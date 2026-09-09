import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';

/**
 * GET /api/contabilidad/reportes/balance
 * Genera el Estado de Situación Financiera (Balance General) real desde la DB
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0];

    try {
        // Obtenemos balances acumulados de todas las cuentas hasta la fecha de corte
        // REMOVED: pc.parent_codigo
        const result = await db.query({
            text: `
                WITH balances AS (
                    SELECT 
                        pc.codigo,
                        pc.nombre,
                        pc.nivel,
                        COALESCE(SUM(ad.debe - ad.haber), 0) as saldo
                    FROM contabilidad.plan_cuentas pc
                    LEFT JOIN contabilidad.asientos_detalles ad ON pc.codigo = ad.cuenta_codigo
                    LEFT JOIN contabilidad.asientos a ON ad.asiento_id = a.id AND a.estado = 'MAYORIZADO' AND a.fecha <= $2
                    WHERE pc.empresa_id = $1
                    GROUP BY pc.codigo, pc.nombre, pc.nivel
                )
                SELECT * FROM balances WHERE saldo != 0 OR nivel = 1 ORDER BY codigo
            `,
            values: [context.empresaId, fecha]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        const rows = result.rows;

        // Función auxiliar para construir el árbol recursivamente basado en codigo y nivel
        const buildTree = (nivelActual: number, codigoPadre: string | null): any[] => {
            // Filtramos las cuentas que deberían estar en este nivel
            // Si es nivel 1, no tiene padre.
            // Si es nivel > 1, debe empezar con el codigo del padre.

            const children = rows.filter(r => {
                if (nivelActual === 1) {
                    return r.nivel === 1;
                }
                // Check if it is a direct child: level matches and code starts with parent code
                return r.nivel === nivelActual && r.codigo.startsWith(codigoPadre + '.');
            });

            return children.map(c => ({
                codigo: c.codigo,
                nombre: c.nombre,
                saldo: parseFloat(c.saldo),
                subcuentas: buildTree(c.nivel + 1, c.codigo)
            })).sort((a, b) => a.codigo.localeCompare(b.codigo));
        };

        const activos = buildTree(1, null).find(c => c.codigo.startsWith('1')) || { codigo: '1', nombre: 'ACTIVOS', saldo: 0, subcuentas: [] };
        const pasivos = buildTree(1, null).find(c => c.codigo.startsWith('2')) || { codigo: '2', nombre: 'PASIVOS', saldo: 0, subcuentas: [] };
        const patrimonio = buildTree(1, null).find(c => c.codigo.startsWith('3')) || { codigo: '3', nombre: 'PATRIMONIO', saldo: 0, subcuentas: [] };

        const totalActivos = activos.saldo || 0;
        const totalPasivos = pasivos.saldo || 0;
        const totalPatrimonio = patrimonio.saldo || 0;

        return NextResponse.json({
            fecha,
            totalActivos,
            totalPasivos,
            totalPatrimonio,
            ecuacionContable: Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) < 0.01,
            activos,
            pasivos,
            patrimonio
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error generando balance:', error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
