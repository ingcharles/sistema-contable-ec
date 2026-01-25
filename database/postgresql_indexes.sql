-- ============================================================================
-- ÍNDICES DE OPTIMIZACIÓN - EcuContable Pro
-- ============================================================================
-- Este script crea índices para mejorar el rendimiento de las consultas
-- más frecuentes del sistema.
--
-- Ejecutar después de aplicar el schema principal (postgres_schema.sql)
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: ÍNDICES BÁSICOS (empresa_id + campo principal)
-- ============================================================================
-- Estos índices aceleran las consultas filtradas por empresa

-- Plan de Cuentas
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_empresa_codigo 
ON plan_cuentas(empresa_id, codigo);

CREATE INDEX IF NOT EXISTS idx_plan_cuentas_empresa_activa 
ON plan_cuentas(empresa_id, activa) 
WHERE activa = true;

-- Asientos Contables
CREATE INDEX IF NOT EXISTS idx_asientos_empresa_fecha 
ON contabilidad.asientos(empresa_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_asientos_empresa_estado 
ON contabilidad.asientos(empresa_id, estado);

CREATE INDEX IF NOT EXISTS idx_asientos_detalles_asiento 
ON contabilidad.asientos_detalles(asiento_id);

CREATE INDEX IF NOT EXISTS idx_asientos_detalles_cuenta 
ON contabilidad.asientos_detalles(cuenta_codigo);

-- ============================================================================
-- SECCIÓN 2: ÍNDICES PARA INVENTARIO
-- ============================================================================

-- Productos
CREATE INDEX IF NOT EXISTS idx_productos_empresa_codigo 
ON productos(empresa_id, codigo_principal);

CREATE INDEX IF NOT EXISTS idx_productos_empresa_categoria 
ON productos(empresa_id, categoria_id);

-- Índice para búsqueda por nombre (GIN para text search)
CREATE INDEX IF NOT EXISTS idx_productos_nombre_gin 
ON productos USING gin(to_tsvector('spanish', nombre));

-- Índice para stock bajo
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo 
ON productos(empresa_id, stock_actual) 
WHERE stock_actual <= stock_minimo;

-- Categorías Producto
CREATE INDEX IF NOT EXISTS idx_categorias_producto_empresa 
ON categorias_producto(empresa_id, activa) 
WHERE activa = true;

-- Bodegas
CREATE INDEX IF NOT EXISTS idx_bodegas_empresa 
ON bodegas(empresa_id, activa) 
WHERE activa = true;

-- Kardex Movimientos
CREATE INDEX IF NOT EXISTS idx_kardex_empresa_producto 
ON kardex_movimientos(empresa_id, producto_id);

CREATE INDEX IF NOT EXISTS idx_kardex_empresa_bodega 
ON kardex_movimientos(empresa_id, bodega_id);

CREATE INDEX IF NOT EXISTS idx_kardex_fecha 
ON kardex_movimientos(empresa_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_kardex_producto_fecha 
ON kardex_movimientos(producto_id, fecha DESC);

-- ============================================================================
-- SECCIÓN 3: ÍNDICES PARA NÓMINA
-- ============================================================================

-- Empleados
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_cedula 
ON empleados(empresa_id, cedula);

CREATE INDEX IF NOT EXISTS idx_empleados_empresa_activo 
ON empleados(empresa_id, activo) 
WHERE activo = true;

-- Índice para búsqueda por nombres/apellidos (GIN)
CREATE INDEX IF NOT EXISTS idx_empleados_nombres_gin 
ON empleados USING gin(to_tsvector('spanish', nombres || ' ' || apellidos));

-- Roles de Pago
CREATE INDEX IF NOT EXISTS idx_nomina_roles_empresa_periodo 
ON nomina_roles(empresa_id, periodo);

CREATE INDEX IF NOT EXISTS idx_nomina_roles_empleado 
ON nomina_roles(empleado_id, periodo DESC);

CREATE INDEX IF NOT EXISTS idx_nomina_roles_estado 
ON nomina_roles(empresa_id, estado);

-- ============================================================================
-- SECCIÓN 4: ÍNDICES PARA BANCOS
-- ============================================================================

-- Cuentas Bancarias
CREATE INDEX IF NOT EXISTS idx_bancos_cuentas_empresa 
ON bancos_cuentas(empresa_id, numero_cuenta);

CREATE INDEX IF NOT EXISTS idx_bancos_cuentas_activa 
ON bancos_cuentas(empresa_id, activa) 
WHERE activa = true;

-- Movimientos Bancarios
CREATE INDEX IF NOT EXISTS idx_bancos_movimientos_cuenta 
ON bancos_movimientos(cuenta_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_bancos_movimientos_empresa_fecha 
ON bancos_movimientos(empresa_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_bancos_movimientos_conciliado 
ON bancos_movimientos(cuenta_id, conciliado) 
WHERE conciliado = false;

CREATE INDEX IF NOT EXISTS idx_bancos_movimientos_tipo 
ON bancos_movimientos(empresa_id, tipo);

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_conciliaciones_empresa ON bancos.bancos_conciliaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_cuenta ON bancos.bancos_conciliaciones(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_fecha ON bancos.bancos_conciliaciones(fecha_corte);
CREATE INDEX IF NOT EXISTS idx_movimientos_conciliacion ON bancos.bancos_movimientos(conciliacion_id);

-- ============================================================================
-- SECCIÓN 5: ÍNDICES PARA CARTERA
-- ============================================================================

-- Documentos Pendientes
CREATE INDEX IF NOT EXISTS idx_cartera_documentos_empresa_tipo 
ON cartera_documentos(empresa_id, tipo_cartera);

CREATE INDEX IF NOT EXISTS idx_cartera_documentos_tercero 
ON cartera_documentos(empresa_id, tercero_id);

CREATE INDEX IF NOT EXISTS idx_cartera_documentos_vencimiento 
ON cartera_documentos(empresa_id, fecha_vencimiento) 
WHERE saldo_pendiente > 0;

-- Índice compuesto para aging (documentos vencidos)
CREATE INDEX IF NOT EXISTS idx_cartera_documentos_vencidos 
ON cartera_documentos(empresa_id, tipo_cartera, fecha_vencimiento) 
WHERE saldo_pendiente > 0 AND fecha_vencimiento < CURRENT_DATE;

-- Anticipos
CREATE INDEX IF NOT EXISTS idx_cartera_anticipos_empresa_tipo 
ON cartera_anticipos(empresa_id, tipo_cartera);

CREATE INDEX IF NOT EXISTS idx_cartera_anticipos_tercero 
ON cartera_anticipos(tercero_id) 
WHERE saldo_disponible > 0;

CREATE INDEX IF NOT EXISTS idx_cartera_anticipos_disponible 
ON cartera_anticipos(empresa_id, tipo_cartera) 
WHERE saldo_disponible > 0;

-- ============================================================================
-- SECCIÓN 6: ÍNDICES PARA AUDITORÍA
-- ============================================================================

-- Logs de Auditoría
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_empresa 
ON auditoria_logs(empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_usuario 
ON auditoria_logs(usuario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_modulo 
ON auditoria_logs(empresa_id, modulo, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_severidad 
ON auditoria_logs(empresa_id, severidad, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_logs_evento 
ON auditoria_logs(empresa_id, evento);

-- ============================================================================
-- SECCIÓN 7: ÍNDICES COMPUESTOS AVANZADOS
-- ============================================================================

-- Asientos por empresa, periodo y estado (reportes)
CREATE INDEX IF NOT EXISTS idx_asientos_reporte 
ON contabilidad.asientos(empresa_id, fecha, estado);

-- Inventario con categoría y stock (reportes)
CREATE INDEX IF NOT EXISTS idx_productos_reporte 
ON productos(empresa_id, categoria_id, stock_actual);

-- Cartera aging por empresa y tipo
CREATE INDEX IF NOT EXISTS idx_cartera_aging 
ON cartera_documentos(empresa_id, tipo_cartera, fecha_vencimiento, saldo_pendiente);

-- Conciliación bancaria
CREATE INDEX IF NOT EXISTS idx_bancos_conciliacion 
ON bancos_movimientos(cuenta_id, conciliado, fecha);

-- Nómina por periodo y estado
CREATE INDEX IF NOT EXISTS idx_nomina_periodo_estado 
ON nomina_roles(empresa_id, periodo, estado);

-- ============================================================================
-- SECCIÓN 8: ÍNDICES PARA BÚSQUEDA FULL-TEXT
-- ============================================================================

-- Productos (búsqueda combinada)
CREATE INDEX IF NOT EXISTS idx_productos_fulltext 
ON productos USING gin(
    to_tsvector('spanish', 
        coalesce(codigo_principal, '') || ' ' || 
        coalesce(nombre, '') || ' ' || 
        coalesce(descripcion, '')
    )
);

-- Empleados (búsqueda combinada)
CREATE INDEX IF NOT EXISTS idx_empleados_fulltext 
ON empleados USING gin(
    to_tsvector('spanish', 
        coalesce(cedula, '') || ' ' || 
        coalesce(nombres, '') || ' ' || 
        coalesce(apellidos, '')
    )
);


-- Roles: búsqueda rápida por nombre
CREATE INDEX IF NOT EXISTS idx_roles_nombre 
ON seguridad.roles(nombre);

-- Usuarios-Roles: consultas por usuario y rol
CREATE INDEX IF NOT EXISTS idx_usuarios_roles_usuario 
ON seguridad.usuarios_roles(usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_roles_rol 
ON seguridad.usuarios_roles(rol_id);

-- Menú Items: consultas por estado y orden
CREATE INDEX IF NOT EXISTS idx_menu_items_activo_orden 
ON configuracion.menu_items(activo, orden);

-- Menú Items: búsqueda por path
CREATE INDEX IF NOT EXISTS idx_menu_items_path 
ON configuracion.menu_items(path);

-- Menú Item-Roles: consultas por ítem y rol
CREATE INDEX IF NOT EXISTS idx_menu_item_roles_item 
ON configuracion.menu_item_roles(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_menu_item_roles_rol 
ON configuracion.menu_item_roles(rol_id);


-- Índices multi-tenant (empresa_id debe estar en todas las consultas)
CREATE INDEX IF NOT EXISTS idx_plan_cuentas_empresa ON contabilidad.plan_cuentas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asientos_empresa ON contabilidad.asientos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON inventario.productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON nomina.empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bancos_cuentas_empresa ON bancos.bancos_cuentas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_empresa ON facturacion.comprobantes_electronicos(empresa_id);

-- Índices catalogos_items
CREATE INDEX IF NOT EXISTS idx_catalogos_items_catalogo ON configuracion.catalogos_items(catalogo_codigo);
CREATE INDEX IF NOT EXISTS idx_catalogos_items_codigo ON configuracion.catalogos_items(codigo);
CREATE INDEX IF NOT EXISTS idx_catalogos_items_activo ON configuracion.catalogos_items(catalogo_codigo, activo);

-- Índices caja chica
CREATE INDEX IF NOT EXISTS idx_caja_chica_empresa ON caja_chica.cajas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_caja_chica_vales_caja ON caja_chica.movimientos(caja_id);
CREATE INDEX IF NOT EXISTS idx_caja_chica_vales_empresa ON caja_chica.movimientos(empresa_id);

-- Índices cartera
CREATE INDEX IF NOT EXISTS idx_documentos_pendientes_empresa ON cartera.documentos_pendientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_documentos_pendientes_tercero ON cartera.documentos_pendientes(tercero_id);
CREATE INDEX IF NOT EXISTS idx_documentos_pendientes_tipo ON cartera.documentos_pendientes(tipo);
CREATE INDEX IF NOT EXISTS idx_anticipos_empresa ON cartera.anticipos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_anticipos_tercero ON cartera.anticipos(tercero_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_empresa ON cartera.transacciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_documento ON cartera.transacciones(documento_id);

-- Índices buzon
CREATE INDEX IF NOT EXISTS idx_buzon_empresa ON buzon.comprobantes_recibidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_buzon_ruc_emisor ON buzon.comprobantes_recibidos(ruc_emisor);
CREATE INDEX IF NOT EXISTS idx_buzon_estado ON buzon.comprobantes_recibidos(estado);

-- Índices terceros
CREATE INDEX IF NOT EXISTS idx_terceros_empresa ON directorio.terceros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_terceros_identificacion ON directorio.terceros(identificacion);
CREATE INDEX IF NOT EXISTS idx_terceros_tipo ON directorio.terceros(tipo_tercero);
CREATE INDEX IF NOT EXISTS idx_terceros_activo ON directorio.terceros(activo);
CREATE INDEX IF NOT EXISTS idx_terceros_razon_social ON directorio.terceros USING gin(to_tsvector('spanish', razon_social));

-- ============================================================================
-- SECCIÓN 9: ESTADÍSTICAS Y MANTENIMIENTO
-- ============================================================================

-- Actualizar estadísticas para el optimizador
ANALYZE plan_cuentas;
ANALYZE contabilidad.asientos;
ANALYZE contabilidad.asientos_detalles;
ANALYZE productos;
ANALYZE kardex_movimientos;
ANALYZE empleados;
ANALYZE nomina_roles;
ANALYZE bancos_cuentas;
ANALYZE bancos_movimientos;
ANALYZE cartera_documentos;
ANALYZE cartera_anticipos;
ANALYZE auditoria_logs;

-- ============================================================================
-- VERIFICACIÓN DE ÍNDICES
-- ============================================================================

-- Query para verificar índices creados
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- Query para verificar tamaño de índices
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- NOTAS DE RENDIMIENTO
-- ============================================================================
-- 
-- 1. Los índices parciales (WHERE activa = true, etc.) son más eficientes
--    para consultas que filtran por esa condición.
--
-- 2. Los índices GIN son excelentes para búsqueda full-text pero consumen
--    más espacio. Usar solo en columnas de búsqueda frecuente.
--
-- 3. Los índices compuestos (empresa_id, campo_x) permiten que PostgreSQL
--    use solo el índice sin acceder a la tabla principal.
--
-- 4. Ejecutar VACUUM ANALYZE periódicamente para mantener estadísticas
--    actualizadas y rendimiento óptimo.
--
-- 5. Monitorear el uso de índices con:
--    SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
--    (índices no utilizados que pueden eliminarse)
--
-- ============================================================================

-- Fin del script de índices
