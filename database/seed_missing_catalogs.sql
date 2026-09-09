-- Semilla para catálogos faltantes del SRI
-- CODIGO_IMPUESTO, TIPO_EMISION, TIPO_COMPROBANTE

-- 1. Asegurar que los tipos existan (si se decide mantener las dos tablas)
INSERT INTO configuracion.catalogos_tipos (codigo, nombre, descripcion) VALUES
('SRI_CODIGO_IMPUESTO', 'Código de Impuesto SRI', '2=IVA, 3=ICE, 5=IRBPNR'),
('SRI_TIPO_EMISION', 'Tipo de Emisión SRI', '1=Normal, 2=Indisponibilidad del Sistema'),
ON CONFLICT (codigo) DO NOTHING;

-- 2. Insertar ítems
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor) VALUES
-- SRI_CODIGO_IMPUESTO
('SRI_CODIGO_IMPUESTO', '2', 'IVA'),
('SRI_CODIGO_IMPUESTO', '3', 'ICE'),
('SRI_CODIGO_IMPUESTO', '5', 'IRBPNR'),

-- SRI_TIPO_EMISION
('SRI_TIPO_EMISION', '1', 'NORMAL'),


ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;
