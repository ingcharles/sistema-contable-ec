import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { validateContext } from '@/shared/middleware/authContext';
import { Usuario, Plan } from '@/shared/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const context = validateContext(req);

    if (!context.isValid || !context.usuarioId) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        // Obtenemos los datos del Usuario, incluyendo su plan ID (Esquema seguridad)
        const userResult = await db.querySimple({
            text: `SELECT u.id, u.plan_id, u.estado_plan, u.fecha_inicio_plan, u.fecha_fin_plan 
                   FROM seguridad.usuarios u WHERE u.id = $1`,
            values: [context.usuarioId]
        });

        if (userResult.rowCount === 0) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const userRow = userResult.rows[0];

        // Construimos objeto parcial de respuesta
        const response: Partial<Usuario> = {
            planStatus: userRow.estado_plan,
            planId: userRow.plan_id,
            // Simular stats por ahora
            usageStats: {
                createdCompanies: 0,
                currentMonthDocs: 0
            }
        };

        // Si tiene plan, cargamos los detalles
        if (userRow.plan_id) {
            const planResult = await db.querySimple({
                text: 'SELECT * FROM seguridad.planes WHERE id = $1',
                values: [userRow.plan_id]
            });

            if (planResult.rowCount && planResult.rowCount > 0) {
                const planRow = planResult.rows[0];
                const plan: Plan = {
                    id: planRow.id,
                    codigo: planRow.codigo,
                    nombre: planRow.nombre,
                    precioMensual: parseFloat(planRow.precio_mensual),
                    activo: planRow.activo,
                    features: []
                };

                // Cargar features
                const featuresResult = await db.querySimple({
                    text: 'SELECT * FROM seguridad.plan_caracteristicas WHERE plan_id = $1',
                    values: [plan.id]
                });

                plan.features = featuresResult.rows.map((f: any) => ({
                    id: f.id,
                    planId: f.plan_id,
                    featureKey: f.clave_caracteristica,
                    valueType: f.tipo_valor,
                    valueNumber: f.valor_numero,
                    valueBool: f.valor_booleano
                }));

                response.plan = plan;
            }
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching subscription SQL:', error);
        return NextResponse.json({ error: 'Error al obtener suscripción' }, { status: 500 });
    }
}
