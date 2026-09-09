import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de desarrollo para inyectar contexto de usuario automáticamente
 * SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
 */
export function middleware(request: NextRequest) {
    // Solo aplicar en desarrollo
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.next();
    }

    // Solo aplicar a rutas API
    if (!request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Excluir rutas de autenticación
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // Clonar headers y agregar contexto de desarrollo
    const requestHeaders = new Headers(request.headers);

    // Si no hay headers de autenticación, inyectar valores de desarrollo
    if (!requestHeaders.has('x-empresa-id') && !requestHeaders.has('authorization')) {
        // IDs de seed_data.sql
        requestHeaders.set('x-empresa-id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'); // EMPRESA DEMO
        requestHeaders.set('x-usuario-id', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'); // ADMIN DEMO

        console.log('🔧 [DEV] Inyectando contexto de desarrollo:', {
            empresaId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            usuarioId: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
            path: request.nextUrl.pathname
        });
    }

    // Crear nueva request con headers modificados
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Configurar matcher para aplicar solo a rutas API
export const config = {
    matcher: '/api/:path*',
};
