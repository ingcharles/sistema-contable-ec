const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function checkUserColumns() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'seguridad' 
            AND table_name = 'usuarios';
        `);
        console.log('User Columns:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkUserColumns();
