import { Pool } from 'pg';

async function main() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
  });
  
  // Ver empresas 
  console.log('=== EMPRESAS ===');
  const empresas = await pool.query(`
    SELECT id, ruc, razon_social, activa
    FROM seguridad.empresas
    LIMIT 5
  `);
  console.log(JSON.stringify(empresas.rows, null, 2));
  
  // Ver certificados completos
  console.log('\n=== CERTIFICADOS ===');
  const certs = await pool.query(`
    SELECT sc.id, sc.empresa_id, sc.sri_ambiente_id, sc.activo,
           sa.codigo as ambiente_codigo, e.ruc as empresa_ruc
    FROM configuracion.sri_certificados sc
    INNER JOIN configuracion.sri_ambiente sa ON sa.id = sc.sri_ambiente_id
    INNER JOIN seguridad.empresas e ON e.id = sc.empresa_id
    LIMIT 10
  `);
  console.log(JSON.stringify(certs.rows, null, 2));
  
  await pool.end();
}

main().catch(console.error);
