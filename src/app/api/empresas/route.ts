import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';

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
                e.logo,
                e.es_obligado_contabilidad AS "obligadoContabilidad",
                e.es_contribuyente_especial AS "contribuyenteEspecial",
                e.color_primario AS "colorPrimario",
                e.color_secundario AS "colorSecundario",
                e.color_acento AS "colorAcento",
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

        // Convertir logo (Buffer/BYTEA) a Base64 para el frontend
        const rows = result.rows.map(row => ({
            ...row,
            logo: row.logo ? row.logo.toString('base64') : null
        }));

        return NextResponse.json(rows);
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
            logo,
            obligadoContabilidad = false,
            contribuyenteEspecial = false
        } = body;

        if (!ruc || !razonSocial) {
            return NextResponse.json(
                { error: 'RUC y Razón Social son requeridos' },
                { status: 400 }
            );
        }

        // Convertir logo (Base64) a Buffer para guardar en BYTEA
        let logoBuffer = null;
        if (logo) {
            try {
                // Si viene el header data:image/..., lo removemos
                const base64Data = logo.replace(/^data:image\/\w+;base64,/, "");
                logoBuffer = Buffer.from(base64Data, 'base64');
            } catch (e) {
                console.error('Error al decodificar logo base64:', e);
            }
        }

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
                    ruc,
                    razon_social,
                    nombre_comercial,
                    direccion,
                    email,
                    logo,
                    es_obligado_contabilidad,
                    es_contribuyente_especial,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
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
                    created_at AS "createdAt",
                    updated_at AS "updatedAt"
            `, [
                ruc,
                razonSocial,
                nombreComercial || razonSocial,
                direccionMatriz || '',
                email || '',
                logoBuffer,
                obligadoContabilidad,
                contribuyenteEspecial
            ]);

            // Transformar logo de vuelta a base64 para la respuesta
            const row = empresaResult.rows[0];
            if (row.logo) {
                row.logo = row.logo.toString('base64');
            }

            return row;
        }, {
            empresaId: null,
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
