import { NextRequest, NextResponse } from 'next/server';
import { JWTService } from '@/shared/infrastructure/auth/jwt';

export interface SecurityContext {
    isValid: boolean;
    empresaId?: string;
    usuarioId?: string;
    roles?: string[];
    error?: string;
}

/**
 * Valida el contexto de seguridad desde headers o JWT
 * Prioridad: JWT > Headers x-empresa-id/x-usuario-id
 */
export function validateContext(req: NextRequest): SecurityContext {
    // Intentar extraer de JWT
    const authHeader = req.headers.get('authorization');
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (token) {
        try {
            const payload = JWTService.verifyAccessToken(token);
            return {
                isValid: true,
                empresaId: payload.empresaId,
                usuarioId: payload.userId,
                roles: payload.roles,
            };
        } catch (error) {
            return {
                isValid: false,
                error: 'Token JWT inválido o expirado'
            };
        }
    }

    // Fallback a headers legacy (para compatibilidad durante migración)
    const empresaId = req.headers.get('x-empresa-id');
    const usuarioId = req.headers.get('x-usuario-id');

    if (!empresaId || !usuarioId) {
        return {
            isValid: false,
            error: 'No se encontró el contexto de empresa o usuario (ni JWT ni Headers)'
        };
    }

    return {
        isValid: true,
        empresaId,
        usuarioId
    };
}

/**
 * Middleware para proteger rutas API
 */
export function withAuth(
    handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const context = validateContext(req);

        if (!context.isValid) {
            return NextResponse.json(
                { error: context.error },
                { status: 401 }
            );
        }

        return handler(req, context);
    };
}
