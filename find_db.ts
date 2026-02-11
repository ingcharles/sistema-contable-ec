import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5435,
    database: 'postgres',
    user: 'postgres',
    password: 'admin',
});

async function findDb() {
    try {
        console.log('--- LISTANDO BASES DE DATOS (Puerto 5435) ---');
        const res = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
        console.table(res.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

findDb();
