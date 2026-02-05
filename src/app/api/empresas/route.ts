import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import crypto from 'crypto';

/**
 * GET /api/empresas
 * Lista empresas del usuario autenticado
 */
export async function GET(request: NextRequest) {
    try {
        const usuarioId = request.headers.get('x-usuario-id');

        if (!usuarioId) {
            return NextResponse.json(
                { error: 'Usuario no autenticado' },
                { status: 401 }
            );
        }

        const query = `
            SELECT 
                e.id,
                e.ruc,
                e.razon_social AS "razonSocial",
                e.nombre_comercial AS "nombreComercial",
                e.direccion AS "direccionMatriz",
                e.email,
                e.logo_url AS "logoUrl",
                e.es_obligado_contabilidad AS "obligadoContabilidad",
                e.es_contribuyente_especial AS "contribuyenteEspecial",
                sa.nombre AS "ambienteSriNombre",
                e.created_at AS "createdAt",
                e.updated_at AS "updatedAt"
            FROM seguridad.empresas e
            INNER JOIN seguridad.usuarios_empresas ue ON e.id = ue.empresa_id
            LEFT JOIN configuracion.sri_certificados sc ON e.id = sc.empresa_id AND sc.activo = true
            LEFT JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
            WHERE e.activa = true 
              AND ue.usuario_id = $1
              AND ue.activo = true
            ORDER BY e.razon_social ASC
        `;

        const result = await db.querySimple({ text: query, values: [usuarioId] });

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

        // Generar nuevo UUID para la empresa
        const newEmpresaId = crypto.randomUUID();
        const usuarioId = request.headers.get('x-usuario-id');

        if (!usuarioId) {
            return NextResponse.json(
                { error: 'Usuario no autenticado' },
                { status: 401 }
            );
        }

        // Ejecutar ambas operaciones en una transacción
        const result = await db.transaction(async (client) => {
            // 1. Insertar empresa
            const empresaResult = await client.query(`
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
            `, [
                newEmpresaId,
                ruc,
                razonSocial,
                nombreComercial || razonSocial,
                direccionMatriz || '',
                email || '',
                logoUrl || '',
                obligadoContabilidad,
                contribuyenteEspecial
            ]);

            // 2. Asociar usuario con la empresa
            await client.query(`
                INSERT INTO seguridad.usuarios_empresas (
                    usuario_id,
                    empresa_id,
                    activo,
                    created_at
                ) VALUES ($1, $2, true, NOW())
                ON CONFLICT (usuario_id, empresa_id) DO NOTHING
            `, [usuarioId, newEmpresaId]);

            return empresaResult.rows[0];
        }, {
            empresaId: newEmpresaId,
            usuarioId
        });

        return NextResponse.json({
            message: 'Empresa creada exitosamente',
            empresa: result
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error al crear empresa:', error);
        return NextResponse.json(
            { error: error.message || 'Error al crear empresa' },
            { status: 500 }
        );
    }
}
