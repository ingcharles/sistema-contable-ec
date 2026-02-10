-- MIGRACIÓN PARA REFACTURAR ALMACENAMIENTO DE IVA
-- REVIRTIDENDO EL USO DE iva_catalogo_item_id A codigo_iva Y tarifa

BEGIN;

-- 1. REFACTOR EN facturacion.comprobantes_detalles
-- ==============================================

-- PASO 1.1: Agregar columnas codigo_iva y tarifa si no existen
ALTER TABLE facturacion.comprobantes_detalles ADD COLUMN IF NOT EXISTS codigo_iva VARCHAR(10);
ALTER TABLE facturacion.comprobantes_detalles ADD COLUMN IF NOT EXISTS tarifa NUMERIC(5,2);

-- PASO 1.2: Migrar datos desde iva_catalogo_item_id
UPDATE facturacion.comprobantes_detalles cd
SET 
    codigo_iva = ci.codigo,
    tarifa = COALESCE(ci.valor_numerico, (REGEXP_MATCH(ci.valor, '(\d+)'))[1]::numeric, 0)
FROM configuracion.catalogos_items ci
WHERE cd.iva_catalogo_item_id = ci.id;

-- PASO 1.3: Poblar valores por defecto para Guías de Remisión (que no tienen IVA en detalle usualmente) o items sin IVA
UPDATE facturacion.comprobantes_detalles
SET codigo_iva = '0', tarifa = 0
WHERE codigo_iva IS NULL;

-- PASO 1.4: Eliminar columna obsoleta y su índice
-- Primero verificar si el índice existe (usualmente idx_comprobantes_detalles_iva)
DROP INDEX IF EXISTS facturacion.idx_comprobantes_detalles_iva;
ALTER TABLE facturacion.comprobantes_detalles DROP COLUMN IF EXISTS iva_catalogo_item_id;

-- 2. REFACTOR EN compras.compras_detalle (Consistencia para Liquidaciones)
-- =======================================================================

-- PASO 2.1: Agregar codigo_iva para estandarizar con SRI
ALTER TABLE compras.compras_detalle ADD COLUMN IF NOT EXISTS codigo_iva VARCHAR(10);

-- PASO 2.2: Intentar inferir codigo_iva desde porcentaje_iva
UPDATE compras.compras_detalle
SET codigo_iva = CASE 
    WHEN porcentaje_iva = 0 THEN '0'
    WHEN porcentaje_iva = 12 THEN '2'
    WHEN porcentaje_iva = 15 THEN '4'
    WHEN porcentaje_iva = 5 THEN '5'
    ELSE '0'
END
WHERE codigo_iva IS NULL;

-- 3. REFACTOR EN configuracion.parametros
-- =======================================
-- Mantener codigo_iva por defecto es más simple para el frontend
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS iva_codigo_defecto VARCHAR(10);
UPDATE configuracion.parametros p
SET iva_codigo_defecto = ci.codigo
FROM configuracion.catalogos_items ci
WHERE p.iva_catalogo_item_id = ci.id;

-- Opcional: Eliminar fk de parámetros si se decide no usar más el item_id allí.
-- ALTER TABLE configuracion.parametros DROP COLUMN iva_catalogo_item_id;

COMMIT;
