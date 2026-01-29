/**
 * Script para verificar los RUC con certificados en la BD
 */
import { db } from '../../shared/infrastructure/database/postgresql';

async function main() {
    // Ver estructura de sri_certificados con datos relevantes (sin el p12)
    const certs = await db.query(
        { text: `SELECT id, empresa_id, sri_ambiente_id, cert_sujeto, cert_emisor, cert_numero_serie, activo, cert_fecha_expiracion FROM configuracion.sri_certificados` },
        { empresaId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', usuarioId: 'system' }
    );
    console.log('Certificados:');
    console.log(JSON.stringify(certs.rows, null, 2));
    
    // Ver ambientes
    const ambientes = await db.query(
        { text: `SELECT * FROM configuracion.sri_ambiente` },
        { empresaId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', usuarioId: 'system' }
    );
    console.log('\nAmbientes SRI:');
    console.log(JSON.stringify(ambientes.rows, null, 2));
    
    await db.close();
}

main().catch(e => { console.error(e); process.exit(1); });
