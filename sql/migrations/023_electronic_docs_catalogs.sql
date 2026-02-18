
ALTER TABLE IF EXISTS facturacion.comprobantes_electronicos
    ADD COLUMN transportista_identificacion character varying(100);
-- Migration: 023_electronic_docs_catalogs.sql
-- Description: Inserta tipos y items de catálogos para motivos de NC, ND y Guía de Remisión

-- 1. Insertar Tipos de Catálogos
INSERT INTO configuracion.catalogos_tipos (codigo, nombre, descripcion, sistema, activo) VALUES
('MOTIVO_NC', 'Motivos de Nota de Crédito', 'Catálogo de motivos para emisión de Notas de Crédito (SRI)', true, true),
('MOTIVO_ND', 'Motivos de Nota de Débito', 'Catálogo de motivos para emisión de Notas de Débito (SRI)', true, true),
('MOTIVO_GR', 'Motivos de Guía de Remisión', 'Catálogo de motivos para traslado de mercadería (SRI)', true, true)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Insertar Items de Catálogos
-- Motivos de Nota de Crédito
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, activo) VALUES
('MOTIVO_NC', '01', 'DEVOLUCION DE MERCADERIA', true),
('MOTIVO_NC', '02', 'DESCUENTO NO CONSIDERADO', true),
('MOTIVO_NC', '03', 'ERROR EN PRECIO O CANTIDAD', true),
('MOTIVO_NC', '04', 'ANULACION DE FACTURA', true),
('MOTIVO_NC', '99', 'OTRO', true)
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- Motivos de Nota de Débito
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, activo) VALUES
('MOTIVO_ND', '01', 'INTERESES POR MORA', true),
('MOTIVO_ND', '02', 'GASTOS ADMINISTRATIVOS', true),
('MOTIVO_ND', '03', 'DIFERENCIA EN PRECIO', true),
('MOTIVO_ND', '04', 'GASTOS BANCARIOS', true),
('MOTIVO_ND', '99', 'OTRO', true)
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- Motivos de Guía de Remisión (Códigos Oficiales SRI)
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, activo) VALUES
('MOTIVO_GR', '01', 'VENTA DE MERCADERIA', true),
('MOTIVO_GR', '02', 'TRASLADO ENTRE BODEGAS', true),
('MOTIVO_GR', '04', 'DEVOLUCION DE COMPRA', true),
('MOTIVO_GR', '05', 'COMPRA DE MERCADERIA', true),
('MOTIVO_GR', '06', 'ENTREGA DE PROMOCIONES', true),
('MOTIVO_GR', '07', 'FERIA O EXPOSICION', true),
('MOTIVO_GR', '08', 'TRANSFORMACION', true),
('MOTIVO_GR', '99', 'OTROS', true)
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;
