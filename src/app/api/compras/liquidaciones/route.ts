import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/compras/liquidaciones
 * Registra una liquidación de compra (Comprobante 03)
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            tipoIdentificacionProveedor,
            identificacionProveedor,
            razonSocialProveedor,
            secuencial,
            fechaEmision,
            totalIVA,
            importeTotal,
            detalles = [],
            // Metadatos SRI
            claveAcceso = null,
            numeroAutorizacion = null,
            estadoSri = 'PENDIENTE'
        } = body;

        const result = await db.transaction(async (client) => {
            // 1. Asegurar que el proveedor existe en el directorio (Tercero)
            // En liquidaciones de compra, a veces el proveedor es nuevo
            const terceroRes = await client.query(
                'SELECT id FROM directorio.terceros WHERE identificacion = $1 AND empresa_id = $2',
                [identificacionProveedor, context.empresaId]
            );

            let proveedorId;
            if (terceroRes.rowCount === 0) {
                proveedorId = crypto.randomUUID();
                await client.query(`
                    INSERT INTO directorio.terceros (
                        id, empresa_id, usuario_id, tipo_identificacion, identificacion, 
                        razon_social, tipo_tercero, activo, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, 'PROVEEDOR', TRUE, NOW())
                `, [
                    proveedorId, context.empresaId, context.usuarioId,
                    tipoIdentificacionProveedor, identificacionProveedor, razonSocialProveedor
                ]);
            } else {
                proveedorId = terceroRes.rows[0].id;
            }

            // 2. Calcular subtotales según el IVA de cada detalle
            const subtotalIva = detalles.filter((d: any) => d.codigoIVA === '4' || d.codigoIVA === '2').reduce((acc: number, d: any) => acc + d.total, 0);
            const subtotal0 = detalles.filter((d: any) => d.codigoIVA === '0').reduce((acc: number, d: any) => acc + d.total, 0);

            // 3. Insertar la liquidación en compras.compras
            const compraId = crypto.randomUUID();
            await client.query(`
                INSERT INTO compras.compras (
                    id, empresa_id, usuario_id, proveedor_id, tipo_comprobante, 
                    secuencial, autorizacion, fecha_emision, fecha_registro,
                    sustento, descripcion, subtotal_iva, subtotal_0, 
                    monto_iva, total, tiene_retencion, estado_retencion, created_at
                ) VALUES (
                    $1, $2, $3, $4, '03', $5, $12, $6, CURRENT_DATE,
                    '01', $7, $8, $9, $10, $11, FALSE, $13, NOW()
                )
            `, [
                compraId, context.empresaId, context.usuarioId, proveedorId,
                secuencial, fechaEmision, `Liquidación de Compra ${secuencial}`,
                subtotalIva, subtotal0,
                totalIVA, importeTotal,
                numeroAutorizacion || claveAcceso, // autorizacion
                estadoSri // estado_retencion (usado como estado general del doc en este contexto)
            ]);

            // 3. Registrar detalles
            for (const d of detalles) {
                await client.query(`
                    INSERT INTO compras.compras_detalle (
                        id, compra_id, descripcion, cantidad, precio_unitario, total, porcentaje_iva, valor_iva, codigo_iva
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    crypto.randomUUID(),
                    compraId,
                    d.descripcion,
                    d.cantidad,
                    d.precioUnitario,
                    d.total,
                    d.tarifa || 0,
                    d.valorIVA || 0,
                    d.codigoIVA || '0'
                ]);
            }

            // 4. Registrar en cartera como pendiente de pago
            await client.query(`
                INSERT INTO cartera.documentos_pendientes (
                    id, empresa_id, tipo, tercero_id, nro_comprobante,
                    fecha_emision, fecha_vencimiento, monto_total, saldo_pendiente,
                    created_at
                ) VALUES ($1, $2, 'CXP', $3, $4, $5, $6, $7, $8, NOW())
            `, [
                crypto.randomUUID(), context.empresaId, proveedorId, secuencial,
                fechaEmision, fechaEmision, importeTotal, importeTotal
            ]);

            return { id: compraId };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            id: result.id,
            mensaje: 'Liquidación de compra registrada exitosamente'
        });

    } catch (error: any) {
        console.error('Error al registrar liquidación:', error);
        return NextResponse.json(
            { error: 'Error al registrar la liquidación', details: error.message },
            { status: 500 }
        );
    }
}
