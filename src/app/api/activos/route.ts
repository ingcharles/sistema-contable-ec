import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const result = await db.query({
            text: `
                SELECT 
                    id, codigo, nombre, categoria, fecha_adquisicion as "fechaAdquisicion",
                    valor_adquisicion as "valorAdquisicion", valor_residual as "valorResidual",
                    vida_util_meses as "vidaUtilMeses", depreciacion_acumulada as "depreciacionAcumulada",
                    valor_libros as "valorLibros", estado, ubicacion, responsable,
                    created_at as "createdAt", updated_at as "updatedAt"
                FROM activos.activos_fijos
                WHERE empresa_id = $1
                ORDER BY created_at DESC
            `,
            values: [context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar activos:', error);
        return NextResponse.json({ error: 'Error al consultar activos' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    try {
        const body = await req.json();
        const {
            id, codigo, nombre, categoria, fechaAdquisicion,
            valorAdquisicion, valorResidual, vidaUtilMeses,
            depreciacionAcumulada, valorLibros, estado,
            ubicacion, responsable
        } = body;

        if (!id) {
            // Insertar nuevo activo
            const newId = crypto.randomUUID();
            await db.query({
                text: `
                    INSERT INTO activos.activos_fijos (
                        id, empresa_id, usuario_id, codigo, nombre, categoria,
                        fecha_adquisicion, valor_adquisicion, valor_residual,
                        vida_util_meses, depreciacion_acumulada, valor_libros,
                        estado, ubicacion, responsable
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                `,
                values: [
                    newId, context.empresaId, context.usuarioId, codigo, nombre, categoria,
                    fechaAdquisicion, valorAdquisicion, valorResidual, vidaUtilMeses,
                    depreciacionAcumulada, valorLibros, estado, ubicacion, responsable
                ]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

            return NextResponse.json({ success: true, id: newId });
        } else {
            // Actualizar activo existente
            await db.query({
                text: `
                    UPDATE activos.activos_fijos SET
                        codigo = $1, nombre = $2, categoria = $3,
                        fecha_adquisicion = $4, valor_adquisicion = $5,
                        valor_residual = $6, vida_util_meses = $7,
                        depreciacion_acumulada = $8, valor_libros = $9,
                        estado = $10, ubicacion = $11, responsable = $12,
                        updated_at = NOW()
                    WHERE id = $13 AND empresa_id = $14
                `,
                values: [
                    codigo, nombre, categoria, fechaAdquisicion, valorAdquisicion,
                    valorResidual, vidaUtilMeses, depreciacionAcumulada, valorLibros,
                    estado, ubicacion, responsable, id, context.empresaId
                ]
            }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

            return NextResponse.json({ success: true, id });
        }
    } catch (error: any) {
        console.error('Error al guardar activo:', error);
        return NextResponse.json({ error: 'Error al guardar el activo' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    try {
        await db.query({
            text: 'DELETE FROM activos.activos_fijos WHERE id = $1 AND empresa_id = $2',
            values: [id, context.empresaId]
        }, { empresaId: context.empresaId!, usuarioId: context.usuarioId! });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error al eliminar activo:', error);
        return NextResponse.json({ error: 'Error al eliminar el activo' }, { status: 500 });
    }
}
