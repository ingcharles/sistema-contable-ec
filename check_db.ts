import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function check() {
    try {
        console.log('--- INSPECCIÓN DE DATOS: plan_caracteristicas ---');

        // 1. Columnas
        const columns = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'seguridad' AND table_name = 'plan_caracteristicas'
        `);
        console.log('Columnas:', columns.rows.map(r => r.column_name).join(', '));

        // 2. Datos
        const data = await pool.query(`SELECT * FROM seguridad.plan_caracteristicas`);
        console.log('\nRegistros:');
        console.table(data.rows);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

check();
