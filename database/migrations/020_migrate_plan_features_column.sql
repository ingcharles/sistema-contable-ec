-- Migración: Refactorización de plan_caracteristicas
-- Descripción: Migra el campo tipo_comprobante (código SRI) a tipo_documento_id (UUID del catálogo)
-- Fecha: 2026-02-10

DO $$ 
BEGIN 
    -- 1. Asegurar que la columna tipo_documento_id existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'seguridad' AND table_name = 'plan_caracteristicas' 
                   AND column_name = 'tipo_documento_id') THEN
        ALTER TABLE seguridad.plan_caracteristicas ADD COLUMN tipo_documento_id UUID REFERENCES configuracion.catalogos_items(id);
        RAISE NOTICE 'Columna tipo_documento_id creada.';
    END IF;

    -- 2. Migrar los datos desde tipo_documento o tipo_comprobante
    -- Verificamos tipo_documento (nombre real encontrado en diagnóstico)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'seguridad' AND table_name = 'plan_caracteristicas' 
               AND column_name = 'tipo_documento') THEN
        
        UPDATE seguridad.plan_caracteristicas pc
        SET tipo_documento_id = ci.id
        FROM configuracion.catalogos_items ci
        WHERE ci.catalogo_codigo = 'SRI_TIPO_COMPROBANTE'
          AND ci.codigo::text = pc.tipo_documento::text
          AND pc.tipo_documento_id IS NULL;

        RAISE NOTICE 'Datos migrados de tipo_documento a tipo_documento_id.';
        
        -- Opcional: Eliminar la columna antigua si se desea limpiar
        -- ALTER TABLE seguridad.plan_caracteristicas DROP COLUMN tipo_documento;
    END IF;

    -- Verificamos tipo_comprobante (por si acaso el usuario lo tenía así)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'seguridad' AND table_name = 'plan_caracteristicas' 
               AND column_name = 'tipo_comprobante') THEN
        
        UPDATE seguridad.plan_caracteristicas pc
        SET tipo_documento_id = ci.id
        FROM configuracion.catalogos_items ci
        WHERE ci.catalogo_codigo = 'SRI_TIPO_COMPROBANTE'
          AND ci.codigo::text = pc.tipo_comprobante::text
          AND pc.tipo_documento_id IS NULL;

        RAISE NOTICE 'Datos migrados de tipo_comprobante a tipo_documento_id.';
        
        -- ALTER TABLE seguridad.plan_caracteristicas DROP COLUMN tipo_comprobante;
    END IF;

    -- 4. Re-crear el índice único para asegurar integridad por Plan + Tipo de Documento
    DROP INDEX IF EXISTS seguridad.idx_plan_caracteristica_tipo_doc;
    
    CREATE UNIQUE INDEX idx_plan_caracteristica_tipo_doc 
    ON seguridad.plan_caracteristicas(plan_id, tipo_documento_id) 
    WHERE tipo_documento_id IS NOT NULL;
    
    RAISE NOTICE 'Índice único idx_plan_caracteristica_tipo_doc actualizado.';

    -- 5. Actualizar comentarios para reflejar el cambio
    COMMENT ON COLUMN seguridad.plan_caracteristicas.tipo_documento_id IS 'UUID del catálogo SRI (SRI_TIPO_COMPROBANTE) para límites por tipo de documento';

END $$;
