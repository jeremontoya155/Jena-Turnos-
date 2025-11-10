const Appointment = require('../models/Appointment');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const pool = require('../config/database');

// Solicitar turno (cliente)
exports.requestAppointment = async (req, res) => {
  try {
    const { barber_id, service_id, client_name, client_phone, client_email, appointment_date, appointment_time, notes } = req.body;

    // Validaciones
    if (!barber_id || !client_name || !client_phone || !appointment_date || !appointment_time) {
      req.flash('error', 'Por favor completa todos los campos requeridos');
      return res.redirect(`/barber/${barber_id}`);
    }

    // Verificar que el horario esté disponible
    const availableSlots = await Appointment.getAvailableSlots(barber_id, appointment_date);
    if (!availableSlots.includes(appointment_time)) {
      req.flash('error', 'El horario seleccionado no está disponible');
      return res.redirect(`/barber/${barber_id}`);
    }

    // Obtener duración del servicio si existe
    let duration_minutes = 30;
    if (service_id) {
      const service = await Service.findById(service_id);
      duration_minutes = service.duration_minutes;
    }

    // Crear el turno
    const appointment = await Appointment.create({
      barber_id,
      service_id: service_id || null,
      client_name,
      client_phone,
      client_email: client_email || null,
      appointment_date,
      appointment_time,
      duration_minutes,
      notes
    });

    // Crear mensaje inicial
    await pool.query(
      `INSERT INTO messages (appointment_id, sender_type, sender_name, message)
       VALUES ($1, 'client', $2, $3)`,
      [appointment.id, client_name, notes || 'Solicitud de turno enviada']
    );

    req.flash('success', 'Turno solicitado exitosamente. El barbero te confirmará pronto.');
    res.redirect(`/appointments/${appointment.id}`);
  } catch (error) {
    console.error('Error solicitando turno:', error);
    req.flash('error', 'Error al solicitar turno: ' + error.message);
    res.redirect('back');
  }
};

// Ver detalles del turno
exports.viewAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      req.flash('error', 'Turno no encontrado');
      return res.redirect('/');
    }

    // Obtener mensajes
    const messagesResult = await pool.query(
      'SELECT * FROM messages WHERE appointment_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.render('appointments/view', {
      title: 'Detalles del Turno',
      appointment,
      messages: messagesResult.rows,
      user: req.user
    });
  } catch (error) {
    console.error('Error cargando turno:', error);
    req.flash('error', 'Error cargando turno');
    res.redirect('/');
  }
};

// Confirmar turno (barbero)
exports.confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      req.flash('error', 'Turno no encontrado');
      return res.redirect('/barbers/appointments');
    }

    // Verificar que el barbero sea el dueño del turno
    const barber = await Barber.findByUserId(req.user.id);
    if (appointment.barber_id !== barber.id) {
      req.flash('error', 'No tienes permiso para confirmar este turno');
      return res.redirect('/barbers/appointments');
    }

    // Actualizar estado
    await Appointment.updateStatus(id, 'confirmed');

    // Crear mensaje de confirmación
    await pool.query(
      `INSERT INTO messages (appointment_id, sender_type, sender_name, message)
       VALUES ($1, 'barber', $2, $3)`,
      [id, req.user.name, 'Turno confirmado']
    );

    // TODO: Aquí se puede agregar integración con Google Calendar

    req.flash('success', 'Turno confirmado exitosamente');
    res.redirect(`/appointments/${id}`);
  } catch (error) {
    console.error('Error confirmando turno:', error);
    req.flash('error', 'Error confirmando turno');
    res.redirect('/barbers/appointments');
  }
};

// Cancelar turno
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      req.flash('error', 'Turno no encontrado');
      return res.redirect('/');
    }

    // Verificar permisos (barbero o el que lo solicitó por teléfono)
    if (req.user) {
      const barber = await Barber.findByUserId(req.user.id);
      if (appointment.barber_id !== barber.id) {
        req.flash('error', 'No tienes permiso para cancelar este turno');
        return res.redirect('/');
      }
    }

    await Appointment.updateStatus(id, 'cancelled');

    // Crear mensaje de cancelación
    const senderName = req.user ? req.user.name : appointment.client_name;
    const senderType = req.user ? 'barber' : 'client';
    
    await pool.query(
      `INSERT INTO messages (appointment_id, sender_type, sender_name, message)
       VALUES ($1, $2, $3, $4)`,
      [id, senderType, senderName, `Turno cancelado. Motivo: ${reason || 'No especificado'}`]
    );

    req.flash('success', 'Turno cancelado exitosamente');
    res.redirect(req.user ? '/barbers/appointments' : '/');
  } catch (error) {
    console.error('Error cancelando turno:', error);
    req.flash('error', 'Error cancelando turno');
    res.redirect('/');
  }
};

// Enviar mensaje
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      req.flash('error', 'Turno no encontrado');
      return res.redirect('/');
    }

    // Determinar tipo de remitente
    let senderType = 'client';
    let senderName = appointment.client_name;

    if (req.user) {
      const barber = await Barber.findByUserId(req.user.id);
      if (barber && appointment.barber_id === barber.id) {
        senderType = 'barber';
        senderName = req.user.name;
      }
    }

    await pool.query(
      `INSERT INTO messages (appointment_id, sender_type, sender_name, message)
       VALUES ($1, $2, $3, $4)`,
      [id, senderType, senderName, message]
    );

    req.flash('success', 'Mensaje enviado');
    res.redirect(`/appointments/${id}`);
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    req.flash('error', 'Error enviando mensaje');
    res.redirect('back');
  }
};

// Obtener horarios disponibles (AJAX)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { barber_id, date } = req.query;

    if (!barber_id || !date) {
      return res.status(400).json({ error: 'Parámetros faltantes' });
    }

    const slots = await Appointment.getAvailableSlots(barber_id, date);
    res.json({ slots });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({ error: 'Error obteniendo horarios disponibles' });
  }
};
