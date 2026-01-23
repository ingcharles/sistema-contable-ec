import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { IessExporter } from '@/modules/nomina/domain/services/IessExporter';

/**
 * GET /api/nomina/iess/planilla?periodo=YYYY-MM
 * Genera archivo de texto para planilla de aportes IESS
 */
export async function GET(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const periodo = searchParams.get('periodo');
        const tipo = searchParams.get('tipo') || 'aportes'; // 'aportes' o 'avisos'

        if (!periodo) {
            return NextResponse.json(
                { error: 'Parámetro periodo requerido (formato: YYYY-MM)' },
                { status: 400 }
            );
        }

        let contenido: string;
        let nombreArchivo: string;

        if (tipo === 'avisos') {
            // Avisos de entrada (requiere rango de fechas)
            const desde = searchParams.get('desde');
            const hasta = searchParams.get('hasta');

            if (!desde || !hasta) {
                return NextResponse.json(
                    { error: 'Para avisos se requieren parámetros: desde, hasta (formato: YYYY-MM-DD)' },
                    { status: 400 }
                );
            }

            contenido = await IessExporter.generarAvisosEntrada(context.empresaId!, desde, hasta);
            nombreArchivo = `AVISOS_ENTRADA_${desde}_${hasta}.txt`;
        } else {
            // Planilla de aportes
            contenido = await IessExporter.generarPlanillaAportes(context.empresaId!, periodo);
            nombreArchivo = `PLANILLA_IESS_${periodo}.txt`;
        }

        // Devolver como archivo descargable
        return new NextResponse(contenido, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
            },
        });

    } catch (error: any) {
        console.error('Error al generar archivo IESS:', error);
        return NextResponse.json(
            { error: error.message || 'Error al generar archivo IESS' },
            { status: 500 }
        );
    }
}
