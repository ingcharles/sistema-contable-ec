const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

async function checkData() {
    try {
        await client.connect();

        const rolesPermisosCount = await client.query('SELECT COUNT(*) FROM seguridad.roles_permisos');
        console.log('roles_permisos count:', rolesPermisosCount.rows[0].count);

        const rolPermisosCount = await client.query('SELECT COUNT(*) FROM seguridad.rol_permisos');
        console.log('rol_permisos count:', rolPermisosCount.rows[0].count);

        const planes = await client.query('SELECT * FROM configuracion.planes');
        console.log('Planes:', planes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkData();
