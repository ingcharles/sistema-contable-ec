-- ============================================================================
-- ECUCONTABLE PRO - SEED DATA (DATOS DE PRUEBA)
-- ============================================================================
-- Descripción: Script para poblar la base de datos con información inicial
-- para desarrollo y pruebas.
-- Orden de ejecución: 1. Schema, 2. Indexes, 3. Seed Data
-- ============================================================================

-- 1. EMPRESA DEMO
INSERT INTO seguridad.empresas (id, ruc, razon_social, nombre_comercial, direccion, email, obligado_contabilidad)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '1790011222001',
    'EMPRESA DEMO S.A.',
    'ECUCONTABLE STORE',
    'Av. Amazonas y Naciones Unidas, Quito',
    'admin@ecucontable.com',
    true
) ON CONFLICT (ruc) DO NOTHING;

-- 2. USUARIO ADMIN
-- Password: password123 (Hash SHA-256 referencial)
INSERT INTO seguridad.usuarios (id, email, nombre, password_hash, rol, activo)
VALUES (
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11',
    'admin@demo.com',
    'Administrador Demo',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 
    'ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;

-- 3. RELACIÓN USUARIO-EMPRESA
INSERT INTO seguridad.usuarios_empresas (usuario_id, empresa_id)
VALUES (
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- 4. TERCEROS (CLIENTES Y PROVEEDORES)
-- Consumidor Final (obligatorio según SRI)
INSERT INTO directorio.terceros (id, empresa_id, tipo_identificacion, identificacion, razon_social, tipo_tercero, activo, created_by)
VALUES (
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '07',
    '9999999999999',
    'CONSUMIDOR FINAL',
    'CLIENTE',
    true,
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11'
) ON CONFLICT (empresa_id, identificacion) DO NOTHING;

-- Cliente ejemplo 1
INSERT INTO directorio.terceros (id, empresa_id, tipo_identificacion, identificacion, razon_social, nombre_comercial, tipo_tercero, 
                      email, telefono, celular, direccion, ciudad, provincia, limite_credito, dias_credito, activo, created_by)
VALUES (
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '04',
    '1792345678001',
    'TECNOLOGÍA AVANZADA CIA. LTDA.',
    'TECH ADVANCE',
    'CLIENTE',
    'ventas@techadvance.com',
    '02-2345678',
    '0998765432',
    'Av. República del Salvador N34-183',
    'Quito',
    'Pichincha',
    5000.00,
    30,
    true,
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11'
) ON CONFLICT (empresa_id, identificacion) DO NOTHING;

-- Cliente ejemplo 2
INSERT INTO directorio.terceros (id, empresa_id, tipo_identificacion, identificacion, razon_social, tipo_tercero, 
                      email, telefono, direccion, ciudad, provincia, limite_credito, dias_credito, activo, created_by)
VALUES (
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t03',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '05',
    '1712345678',
    'RODRIGUEZ MARTINEZ JUAN CARLOS',
    'CLIENTE',
    'jrodriguez@email.com',
    '02-3456789',
    'Calle Los Shyris N45-123',
    'Quito',
    'Pichincha',
    2000.00,
    15,
    true,
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11'
) ON CONFLICT (empresa_id, identificacion) DO NOTHING;

-- Proveedor ejemplo 1
INSERT INTO directorio.terceros (id, empresa_id, tipo_identificacion, identificacion, razon_social, nombre_comercial, tipo_tercero,
                      es_contribuyente_especial, email, telefono, direccion, ciudad, provincia, dias_credito, activo, created_by)
VALUES (
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t04',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '04',
    '1791234567001',
    'IMPORTADORA SUMINISTROS S.A.',
    'IMPORT SUMINISTROS',
    'PROVEEDOR',
    true,
    'compras@importsuministros.com',
    '02-4567890',
    'Av. 6 de Diciembre N33-123',
    'Quito',
    'Pichincha',
    45,
    true,
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11'
) ON CONFLICT (empresa_id, identificacion) DO NOTHING;

-- Cliente Y Proveedor (AMBOS)
INSERT INTO directorio.terceros (id, empresa_id, tipo_identificacion, identificacion, razon_social, nombre_comercial, tipo_tercero,
                      email, telefono, direccion, ciudad, provincia, limite_credito, dias_credito, activo, created_by)
VALUES (
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t05',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '04',
    '1798765432001',
    'COMERCIAL DISTRIBUIDORA DEL NORTE S.A.',
    'DISTRYNORTE',
    'AMBOS',
    'admin@distrynorte.com',
    '02-5678901',
    'Av. Eloy Alfaro N35-456',
    'Quito',
    'Pichincha',
    3000.00,
    30,
    true,
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11'
) ON CONFLICT (empresa_id, identificacion) DO NOTHING;

-- 5. PLAN DE CUENTAS BÁSICO (NIIF)
INSERT INTO contabilidad.plan_cuentas (empresa_id, usuario_id, codigo, nombre, tipo, nivel, saldo) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '1', 'ACTIVO', 'ACTIVO', 1, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '1.1', 'ACTIVO CORRIENTE', 'ACTIVO', 2, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '1.1.01', 'EFECTIVO Y EQUIVALENTES', 'ACTIVO', 3, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '1.1.01.01', 'CAJA GENERAL', 'ACTIVO', 4, 500.00),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '1.1.01.02', 'BANCOS', 'ACTIVO', 4, 15000.00),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '1.1.03', 'INVENTARIOS', 'ACTIVO', 3, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '2', 'PASIVO', 'PASIVO', 1, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '2.1', 'PASIVO CORRIENTE', 'PASIVO', 2, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '4', 'INGRESOS', 'INGRESO', 1, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '4.1', 'INGRESOS OPERACIONALES', 'INGRESO', 2, 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11', '5', 'GASTOS', 'GASTO', 1, 0);

-- 6. BODEGA PRINCIPAL
INSERT INTO inventario.bodegas (id, empresa_id, codigo, nombre, responsable, ubicacion)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MATRIZ',
    'BODEGA CENTRAL',
    'Juan Bodeguero',
    'Planta Baja'
) ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- 7. CATEGORÍA DE PRODUCTOS
INSERT INTO inventario.categorias_producto (id, empresa_id, nombre, cuenta_inventario, cuenta_costo_venta, cuenta_venta)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'TECNOLOGÍA',
    '1.1.03.01', -- Inventario MP
    '5.1.01',    -- Costo Ventas
    '4.1.01'     -- Ventas
);

-- 8. PRODUCTOS
INSERT INTO inventario.productos (id, empresa_id, usuario_id, codigo_principal, nombre, precio_venta, categoria_id, stock_actual, stock_minimo, costo_promedio)
VALUES 
(
    'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380p01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11',
    'LAP-001',
    'LAPTOP DELL INSPIRON 15',
    899.99,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    10, 
    2,
    650.00
),
(
    'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380p02',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11',
    'MOU-001',
    'MOUSE INALAMBRICO LOGITECH',
    25.50,
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01',
    50,
    10,
    12.00
);

-- 9. CUENTA BANCARIA
INSERT INTO bancos.bancos_cuentas (empresa_id, usuario_id, numero_cuenta, nombre, banco, saldo_actual)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11',
    '1234567890',
    'CUENTA CORRIENTE PRINCIPAL',
    'BANCO PICHINCHA',
    15000.00
) ON CONFLICT (empresa_id, numero_cuenta) DO NOTHING;

-- 10. ASIENTO CONTABLE DE APERTURA (Ejemplo)
INSERT INTO contabilidad.asientos_cab (id, empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
VALUES (
    'as0ebc99-9c0b-4ef8-bb6d-6bb9bd380as1',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'u0eebc99-9c0b-4ef8-bb6d-6bb9bd380u11',
    '2024-00001',
    '2024-01-01',
    'ASIENTO DE APERTURA 2024',
    'APERTURA',
    'MAYORIZADO'
) ON CONFLICT (empresa_id, numero) DO NOTHING;

INSERT INTO contabilidad.asientos_det (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES
('as0ebc99-9c0b-4ef8-bb6d-6bb9bd380as1', '1.1.01.02', 15000.00, 0, 'Saldo Bancos'),
('as0ebc99-9c0b-4ef8-bb6d-6bb9bd380as1', '1.1.01.01', 500.00, 0, 'Caja Chica'),
('as0ebc99-9c0b-4ef8-bb6d-6bb9bd380as1', '4.1', 0, 15500.00, 'Capital Social');

-- ============================================================================
-- CATÁLOGOS SRI Y DEL SISTEMA
-- ============================================================================

-- 1. CREACIÓN DE TIPOS DE CATÁLOGO
INSERT INTO configuracion.catalogos_tipos (codigo, nombre, descripcion) VALUES
('SRI_TIPO_COMPROBANTE', 'Tipos de Comprobante SRI', 'Tabla 3: Tipos de Comprobante'),
('SRI_TIPO_IDENTIFICACION', 'Tipos de Identificación', 'Tabla 6: Tipos de Identificación'),
('SRI_IMPUESTO_RETENCION', 'Códigos de Retención', 'Tabla 9: Impuestos y Retenciones'),
('SRI_TIPO_IMPUESTO_IVA', 'Porcentajes de IVA', 'Tabla 16: Código de Porcentaje IVA'),
('SRI_FORMA_PAGO', 'Formas de Pago', 'Tabla 24: Formas de Pago'),
('SYS_TIPO_CUENTA_BANCO', 'Tipos de Cuenta Bancaria', 'Catálogo interno de sistema'),
('SYS_BANCOS_ECUADOR', 'Bancos del Ecuador', 'Instituciones financieras principales')
ON CONFLICT (codigo) DO NOTHING;

-- 2. INSERCIÓN DE ITEMS DE CATÁLOGOS SRI

-- A. SRI_TIPO_COMPROBANTE
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, descripcion) VALUES
('SRI_TIPO_COMPROBANTE', '01', 'FACTURA', 'Comprobante de venta'),
('SRI_TIPO_COMPROBANTE', '03', 'LIQUIDACIÓN DE KOMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS', 'Compras a personas sin RUC'),
('SRI_TIPO_COMPROBANTE', '04', 'NOTA DE CRÉDITO', 'Anulaciones o descuentos'),
('SRI_TIPO_COMPROBANTE', '05', 'NOTA DE DÉBITO', 'Cobros adicionales'),
('SRI_TIPO_COMPROBANTE', '06', 'GUÍA DE REMISIÓN', 'Sustento de traslado'),
('SRI_TIPO_COMPROBANTE', '07', 'COMPROBANTE DE RETENCIÓN', 'Retenciones en la fuente e IVA')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- B. SRI_TIPO_IDENTIFICACION
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SRI_TIPO_IDENTIFICACION', '04', ' RUC'),
('SRI_TIPO_IDENTIFICACION', '05', 'CÉDULA'),
('SRI_TIPO_IDENTIFICACION', '06', 'PASAPORTE'),
('SRI_TIPO_IDENTIFICACION', '07', 'CONSUMIDOR FINAL'),
('SRI_TIPO_IDENTIFICACION', '08', 'IDENTIFICACIÓN DEL EXTERIOR')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- C. SRI_TIPO_IMPUESTO_IVA
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, descripcion, orden) VALUES
('SRI_TIPO_IMPUESTO_IVA', '0', '0%', 'Tarifa 0% de IVA', 1),
('SRI_TIPO_IMPUESTO_IVA', '2', '12%', 'Tarifa 12% de IVA', 2),
('SRI_TIPO_IMPUESTO_IVA', '3', '14%', 'Tarifa 14% de IVA (Temporal)', 4),
('SRI_TIPO_IMPUESTO_IVA', '4', '15%', 'Tarifa 15% de IVA (Actual 2024)', 3),
('SRI_TIPO_IMPUESTO_IVA', '5', '5%', 'Tarifa 5% de IVA (Materiales construcción)', 5),
('SRI_TIPO_IMPUESTO_IVA', '6', 'NO OBJETO DE IMPUESTO', 'No grava IVA', 6),
('SRI_TIPO_IMPUESTO_IVA', '7', 'EXENTO DE IVA', 'Exento legal de IVA', 7)
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- D. SRI_FORMA_PAGO
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SRI_FORMA_PAGO', '01', 'SIN UTILIZACION DEL SISTEMA FINANCIERO'),
('SRI_FORMA_PAGO', '15', 'COMPENSACIÓN DE DEUDAS'),
('SRI_FORMA_PAGO', '16', 'TARJETA DE DÉBITO'),
('SRI_FORMA_PAGO', '19', 'TARJETA DE CRÉDITO'),
('SRI_FORMA_PAGO', '20', 'OTROS CON UTILIZACION DEL SISTEMA FINANCIERO'),
('SRI_FORMA_PAGO', '21', 'ENDOSO DE TÍTULOS')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- E. SYS_TIPO_CUENTA_BANCO
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SYS_TIPO_CUENTA_BANCO', 'AHORROS', 'CUENTA DE AHORROS'),
('SYS_TIPO_CUENTA_BANCO', 'CORRIENTE', 'CUENTA CORRIENTE')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- F. SYS_BANCOS_ECUADOR (Principales)
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SYS_BANCOS_ECUADOR', 'BP', 'BANCO PICHINCHA'),
('SYS_BANCOS_ECUADOR', 'BG', 'BANCO GUAYAQUIL'),
('SYS_BANCOS_ECUADOR', 'BB', 'PRODUBANCO'),
('SYS_BANCOS_ECUADOR', 'BPA', 'BANCO DEL PACÍFICO'),
('SYS_BANCOS_ECUADOR', 'BI', 'BANCO INTERNACIONAL'),
('SYS_BANCOS_ECUADOR', 'BOL', 'BANCO BOLIVARIANO')
ON CONFLICT (catalogo_codigo, codigo) DO NOTHING;

-- 11. DATOS INICIALES PARA CAJA CHICA
INSERT INTO caja_chica.caja_chica (id, empresa_id, nombre, responsable, monto_asignado, saldo_actual)
VALUES (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380cc1',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Caja Principal Matriz',
    'María Auxiliadora',
    500.00,
    500.00
) ON CONFLICT (empresa_id, nombre) DO NOTHING;

-- 12. DATOS INICIALES PARA CARTERA
INSERT INTO cartera.documentos_pendientes 
(id, empresa_id, tipo, tercero_id, nro_comprobante, fecha_emision, fecha_vencimiento, 
 dias_credito, monto_total, total_pagado, saldo_pendiente)
VALUES (
    'dcxc01-9c0b-4ef8-bb6d-6bb9bd380001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CXC',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t02',
    '001-002-000004521',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '15 days',
    30,
    1680.00,
    0,
    1680.00
) ON CONFLICT (empresa_id, nro_comprobante) DO NOTHING;

INSERT INTO cartera.documentos_pendientes 
(id, empresa_id, tipo, tercero_id, nro_comprobante, fecha_emision, fecha_vencimiento, 
 dias_credito, monto_total, total_pagado, saldo_pendiente)
VALUES (
    'dcxc02-9c0b-4ef8-bb6d-6bb9bd380002',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CXC',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t03',
    '001-002-000004525',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    30,
    500.00,
    200.00,
    300.00
) ON CONFLICT (empresa_id, nro_comprobante) DO NOTHING;

INSERT INTO cartera.documentos_pendientes 
(id, empresa_id, tipo, tercero_id, nro_comprobante, fecha_emision, fecha_vencimiento, 
 dias_credito, monto_total, total_pagado, saldo_pendiente)
VALUES (
    'dcxp01-9c0b-4ef8-bb6d-6bb9bd380003',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CXP',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t04',
    '045-002-000123456',
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '10 days',
    30,
    153.58,
    0,
    153.58
) ON CONFLICT (empresa_id, nro_comprobante) DO NOTHING;

INSERT INTO cartera.anticipos 
(id, empresa_id, tipo, tercero_id, fecha, referencia, monto_original, monto_usado, saldo_disponible, estado)
VALUES (
    'ant001-9c0b-4ef8-bb6d-6bb9bd380001',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CXP',
    't0eebc99-9c0b-4ef8-bb6d-6bb9bd380t04',
    CURRENT_DATE - INTERVAL '30 days',
    'Transf. Inicial Obra',
    500.00,
    0,
    500.00,
    'DISPONIBLE'
);

