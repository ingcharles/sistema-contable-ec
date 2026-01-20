-- ============================================================================
-- ECUCONTABLE PRO - DATOS DE CATÁLOGOS SRI
-- ============================================================================
-- Fuente: Ficha Técnica Comprobantes Electrónicos SRI v2.21
-- ============================================================================

-- 1. CREACIÓN DE TIPOS DE CATÁLOGO
-- ============================================================================

INSERT INTO catalogos_tipos (codigo, nombre, descripcion) VALUES
('SRI_TIPO_COMPROBANTE', 'Tipos de Comprobante SRI', 'Tabla 3: Tipos de Comprobante'),
('SRI_TIPO_IDENTIFICACION', 'Tipos de Identificación', 'Tabla 6: Tipos de Identificación'),
('SRI_IMPUESTO_RETENCION', 'Códigos de Retención', 'Tabla 9: Impuestos y Retenciones'),
('SRI_TIPO_IMPUESTO_IVA', 'Porcentajes de IVA', 'Tabla 16: Código de Porcentaje IVA'),
('SRI_FORMA_PAGO', 'Formas de Pago', 'Tabla 24: Formas de Pago'),
('SYS_TIPO_CUENTA_BANCO', 'Tipos de Cuenta Bancaria', 'Catálogo interno de sistema'),
('SYS_BANCOS_ECUADOR', 'Bancos del Ecuador', 'Instituciones financieras principales')
ON CONFLICT (codigo) DO NOTHING;

-- 2. INSERCIÓN DE ITEMS
-- ============================================================================

-- A. SRI_TIPO_COMPROBANTE
INSERT INTO catalogos_items (catalogo_codigo, codigo, valor, descripcion) VALUES
('SRI_TIPO_COMPROBANTE', '01', 'FACTURA', 'Comprobante de venta'),
('SRI_TIPO_COMPROBANTE', '03', 'LIQUIDACIÓN DE COMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS', 'Compras a personas sin RUC'),
('SRI_TIPO_COMPROBANTE', '04', 'NOTA DE CRÉDITO', 'Anulaciones o descuentos'),
('SRI_TIPO_COMPROBANTE', '05', 'NOTA DE DÉBITO', 'Cobros adicionales'),
('SRI_TIPO_COMPROBANTE', '06', 'GUÍA DE REMISIÓN', 'Sustento de traslado'),
('SRI_TIPO_COMPROBANTE', '07', 'COMPROBANTE DE RETENCIÓN', 'Retenciones en la fuente e IVA')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- B. SRI_TIPO_IDENTIFICACION
INSERT INTO catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SRI_TIPO_IDENTIFICACION', '04', 'RUC'),
('SRI_TIPO_IDENTIFICACION', '05', 'CÉDULA'),
('SRI_TIPO_IDENTIFICACION', '06', 'PASAPORTE'),
('SRI_TIPO_IDENTIFICACION', '07', 'CONSUMIDOR FINAL'),
('SRI_TIPO_IDENTIFICACION', '08', 'IDENTIFICACIÓN DEL EXTERIOR')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- C. SRI_TIPO_IMPUESTO_IVA
INSERT INTO catalogos_items (catalogo_codigo, codigo, valor, descripcion, orden) VALUES
('SRI_TIPO_IMPUESTO_IVA', '0', '0%', 'Tarifa 0% de IVA', 1),
('SRI_TIPO_IMPUESTO_IVA', '2', '12%', 'Tarifa 12% de IVA', 2),
('SRI_TIPO_IMPUESTO_IVA', '3', '14%', 'Tarifa 14% de IVA (Temporal)', 4),
('SRI_TIPO_IMPUESTO_IVA', '4', '15%', 'Tarifa 15% de IVA (Actual 2024)', 3),
('SRI_TIPO_IMPUESTO_IVA', '5', '5%', 'Tarifa 5% de IVA (Materiales construcción)', 5),
('SRI_TIPO_IMPUESTO_IVA', '6', 'NO OBJETO DE IMPUESTO', 'No grava IVA', 6),
('SRI_TIPO_IMPUESTO_IVA', '7', 'EXENTO DE IVA', 'Exento legal de IVA', 7)
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- D. SRI_FORMA_PAGO
INSERT INTO catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SRI_FORMA_PAGO', '01', 'SIN UTILIZACION DEL SISTEMA FINANCIERO'),
('SRI_FORMA_PAGO', '15', 'COMPENSACIÓN DE DEUDAS'),
('SRI_FORMA_PAGO', '16', 'TARJETA DE DÉBITO'),
('SRI_FORMA_PAGO', '19', 'TARJETA DE CRÉDITO'),
('SRI_FORMA_PAGO', '20', 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO'),
('SRI_FORMA_PAGO', '21', 'ENDOSO DE TÍTULOS')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- E. SYS_TIPO_CUENTA_BANCO
INSERT INTO catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SYS_TIPO_CUENTA_BANCO', 'AHORROS', 'CUENTA DE AHORROS'),
('SYS_TIPO_CUENTA_BANCO', 'CORRIENTE', 'CUENTA CORRIENTE')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- F. SYS_BANCOS_ECUADOR (Principales)
INSERT INTO catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SYS_BANCOS_ECUADOR', 'BP', 'BANCO PICHINCHA'),
('SYS_BANCOS_ECUADOR', 'BG', 'BANCO GUAYAQUIL'),
('SYS_BANCOS_ECUADOR', 'BB', 'PRODUBANCO'),
('SYS_BANCOS_ECUADOR', 'BPA', 'BANCO DEL PACÍFICO'),
('SYS_BANCOS_ECUADOR', 'BI', 'BANCO INTERNACIONAL'),
('SYS_BANCOS_ECUADOR', 'BOL', 'BANCO BOLIVARIANO')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

