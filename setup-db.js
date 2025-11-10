const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    const client = await pool.connect();
    
    console.log('Leyendo archivo schema.sql...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    
    console.log('Ejecutando schema SQL...');
    await client.query(schemaSQL);
    
    console.log('✓ Base de datos configurada exitosamente!');
    console.log('✓ Tablas creadas:');
    console.log('  - users');
    console.log('  - barbers');
    console.log('  - services');
    console.log('  - working_hours');
    console.log('  - appointments');
    console.log('  - messages');
    console.log('  - google_tokens');
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error configurando la base de datos:', error);
    process.exit(1);
  }
}

setupDatabase();
