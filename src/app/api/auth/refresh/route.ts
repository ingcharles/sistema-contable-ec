import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/shared/infrastructure/auth/jwt';
import { db } from '@/shared/infrastructure/database/postgresql';

/**
 * POST /api/auth/refresh
 * Renueva el access token usando un refresh token válido
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token requerido' },
                { status: 400 }
            );
        }

        // Verificar refresh token
        let decoded;
        try {
            decoded = JWTService.verifyRefreshToken(refreshToken);
        } catch (error) {
            return NextResponse.json(
                { error: 'Refresh token inválido o expirado' },
                { status: 401 }
            );
        }

        // Obtener datos actualizados del usuario
        const userResult = await db.querySimple({
            text: `
                SELECT 
                    u.id, u.email, u.nombre, u.rol, u.activo
                FROM usuarios u
                WHERE u.id = $1
            `,
            values: [decoded.userId]
        });

        if (userResult.rows.length === 0 || !userResult.rows[0].activo) {
            return NextResponse.json(
                { error: 'Usuario no encontrado o inactivo' },
                { status: 401 }
            );
        }

        const user = userResult.rows[0];

        // Obtener empresa actual del usuario
        const empresaResult = await db.querySimple({
            text: `
                SELECT empresa_id 
                FROM usuarios_empresas
                WHERE usuario_id = $1 AND activo = true
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

        const empresaId = empresaResult.rows[0].empresa_id;

        // Generar nuevo access token
        const newAccessToken = JWTService.generateAccessToken({
            userId: user.id,
            empresaId,
            email: user.email,
            rol: user.rol
        });

        return NextResponse.json({
            success: true,
            accessToken: newAccessToken,
            expiresIn: '8h'
        });

    } catch (error: any) {
        console.error('Error al renovar token:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
