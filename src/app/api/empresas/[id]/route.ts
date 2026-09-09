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
            logo,
            obligadoContabilidad,
            contribuyenteEspecial,
            colorPrimario,
            colorSecundario,
            colorAcento
        } = body;

        // Convertir logo (Base64) a Buffer para guardar en BYTEA
        let logoBuffer = undefined;
        if (logo !== undefined) {
            if (logo === null || logo === '') {
                logoBuffer = null;
            } else {
                try {
                    const base64Data = logo.replace(/^data:image\/\w+;base64,/, "");
                    logoBuffer = Buffer.from(base64Data, 'base64');
                } catch (e) {
                    console.error('Error al decodificar logo base64:', e);
                }
            }
        }

        // Obtener usuario y empresa desde headers
        const usuarioId = request.headers.get('x-usuario-id');
        const currentEmpresaId = request.headers.get('x-empresa-id');

        // Actualizar empresa
        // Construimos la query dinámicamente para no borrar el logo si no se envía
        let query = `
            UPDATE seguridad.empresas
            SET 
                nombre_comercial = $1,
                direccion = $2,
                email = $3,
                es_obligado_contabilidad = $4,
                es_contribuyente_especial = $5,
                color_primario = $6,
                color_secundario = $7,
                color_acento = $8,
                updated_at = NOW()
        `;

        const values = [
            nombreComercial,
            direccionMatriz,
            email || '',
            obligadoContabilidad,
            contribuyenteEspecial,
            colorPrimario || null,
            colorSecundario || null,
            colorAcento || null
        ];

        let paramCount = 9;
        if (logoBuffer !== undefined) {
            query += `, logo = $${paramCount++}`;
            values.push(logoBuffer);
        }

        query += ` WHERE id = $${paramCount}
            RETURNING 
                id,
                ruc,
                razon_social AS "razonSocial",
                nombre_comercial AS "nombreComercial",
                direccion AS "direccionMatriz",
                email,
                logo,
                es_obligado_contabilidad AS "obligadoContabilidad",
                es_contribuyente_especial AS "contribuyenteEspecial",
                color_primario AS "colorPrimario",
                color_secundario AS "colorSecundario",
                color_acento AS "colorAcento",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
        `;
        values.push(empresaId);

        const result = await db.query({
            text: query,
            values: values
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

        const row = result.rows[0];
        if (row.logo) {
            row.logo = row.logo.toString('base64');
        }

        return NextResponse.json({
            message: 'Empresa actualizada exitosamente',
            empresa: row
        });

    } catch (error: any) {
        console.error('Error al actualizar empresa:', error);
        return NextResponse.json(
            { error: error.message || 'Error al actualizar empresa' },
            { status: 500 }
        );
    }
}
