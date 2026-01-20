import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';

export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) return NextResponse.json({ error: context.error }, { status: 401 });

    const totalIngresos = 50000.00;
    const totalGastos = 35000.00;

    return NextResponse.json({
        ingresos: { codigo: '4', nombre: 'INGRESOS', saldo: totalIngresos },
        gastos: { codigo: '5', nombre: 'GASTOS', saldo: totalGastos },
        utilidadOperativa: totalIngresos - totalGastos,
        utilidadNeta: totalIngresos - totalGastos
    });
}
