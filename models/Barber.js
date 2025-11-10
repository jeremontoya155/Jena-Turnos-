const pool = require('../config/database');

class Barber {
  static async findById(id) {
    const result = await pool.query(
      `SELECT b.*, u.name, u.email, u.phone, u.role,
              gt.is_connected as calendar_connected
       FROM barbers b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN google_tokens gt ON b.id = gt.barber_id AND gt.is_connected = true
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT b.*, u.name, u.email, u.phone
       FROM barbers b
       JOIN users u ON b.user_id = u.id
       WHERE b.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async search(filters = {}) {
    let query = `
      SELECT b.*, u.name as barber_name, u.phone,
             (SELECT COUNT(*) FROM appointments WHERE barber_id = b.id AND status = 'confirmed') as total_appointments
      FROM barbers b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_verified = true
    `;
    const params = [];

    if (filters.neighborhood) {
      params.push(`%${filters.neighborhood}%`);
      query += ` AND b.neighborhood ILIKE $${params.length}`;
    }

    if (filters.city) {
      params.push(`%${filters.city}%`);
      query += ` AND b.city ILIKE $${params.length}`;
    }

    query += ' ORDER BY b.shop_name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async create(userId, data) {
    const result = await pool.query(
      `INSERT INTO barbers (user_id, shop_name, address, neighborhood, city, description, hourly_rate, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [userId, data.shop_name, data.address, data.neighborhood, data.city, data.description, data.hourly_rate]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const result = await pool.query(
      `UPDATE barbers
       SET shop_name = $1, address = $2, neighborhood = $3, city = $4, 
           description = $5, hourly_rate = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [data.shop_name, data.address, data.neighborhood, data.city, data.description, data.hourly_rate, id]
    );
    return result.rows[0];
  }

  static async getServices(barberId) {
    const result = await pool.query(
      'SELECT * FROM services WHERE barber_id = $1 AND is_active = true ORDER BY price',
      [barberId]
    );
    return result.rows;
  }

  static async getWorkingHours(barberId) {
    const result = await pool.query(
      'SELECT * FROM working_hours WHERE barber_id = $1 AND is_active = true ORDER BY day_of_week, start_time',
      [barberId]
    );
    return result.rows;
  }
}

module.exports = Barber;
