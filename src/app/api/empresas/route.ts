import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import crypto from 'crypto';

/**
 * GET /api/empresas
 * Lista todas las empresas
 */
export async function GET() {
    try {
        const query = `
            SELECT 
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
            FROM seguridad.empresas
            WHERE activa = true
            ORDER BY razon_social ASC
        `;

        const result = await db.querySimple(query);

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar empresas:', error);
        return NextResponse.json(
            { error: error.message || 'Error al listar empresas' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/empresas
 * Crea una nueva empresa
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            ruc,
            razonSocial,
            nombreComercial,
            direccionMatriz,
            email,
            logoUrl,
            obligadoContabilidad = false,
            contribuyenteEspecial = false
        } = body;

        if (!ruc || !razonSocial) {
            return NextResponse.json(
                { error: 'RUC y Razón Social son requeridos' },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();
        const usuarioId = request.headers.get('x-usuario-id') || 'sistema';

        const query = `
            INSERT INTO seguridad.empresas (
                id,
                ruc,
                razon_social,
                nombre_comercial,
                direccion,
                email,
                logo_url,
                es_obligado_contabilidad,
                es_contribuyente_especial,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
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
                id,
                ruc,
                razonSocial,
                nombreComercial || razonSocial,
                direccionMatriz || '',
                email || '',
                logoUrl || '',
                obligadoContabilidad,
                contribuyenteEspecial
            ]
        }, {
            empresaId: id,
            usuarioId
        });

        return NextResponse.json({
            message: 'Empresa creada exitosamente',
            empresa: result.rows[0]
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear empresa:', error);
        return NextResponse.json(
            { error: error.message || 'Error al crear empresa' },
            { status: 500 }
        );
    }
}
