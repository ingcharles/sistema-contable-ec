const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function checkSchema() {
    try {
        await client.connect();

        console.log('--- Columns in seguridad.roles_permisos ---');
        const rolesPermisosCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'seguridad' AND table_name = 'roles_permisos';
        `);
        console.log(JSON.stringify(rolesPermisosCols.rows, null, 2));

        console.log('\n--- Columns in configuracion.parametros ---');
        const parametrosCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'configuracion' AND table_name = 'parametros';
        `);
        console.log(JSON.stringify(parametrosCols.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
