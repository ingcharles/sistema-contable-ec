-- ============================================================================
-- ECUCONTABLE PRO - MASTER SEED DATA (RBAC + GRANULAR MENU + ESPAÑOL)
-- ============================================================================

-- 1. ROLES BASE
INSERT INTO seguridad.roles (nombre, descripcion) VALUES
('SUPERADMIN', 'Propietario del Sistema (SaaS)'),
('ADMIN', 'Administrador del Negocio'),
('CONTADOR', 'Contador General'),
('AUDITOR', 'Auditor Externo/Interno'),
('ASISTENTE', 'Asistente Contable/Administrativo'),
('VENDEDOR', 'Ejecutivo de Ventas'),
('BODEGUERO', 'Encargado de Bodega')
ON CONFLICT (nombre) DO NOTHING;

-- 2. PLANES DE SUSCRIPCIÓN
INSERT INTO seguridad.planes (nombre, codigo, descripcion, precio_mensual) VALUES
('Plan Gratuito', 'GRATUITO', 'Funciones básicas', 0),
('Plan Profesional', 'PROFESIONAL', 'Funciones avanzadas + Facturación', 25.00),
('Plan Empresarial', 'EMPRESARIAL', 'Todo incluido (RRHH + Contabilidad Completa)', 50.00)
ON CONFLICT (codigo) DO NOTHING;

-- 3. PERMISOS (CAPABILITIES) - GRANULAR LIST
INSERT INTO seguridad.permisos (codigo, nombre, descripcion) VALUES
-- Dashboard
('VER_DASHBOARD', 'Ver Dashboard', 'Tablero Principal'),

-- Comercial > Ventas
('VER_MODULO_COMERCIAL', 'Ver Módulo Comercial', 'Acceso Grupo Comercial'),
('VER_VENTAS_FACTURAS', 'Ver Facturas Venta', 'Emitir facturas'),
('VER_VENTAS_NC', 'Ver Notas Crédito', 'Emitir notas de crédito'),
('VER_VENTAS_ND', 'Ver Notas Débito', 'Emitir notas de débito'),
('VER_VENTAS_GUIAS', 'Ver Guías Remisión', 'Emitir guías'),
('VER_VENTAS_PROFORMAS', 'Ver Proformas', 'Emitir proformas'),

-- Comercial > Compras
('VER_COMPRAS_FACTURAS', 'Ver Facturas Compra', 'Registrar compras'),
('VER_COMPRAS_LIQ', 'Ver Liq. Compra', 'Liquidaciones de compra'),
('VER_COMPRAS_RET', 'Ver Retenciones', 'Comprobantes de retención'),
('VER_COMPRAS_ORDENES', 'Ver Órdenes Compra', 'Órdenes de pedido'),

-- Comercial > Inventario
('VER_INVENTARIO', 'Ver Inventario', 'Acceso Grupo Inventario'),
('VER_INV_KARDEX', 'Ver Productos/Kardex', 'Gestión productos'),
('VER_INV_CATEGORIAS', 'Ver Categorías', 'Gestión categorías'),
('VER_INV_BODEGAS', 'Ver Bodegas', 'Gestión bodegas'),
('VER_INV_TRANSF', 'Ver Transferencias', 'Movimientos entre bodegas'),

-- Comercial > Otros
('VER_CARTERA', 'Ver Cartera', 'Cobros y Pagos'),
('VER_TERCEROS', 'Ver Terceros', 'Clientes y Proveedores'),
('VER_CAJA_CHICA', 'Ver Caja Chica', 'Acceso Caja Chica'),

-- Financiero > Contabilidad
('VER_MODULO_FINANCIERO', 'Ver Módulo Financiero', 'Acceso Grupo Financiero'),
('VER_CONT_PLAN', 'Ver Plan Cuentas', 'Plan de cuentas'),
('VER_CONT_ASIENTOS', 'Ver Asientos', 'Libro diario manual'),
('VER_CONT_COSTOS', 'Ver Centros Costos', 'Gestión centros de costo'),

-- Financiero > Reportes
('VER_REP_DIARIO', 'Ver Libro Diario', 'Reporte Diario'),
('VER_REP_MAYOR', 'Ver Libro Mayor', 'Reporte Mayor'),
('VER_REP_BAL_COMP', 'Ver Bal. Comprobación', 'Balance de Comprobación'),
('VER_REP_ESF', 'Ver Est. Situación', 'Estado de Situación Financiera'),
('VER_REP_ERI', 'Ver Est. Resultados', 'Estado de Resultados Integral'),
('VER_REP_FLUJO', 'Ver Flujo Efectivo', 'Estado de Flujo Efectivo'),
('VER_REP_PATRIMONIO', 'Ver Cambios Patrimonio', 'Estado Cambios Patrimonio'),

-- Financiero > Otros
('VER_BANCOS', 'Ver Bancos', 'Movimientos y Conciliación'),
('VER_IMPUESTOS', 'Ver Impuestos', 'Formularios y ATS'),
('VER_ACTIVOS', 'Ver Activos Fijos', 'Gestión Activos y Depreciación'),

-- Recursos Humanos
('VER_MODULO_RRHH', 'Ver RRHH', 'Acceso Grupo RRHH'),
('VER_RRHH_EMPLEADOS', 'Ver Empleados', 'Fichas y Contratos'),
('VER_RRHH_NOMINA', 'Ver Nómina', 'Roles de Pago'),
('VER_RRHH_PRESTAMOS', 'Ver Préstamos', 'Anticipos y Préstamos'),
('VER_RRHH_BENEFICIOS', 'Ver Beneficios', 'Décimos y Utilidades'),
('VER_RRHH_ASISTENCIA', 'Ver Asistencia', 'Horas extras y atrasos'),
('VER_RRHH_VACACIONES', 'Ver Vacaciones', 'Solicitudes y Saldos'),
('VER_RRHH_LIQUIDACIONES', 'Ver Liquidaciones', 'Actas de Finiquito'),

-- Sistema
('VER_MODULO_SISTEMA', 'Ver Sistema', 'Acceso Grupo Sistema'),
('VER_SYS_SEGURIDAD', 'Ver Seguridad', 'Usuarios y Roles'),
('VER_SYS_CONFIG', 'Ver Configuración', 'Empresa y Parámetros'),
('VER_SYS_PLANES', 'Ver Gestión Planes', 'Administrar planes de suscripción'),
('VER_SYS_FACT_ELEC', 'Ver Fact. Electrónica', 'Firma y Buzón'),
('VER_SYS_AUDITORIA', 'Ver Auditoría', 'Logs'),
('VER_SYS_REPORTES', 'Ver Reportes Gral', 'Reportes del sistema')
ON CONFLICT (codigo) DO NOTHING;

-- 4. ASIGNACIÓN A ROLES (MATRIZ COMPLETA)
DO $$
DECLARE
    r_super UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'SUPERADMIN');
    r_admin UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'ADMIN');
    r_cont UUID  := (SELECT id FROM seguridad.roles WHERE nombre = 'CONTADOR');
    r_vend UUID  := (SELECT id FROM seguridad.roles WHERE nombre = 'VENDEDOR');
    r_bod  UUID  := (SELECT id FROM seguridad.roles WHERE nombre = 'BODEGUERO');
    r_aud  UUID  := (SELECT id FROM seguridad.roles WHERE nombre = 'AUDITOR');
BEGIN
    -- 1. SUPERADMIN: Todo acceso (Dueño del SaaS)
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT r_super, id FROM seguridad.permisos ON CONFLICT DO NOTHING;
    
    -- 2. ADMIN: Todo acceso MENOS Planes y Auditoría (Admin de Empresa)
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT r_admin, id FROM seguridad.permisos 
    WHERE codigo NOT IN ('VER_SYS_PLANES', 'VER_SYS_AUDITORIA','VER_SYS_SEGURIDAD')
    ON CONFLICT DO NOTHING;

    -- 3. CONTADOR: Financiero completo, Reportes, Impuestos, Activos, Compras (Retenciones)
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT r_cont, id FROM seguridad.permisos 
    WHERE codigo LIKE 'VER_MODULO_FINANCIERO' 
       OR codigo LIKE 'VER_CONT_%' 
       OR codigo LIKE 'VER_REP_%' 
       OR codigo LIKE 'VER_BANCOS' 
       OR codigo LIKE 'VER_IMPUESTOS' 
       OR codigo LIKE 'VER_ACTIVOS'
       -- Acceso visual a comercial para contexto
       OR codigo = 'VER_MODULO_COMERCIAL'
       OR codigo IN ('VER_COMPRAS_FACTURAS', 'VER_COMPRAS_RET', 'VER_COMPRAS_LIQ', 'VER_TERCEROS')
       OR codigo = 'VER_DASHBOARD'
    ON CONFLICT DO NOTHING;

    -- 3. VENDEDOR: Comercial (Ventas), Cartera (Cobros), Terceros, Inventario (Ver Stock)
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT r_vend, id FROM seguridad.permisos 
    WHERE codigo IN (
        'VER_DASHBOARD',
        'VER_MODULO_COMERCIAL',
        'VER_VENTAS_FACTURAS', 'VER_VENTAS_NC', 'VER_VENTAS_PROFORMAS', 'VER_VENTAS_GUIAS',
        'VER_CARTERA', -- Para cobros básicos
        'VER_TERCEROS', -- Crear clientes
        'VER_INVENTARIO', 'VER_INV_KARDEX' -- Consultar stock y precios
    ) ON CONFLICT DO NOTHING;

    -- 4. BODEGUERO: Inventario Completo, Transferencias, Compras (Ver Ordenes)
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT r_bod, id FROM seguridad.permisos 
    WHERE codigo LIKE 'VER_INV_%' 
       OR codigo IN ('VER_DASHBOARD', 'VER_MODULO_COMERCIAL', 'VER_INVENTARIO', 'VER_COMPRAS_ORDENES')
    ON CONFLICT DO NOTHING;

    -- 5. AUDITOR: Acceso de lectura global + Auditoría Sistema
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT r_aud, id FROM seguridad.permisos 
    WHERE codigo LIKE 'VER_%' -- Asumimos que los permisos VER_ son de lectura
      AND codigo != 'VER_SYS_CONFIG' -- No configurar
    ON CONFLICT DO NOTHING;
END $$;

-- 5. ASIGNACIÓN A PLANES (FEATURE GATING)
DO $$
DECLARE
    p_emp UUID := (SELECT id FROM seguridad.planes WHERE codigo = 'EMPRESARIAL');
    p_pro UUID := (SELECT id FROM seguridad.planes WHERE codigo = 'PROFESIONAL');
    p_gra UUID := (SELECT id FROM seguridad.planes WHERE codigo = 'GRATUITO');
BEGIN
    -- 1. PLAN EMPRESARIAL: Todo incluido
    INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
    SELECT p_emp, id FROM seguridad.permisos ON CONFLICT DO NOTHING;
    
    -- 2. PLAN PROFESIONAL: Comercial + Financiero Básico (Sin RRHH, Sin Activos, Sin Costos)
    INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
    SELECT p_pro, id FROM seguridad.permisos
    WHERE codigo NOT LIKE 'VER_RRHH_%' 
      AND codigo NOT LIKE 'VER_ACTIVOS'
      AND codigo != 'VER_CONT_COSTOS'
    ON CONFLICT DO NOTHING;

    -- 3. PLAN GRATUITO: Solo Facturación Básica, Clientes y Productos
    INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
    SELECT p_gra, id FROM seguridad.permisos
    WHERE codigo IN (
        'VER_DASHBOARD',
        'VER_MODULO_COMERCIAL',
        'VER_VENTAS_FACTURAS', 'VER_VENTAS_PROFORMAS',
        'VER_TERCEROS',
        'VER_INVENTARIO', 'VER_INV_KARDEX', -- Solo ver y crear prod
        'VER_SYS_CONFIG' -- Solo básica (Empresa)
    ) ON CONFLICT DO NOTHING;
END $$;

-- 6. USUARIOS BASE
INSERT INTO seguridad.empresas (id, ruc, razon_social, nombre_comercial, es_obligado_contabilidad) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1722039953001', 'EMPRESA DEMO S.A.', 'ECUCONTABLE STORE', true
) ON CONFLICT (ruc) DO NOTHING;

INSERT INTO seguridad.usuarios (id, email, nombre, password_hash, activo, plan_id) VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'admin@demo.com', 'Administrador Demo', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', true,
    (SELECT id FROM seguridad.planes WHERE codigo = 'EMPRESARIAL')
) ON CONFLICT (email) DO UPDATE SET plan_id = EXCLUDED.plan_id;

INSERT INTO seguridad.usuarios_empresas (usuario_id, empresa_id) VALUES (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT DO NOTHING;

INSERT INTO seguridad.usuarios_roles (usuario_id, rol_id)
SELECT 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', id FROM seguridad.roles WHERE nombre = 'ADMIN'
ON CONFLICT DO NOTHING;

-- 7. MENU ITEMS HIERARCHY
DELETE FROM configuracion.menu_items;

DO $$
DECLARE
    -- Group Parents
    g_comercial UUID;
    g_financiero UUID;
    g_rrhh UUID;
    g_sistema UUID;
    
    -- Sub-Group Parents
    sg_ventas UUID;
    sg_compras UUID;
    sg_inventario UUID;
    sg_cartera UUID;
    sg_terceros UUID;
    sg_cajachica UUID;
    sg_contabilidad UUID;
    sg_reportes UUID;
    sg_bancos UUID;
    sg_impuestos UUID;
    sg_activos UUID;
    sg_rrhh_empleados UUID;
    sg_rrhh_nomina UUID;
    sg_rrhh_prestamos UUID;
    sg_rrhh_beneficios UUID;
    sg_rrhh_asistencia UUID;
    sg_rrhh_vacaciones UUID;
    sg_rrhh_liquidaciones UUID;
    sg_seguridad UUID;
    sg_config UUID;
    sg_factel UUID;
BEGIN
    -- DASHBOARD
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id)
    VALUES ('Dashboard', 'LayoutDashboard', '/dashboard', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_DASHBOARD'));

    -- GRUPO COMERCIAL
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id)
    VALUES ('Comercial', 'Store', '#', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_MODULO_COMERCIAL'))
    RETURNING id INTO g_comercial;
    
        -- Sub: Ventas
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_comercial, 'Ventas', 'ShoppingBag', '#', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_VENTAS_FACTURAS'))
        RETURNING id INTO sg_ventas;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_ventas, 'Facturación', 'FileText', '/facturacion', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_VENTAS_FACTURAS')),
            (sg_ventas, 'Notas de Crédito', 'FileMinus', '/facturacion/notas-credito', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_VENTAS_NC')),
            (sg_ventas, 'Notas de Débito', 'FilePlus', '/facturacion/notas-debito', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_VENTAS_ND')),
            (sg_ventas, 'Guías de Remisión', 'Truck', '/facturacion/guias', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_VENTAS_GUIAS')),
            (sg_ventas, 'Proformas', 'ClipboardList', '/facturacion/proformas', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_VENTAS_PROFORMAS'));

        -- Sub: Compras
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_comercial, 'Compras', 'ShoppingCart', '#', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_FACTURAS'))
        RETURNING id INTO sg_compras;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_compras, 'Facturas Compra', 'FileInput', '/compras', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_FACTURAS')),
            (sg_compras, 'Liq. de Compra', 'FileSpreadsheet', '/compras/liquidaciones', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_LIQ')),
            (sg_compras, 'Retenciones', 'Scissors', '/compras/retenciones', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_RET')),
            (sg_compras, 'Notas de Crédito', 'FileMinus', '/compras/notas-credito', 35, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_FACTURAS')),
            (sg_compras, 'Órdenes Compra', 'ClipboardCheck', '/compras/ordenes-compra', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_ORDENES')),
            (sg_compras, 'Buzón XML', 'Inbox', '/buzon', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_FACTURAS'));

        -- Sub: Inventario
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_comercial, 'Inventario', 'Package', '#', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_INVENTARIO'))
        RETURNING id INTO sg_inventario;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_inventario, 'Kardex / Productos', 'Box', '/inventario/kardex', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_INV_KARDEX')),
            (sg_inventario, 'Categorías', 'Tags', '/inventario/categorias', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_INV_CATEGORIAS')),
            (sg_inventario, 'Bodegas', 'Warehouse', '/inventario/bodegas', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_INV_BODEGAS')),
            (sg_inventario, 'Transferencias', 'ArrowLeftRight', '/inventario/transferencias', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_INV_TRANSF'));

        -- Otros Comercial
        -- Sub: Cartera
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_comercial, 'Cartera', 'Wallet', '#', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CARTERA'))
        RETURNING id INTO sg_cartera;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_cartera, 'Cuentas por Cobrar', 'ArrowDownLeft', '/cartera/clientes', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CARTERA')),
            (sg_cartera, 'Cuentas por Pagar', 'ArrowUpRight', '/cartera/proveedores', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CARTERA')),
            (sg_cartera, 'Anticipos', 'Coins', '/cartera/anticipos', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CARTERA'));

        -- Sub: Terceros
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_comercial, 'Terceros', 'Contact2', '#', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_TERCEROS'))
        RETURNING id INTO sg_terceros;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_terceros, 'Clientes', 'UserCheck', '/directorio/clientes', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_TERCEROS')),
            (sg_terceros, 'Proveedores', 'Truck', '/directorio/proveedores', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_TERCEROS'));

        -- Sub: Caja Chica
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_comercial, 'Caja Chica', 'Coins', '#', 60, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CAJA_CHICA'))
        RETURNING id INTO sg_cajachica;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_cajachica, 'Vales y Caja', 'Wallet2', '/caja-chica/vales', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CAJA_CHICA'));


    -- GRUPO FINANCIERO
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id)
    VALUES ('Financiero', 'Landmark', '#', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_MODULO_FINANCIERO'))
    RETURNING id INTO g_financiero;

        -- Sub: Contabilidad
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_financiero, 'Contabilidad', 'BookOpen', '#', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CONT_PLAN'))
        RETURNING id INTO sg_contabilidad;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_contabilidad, 'Plan de Cuentas', 'ListTree', '/contabilidad/plan-cuentas', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CONT_PLAN')),
            (sg_contabilidad, 'Asientos', 'Edit3', '/contabilidad/asientos', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CONT_ASIENTOS')),
            (sg_contabilidad, 'Centros Costos', 'Target', '/contabilidad/centros-costos', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CONT_COSTOS'));

        -- Sub: Reportes
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_financiero, 'Reportes Contables', 'BarChart4', '#', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_DIARIO'))
        RETURNING id INTO sg_reportes;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_reportes, 'Libro Diario', 'Book', '/reportes/libro-diario', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_DIARIO')),
            (sg_reportes, 'Libro Mayor', 'BookText', '/reportes/libro-mayor', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_MAYOR')),
            (sg_reportes, 'Balance Comprob.', 'Scale', '/reportes/balance-comprobacion', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_BAL_COMP')),
            (sg_reportes, 'Est. Situación Fin.', 'Building', '/reportes/estado-situacion', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_ESF')),
            (sg_reportes, 'Est. Resultados', 'TrendingUp', '/reportes/estado-resultados', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_ERI')),
            (sg_reportes, 'Flujo Efectivo', 'Banknote', '/reportes/flujo-efectivo', 60, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_FLUJO')),
            (sg_reportes, 'Cambios Patrimonio', 'Users', '/reportes/cambios-patrimonio', 70, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_REP_PATRIMONIO'));

        -- Otros Financiero
        -- Sub: Bancos
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_financiero, 'Bancos', 'CreditCard', '#', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_BANCOS'))
        RETURNING id INTO sg_bancos;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_bancos, 'Movimientos', 'ArrowLeftRight', '/bancos/movimientos', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_BANCOS')),
            (sg_bancos, 'Conciliación', 'CheckCircle2', '/bancos/conciliacion', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_BANCOS'));

        -- Sub: Impuestos
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_financiero, 'Impuestos (SRI)', 'Stamp', '#', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_IMPUESTOS'))
        RETURNING id INTO sg_impuestos;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_impuestos, 'Declaraciones', 'FileText', '/impuestos/declaraciones', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_IMPUESTOS')),
            (sg_impuestos, 'Anexo Transaccional (ATS)', 'Table', '/impuestos/ats', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_IMPUESTOS'));

        -- Sub: Activos Fijos
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_financiero, 'Activos Fijos', 'Monitor', '#', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_ACTIVOS'))
        RETURNING id INTO sg_activos;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_activos, 'Activos', 'Monitor', '/activos-fijos/lista', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_ACTIVOS')),
            (sg_activos, 'Depreciaciones', 'TrendingDown', '/activos-fijos/depreciaciones', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_ACTIVOS')),
            (sg_activos, 'Bajas', 'Trash2', '/activos-fijos/bajas', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_ACTIVOS'));


    -- GRUPO RRHH
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id)
    VALUES ('Recursos Humanos', 'Users', '#', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_MODULO_RRHH'))
    RETURNING id INTO g_rrhh;

    -- Sub: Empleados
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Empleados', 'UserPlus', '#', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_EMPLEADOS'))
    RETURNING id INTO sg_rrhh_empleados;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_empleados, 'Ficha Personal', 'User', '/rrhh/empleados', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_EMPLEADOS')),
        (sg_rrhh_empleados, 'Contratos', 'FileSignature', '/rrhh/empleados', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_EMPLEADOS'));

    -- Sub: Nómina
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Nómina', 'Table2', '#', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_NOMINA'))
    RETURNING id INTO sg_rrhh_nomina;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_nomina, 'Roles de Pago', 'Banknote', '/rrhh/nomina', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_NOMINA'));

    -- Sub: Préstamos
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Préstamos', 'HandCoins', '#', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_PRESTAMOS'))
    RETURNING id INTO sg_rrhh_prestamos;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_prestamos, 'Anticipos', 'Coins', '/rrhh/prestamos', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_PRESTAMOS')),
        (sg_rrhh_prestamos, 'Préstamos', 'Landmark', '/rrhh/prestamos', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_PRESTAMOS'));

    -- Sub: Beneficios
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Beneficios', 'Gift', '#', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_BENEFICIOS'))
    RETURNING id INTO sg_rrhh_beneficios;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_beneficios, 'Décimos', 'CalendarPlus', '/rrhh/beneficios', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_BENEFICIOS')),
        (sg_rrhh_beneficios, 'Utilidades', 'TrendingUp', '/rrhh/beneficios', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_BENEFICIOS')),
        (sg_rrhh_beneficios, 'Fondos de Reserva', 'PiggyBank', '/rrhh/beneficios', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_BENEFICIOS'));

    -- Sub: Asistencia
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Asistencia', 'Clock', '#', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_ASISTENCIA'))
    RETURNING id INTO sg_rrhh_asistencia;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_asistencia, 'Horas Extras', 'Timer', '/rrhh/asistencia', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_ASISTENCIA')),
        (sg_rrhh_asistencia, 'Atrasos y Faltas', 'UserMinus', '/rrhh/asistencia', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_ASISTENCIA'));

    -- Sub: Vacaciones
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Vacaciones', 'Palmtree', '#', 60, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_VACACIONES'))
    RETURNING id INTO sg_rrhh_vacaciones;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_vacaciones, 'Solicitudes', 'FilePlus', '/rrhh/vacaciones', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_VACACIONES')),
        (sg_rrhh_vacaciones, 'Saldos', 'ListVideo', '/rrhh/vacaciones', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_VACACIONES'));

    -- Sub: Liquidaciones
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES (g_rrhh, 'Liquidaciones', 'FileX', '#', 70, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_LIQUIDACIONES'))
    RETURNING id INTO sg_rrhh_liquidaciones;
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (sg_rrhh_liquidaciones, 'Actas de Finiquito', 'FileText', '/rrhh/liquidaciones', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_RRHH_LIQUIDACIONES'));


    -- GRUPO SISTEMA
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id)
    VALUES ('Sistema', 'Settings', '#', 90, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_MODULO_SISTEMA'))
    RETURNING id INTO g_sistema;

        -- Sub: Seguridad
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_sistema, 'Seguridad', 'Shield', '#', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_SEGURIDAD'))
        RETURNING id INTO sg_seguridad;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_seguridad, 'Usuarios', 'UserCog', '/administracion/usuarios', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_SEGURIDAD')),
            (sg_seguridad, 'Gestión de Roles', 'Lock', '/administracion/roles', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_SEGURIDAD')),
            (sg_seguridad, 'Puntos de Usuario', 'UserCheck', '/administracion/puntos-usuario', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_SEGURIDAD'));

        -- Sub: Configuración
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_sistema, 'Configuración', 'Settings2', '#', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG'))
        RETURNING id INTO sg_config;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_config, 'Empresa', 'Building2', '/configuracion/empresa', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG')),
            (sg_config, 'Sucursales', 'Database', '/configuracion/sucursales', 20, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG')),
            (sg_config, 'Puntos Emisión', 'Computer', '/configuracion/puntos-emision', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG')),
            (sg_config, 'Gestión de Planes', 'CreditCard', '/administracion/planes', 35, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_PLANES')),
            (sg_config, 'Parámetros', 'Sliders', '/configuracion/parametros', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG'));

        -- Sub: Fact. Electrónica
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (g_sistema, 'Fact. Electrónica', 'Wifi', '#', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_FACT_ELEC'))
        RETURNING id INTO sg_factel;
            INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
            (sg_factel, 'Firma Electrónica', 'FileSignature', '/configuracion/firma-electronica', 10, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_FACT_ELEC'));

        -- Otros Sistema
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id) VALUES 
        (g_sistema, 'Auditoría', 'Eye', '/auditoria', 40, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_AUDITORIA')),
        (g_sistema, 'Reportes Gral.', 'PieChart', '/reportes-generales', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_REPORTES'));

END $$;
