/**
 * Script para consultar autorización de comprobante
 * Ejecutar con: npx tsx src/scripts/consultar_autorizacion.ts <claveAcceso>
 */

import { SriWebService } from '../../modules/facturacion/domain/services/SriWebService';
import { SriEnvironment } from '../../shared/sri-constants';

async function main() {
    const claveAcceso = process.argv[2] || '2701202607172203995300110010017431764831234567811';
    
    console.log('=== CONSULTA DE AUTORIZACIÓN SRI ===\n');
    console.log('Clave de acceso:', claveAcceso);
    
    try {
        console.log('\nConsultando autorización en ambiente PRUEBAS...');
        const result = await SriWebService.autorizarComprobante(claveAcceso, SriEnvironment.PRUEBAS);
        
        console.log('\n=== RESPUESTA SRI ===');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.autorizaciones && result.autorizaciones.length > 0) {
            const auth = result.autorizaciones[0];
            console.log('\n=== DETALLE AUTORIZACIÓN ===');
            console.log('Estado:', auth.estado);
            console.log('Número Autorización:', auth.numeroAutorizacion);
            console.log('Fecha Autorización:', auth.fechaAutorizacion);
            
            if (auth.mensajes && auth.mensajes.length > 0) {
                console.log('\nMensajes:');
                auth.mensajes.forEach((m: any, i: number) => {
                    console.log(`  ${i + 1}. [${m.tipo}] ${m.identificador}: ${m.mensaje}`);
                    if (m.informacionAdicional) {
                        console.log(`      Info: ${m.informacionAdicional}`);
                    }
                });
            }
        }
        
    } catch (error: any) {
        console.error('\n✗ Error:', error.message);
    }
}

main();
