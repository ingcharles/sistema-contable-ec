import { LogAuditoria, AuditoriaRepository } from '../domain/types';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * Implementación de AuditoriaRepository utilizando PostgreSQL
 */
export class PostgresAuditoriaRepository implements AuditoriaRepository {
    async getLogs(empresaId: string, filtros?: any): Promise<LogAuditoria[]> {
        try {
            let whereConditions = ['empresa_id = $1'];
            let values: any[] = [empresaId];
            let paramIndex = 2;

            if (filtros?.modulo) {
                whereConditions.push(`modulo = $${paramIndex}`);
                values.push(filtros.modulo);
                paramIndex++;
            }

            if (filtros?.evento) {
                whereConditions.push(`evento ILIKE $${paramIndex}`);
                values.push(`%${filtros.evento}%`);
                paramIndex++;
            }

            if (filtros?.usuarioId) {
                whereConditions.push(`usuario_id = $${paramIndex}`);
                values.push(filtros.usuarioId);
                paramIndex++;
            }

            if (filtros?.severidad) {
                whereConditions.push(`severidad = $${paramIndex}`);
                values.push(filtros.severidad);
                paramIndex++;
            }

            if (filtros?.desde) {
                whereConditions.push(`created_at >= $${paramIndex}`);
                values.push(filtros.desde);
                paramIndex++;
            }

            if (filtros?.hasta) {
                whereConditions.push(`created_at <= $${paramIndex}`);
                values.push(filtros.hasta);
                paramIndex++;
            }

            const whereClause = whereConditions.join(' AND ');

            const limit = filtros?.limit || 100;
            const offset = filtros?.offset || 0;

            const result = await db.query(
                {
                    text: `
                        SELECT 
                            id, empresa_id as "empresaId", modulo, evento, usuario_id as "usuarioId", 
                            usuario_nombre as "usuario", ip_address as "ip", severidad, 
                            datos_antes as "datosAntes", datos_despues as "datosDespues", 
                            created_at as "createdAt", created_at as "updatedAt"
                        FROM auditoria.auditoria_logs
                        WHERE ${whereClause}
                        ORDER BY created_at DESC
                        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
                    `,
                    values: [...values, limit, offset]
                },
                { empresaId, usuarioId: filtros?.usuarioId || null }
            );

            return result.rows.map(row => ({
                ...row,
                severidad: row.severidad.toUpperCase()
            }));
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error desconocido al obtener logs';
            throw new Error(`Error en PostgresAuditoriaRepository.getLogs: ${msg}`);
        }
    }

    async registrarLog(log: Partial<LogAuditoria>): Promise<void> {
        try {
            await db.query(
                {
                    text: `
                        INSERT INTO auditoria.auditoria_logs (
                            empresa_id, modulo, evento, usuario_id, usuario_nombre, 
                            ip_address, severidad, datos_antes, datos_despues, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
                        )
                    `,
                    values: [
                        log.empresaId,
                        log.modulo,
                        log.evento,
                        log.createdBy || null,
                        log.usuario,
                        log.ip,
                        log.severidad?.toLowerCase(),
                        log.datos_antes || null,
                        log.datos_despues || null
                    ]
                },
                { empresaId: log.empresaId!, usuarioId: log.createdBy || null }
            );
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error desconocido al registrar log';
            // No bloqueamos el flujo principal por un error en auditoría, pero lo reportamos
            console.warn(`No se pudo registrar log de auditoría: ${msg}`);
        }
    }
}

// Mantenemos la clase mock para compatibilidad o fallback si fuera necesario
export class InMemoryAuditoriaRepository extends PostgresAuditoriaRepository { }

// Exportamos una instancia por defecto
export const auditoriaRepository = new PostgresAuditoriaRepository();
