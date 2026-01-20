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
CREATE INDEX IF NOT EXISTS idx_asientos_cab_empresa_fecha 
ON asientos_cab(empresa_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_asientos_cab_empresa_estado 
ON asientos_cab(empresa_id, estado);

CREATE INDEX IF NOT EXISTS idx_asientos_det_asiento 
ON asientos_det(asiento_id);

CREATE INDEX IF NOT EXISTS idx_asientos_det_cuenta 
ON asientos_det(cuenta_codigo);

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
ON asientos_cab(empresa_id, fecha, estado);

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

-- ============================================================================
-- SECCIÓN 9: ESTADÍSTICAS Y MANTENIMIENTO
-- ============================================================================

-- Actualizar estadísticas para el optimizador
ANALYZE plan_cuentas;
ANALYZE asientos_cab;
ANALYZE asientos_det;
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
