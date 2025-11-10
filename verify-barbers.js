const pool = require('./config/database');
require('dotenv').config();

async function verifyAllBarbers() {
  try {
    console.log('Conectando a la base de datos...');
    
    const result = await pool.query(
      'UPDATE barbers SET is_verified = true WHERE is_verified = false RETURNING *'
    );
    
    console.log(`✓ ${result.rowCount} barbero(s) verificado(s) exitosamente!`);
    
    if (result.rows.length > 0) {
      console.log('\nBarberos verificados:');
      result.rows.forEach(barber => {
        console.log(`  - ${barber.shop_name} (${barber.neighborhood}, ${barber.city})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAllBarbers();
