import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    return NextResponse.json([
        { id: '1', codigo: '01', nombre: 'Administración', nivel: 1, activo: true },
        { id: '2', codigo: '01.01', nombre: 'Recursos Humanos', nivel: 2, activo: true },
        { id: '3', codigo: '02', nombre: 'Producción', nivel: 1, activo: true }
    ]);
}
