
// Base de conocimiento estática sobre normativa SRI Ecuador (Simulación de RAG)

export interface SriRule {
    keywords: string[];
    respuesta: string;
    categoria: 'RETENCION_RENTA' | 'RETENCION_IVA' | 'DEDUCIBILIDAD' | 'GENERAL';
}

export const SRI_KNOWLEDGE_BASE: SriRule[] = [
    {
        keywords: ['honorarios', 'profesionales', 'servicios profesionales'],
        respuesta: "Para honorarios profesionales a personas naturales residentes, aplica el código **303** con una retención del **10%** del Impuesto a la Renta. Si es sociedad, aplica el 2.75% (Cod. 3440).",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['bienes', 'compra bienes', 'muebles', 'inventario'],
        respuesta: "La transferencia de bienes muebles de naturaleza corporal (compras generales) aplica el código **312** con retención del **1.75%**.",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['transporte', 'flete', 'carga'],
        respuesta: "Para servicios de transporte privado de carga o pasajeros, aplica el código **311** con retención del **1%**.",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['arriendo', 'alquiler', 'inmueble', 'local', 'oficina'],
        respuesta: "El arrendamiento de bienes inmuebles aplica el código **320** con una retención del **8%** si el beneficiario es persona natural o sociedad.",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['construccion', 'obra', 'inmobiliaria'],
        respuesta: "Para contratos de construcción y urbanización, aplica el código **3140** con el **1.75%**.",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['tarjeta', 'credito', 'liquidación'],
        respuesta: "Los pagos a través de tarjeta de crédito/débito no están sujetos a retención en la fuente por parte del comercio (la retención la hace la emisora de la tarjeta).",
        categoria: 'GENERAL'
    },
    {
        keywords: ['rimpe', 'negocio popular'],
        respuesta: "A los contribuyentes **RIMPE - Negocio Popular** NO se les debe retener Impuesto a la Renta (Tarifa 0%), pero sí se debe emitir la retención informativa. En IVA tampoco se retiene.",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['rimpe emprendedor', 'emprendedor'],
        respuesta: "A los contribuyentes **RIMPE - Emprendedor** se les retiene el **1%** en renta (Cód. 343) para bienes y servicios.",
        categoria: 'RETENCION_RENTA'
    },
    {
        keywords: ['retencion iva bienes', 'iva bienes'],
        respuesta: "En compra de bienes, habitualmente se retiene el **30%** del IVA generado si eres Agente de Retención y el proveedor no es Contribuyente Especial.",
        categoria: 'RETENCION_IVA'
    },
    {
        keywords: ['retencion iva servicios', 'iva servicios'],
        respuesta: "En prestación de servicios, habitualmente se retiene el **70%** del IVA generado.",
        categoria: 'RETENCION_IVA'
    }
];
