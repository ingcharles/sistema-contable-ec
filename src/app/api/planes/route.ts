import { NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { Plan } from '@/shared/types';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Consultar Planes
        const resultPlanes = await db.querySimple('SELECT * FROM seguridad.planes WHERE activo = true ORDER BY precio_mensual ASC');
        const planes: Plan[] = resultPlanes.rows.map((row: any) => ({
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            precioMensual: parseFloat(row.precio_mensual),
            activo: row.activo,
            features: []
        }));

        // Consultar Características
        const resultFeatures = await db.querySimple('SELECT * FROM seguridad.plan_caracteristicas');
        const allFeatures = resultFeatures.rows;

        // Mapear Características a Planes
        planes.forEach(plan => {
            plan.features = allFeatures
                .filter((f: any) => f.plan_id === plan.id)
                .map((f: any) => ({
                    id: f.id,
                    planId: f.plan_id,
                    featureKey: f.clave_caracteristica,
                    tipoDocumento: f.tipo_documento,
                    valueType: f.tipo_valor as 'NUMERO' | 'BOOLEANO',
                    valueNumber: f.valor_numero,
                    valueBool: f.valor_booleano
                }));
        });

        return NextResponse.json(planes);

    } catch (error) {
        console.error('Error fetching plans with SQL:', error);
        return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 });
    }
}
