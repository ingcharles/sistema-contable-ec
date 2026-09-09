const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function checkMenuTables() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'seguridad' 
            AND table_name IN ('roles_permisos', 'rol_permisos', 'planes_permisos');
        `);
        console.log('Tables:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkMenuTables();
