const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkBarbers() {
  try {
    console.log('Consultando barberos en la base de datos...\n');
    
    const result = await pool.query(`
      SELECT b.*, u.name, u.email, 
             (SELECT COUNT(*) FROM services WHERE barber_id = b.id) as services_count
      FROM barbers b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No hay barberos registrados en la base de datos');
    } else {
      console.log(`✓ Encontrados ${result.rows.length} barberos:\n`);
      result.rows.forEach((barber, index) => {
        console.log(`${index + 1}. ${barber.shop_name}`);
        console.log(`   Barbero: ${barber.name}`);
        console.log(`   Email: ${barber.email}`);
        console.log(`   Ubicación: ${barber.address}, ${barber.neighborhood}, ${barber.city}`);
        console.log(`   Verificado: ${barber.is_verified ? '✓ Sí' : '✗ No'}`);
        console.log(`   Servicios: ${barber.services_count}`);
        console.log('');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBarbers();
