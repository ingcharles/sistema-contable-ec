-- Migration: 019_retenciones_impuestos.sql
-- Description: Create table to persist retention tax details for re-emission.

CREATE TABLE IF NOT EXISTS facturacion.retenciones_impuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID NOT NULL REFERENCES facturacion.comprobantes_electronicos(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL, -- 1=RENTA, 2=IVA, 6=ISD
    codigo_retencion VARCHAR(10) NOT NULL, -- Código de retención (ej: 312, 1, 2)
    base_imponible NUMERIC(18,2) NOT NULL,
    porcentaje_retener NUMERIC(5,2) NOT NULL,
    valor_retenido NUMERIC(18,2) NOT NULL,
    cod_doc_sustento VARCHAR(2) NOT NULL,
    num_doc_sustento VARCHAR(20) NOT NULL,
    fecha_emision_doc_sustento DATE NOT NULL,
    -- Campos para v2.0.0
    cod_sustento VARCHAR(2) DEFAULT '01',
    num_aut_doc_sustento VARCHAR(50),
    total_sin_impuestos_doc_sustento NUMERIC(18,2),
    base_imponible_iva_doc_sustento NUMERIC(18,2),
    importe_total_doc_sustento NUMERIC(18,2),
    pago_loc_ext VARCHAR(2) DEFAULT '01',
    forma_pago VARCHAR(2) DEFAULT '20',
    iva_doc_sustento NUMERIC(18,2),
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE facturacion.retenciones_impuestos IS 'Detalle de impuestos retenidos en Comprobantes de Retención (07).';
COMMENT ON COLUMN facturacion.retenciones_impuestos.codigo IS 'Tipo de impuesto: 1 (Renta), 2 (IVA), 6 (ISD)';
COMMENT ON COLUMN facturacion.retenciones_impuestos.codigo_retencion IS 'Código del impuesto de retención según catálogo SRI';
