
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11'
) ON CONFLICT (empresa_id, identificacion) DO NOTHING;

-- 5. PLAN DE CUENTAS BÁSICO (NIIF)
INSERT INTO contabilidad.plan_cuentas 
(empresa_id, usuario_id, codigo, nombre, tipo, nivel, saldo, acepta_movimiento) VALUES
-- Activo
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1','ACTIVO','ACTIVO',1,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1','ACTIVO CORRIENTE','ACTIVO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.01','EFECTIVO Y EQUIVALENTES','ACTIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.01.01','CAJA GENERAL','ACTIVO',4,500.00, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.01.02','BANCOS','ACTIVO',4,15000.00, true),
-- nuevas cuentas de movimiento
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.01.03','CAJA CHICA','ACTIVO',4,200.00, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.01.04','CUENTAS POR COBRAR CLIENTES','ACTIVO',4,3500.00, true),

-- Cuentas por Cobrar
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.02','CUENTAS POR COBRAR','ACTIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.02.01','CLIENTES','ACTIVO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.02.02','DOCUMENTOS POR COBRAR','ACTIVO',4,0, true),

-- Inventarios
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.03','INVENTARIOS','ACTIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.03.01','INVENTARIO DE MERCADERÍAS','ACTIVO',4,8000.00, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.03.02','INVENTARIO DE MATERIA PRIMA','ACTIVO',4,2500.00, true),

-- Anticipos Entregados
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.04','ANTICIPOS ENTREGADOS','ACTIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.04.01','ANTICIPOS A PROVEEDORES','ACTIVO',4,0, true),

-- Impuestos Anticipados (Crédito Tributario)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.05','IMPUESTOS ANTICIPADOS','ACTIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.05.01','IVA PAGADO EN COMPRAS','ACTIVO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','1.1.05.02','RETENCIONES QUE NOS EFECTÚAN','ACTIVO',4,0, true),

-- Pasivo
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2','PASIVO','PASIVO',1,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1','PASIVO CORRIENTE','PASIVO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.01','CUENTAS POR PAGAR PROVEEDORES','PASIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.01.01','PROVEEDORES NACIONALES','PASIVO',4,4200.00, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.01.02','PROVEEDORES EXTRANJEROS','PASIVO',4,12000.00, true),

-- Obligaciones Tributarias (IVA por Pagar)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.02','OBLIGACIONES TRIBUTARIAS','PASIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.02.01','IVA POR PAGAR','PASIVO',4,0, true),

-- Retenciones por Pagar
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.03','RETENCIONES POR PAGAR','PASIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.03.01','RETENCIÓN RENTA POR PAGAR','PASIVO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.03.02','RETENCIÓN IVA POR PAGAR','PASIVO',4,0, true),

-- Anticipos Recibidos
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.04','ANTICIPOS RECIBIDOS','PASIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.04.01','ANTICIPOS DE CLIENTES','PASIVO',4,0, true),

-- Otros Pasivos (IVA Cobrado en Ventas)
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.05','IVA EN VENTAS','PASIVO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','2.1.05.01','IVA COBRADO EN VENTAS','PASIVO',4,0, true),

-- Ingresos
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4','INGRESOS','INGRESO',1,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4.1','INGRESOS OPERACIONALES','INGRESO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4.1.01','VENTAS DE MERCADERÍAS','INGRESO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4.1.01.01','VENTAS LOCALES','INGRESO',4,25000.00, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4.1.01.02','DEVOLUCIÓN EN VENTAS','INGRESO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4.1.01.03','DESCUENTO EN VENTAS','INGRESO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','4.1.01.04','VENTAS EXPORTACIÓN','INGRESO',4,8000.00, true),

-- Gastos
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5','GASTOS','GASTO',1,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.1','GASTOS OPERACIONALES','GASTO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.1.01','COSTO DE VENTAS','GASTO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.1.01.01','COSTO DE MERCADERÍAS VENDIDAS','GASTO',4,12000.00, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.1.01.02','COSTO DE PRODUCCIÓN / SERVICIOS','GASTO',4,6000.00, true),

-- Gastos Administrativos
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.2','GASTOS ADMINISTRATIVOS','GASTO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.2.01','GASTOS GENERALES','GASTO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.2.01.01','SERVICIOS BÁSICOS','GASTO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.2.01.02','SUMINISTROS DE OFICINA','GASTO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','5.2.01.03','OTROS GASTOS ADMINISTRATIVOS','GASTO',4,0, true),

-- Patrimonio
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3','PATRIMONIO','PATRIMONIO',1,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.1','CAPITAL','PATRIMONIO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.1.01','CAPITAL SOCIAL','PATRIMONIO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.1.01.01','CAPITAL PAGADO','PATRIMONIO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.2','RESULTADOS','PATRIMONIO',2,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.2.01','RESULTADOS ACUMULADOS','PATRIMONIO',3,0, false),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.2.01.01','UTILIDAD DEL EJERCICIO','PATRIMONIO',4,0, true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11','e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11','3.2.01.02','PÉRDIDA DEL EJERCICIO','PATRIMONIO',4,0, true);

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
    '5.1.01.01', -- Costo Ventas (Nivel 4)
    '4.1.01.01'  -- Ventas (Nivel 4)
);

-- 8. PRODUCTOS
INSERT INTO inventario.productos (id, empresa_id, usuario_id, codigo_principal, nombre, precio_venta, categoria_id, stock_actual, stock_minimo, costo_promedio)
VALUES 
(
    'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380p01',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
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
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    '1234567890',
    'CUENTA CORRIENTE PRINCIPAL',
    'BANCO PICHINCHA',
    15000.00
) ON CONFLICT (empresa_id, numero_cuenta) DO NOTHING;

-- 10. ASIENTO CONTABLE DE APERTURA (Ejemplo)
INSERT INTO contabilidad.asientos (id, empresa_id, usuario_id, numero, fecha, glosa, tipo, estado)
VALUES (
    'as0ebc99-9c0b-4ef8-bb6d-6bb9bd380as1',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    '2024-00001',
    '2024-01-01',
    'ASIENTO DE APERTURA 2024',
    'APERTURA',
    'MAYORIZADO'
) ON CONFLICT (empresa_id, numero) DO NOTHING;

INSERT INTO contabilidad.asientos_detalles (asiento_id, cuenta_codigo, debe, haber, concepto) VALUES
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
('SRI_FORMA_PAGO', 'Formas de Pago', 'Tabla 24: Formas de Pago - 01=Sin Sist Fin, 19=T. Crédito, 20=Otros con Sist Fin, etc.'),
('SYS_TIPO_CUENTA_BANCO', 'Tipos de Cuenta Bancaria', 'Catálogo interno de sistema'),
('SYS_BANCOS_ECUADOR', 'Bancos del Ecuador', 'Instituciones financieras principales'),
('SRI_UNIDAD_MEDIDA', 'Unidades de Medida SRI', 'Unidades estándar para facturación')
ON CONFLICT (codigo) DO NOTHING;

-- 2. INSERCIÓN DE ITEMS DE CATÁLOGOS SRI

-- A. SRI_TIPO_COMPROBANTE
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, descripcion) VALUES
('SRI_TIPO_COMPROBANTE', '01', 'FACTURA', 'Comprobante de venta'),
('SRI_TIPO_COMPROBANTE', '03', 'LIQUIDACIÓN DE COMPRA DE BIENES Y PRESTACIÓN DE SERVICIOS', 'Compras a personas sin RUC'),
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
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, valor_numerico, descripcion, orden) VALUES
('SRI_TIPO_IMPUESTO_IVA', '0', '0%', 0, 'Tarifa 0% de IVA', 1),
('SRI_TIPO_IMPUESTO_IVA', '2', '12%', 12, 'Tarifa 12% de IVA', 2),
('SRI_TIPO_IMPUESTO_IVA', '3', '14%', 14, 'Tarifa 14% de IVA', 4),
('SRI_TIPO_IMPUESTO_IVA', '4', '15%', 15, 'Tarifa 15% de IVA', 3),
('SRI_TIPO_IMPUESTO_IVA', '5', '5%', 5, 'Tarifa 5% de IVA (Materiales construcción)', 5),
('SRI_TIPO_IMPUESTO_IVA', '6', 'NO OBJETO DE IMPUESTO', 0, 'No grava IVA', 6),
('SRI_TIPO_IMPUESTO_IVA', '7', 'EXENTO DE IVA', 0, 'Exento legal de IVA', 7)
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
 
-- G. SRI_UNIDAD_MEDIDA
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor) VALUES
('SRI_UNIDAD_MEDIDA', 'UND', 'UNIDAD'),
('SRI_UNIDAD_MEDIDA', 'KG', 'KILOGRAMO'),
('SRI_UNIDAD_MEDIDA', 'LT', 'LITRO'),
('SRI_UNIDAD_MEDIDA', 'MT', 'METRO'),
('SRI_UNIDAD_MEDIDA', 'SER', 'SERVICIO'),
('SRI_UNIDAD_MEDIDA', 'CAJ', 'CAJA'),
('SRI_UNIDAD_MEDIDA', 'PAQ', 'PAQUETE'),
('SRI_UNIDAD_MEDIDA', 'SER', 'SERVICIO')
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
    'Transf. Inicial Obra',
    CURRENT_DATE - INTERVAL '30 days',
    500.00,
    0,
    500.00,
    'DISPONIBLE'
);

-- ============================================================================
-- 13. CÓDIGOS DE RETENCIÓN (RENTA E IVA)
-- ============================================================================

-- A. SRI_IMPUESTO_RETENCION (Catálogo para UI)
INSERT INTO configuracion.catalogos_items (catalogo_codigo, codigo, valor, descripcion) VALUES
('SRI_IMPUESTO_RETENCION', '303', 'HONORARIOS PROFESIONALES (10%)', 'Honorarios profesionales y demás pagos por servicios relacionados con el título profesional'),
('SRI_IMPUESTO_RETENCION', '304', 'SERVICIOS INTELECTO (10%)', 'Servicios donde predomina el intelecto no relacionados con el título profesional'),
('SRI_IMPUESTO_RETENCION', '307', 'SERVICIOS MANO DE OBRA (2%)', 'Servicios donde predomina la mano de obra'),
('SRI_IMPUESTO_RETENCION', '308', 'UTILIZACIÓN IMAGEN (10%)', 'Utilización o aprovechamiento de la imagen o renombre'),
('SRI_IMPUESTO_RETENCION', '309', 'SERVICIOS PUBLICIDAD (1.75%)', 'Servicios prestados por medios de comunicación y agencias de publicidad'),
('SRI_IMPUESTO_RETENCION', '310', 'TRANSPORTE (1%)', 'Transporte privado de pasajeros o transporte público o privado de carga'),
('SRI_IMPUESTO_RETENCION', '312', 'TRANSFERENCIA BIENES (1.75%)', 'Transferencia de bienes muebles de naturaleza corporal'),
('SRI_IMPUESTO_RETENCION', '312A', 'COMPRA BIENES AGRICOLAS (1%)', 'Compra de bienes de origen agrícola, avícola, pecuario, apícola, bioacuáticos, forestal y carnes en estado natural'),
('SRI_IMPUESTO_RETENCION', '314A', 'REGALÍAS FRANQUICIAS (8%)', 'Regalías por concepto de franquicias'),
('SRI_IMPUESTO_RETENCION', '314B', 'CÁNONES, DERECHOS AUTOR (8%)', 'Cánones, derechos de autor, marcas, patentes y similares'),
('SRI_IMPUESTO_RETENCION', '319', 'ARRENDAMIENTO INMUEBLES SOC (8%)', 'Arrendamiento de bienes inmuebles (Sociedades)'),
('SRI_IMPUESTO_RETENCION', '320', 'ARRENDAMIENTO INMUEBLES PN (10%)', 'Arrendamiento de bienes inmuebles (Personas Naturales)'),
('SRI_IMPUESTO_RETENCION', '322', 'SEGUROS Y REASEGUROS (1.75%)', 'Seguros y reaseguros (Primas y cesiones)'),
('SRI_IMPUESTO_RETENCION', '332', 'NOTARIOS Y REGISTRADORES (10%)', 'Pagos a notarios y registradores de la propiedad y mercantil'),
('SRI_IMPUESTO_RETENCION', '343', 'INTERESES Y COMISIONES (0%)', 'Intereses y comisiones en operaciones de crédito (Bancos y Seguros)'),
('SRI_IMPUESTO_RETENCION', '3440', 'DIVIDENDOS DISTRIBUIDOS', 'Dividendos distribuidos'),
('SRI_IMPUESTO_RETENCION', '346', 'OTROS CONCEPTOS (2.75%)', 'Otros conceptos no contemplados en los anteriores'),
('SRI_IMPUESTO_RETENCION', '351', 'RIMPE EMPRENDEDORES (1%)', 'Adquisición de bienes y servicios a contribuyentes RIMPE Emprendedores'),
-- IVA Codes (Added to this catalog for UI selection if needed, though usually separate)
('SRI_IMPUESTO_RETENCION', '9', 'IVA 10% (Bienes)', 'Retención de IVA 10% en adquisición de bienes'),
('SRI_IMPUESTO_RETENCION', '1', 'IVA 30% (Bienes)', 'Retención de IVA 30% en adquisición de bienes'),
('SRI_IMPUESTO_RETENCION', '2', 'IVA 70% (Servicios)', 'Retención de IVA 70% en prestación de servicios'),
('SRI_IMPUESTO_RETENCION', '3', 'IVA 100%', 'Retención de IVA 100% (Profesionales, Arriendo, Liq. Compra)'),
('SRI_IMPUESTO_RETENCION', '7', 'IVA 0%', 'Retención de IVA 0%'),
('SRI_IMPUESTO_RETENCION', '8', 'IVA 20%', 'Retención de IVA 20%')
ON CONFLICT (catalogo_codigo, codigo) DO UPDATE SET valor = EXCLUDED.valor, descripcion = EXCLUDED.descripcion;

-- B. CONFIGURACION.CODIGOS_RETENCION (Tabla lógica para cálculos)
-- Empresa Demo: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
INSERT INTO configuracion.codigos_retencion (empresa_id, codigo, concepto, porcentaje, tipo) VALUES
-- RENTA
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '303', 'Honorarios profesionales y demás pagos por servicios relacionados con el título profesional', 10.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '304', 'Servicios donde predomina el intelecto no relacionados con el título profesional', 10.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '307', 'Servicios donde predomina la mano de obra', 2.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '308', 'Utilización o aprovechamiento de la imagen o renombre', 10.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '309', 'Servicios prestados por medios de comunicación y agencias de publicidad', 1.75, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '310', 'Transporte privado de pasajeros o transporte público o privado de carga', 1.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '312', 'Transferencia de bienes muebles de naturaleza corporal', 1.75, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '312A', 'Compra de bienes de origen agrícola, avícola, pecuario, apícola, bioacuáticos, forestal y carnes en estado natural', 1.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '314A', 'Regalías por concepto de franquicias', 8.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '314B', 'Cánones, derechos de autor, marcas, patentes y similares', 8.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '319', 'Arrendamiento de bienes inmuebles (Sociedades)', 8.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '320', 'Arrendamiento de bienes inmuebles (Personas Naturales)', 10.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '322', 'Seguros y reaseguros (Primas y cesiones)', 1.75, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '332', 'Pagos a notarios y registradores de la propiedad y mercantil', 10.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '343', 'Intereses y comisiones en operaciones de crédito (Bancos y Seguros)', 0.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3440', 'Dividendos distribuidos', 0.00, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '346', 'Otros conceptos no contemplados en los anteriores', 2.75, 'RENTA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '351', 'Adquisición de bienes y servicios a contribuyentes RIMPE Emprendedores', 1.00, 'RENTA'),
-- IVA
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '9', 'Retención de IVA 10% (Bienes)', 10.00, 'IVA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1', 'Retención de IVA 30% (Bienes)', 30.00, 'IVA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2', 'Retención de IVA 70% (Servicios)', 70.00, 'IVA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3', 'Retención de IVA 100%', 100.00, 'IVA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '7', 'Retención de IVA 0%', 0.00, 'IVA'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '8', 'Retención de IVA 20%', 20.00, 'IVA')
ON CONFLICT (empresa_id, codigo, tipo) DO UPDATE SET porcentaje = EXCLUDED.porcentaje, concepto = EXCLUDED.concepto;


-- PASO 2: Insertar los ambientes estándar del SRI
-- ============================================================================
INSERT INTO configuracion.sri_ambiente (codigo, nombre, valor, url_recepcion, url_autorizacion, descripcion)
VALUES
    ('PRUEBAS', 'Ambiente de Pruebas', 1,
     'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
     'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
     'Ambiente de certificación y pruebas del SRI'),
    ('PRODUCCION', 'Ambiente de Producción', 2,
     'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
     'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
     'Ambiente productivo del SRI')
ON CONFLICT (codigo) DO NOTHING;
