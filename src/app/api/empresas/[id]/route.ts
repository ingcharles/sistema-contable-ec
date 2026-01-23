import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * PUT /api/empresas/[id]
 * Actualiza los datos de una empresa
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: empresaId } = await params;
        const body = await request.json();

        const {
            nombreComercial,
            direccionMatriz,
            email,
            logoUrl,
            obligadoContabilidad,
            contribuyenteEspecial
        } = body;

        // Obtener usuario y empresa desde headers
        const usuarioId = request.headers.get('x-usuario-id');
        const currentEmpresaId = request.headers.get('x-empresa-id');

        // Actualizar empresa
        const query = `
            UPDATE seguridad.empresas
            SET 
                nombre_comercial = $1,
                direccion = $2,
                email = $3,
                logo_url = $4,
                es_obligado_contabilidad = $5,
                es_contribuyente_especial = $6,
                updated_at = NOW()
            WHERE id = $7
            RETURNING 
                id,
                ruc,
                razon_social AS "razonSocial",
                nombre_comercial AS "nombreComercial",
                direccion AS "direccionMatriz",
                email,
                logo_url AS "logoUrl",
                es_obligado_contabilidad AS "obligadoContabilidad",
                es_contribuyente_especial AS "contribuyenteEspecial",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
        `;

        const result = await db.query({
            text: query,
            values: [
                nombreComercial,
                direccionMatriz,
                email || '',
                logoUrl || '',
                obligadoContabilidad,
                contribuyenteEspecial,
                empresaId
            ]
        }, {
            empresaId: currentEmpresaId,
            usuarioId
        });

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Empresa no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Empresa actualizada exitosamente',
            empresa: result.rows[0]
        });

    } catch (error: any) {
        console.error('Error al actualizar empresa:', error);
        return NextResponse.json(
            { error: error.message || 'Error al actualizar empresa' },
            { status: 500 }
        );
    }
}
