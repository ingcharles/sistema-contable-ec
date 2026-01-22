import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/cartera/pagos
 * Registra un pago o cruce de anticipo
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const {
            documentoId,
            valorEfectivo = 0,
            fecha,
            formaPago,
            referencia,
            cuentaBancoId // Cuenta contable o ID de cuenta bancaria
        } = body;

        if (!documentoId || !formaPago || !fecha) {
            return NextResponse.json(
                { error: 'Campos requeridos: documentoId, formaPago, fecha' },
                { status: 400 }
            );
        }

        const monto = Number(valorEfectivo);

        if (monto <= 0) {
            return NextResponse.json({ error: 'El valor debe ser mayor a cero' }, { status: 400 });
        }

        const result = await db.transaction(async (client) => {
            // 1. Obtener datos del documento y del tercero
            const docResult = await client.query(`
                SELECT d.*, t.cuenta_contable_cxc, t.cuenta_contable_cxp
                FROM cartera.cartera_documentos d
                JOIN directorio.terceros t ON d.tercero_id = t.id
                WHERE d.id = $1 AND d.empresa_id = $2
            `, [documentoId, context.empresaId]);

            if (docResult.rows.length === 0) {
                throw new Error('Documento no encontrado');
            }

            const doc = docResult.rows[0];
            const esCobro = doc.tipo_cartera === 'CXC';

            // 2. Actualizar saldo en Cartera
            await client.query(`
                UPDATE cartera.cartera_documentos 
                SET saldo_pendiente = saldo_pendiente - $1, updated_at = NOW()
                WHERE id = $2
            `, [monto, documentoId]);

            // 3. Registrar Movimiento Bancario
            await client.query(`
                INSERT INTO bancos.bancos_movimientos
                    (empresa_id, usuario_id, cuenta_id, fecha, tipo, referencia, beneficiario, concepto, monto, es_egreso)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                context.empresaId, context.usuarioId,
                cuentaBancoId,
                fecha, formaPago, referencia, doc.tercero_nombre,
                `${esCobro ? 'Cobro' : 'Pago'} Factura ${doc.nro_comprobante}`,
                monto, !esCobro
            ]);

            // 3.1 Actualizar Saldo en Cuenta Bancaria
            const bancoResult = await client.query(`
                UPDATE bancos.bancos_cuentas
                SET saldo_actual = saldo_actual + $1, updated_at = NOW()
                WHERE id = $2
                RETURNING cuenta_contable_codigo
            `, [esCobro ? monto : -monto, cuentaBancoId]);

            const ctaBanco = bancoResult.rows[0]?.cuenta_contable_codigo || '1.1.01.01';

            // 4. Generar Asiento Contable Automático
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos (empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                VALUES ($1, $2, $3, $4, $5, $6, 'MAYORIZADO')
                RETURNING id
            `, [
                context.empresaId, context.usuarioId,
                `${esCobro ? 'COB' : 'PAG'}-${Date.now().toString().slice(-6)}`,
                fecha, `${esCobro ? 'Cobro' : 'Pago'} ${doc.tercero_nombre} - Fact. ${doc.nro_comprobante}`,
                esCobro ? 'INGRESO' : 'EGRESO'
            ]);
            const asientoId = asientoResult.rows[0].id;

            // Determinar cuentas contables
            const ctaCartera = esCobro ? (doc.cuenta_contable_cxc || '1.1.02.01') : (doc.cuenta_contable_cxp || '2.1.01.01');

            if (esCobro) {
                // DEBE: Banco/Caja, HABER: Clientes
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'INGRESO POR COBRO')`, [asientoId, ctaBanco, monto]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'BAJA DE CARTERA')`, [asientoId, ctaCartera, monto]);
            } else {
                // DEBE: Proveedores, HABER: Banco/Caja
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'BAJA DE PASIVO')`, [asientoId, ctaCartera, monto]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'EGRESO POR PAGO')`, [asientoId, ctaBanco, monto]);
            }

            return { asientoId };
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            mensaje: 'Transacción procesada integralmente (Cartera, Bancos y Contabilidad)',
            asientoId: result.asientoId
        });
    } catch (error: any) {
        console.error('Error al procesar pago:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

