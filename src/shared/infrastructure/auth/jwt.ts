import * as jwt from 'jsonwebtoken';

export interface JWTPayload {
    userId: string;
    empresaId: string;
    email: string;
    rol: string;
    iat?: number;
    exp?: number;
}

/**
 * Servicio para manejo de tokens JWT
 */
export class JWTService {
    private static readonly SECRET = process.env.JWT_SECRET || 'ecucontable-secret-key-change-in-production';
    private static readonly EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
    private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'ecucontable-refresh-secret';
    private static readonly REFRESH_EXPIRES_IN = '7d';

    /**
     * Genera un token de acceso JWT
     */
    static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        return jwt.sign(payload, this.SECRET, {
            expiresIn: this.EXPIRES_IN as any,
            issuer: 'ecucontable-pro',
            audience: 'ecucontable-api'
        });
    }

    /**
     * Genera un refresh token
     */
    static generateRefreshToken(userId: string): string {
        return jwt.sign({ userId, type: 'refresh' }, this.REFRESH_SECRET, {
            expiresIn: this.REFRESH_EXPIRES_IN as any,
            issuer: 'ecucontable-pro'
        });
    }

    /**
     * Verifica y decodifica un token de acceso
     */
    static verifyAccessToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, this.SECRET, {
                issuer: 'ecucontable-pro',
                audience: 'ecucontable-api'
            }) as JWTPayload;
            return decoded;
        } catch (error) {
            throw new Error('Token inválido o expirado');
        }
    }

    /**
     * Verifica un refresh token
     */
    static verifyRefreshToken(token: string): { userId: string; type: string } {
        try {
            const decoded = jwt.verify(token, this.REFRESH_SECRET, {
                issuer: 'ecucontable-pro'
            }) as { userId: string; type: string };

            if (decoded.type !== 'refresh') {
                throw new Error('Token de tipo incorrecto');
            }

            return decoded;
        } catch (error) {
            throw new Error('Refresh token inválido o expirado');
        }
    }

    /**
     * Decodifica un token sin verificar (útil para debugging)
     */
    static decode(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch {
            return null;
        }
    }

    /**
     * Extrae el token del header Authorization
     */
    static extractTokenFromHeader(authHeader: string | null): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
