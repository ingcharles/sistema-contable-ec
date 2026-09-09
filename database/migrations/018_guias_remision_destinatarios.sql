-- Tabla para destinatarios de guías de remisión
CREATE TABLE IF NOT EXISTS facturacion.guias_destinatarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID NOT NULL REFERENCES facturacion.comprobantes_electronicos(id) ON DELETE CASCADE,
    identificacion VARCHAR(20) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    direccion TEXT,
    motivo_traslado VARCHAR(100),
    cod_doc_sustento VARCHAR(2),
    num_doc_sustento VARCHAR(20),
    fecha_doc_sustento DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Detalles de cada destinatario (mercadería transportada)
CREATE TABLE IF NOT EXISTS facturacion.guias_destinatarios_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destinatario_id UUID NOT NULL REFERENCES facturacion.guias_destinatarios(id) ON DELETE CASCADE,
    codigo_interno VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_guias_destinatarios_comprobante ON facturacion.guias_destinatarios(comprobante_id);
CREATE INDEX IF NOT EXISTS idx_guias_dest_detalles_dest ON facturacion.guias_destinatarios_detalles(destinatario_id);
