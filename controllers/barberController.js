const Barber = require('../models/Barber');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const pool = require('../config/database');

// Dashboard del barbero
exports.dashboard = async (req, res) => {
  try {
    const barber = await Barber.findByUserId(req.user.id);
    
    if (!barber) {
      req.flash('error', 'Perfil de barbero no encontrado');
      return res.redirect('/');
    }

    const appointments = await Appointment.findByBarber(barber.id, { limit: 10 });
    
    // Estadísticas
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
       FROM appointments 
       WHERE barber_id = $1`,
      [barber.id]
    );

    res.render('barbers/dashboard', {
      title: 'Dashboard',
      barber,
      appointments,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    req.flash('error', 'Error cargando dashboard');
    res.redirect('/');
  }
};

// Ver perfil
exports.profile = async (req, res) => {
  try {
    const barber = await Barber.findByUserId(req.user.id);
    const services = await Service.findByBarber(barber.id);

    res.render('barbers/profile', {
      title: 'Mi Perfil',
      barber,
      services,
      user: req.user
    });
  } catch (error) {
    console.error('Error cargando perfil:', error);
    req.flash('error', 'Error cargando perfil');
    res.redirect('/barbers/dashboard');
  }
};

// Actualizar perfil
exports.updateProfile = async (req, res) => {
  try {
    const { shop_name, address, neighborhood, city, description, hourly_rate } = req.body;
    const barber = await Barber.findByUserId(req.user.id);

    await Barber.update(barber.id, {
      shop_name,
      address,
      neighborhood,
      city,
      description,
      hourly_rate
    });

    req.flash('success', 'Perfil actualizado exitosamente');
    res.redirect('/barbers/profile');
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    req.flash('error', 'Error actualizando perfil');
    res.redirect('/barbers/profile');
  }
};

// Gestión de servicios
exports.services = async (req, res) => {
  try {
    const barber = await Barber.findByUserId(req.user.id);
    const services = await Service.findByBarber(barber.id);

    res.render('barbers/services', {
      title: 'Mis Servicios',
      services,
      barber
    });
  } catch (error) {
    console.error('Error cargando servicios:', error);
    req.flash('error', 'Error cargando servicios');
    res.redirect('/barbers/dashboard');
  }
};

// Crear servicio
exports.createService = async (req, res) => {
  try {
    const { name, description, price, duration_minutes } = req.body;
    const barber = await Barber.findByUserId(req.user.id);

    await Service.create(barber.id, {
      name,
      description,
      price: parseFloat(price),
      duration_minutes: parseInt(duration_minutes) || 30
    });

    req.flash('success', 'Servicio creado exitosamente');
    res.redirect('/barbers/services');
  } catch (error) {
    console.error('Error creando servicio:', error);
    req.flash('error', 'Error creando servicio');
    res.redirect('/barbers/services');
  }
};

// Actualizar servicio
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration_minutes } = req.body;

    await Service.update(id, {
      name,
      description,
      price: parseFloat(price),
      duration_minutes: parseInt(duration_minutes)
    });

    req.flash('success', 'Servicio actualizado exitosamente');
    res.redirect('/barbers/services');
  } catch (error) {
    console.error('Error actualizando servicio:', error);
    req.flash('error', 'Error actualizando servicio');
    res.redirect('/barbers/services');
  }
};

// Eliminar servicio
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await Service.delete(id);

    req.flash('success', 'Servicio eliminado exitosamente');
    res.redirect('/barbers/services');
  } catch (error) {
    console.error('Error eliminando servicio:', error);
    req.flash('error', 'Error eliminando servicio');
    res.redirect('/barbers/services');
  }
};

// Gestión de horarios
exports.schedule = async (req, res) => {
  try {
    const barber = await Barber.findByUserId(req.user.id);
    const workingHours = await Barber.getWorkingHours(barber.id);

    // Organizar horarios por día
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const schedule = days.map((day, index) => {
      const daySchedule = workingHours.find(wh => wh.day_of_week === index);
      return {
        day_of_week: index,
        day_name: day,
        start_time: daySchedule?.start_time || '',
        end_time: daySchedule?.end_time || '',
        is_active: daySchedule?.is_active || false,
        id: daySchedule?.id
      };
    });

    res.render('barbers/schedule', {
      title: 'Horarios',
      schedule,
      barber
    });
  } catch (error) {
    console.error('Error cargando horarios:', error);
    req.flash('error', 'Error cargando horarios');
    res.redirect('/barbers/dashboard');
  }
};

// Actualizar horarios
exports.updateSchedule = async (req, res) => {
  try {
    const barber = await Barber.findByUserId(req.user.id);
    const { schedules } = req.body;

    // schedules es un array de objetos con day_of_week, start_time, end_time, is_active
    for (const schedule of schedules) {
      if (schedule.is_active) {
        await pool.query(
          `INSERT INTO working_hours (barber_id, day_of_week, start_time, end_time, is_active)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (barber_id, day_of_week)
           DO UPDATE SET start_time = $3, end_time = $4, is_active = true`,
          [barber.id, schedule.day_of_week, schedule.start_time, schedule.end_time]
        );
      } else {
        await pool.query(
          `UPDATE working_hours SET is_active = false
           WHERE barber_id = $1 AND day_of_week = $2`,
          [barber.id, schedule.day_of_week]
        );
      }
    }

    req.flash('success', 'Horarios actualizados exitosamente');
    res.redirect('/barbers/schedule');
  } catch (error) {
    console.error('Error actualizando horarios:', error);
    req.flash('error', 'Error actualizando horarios');
    res.redirect('/barbers/schedule');
  }
};

// Ver turnos
exports.appointments = async (req, res) => {
  try {
    const barber = await Barber.findByUserId(req.user.id);
    const { status, date } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (date) filters.date = date;

    const appointments = await Appointment.findByBarber(barber.id, filters);

    res.render('barbers/appointments', {
      title: 'Mis Turnos',
      appointments,
      barber,
      filters: { status, date }
    });
  } catch (error) {
    console.error('Error cargando turnos:', error);
    req.flash('error', 'Error cargando turnos');
    res.redirect('/barbers/dashboard');
  }
};
