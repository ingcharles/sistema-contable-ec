import { NextRequest, NextResponse } from 'next/server';

/**
 * MOCK DB para Transportistas
 */
let transportistasMock = [
    { id: '1', razonSocial: 'Transportes Rápidos S.A.', ruc: '1790011223001', placa: 'AAA-1234', email: 'info@transrapidos.com', telefono: '022334455' },
    { id: '2', razonSocial: 'Logística Ecuador Express', ruc: '0991122334001', placa: 'PBA-5678', email: 'ventas@logistica.ec', telefono: '042998877' }
];

export async function GET() {
    return NextResponse.json(transportistasMock);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validación básica
        if (!body.razonSocial || !body.identificacion || !body.placa) {
            return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
        }

        const nuevo = {
            id: Math.random().toString(36).substr(2, 9),
            ...body,
            ruc: body.identificacion // Estandarizar
        };

        transportistasMock.push(nuevo);

        console.log('DB: Transportista guardado en PostgreSQL (Simulado)');

        return NextResponse.json({ success: true, data: nuevo });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
