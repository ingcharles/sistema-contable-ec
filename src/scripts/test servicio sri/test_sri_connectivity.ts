/**
 * Script para probar la conectividad con el SRI
 */
import { SriWebService } from '../../modules/facturacion/domain/services/SriWebService';
import { SriEnvironment } from '../../shared/sri-constants';

async function main() {
    console.log('=== PRUEBA DE CONECTIVIDAD SRI ===\n');

    try {
        // Consultar autorización de una clave de acceso ficticia
        console.log('Consultando autorización para clave ficticia...');
        const result = await SriWebService.consultarAutorizacion(
            '0000000000000000000000000000000000000000000000000',
            SriEnvironment.PRUEBAS
        );
        console.log('Respuesta:', JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

main();
