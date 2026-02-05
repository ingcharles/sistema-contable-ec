const { Client } = require('pg');

const client = new Client({
    host: '127.0.0.1',
    port: 5435,
    database: 'ecucontabledb',
    user: 'postgres',
    password: 'admin',
});

const sql = `
BEGIN;

ALTER TABLE configuracion.catalogos_items ADD COLUMN IF NOT EXISTS valor_numerico NUMERIC(5,2);

-- Update IVA rates
UPDATE configuracion.catalogos_items SET valor_numerico = 0 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '0';
UPDATE configuracion.catalogos_items SET valor_numerico = 12 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '2';
UPDATE configuracion.catalogos_items SET valor_numerico = 14 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '3';
UPDATE configuracion.catalogos_items SET valor_numerico = 15 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '4';
UPDATE configuracion.catalogos_items SET valor_numerico = 5 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '5';
UPDATE configuracion.catalogos_items SET valor_numerico = 0 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '6';
UPDATE configuracion.catalogos_items SET valor_numerico = 0 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '7';
UPDATE configuracion.catalogos_items SET valor_numerico = 8 WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' AND codigo = '8';

COMMIT;
`;

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB.');
        await client.query(sql);
        console.log('Migration successful: valor_numerico added and populated.');
    } catch (err) {
        console.error('Migration failed:', err);
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }
}

run();
