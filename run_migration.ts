import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';

const pool = new Pool({
    host: 'localhost',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function run() {
    try {
        const sqlPath = path.resolve('database/migrations/020_migrate_plan_features_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('--- EJECUTANDO MIGRACIÓN CORREGIDA ---');
        const res = await pool.query(sql);
        console.log('Migración completada con éxito.');

        // Verificar resultados
        const verify = await pool.query('SELECT tipo_documento, tipo_documento_id FROM seguridad.plan_caracteristicas WHERE tipo_documento IS NOT NULL');
        console.log('\nVerificación de datos migrados:');
        console.table(verify.rows);

    } catch (e) {
        console.error('Error durante la migración:', e);
    } finally {
        await pool.end();
    }
}

run();
