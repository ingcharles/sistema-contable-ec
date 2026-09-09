import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * GET /api/compras/descarga-robot
 * Lista historial de descargas del robot con filtros opcionales
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const anio = url.searchParams.get('anio');
        const mes = url.searchParams.get('mes');
        const razonSocial = url.searchParams.get('razonSocial'); // RUC del proveedor

        const whereConditions = ['dr.empresa_id = $1'];
        const values: (string | number)[] = [context.empresaId!];
        let paramIndex = 2;

        if (anio) {
            whereConditions.push(`dr.anio = $${paramIndex++}`);
            values.push(parseInt(anio));
        }
        if (mes) {
            whereConditions.push(`dr.mes = $${paramIndex++}`);
            values.push(parseInt(mes));
        }
        // Filtrar por RUC del proveedor (solo descargas que tengan comprobantes de ese emisor)
        if (razonSocial) {
            whereConditions.push(`EXISTS (
                SELECT 1 FROM compras.comprobantes_descargados cd 
                WHERE cd.descarga_id = dr.id AND cd.ruc_emisor = $${paramIndex++}
            )`);
            values.push(razonSocial);
        }

        const result = await db.query(
            {
                text: `
                    SELECT 
                        dr.id, dr.empresa_id AS "empresaId", dr.usuario_id AS "usuarioId",
                        dr.anio, dr.mes, dr.tipo_documento AS "tipoDocumento",
                        dr.estado, dr.total_encontrados AS "totalEncontrados",
                        dr.total_descargados AS "totalDescargados",
                        dr.total_procesados AS "totalProcesados",
                        dr.fecha_inicio AS "fechaInicio", dr.fecha_fin AS "fechaFin",
                        dr.error_detalle AS "errorDetalle",
                        dr.created_at AS "createdAt", dr.updated_at AS "updatedAt"
                    FROM compras.descargas_robot dr
                    WHERE ${whereConditions.join(' AND ')}
                    ORDER BY dr.anio DESC, dr.mes DESC, dr.created_at DESC
                `,
                values
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        return NextResponse.json(result.rows);
    } catch (error: any) {
        console.error('Error al listar descargas:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/compras/descarga-robot
 * Crea nueva tarea de descarga y ejecuta el robot en background
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { anio, mes, tipoDocumento = 'TODOS', registroDesde, registroHasta } = await req.json();

        if (!anio || !mes) {
            return NextResponse.json(
                { error: 'Se requieren año y mes' },
                { status: 400 }
            );
        }

        // Verificar si ya existe una descarga en curso para el mismo período
        // Verificar si ya existe una descarga en curso para el mismo período
        const existente = await db.query(
            {
                text: `SELECT id, estado, updated_at FROM compras.descargas_robot 
                    WHERE empresa_id = $1 AND anio = $2 AND mes = $3 AND tipo_documento = $4
                    ORDER BY created_at DESC LIMIT 1`,
                values: [context.empresaId, anio, mes, tipoDocumento]
            },
            { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
        );

        // if (existente.rows.length > 0 && existente.rows[0].estado === 'EN_CURSO') {
        //     const updatedAt = new Date(existente.rows[0].updated_at);
        //     const now = new Date();
        //     const diffMinutes = (now.getTime() - updatedAt.getTime()) / 1000 / 60;

        //     // Si la descarga está EN_CURSO pero no se ha actualizado en 20 minutos, asumimos que murió y permitimos reiniciar
        //     if (diffMinutes < 20) {
        //         return NextResponse.json(
        //             { error: 'Ya existe una descarga en curso para este período (iniciada recientemente)' },
        //             { status: 409 }
        //         );
        //     }
        // }

        // Crear o actualizar registro de descarga
        let descargaId: string;
        if (existente.rows.length > 0) {
            // Reiniciar la descarga existente
            const updateResult = await db.query(
                {
                    text: `UPDATE compras.descargas_robot 
                        SET estado = 'PENDIENTE', total_encontrados = 0, total_descargados = 0, 
                            total_procesados = 0, fecha_inicio = NULL, fecha_fin = NULL,
                            error_detalle = NULL, updated_at = NOW()
                        WHERE id = $1 RETURNING id`,
                    values: [existente.rows[0].id]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );
            descargaId = updateResult.rows[0].id;
        } else {
            const insertResult = await db.query(
                {
                    text: `INSERT INTO compras.descargas_robot (empresa_id, usuario_id, anio, mes, tipo_documento, estado)
                        VALUES ($1, $2, $3, $4, $5, 'PENDIENTE') RETURNING id`,
                    values: [context.empresaId, context.usuarioId, anio, mes, tipoDocumento]
                },
                { empresaId: context.empresaId!, usuarioId: context.usuarioId! }
            );
            descargaId = insertResult.rows[0].id;
        }

        // Ejecutar el robot en background (no bloquea la respuesta)
        // Importar dinámicamente para evitar errores si Playwright no está instalado
        import('@/modules/compras/domain/services/SriRobotService').then(({ SriRobotService }) => {
            SriRobotService.ejecutarDescarga(
                context.empresaId!,
                context.usuarioId!,
                descargaId,
                anio,
                mes,
                tipoDocumento,
                registroDesde,
                registroHasta
            ).catch(err => {
                console.error('Error en robot de descarga:', err);
            });
        }).catch(err => {
            console.error('Error al importar SriRobotService:', err);
        });

        return NextResponse.json({
            success: true,
            descargaId,
            mensaje: `Descarga iniciada para ${mes}/${anio}. El robot está trabajando en segundo plano.`
        });
    } catch (error: any) {
        console.error('Error al iniciar descarga:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
