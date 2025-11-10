const pool = require('../config/database');

class Service {
  static async create(barberId, data) {
    const result = await pool.query(
      `INSERT INTO services (barber_id, name, description, price, duration_minutes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [barberId, data.name, data.description, data.price, data.duration_minutes || 30]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByBarber(barberId) {
    const result = await pool.query(
      'SELECT * FROM services WHERE barber_id = $1 AND is_active = true ORDER BY price',
      [barberId]
    );
    return result.rows;
  }

  static async update(id, data) {
    const result = await pool.query(
      `UPDATE services
       SET name = $1, description = $2, price = $3, duration_minutes = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [data.name, data.description, data.price, data.duration_minutes, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('UPDATE services SET is_active = false WHERE id = $1', [id]);
  }

  static async hardDelete(id) {
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
  }
}

module.exports = Service;
