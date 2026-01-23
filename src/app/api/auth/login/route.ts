import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/infrastructure/database/postgresql';
import { JWTService } from '@/shared/infrastructure/auth/jwt';
import crypto from 'crypto';

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve tokens JWT
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, empresaId } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Buscar usuario con sus roles
        const userResult = await db.querySimple({
            text: `
                SELECT 
                    u.id, u.email, u.nombre, u.password_hash, u.activo,
                    COALESCE(array_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL), ARRAY[]::text[]) as roles
                FROM seguridad.usuarios u
                LEFT JOIN seguridad.usuarios_roles ur ON u.id = ur.usuario_id
                LEFT JOIN seguridad.roles r ON ur.rol_id = r.id
                WHERE u.email = $1
                GROUP BY u.id
            `,
            values: [email]
        });

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        const user = userResult.rows[0];

        // ... (verificación de activo y password_hash igual que antes)
        if (!user.activo) {
            return NextResponse.json(
                { error: 'Usuario inactivo. Contacte al administrador' },
                { status: 403 }
            );
        }

        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        if (passwordHash !== user.password_hash) {
            // Registrar intento fallido en auditoría
            await db.querySimple({
                text: `
                    INSERT INTO auditoria.auditoria_logs 
                        (modulo, evento, usuario_id, severidad, ip_address, created_at)
                    VALUES 
                        ('AUTH', 'LOGIN_FAILED', $1, 'WARNING', $2, NOW())
                `,
                values: [user.id, req.headers.get('x-forwarded-for') || 'unknown']
            });

            return NextResponse.json(
                { error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Determinar empresa (igual que antes)
        let selectedEmpresaId = empresaId;

        if (!selectedEmpresaId) {
            const empresaResult = await db.querySimple({
                text: `
                    SELECT ue.empresa_id 
                    FROM seguridad.usuarios_empresas ue
                    WHERE ue.usuario_id = $1 AND ue.activo = true
                    LIMIT 1
                `,
                values: [user.id]
            });

            if (empresaResult.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Usuario sin empresas asignadas' },
                    { status: 403 }
                );
            }

            selectedEmpresaId = empresaResult.rows[0].empresa_id;
        } else {
            const accessResult = await db.querySimple({
                text: `
                    SELECT 1 FROM seguridad.usuarios_empresas
                    WHERE usuario_id = $1 AND empresa_id = $2 AND activo = true
                `,
                values: [user.id, selectedEmpresaId]
            });

            if (accessResult.rows.length === 0) {
                return NextResponse.json(
                    { error: 'No tiene acceso a la empresa solicitada' },
                    { status: 403 }
                );
            }
        }

        // Generar tokens JWT con múltiples roles
        const accessToken = JWTService.generateAccessToken({
            userId: user.id,
            empresaId: selectedEmpresaId,
            email: user.email,
            roles: user.roles
        });

        const refreshToken = JWTService.generateRefreshToken(user.id);

        // Registrar login exitoso (igual que antes)
        await db.querySimple({
            text: `
                INSERT INTO auditoria.auditoria_logs 
                    (empresa_id, modulo, evento, usuario_id, usuario_nombre, severidad, ip_address, created_at)
                VALUES 
                    ($1, 'AUTH', 'LOGIN_SUCCESS', $2, $3, 'INFO', $4, NOW())
            `,
            values: [
                selectedEmpresaId,
                user.id,
                user.nombre,
                req.headers.get('x-forwarded-for') || 'unknown'
            ]
        });

        await db.querySimple({
            text: `UPDATE seguridad.usuarios SET ultimo_acceso = NOW() WHERE id = $1`,
            values: [user.id]
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                roles: user.roles
            },
            empresaId: selectedEmpresaId,
            accessToken,
            refreshToken,
            expiresIn: '8h'
        });

    } catch (error: any) {
        console.error('Error en login:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
