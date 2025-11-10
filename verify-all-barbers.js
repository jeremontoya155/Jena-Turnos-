const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyAllBarbers() {
  try {
    console.log('Verificando todas las cuentas de barberos...');
    
    const result = await pool.query(
      'UPDATE barbers SET is_verified = true WHERE is_verified = false RETURNING *'
    );
    
    console.log(`✓ ${result.rowCount} barberos verificados`);
    
    if (result.rows.length > 0) {
      console.log('\nBarberos verificados:');
      result.rows.forEach(barber => {
        console.log(`  - ${barber.shop_name} (ID: ${barber.id})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAllBarbers();
