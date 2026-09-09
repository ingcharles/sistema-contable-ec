const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function listPlanes() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM seguridad.planes');
        console.log('Planes:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listPlanes();
