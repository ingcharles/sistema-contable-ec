import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'formularios' or 'ats'

    try {
        if (type === 'ats') {
            const result = await db.query({
                text: `
                    SELECT id, periodo, estado, xml_data as "xmlData", created_at as "createdAt"
                    FROM impuestos.ats
                    WHERE empresa_id = $1
                    ORDER BY created_at DESC
                `,
                values: [context.empresaId]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json(result.rows);
        } else {
            const result = await db.query({
                text: `
                    SELECT 
                        id, tipo, periodo, total_ventas as "totalVentas",
                        total_compras as "totalCompras", valor_a_pagar as "valorAPagar",
                        estado, xml_data as "xmlData", created_at as "createdAt"
                    FROM impuestos.formularios
                    WHERE empresa_id = $1
                    ORDER BY created_at DESC
                `,
                values: [context.empresaId]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json(result.rows);
        }
    } catch (error: any) {
        console.error('Error al listar impuestos:', error);
        return NextResponse.json({ error: 'Error al consultar impuestos' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const { type, periodo, tipoFormulario, totalVentas, totalCompras, valorAPagar, xmlData } = body;

        if (type === 'ats') {
            const newId = crypto.randomUUID();
            await db.query({
                text: `
                    INSERT INTO impuestos.ats (id, empresa_id, periodo, xml_data)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (empresa_id, periodo) DO UPDATE SET
                        xml_data = EXCLUDED.xml_data,
                        estado = 'REGENERADO'
                `,
                values: [newId, context.empresaId, periodo, xmlData]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json({ success: true, id: newId });
        } else {
            const newId = crypto.randomUUID();
            await db.query({
                text: `
                    INSERT INTO impuestos.formularios (
                        id, empresa_id, tipo, periodo, total_ventas,
                        total_compras, valor_a_pagar, xml_data
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (empresa_id, tipo, periodo) DO UPDATE SET
                        total_ventas = EXCLUDED.total_ventas,
                        total_compras = EXCLUDED.total_compras,
                        valor_a_pagar = EXCLUDED.valor_a_pagar,
                        xml_data = EXCLUDED.xml_data,
                        estado = 'REGENERADO'
                `,
                values: [
                    newId, context.empresaId, tipoFormulario, periodo,
                    totalVentas, totalCompras, valorAPagar, xmlData
                ]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });
            return NextResponse.json({ success: true, id: newId });
        }
    } catch (error: any) {
        console.error('Error al guardar impuesto:', error);
        return NextResponse.json({ error: 'Error al guardar el impuesto' }, { status: 500 });
    }
}
