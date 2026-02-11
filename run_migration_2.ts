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
        const sqlPath = path.resolve('database/migrations/021_replace_max_empresas_with_liquidaciones.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('--- EJECUTANDO MIGRACIÓN: MAX_EMPRESAS -> MAX_LIQUIDACION_COMPRA ---');
        await pool.query(sql);
        console.log('Migración completada con éxito.');

        // Verificar resultados
        const verify = await pool.query(`
            SELECT pc.clave_caracteristica, ci.valor as tipo_documento, pc.tipo_documento_id 
            FROM seguridad.plan_caracteristicas pc
            LEFT JOIN configuracion.catalogos_items ci ON ci.id = pc.tipo_documento_id
            WHERE pc.clave_caracteristica = 'MAX_LIQUIDACION_COMPRA'
        `);
        console.log('\nVerificación de datos migrados:');
        console.table(verify.rows);

    } catch (e) {
        console.error('Error durante la migración:', e);
    } finally {
        await pool.end();
    }
}

run();
