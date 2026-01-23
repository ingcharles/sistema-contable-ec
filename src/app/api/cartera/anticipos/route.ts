import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/cartera/anticipos
 * Lista anticipos disponibles (CxC o CxP)
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const tipo = url.searchParams.get('tipo'); // 'CXC' o 'CXP'

        if (!tipo || !['CXC', 'CXP'].includes(tipo)) {
            return NextResponse.json(
                { error: 'Parámetro tipo requerido (CXC o CXP)' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        a.id, a.fecha, a.tercero_id, t.razon_social as tercero_nombre, a.referencia,
                        a.monto_original, a.saldo_disponible,
                        a.created_at
                    FROM cartera.anticipos a
                    LEFT JOIN directorio.terceros t ON t.id = a.tercero_id
                    WHERE a.empresa_id = $1 
                    AND a.tipo = $2
                    AND a.saldo_disponible > 0
                    ORDER BY a.fecha DESC
                `,
                values: [context.empresaId, tipo]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar anticipos:', error);
        return NextResponse.json(
            { error: 'Error al consultar anticipos', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/cartera/anticipos
 * Registra un anticipo
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { tipo, fecha, terceroId, referencia, monto, cuentaBancoId } = body;

        if (!tipo || !fecha || !terceroId || !monto || !cuentaBancoId) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipo, fecha, terceroId, monto, cuentaBancoId' },
                { status: 400 }
            );
        }

        const montoVal = Number(monto);
        if (montoVal <= 0) {
            return NextResponse.json({ error: 'Monto debe ser mayor a 0' }, { status: 400 });
        }

        const result = await db.transaction(async (client) => {
            // 1. Obtener tercero para nombre y cuentas
            const terceroResult = await client.query(
                `SELECT razon_social, cuenta_contable_cxc, cuenta_contable_cxp FROM directorio.terceros WHERE id = $1 AND empresa_id = $2`,
                [terceroId, context.empresaId]
            );

            if (terceroResult.rows.length === 0) throw new Error('Tercero no encontrado');
            const tercero = terceroResult.rows[0];

            // 2. Insertar Anticipo
            const anticipoResult = await client.query(`
                INSERT INTO cartera.anticipos 
                    (empresa_id, tipo, fecha, tercero_id,
                     referencia, monto_original, saldo_disponible, estado, created_at)
                VALUES 
                    ($1, $2, $3, $4, $5, $6, $6, 'DISPONIBLE', NOW())
                RETURNING id
            `, [context.empresaId, tipo, fecha, terceroId, referencia, montoVal]);

            // 3. Registrar Movimiento Bancario
            const esCliente = tipo === 'CXC';
            // Cliente paga anticipo -> Ingreso de dinero (No es egreso)
            // Pago anticipo a proveedor -> Salida de dinero (Es egreso)
            const esEgreso = !esCliente;

            await client.query(`
                INSERT INTO bancos.bancos_movimientos
                    (empresa_id, usuario_id, cuenta_id, fecha, tipo, referencia, beneficiario, concepto, monto, es_egreso)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                context.empresaId, context.usuarioId, cuentaBancoId,
                fecha, 'TRANSFERENCIA', referencia, tercero.razon_social,
                `Anticipo ${esCliente ? 'de Cliente' : 'a Proveedor'}`,
                montoVal, esEgreso
            ]);

            // 4. Actualizar Saldo Banco
            const bancoResult = await client.query(`
                UPDATE bancos.bancos_cuentas
                SET saldo_actual = saldo_actual + $1, updated_at = NOW()
                WHERE id = $2
                RETURNING cuenta_contable_codigo
            `, [esEgreso ? -montoVal : montoVal, cuentaBancoId]);

            const ctaBanco = bancoResult.rows[0]?.cuenta_contable_codigo || '1.1.01.01';

            // 5. Obtener cuentas de anticipo de configuración parametrizada
            const paramsResult = await client.query(
                `SELECT cuenta_anticipo_clientes, cuenta_anticipo_proveedores FROM configuracion.parametros WHERE empresa_id = $1`,
                [context.empresaId]
            );

            const params = paramsResult.rows[0];
            const ctaAnticipoCliente = params?.cuenta_anticipo_clientes || '2.1.04.01';
            const ctaAnticipoProveedor = params?.cuenta_anticipo_proveedores || '1.1.04.01';

            // 6. Asiento Contable
            const asientoResult = await client.query(`
                INSERT INTO contabilidad.asientos (empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
                VALUES ($1, $2, $3, $4, $5, $6, 'MAYORIZADO')
                RETURNING id
            `, [
                context.empresaId, context.usuarioId,
                `ANT-${Date.now().toString().slice(-6)}`,
                fecha, `Anticipo ${esCliente ? 'Cliente' : 'Proveedor'} - ${tercero.razon_social}`,
                esCliente ? 'INGRESO' : 'EGRESO'
            ]);
            const asientoId = asientoResult.rows[0].id;

            if (esCliente) {
                // Ingreso de dinero: Debe Banco / Haber Anticipo Clientes (Pasivo)
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'BANCO')`, [asientoId, ctaBanco, montoVal]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'ANTICIPO CLIENTE')`, [asientoId, ctaAnticipoCliente, montoVal]);
            } else {
                // Egreso de dinero: Debe Anticipo Proveedores (Activo) / Haber Banco
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, $3, 0, 'ANTICIPO PROVEEDOR')`, [asientoId, ctaAnticipoProveedor, montoVal]);
                await client.query(`INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES ($1, $2, 0, $3, 'BANCO')`, [asientoId, ctaBanco, montoVal]);
            }

            return { anticipoId: anticipoResult.rows[0].id, asientoId };

        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({
            success: true,
            data: result,
            mensaje: 'Anticipo registrado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al registrar anticipo:', error);
        return NextResponse.json(
            { error: 'Error al registrar anticipo', details: error.message },
            { status: 500 }
        );
    }
}
