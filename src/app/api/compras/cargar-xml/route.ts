import { NextRequest, NextResponse } from 'next/server';
import { validateContext } from '@/shared/middleware/authContext';
import { SriXmlParser } from '@/modules/compras/domain/services/SriXmlParser';

/**
 * POST /api/compras/cargar-xml
 * Parsea un XML o TXT de factura electrónica del SRI
 * Body: { tipo: 'xml' | 'txt', contenido: string }
 */
export async function POST(req: NextRequest) {
    const context = validateContext(req);
    if (!context.isValid) {
        return NextResponse.json({ error: context.error }, { status: 401 });
    }

    try {
        const { tipo, contenido } = await req.json();

        if (!contenido) {
            return NextResponse.json(
                { error: 'Se requiere el contenido del archivo' },
                { status: 400 }
            );
        }

        let resultado;

        if (tipo === 'txt') {
            resultado = SriXmlParser.parseTxt(contenido);
        } else {
            // Default: XML
            resultado = SriXmlParser.parse(contenido);
        }

        if (!resultado.rucEmisor && !resultado.razonSocialEmisor) {
            return NextResponse.json(
                { error: 'No se pudo extraer información del archivo. Verifique el formato.' },
                { status: 422 }
            );
        }

        return NextResponse.json(resultado);
    } catch (error: any) {
        console.error('Error al parsear archivo:', error);
        return NextResponse.json(
            { error: 'Error al procesar el archivo', details: error.message },
            { status: 500 }
        );
    }
}
