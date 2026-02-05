const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

const queryText = `
    SELECT id, catalogo_codigo, codigo, valor, descripcion, orden, valor_numerico
    FROM configuracion.catalogos_items 
    WHERE catalogo_codigo = ANY($1) 
    AND activo = true
    ORDER BY catalogo_codigo, orden, valor
`;
const values = [['SRI_TIPO_IMPUESTO_IVA']];

async function run() {
    try {
        await client.connect();
        console.log('Connected.');
        const res = await client.query(queryText, values);
        console.log('Query success!');
        console.log('Rows:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('First row:', res.rows[0]);
        }
    } catch (err) {
        console.error('Query error:', err);
    } finally {
        await client.end();
    }
}

run();
