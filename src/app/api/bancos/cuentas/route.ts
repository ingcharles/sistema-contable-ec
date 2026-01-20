import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';


/**
 * GET /api/bancos/cuentas
 * Lista cuentas bancarias con saldos
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const activa = url.searchParams.get('activa');

        let whereConditions = ['empresa_id = $1'];
        let values: any[] = [context.empresaId];
        let paramIndex = 2;

        if (activa !== null && activa !== undefined) {
            whereConditions.push(`activa = $${paramIndex}`);
            values.push(activa === 'true');
            paramIndex++;
        }

        const whereClause = whereConditions.join(' AND ');

        const result = await db.query(
            {
                text: `
                    SELECT 
                        c.id, c.numero_cuenta, c.nombre, c.tipo_cuenta, c.banco,
                        c.saldo_actual, c.moneda, c.activa, c.created_at, c.updated_at,
                        (
                            SELECT COUNT(*) 
                            FROM bancos_movimientos m 
                            WHERE m.cuenta_id = c.id AND m.conciliado = false
                        ) as movimientos_pendientes
                    FROM bancos_cuentas c
                    WHERE ${whereClause}
                    ORDER BY c.nombre ASC
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar cuentas bancarias:', error);
        return NextResponse.json(
            { error: 'Error al consultar cuentas', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/bancos/cuentas
 * Crea o actualiza una cuenta bancaria
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { numeroCuenta, nombre, tipoCuenta, banco, saldoInicial = 0, moneda = 'USD', activa = true } = body;

        if (!numeroCuenta || !nombre || !banco) {
            return NextResponse.json(
                { error: 'Campos requeridos: numeroCuenta, nombre, banco' },
                { status: 400 }
            );
        }

        const result = await db.query(
            {
                text: `
                    INSERT INTO bancos_cuentas 
                        (empresa_id, usuario_id, numero_cuenta, nombre, tipo_cuenta, banco,
                         saldo_actual, moneda, activa, created_at, updated_at)
                    VALUES 
                        ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                    ON CONFLICT (empresa_id, numero_cuenta) 
                    DO UPDATE SET
                        nombre = EXCLUDED.nombre,
                        tipo_cuenta = EXCLUDED.tipo_cuenta,
                        banco = EXCLUDED.banco,
                        moneda = EXCLUDED.moneda,
                        activa = EXCLUDED.activa,
                        updated_at = NOW()
                    RETURNING *
                `,
                values: [
                    context.empresaId,
                    context.usuarioId,
                    numeroCuenta,
                    nombre,
                    tipoCuenta,
                    banco,
                    saldoInicial,
                    moneda,
                    activa
                ]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0],
            mensaje: 'Cuenta bancaria guardada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al guardar cuenta bancaria:', error);
        return NextResponse.json(
            { error: 'Error al guardar cuenta', details: error.message },
            { status: 500 }
        );
    }
}
