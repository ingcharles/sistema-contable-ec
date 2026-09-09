import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/configuracion/puntos-emision/mis-puntos
 * Obtiene los puntos de emisión asignados al usuario actual
 */
export async function GET(request: NextRequest) {
    const context = validateContext(request);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        // Obtener puntos asignados con toda la info necesaria para el selector
        const result = await db.query(
            {
                text: `
                    SELECT 
                        upe.id,
                        pe.id as "puntoEmisionId",
                        pe.codigo as "codigoPunto",
                        s.codigo as "codigoEstablecimiento",
                        pe.nombre as "nombrePunto",
                        s.nombre as "nombreSucursal",
                        CONCAT(s.codigo, '-', pe.codigo) as "codigoCompleto",
                        upe.activo,
                        upe.es_principal as "esPrincipal",
                        upe.puede_cambiar as "puedeCambiar"
                    FROM configuracion.usuarios_puntos_emision upe
                    INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
                    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
                    WHERE upe.usuario_id = $1
                    AND upe.empresa_id = $2
                    AND pe.activo = true
                    ORDER BY s.codigo, pe.codigo
                `,
                values: [context.usuarioId, context.empresaId]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // El punto activo es el que tiene upe.activo = true en el resultado anterior
        const puntoActivo = result.rows.find(p => p.activo) || null;

        return NextResponse.json({
            puntosAsignados: result.rows,
            puntoActivo: puntoActivo
        });

    } catch (error: any) {
        console.error('Error al obtener mis puntos:', error);
        return NextResponse.json(
            { error: 'Error al obtener puntos de emisión', details: error.message },
            { status: 500 }
        );
    }
}
