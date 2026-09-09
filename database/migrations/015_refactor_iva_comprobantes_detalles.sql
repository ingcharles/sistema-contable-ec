-- ============================================================================
-- MIGRATION 015: Refactor IVA Storage in Comprobantes Detalles
-- ============================================================================
-- Fecha: 2026-02-06
-- Descripción: Reemplaza codigo_iva y tarifa con iva_catalogo_item_id para
--              estandarizar el manejo de IVA usando el catálogo centralizado.
-- ============================================================================

-- PASO 1: Verificar que iva_catalogo_item_id existe (debe existir del schema base)
-- Si no existe, crearla como NULLABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'facturacion' 
        AND table_name = 'comprobantes_detalles' 
        AND column_name = 'iva_catalogo_item_id'
    ) THEN
        ALTER TABLE facturacion.comprobantes_detalles 
        ADD COLUMN iva_catalogo_item_id UUID REFERENCES configuracion.catalogos_items(id);
        
        COMMENT ON COLUMN facturacion.comprobantes_detalles.iva_catalogo_item_id 
        IS 'Referencia al catálogo de tipos de IVA (SRI_TIPO_IMPUESTO_IVA)';
    END IF;
END $$;

-- PASO 2: Migrar datos existentes de codigo_iva a iva_catalogo_item_id
-- Solo si las columnas codigo_iva y tarifa existen
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'facturacion' 
        AND table_name = 'comprobantes_detalles' 
        AND column_name = 'codigo_iva'
    ) THEN
        -- Migrar datos: mapear codigo_iva a iva_catalogo_item_id
        UPDATE facturacion.comprobantes_detalles cd
        SET iva_catalogo_item_id = ci.id
        FROM configuracion.catalogos_items ci
        WHERE ci.catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA'
          AND ci.codigo = cd.codigo_iva
          AND cd.iva_catalogo_item_id IS NULL;
        
        -- Para registros que no tienen match (si existen), usar IVA por defecto (código '4' = 15%)
        UPDATE facturacion.comprobantes_detalles cd
        SET iva_catalogo_item_id = (
            SELECT id FROM configuracion.catalogos_items 
            WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA' 
            AND codigo = '4' 
            LIMIT 1
        )
        WHERE iva_catalogo_item_id IS NULL
          AND codigo_iva IS NOT NULL;
    END IF;
END $$;

-- PASO 3: Eliminar columnas obsoletas codigo_iva y tarifa
DO $$
BEGIN
    -- Eliminar codigo_iva si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'facturacion' 
        AND table_name = 'comprobantes_detalles' 
        AND column_name = 'codigo_iva'
    ) THEN
        ALTER TABLE facturacion.comprobantes_detalles DROP COLUMN codigo_iva;
    END IF;
    
    -- Eliminar tarifa si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'facturacion' 
        AND table_name = 'comprobantes_detalles' 
        AND column_name = 'tarifa'
    ) THEN
        ALTER TABLE facturacion.comprobantes_detalles DROP COLUMN tarifa;
    END IF;
END $$;

-- PASO 4: Crear índice para mejorar performance en joins con catalogos_items
CREATE INDEX IF NOT EXISTS idx_comprobantes_detalles_iva_catalogo 
ON facturacion.comprobantes_detalles(iva_catalogo_item_id);

-- PASO 5: Verificación (Opcional - Comentar en producción)
-- SELECT 
--     cd.id,
--     cd.descripcion,
--     cd.iva_catalogo_item_id,
--     ci.codigo as codigo_iva,
--     ci.nombre as nombre_iva,
--     ci.valor_numerico as tarifa_iva
-- FROM facturacion.comprobantes_detalles cd
-- LEFT JOIN configuracion.catalogos_items ci ON cd.iva_catalogo_item_id = ci.id
-- LIMIT 10;

COMMENT ON COLUMN facturacion.comprobantes_detalles.iva_catalogo_item_id 
IS 'Referencia al catálogo de tipos de IVA (SRI_TIPO_IMPUESTO_IVA). Reemplaza codigo_iva y tarifa para estandarizar el manejo de impuestos.';
