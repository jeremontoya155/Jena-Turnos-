const pool = require('../config/database');

class Appointment {
  static async create(data) {
    const result = await pool.query(
      `INSERT INTO appointments 
       (barber_id, service_id, client_name, client_phone, client_email, 
        appointment_date, appointment_time, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.barber_id,
        data.service_id,
        data.client_name,
        data.client_phone,
        data.client_email,
        data.appointment_date,
        data.appointment_time,
        data.duration_minutes || 30,
        data.notes
      ]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, s.name as service_name, s.price, s.duration_minutes as service_duration,
              b.shop_name, u.name as barber_name, u.phone as barber_phone
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       JOIN barbers b ON a.barber_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByBarber(barberId, filters = {}) {
    let query = `
      SELECT a.*, s.name as service_name, s.price
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.barber_id = $1
    `;
    const params = [barberId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND a.status = $${params.length}`;
    }

    if (filters.date) {
      params.push(filters.date);
      query += ` AND a.appointment_date = $${params.length}`;
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateStatus(id, status, googleEventId = null) {
    const query = googleEventId
      ? 'UPDATE appointments SET status = $1, google_event_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *'
      : 'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    
    const params = googleEventId ? [status, googleEventId, id] : [status, id];
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);
  }

  static async getAvailableSlots(barberId, date) {
    // Obtener horarios de trabajo del barbero para ese día
    const dayOfWeek = new Date(date).getDay();
    
    const workingHoursResult = await pool.query(
      'SELECT start_time, end_time FROM working_hours WHERE barber_id = $1 AND day_of_week = $2 AND is_active = true',
      [barberId, dayOfWeek]
    );

    if (workingHoursResult.rows.length === 0) {
      return [];
    }

    const { start_time, end_time } = workingHoursResult.rows[0];

    // Obtener turnos ocupados
    const appointmentsResult = await pool.query(
      'SELECT appointment_time, duration_minutes FROM appointments WHERE barber_id = $1 AND appointment_date = $2 AND status != $3',
      [barberId, date, 'cancelled']
    );

    // Generar slots disponibles (intervalos de 30 minutos)
    const slots = [];
    const startHour = parseInt(start_time.split(':')[0]);
    const startMinute = parseInt(start_time.split(':')[1]);
    const endHour = parseInt(end_time.split(':')[0]);
    const endMinute = parseInt(end_time.split(':')[1]);

    for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === startHour && minute < startMinute) continue;
        if (hour === endHour && minute >= endMinute) break;

        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Verificar si el slot está ocupado
        const isOccupied = appointmentsResult.rows.some(apt => {
          return apt.appointment_time === timeSlot;
        });

        if (!isOccupied) {
          slots.push(timeSlot);
        }
      }
    }

    return slots;
  }
}

module.exports = Appointment;
