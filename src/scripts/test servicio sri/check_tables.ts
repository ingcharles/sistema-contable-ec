import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5435,
  database: 'ecucontabledb',
  user: 'postgres',
  password: 'admin'
});

async function main() {
  const client = await pool.connect();
  try {
    // Listar todas las tablas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas en la base de datos:\n');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Buscar tablas relacionadas con empresa
    const empresaLike = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%empresa%'
    `);
    
    console.log('\n📦 Tablas con "empresa":', empresaLike.rows.map(r => r.table_name));
    
  } finally {
    client.release();
    await pool.end();
  }
}

main();
