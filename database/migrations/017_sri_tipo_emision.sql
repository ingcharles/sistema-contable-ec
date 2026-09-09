-- Migración: Agregar tipo de emisión por defecto para el SRI
-- Tabla: configuracion.parametros

ALTER TABLE configuracion.parametros 
ADD COLUMN IF NOT EXISTS sri_tipo_emision VARCHAR(1) DEFAULT '1';

COMMENT ON COLUMN configuracion.parametros.sri_tipo_emision IS 'Tipo de emisión predeterminado para el SRI (1: Normal, 2: Emisión por Indisponibilidad)';

-- Asegurar que las empresas existentes tengan el valor '1'
UPDATE configuracion.parametros SET sri_tipo_emision = '1' WHERE sri_tipo_emision IS NULL;
