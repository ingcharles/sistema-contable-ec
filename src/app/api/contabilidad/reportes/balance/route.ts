import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const totalActivos = 125000.50;
    const totalPasivos = 45000.20;
    const totalPatrimonio = 80000.30;

    return NextResponse.json({
        totalActivos,
        totalPasivos,
        totalPatrimonio,
        ecuacionContable: (totalActivos === (totalPasivos + totalPatrimonio)),
        activos: { codigo: '1', nombre: 'ACTIVOS', saldo: totalActivos },
        pasivos: { codigo: '2', nombre: 'PASIVOS', saldo: totalPasivos },
        patrimonio: { codigo: '3', nombre: 'PATRIMONIO', saldo: totalPatrimonio }
    });
}
