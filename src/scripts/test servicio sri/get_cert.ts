import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5435'),
    database: process.env.DB_NAME || 'ecucontabledb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
  });
  
  // Ver qué schemas existen
  console.log('=== SCHEMAS ===');
  const schemas = await pool.query(`
    SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
  `);
  for (const s of schemas.rows) {
    console.log(s.schema_name);
  }
  
  // Ver tablas en el schema public
  console.log('\n=== TABLAS EN PUBLIC ===');
  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 20
  `);
  for (const t of tables.rows) {
    console.log(t.table_name);
  }
  
  // Ver tablas en configuracion si existe
  console.log('\n=== TABLAS EN CONFIGURACION ===');
  const tablesConfig = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'configuracion' LIMIT 20
  `);
  for (const t of tablesConfig.rows) {
    console.log(t.table_name);
  }
  
  await pool.end();
}

main().catch(console.error);
