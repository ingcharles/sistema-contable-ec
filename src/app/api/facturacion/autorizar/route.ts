import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';
import { SriWebService } from '@/modules/facturacion/domain/services/SriWebService';

export const runtime = 'nodejs';

/**
 * POST /api/facturacion/autorizar
 * Endpoint para consultar manualmente (o por polling) la autorización de un comprobante
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const { comprobanteId } = await req.json();

        // 1. Obtener datos del comprobante y configuración SRI
        const compResult = await db.query({
            text: `
                SELECT c.id, c.clave_acceso, c.estado, c.secuencial,
                       sc.cert_p12_certificado, sc.cert_clave_certificado,
                       sa.url_autorizacion
                FROM facturacion.comprobantes_electronicos c
                INNER JOIN configuracion.sri_certificados sc ON sc.empresa_id = c.empresa_id
                INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
                WHERE c.id = $1 AND c.empresa_id = $2 AND sc.activo = TRUE
                LIMIT 1
            `,
            values: [comprobanteId, context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        if (compResult.rows.length === 0) {
            return NextResponse.json({ error: 'Comprobante no encontrado o configuración SRI inválida' }, { status: 404 });
        }

        const comp = compResult.rows[0];

        // 2. Lógica de Reintento y Espera (Robustez SRI)
        // Check inicial (puede ser Recepción o Autorización dependiendo del estado actual, aqui asumimos que ya pasó recepción)

        let auth = await SriWebService.autorizarComprobante(comp.clave_acceso, comp.url_autorizacion);
        console.log("auth", JSON.stringify(auth));
        // let nuevoEstado = auth.estado; // This line is removed

        // Comparar con 'EN PROCESO' o ID 70 (Procesamiento)
        // Helper para detectar estado de procesamiento
        const esEnProcesamiento = (r: typeof auth) => {
            return r.estado === 'EN PROCESO' ||
                r.estado === 'RECIBIDA' ||
                // Si es DEVUELTA/ERROR pero el mensaje dice procesando (ID 70), es procesamiento
                ((r.estado === 'DEVUELTA') && r.mensajes?.some(m => m.identificador === '70'));
        };

        if (esEnProcesamiento(auth)) {
            console.log(`Comprobante ${comprobanteId} en estado de procesamiento (ID 70 o ${auth.estado}). Iniciando espera...`);

            // 1. Espera inicial
            await sleep(3000);

            // 2. Loop de reintentos
            let intentos = 0;
            const maxIntentos = 5;

            while (esEnProcesamiento(auth) && intentos < maxIntentos) {
                await sleep(5000); // 5 segundos entre intentos
                auth = await SriWebService.autorizarComprobante(comp.clave_acceso, comp.url_autorizacion);
                intentos++;
            }

            // Mapeo final si sigue en proceso
            if (esEnProcesamiento(auth)) {
                // Forzamos el string para que coincida con el enum de la BD explicito
                auth.estado = 'EN_PROCESAMIENTO' as any;
            }
        }

        const nuevoEstado = auth.estado;

        // 3. Actualizar BD
        await db.query({
            text: `
                UPDATE facturacion.comprobantes_electronicos
                SET estado = $1,
                    numero_autorizacion = $2, 
                    fecha_autorizacion = $3, 
                    mensajes_sri = $4,
                    updated_at = NOW()
                WHERE id = $5
            `,
            values: [
                nuevoEstado,
                auth.numeroAutorizacion,
                auth.fechaAutorizacion,
                { mensajes: auth.mensajes || [] },
                comprobanteId
            ]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            estado: nuevoEstado,
            mensajes: auth.mensajes,
            autorizacion: auth
        });
    } catch (error: any) {
        console.error('Error en endpoint autorizar:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
