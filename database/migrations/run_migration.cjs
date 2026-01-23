const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/ecucontable_pro?schema=public'
});

async function runMigration() {
    console.log('--- Iniciando Migración RBAC Multi-Rol ---');
    const sqlPath = path.join(__dirname, '20240123_rbac_multi_role.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Ejecutando script SQL...');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('--- Migración completada con éxito ---');
    } catch (error) {
        await client.query('ROLLBACK');
        console.log('--- ERROR en la migración ---');
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
