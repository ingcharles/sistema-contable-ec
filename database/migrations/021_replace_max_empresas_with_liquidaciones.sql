-- Migración: Reemplazar MAX_EMPRESAS por MAX_LIQUIDACION_COMPRA
-- Descripción: Cambia el nombre de la característica y le asigna el ID del catálogo SRI correspondente (03)
-- Fecha: 2026-02-10

DO $$ 
DECLARE 
    id_liq UUID;
BEGIN 
    -- 1. Obtener el ID del catálogo para Liquidación de Compra (03)
    SELECT id INTO id_liq FROM configuracion.catalogos_items 
    WHERE catalogo_codigo = 'SRI_TIPO_COMPROBANTE' AND codigo = '03';

    IF id_liq IS NOT NULL THEN
        -- 2. Actualizar las características existentes
        UPDATE seguridad.plan_caracteristicas
        SET clave_caracteristica = 'MAX_LIQUIDACION_COMPRA',
            tipo_documento_id = id_liq
        WHERE clave_caracteristica = 'MAX_EMPRESAS';

        RAISE NOTICE 'Características MAX_EMPRESAS convertidas a MAX_LIQUIDACION_COMPRA.';
    ELSE
        RAISE NOTICE 'No se encontró el código 03 en el catálogo SRI. Verifique la base de datos.';
    END IF;

END $$;
