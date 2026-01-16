
export interface ComprobanteImportado {
    id: string;
    archivoNombre: string;
    
    // Datos Parseados
    claveAcceso: string;
    rucEmisor: string;
    razonSocialEmisor: string;
    fechaEmision: string;
    tipoComprobante: string; // '01', '04', '07'
    secuencial: string;
    
    // Valores
    subtotal15: number;
    subtotal0: number;
    iva: number;
    total: number;
    
    // Estado en el sistema
    estadoImportacion: 'PENDIENTE' | 'PROCESADO' | 'ERROR';
    mensajeError?: string;
    existeProveedor: boolean; // Si el RUC ya está en Directorio
}
