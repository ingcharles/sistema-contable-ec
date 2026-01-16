
import { ComprobanteImportado } from '../domain/types';

// En un entorno real, esto usaría DOMParser para leer el XML string.
// Aquí simulamos la extracción de datos de archivos mock.

export const parseSriXml = async (file: File): Promise<ComprobanteImportado> => {
    // Simulamos latencia de lectura
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generamos datos aleatorios basados en el nombre del archivo para simular parsing
    // En producción: const text = await file.text(); const xmlDoc = new DOMParser().parseFromString(text, "text/xml");
    
    const isFactura = file.name.toLowerCase().includes('factura') || !file.name.toLowerCase().includes('ret');
    const randomTotal = Math.floor(Math.random() * 500) + 10;
    
    return {
        id: Math.random().toString(36),
        archivoNombre: file.name,
        claveAcceso: '2710202301' + Math.floor(Math.random() * 1000000000000000000000).toString(),
        rucEmisor: '179' + Math.floor(Math.random() * 1000000000).toString(),
        razonSocialEmisor: isFactura ? 'PROVEEDOR IMPORTADO S.A.' : 'CLIENTE RETENCION C.A.',
        fechaEmision: new Date().toISOString().split('T')[0],
        tipoComprobante: isFactura ? '01' : '07',
        secuencial: '001-001-' + Math.floor(Math.random() * 1000000).toString().padStart(9, '0'),
        subtotal15: isFactura ? randomTotal : 0,
        subtotal0: 0,
        iva: isFactura ? Number((randomTotal * 0.15).toFixed(2)) : 0,
        total: isFactura ? Number((randomTotal * 1.15).toFixed(2)) : randomTotal,
        estadoImportacion: 'PENDIENTE',
        existeProveedor: Math.random() > 0.5 // Simular si existe o no
    };
};
