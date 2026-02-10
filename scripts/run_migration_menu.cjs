const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');

        const migrationPath = path.join(__dirname, '../database/migrations/setup_menu_seguridad.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing migration...');
        await client.query(migrationSql);
        console.log('Migration executed successfully');
    } catch (err) {
        console.error('Error executing migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
