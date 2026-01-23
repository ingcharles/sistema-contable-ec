-- Migration: Update tipo_comprobante_sri ENUM to use SRI standard codes
-- Date: 2026-01-22
-- Description: Change from descriptive names (FACTURA, NOTA_CREDITO) to SRI codes (01, 04, etc.)

-- Step 1: Create new ENUM type with SRI codes
CREATE TYPE tipo_comprobante_sri_new AS ENUM ('01', '03', '04', '05', '06', '07');

-- Step 2: Add temporary column with new type
ALTER TABLE configuracion.puntos_emision_secuenciales 
ADD COLUMN tipo_comprobante_new tipo_comprobante_sri_new;

-- Step 3: Migrate data with mapping
UPDATE configuracion.puntos_emision_secuenciales
SET tipo_comprobante_new = CASE 
    WHEN tipo_comprobante = 'FACTURA' THEN '01'
    WHEN tipo_comprobante = 'LIQUIDACION_COMPRA' THEN '03'
    WHEN tipo_comprobante = 'NOTA_CREDITO' THEN '04'
    WHEN tipo_comprobante = 'NOTA_DEBITO' THEN '05'
    WHEN tipo_comprobante = 'GUIA_REMISION' THEN '06'
    WHEN tipo_comprobante = 'COMPROBANTE_RETENCION' THEN '07'
END;

-- Step 4: Drop old column
ALTER TABLE configuracion.puntos_emision_secuenciales 
DROP COLUMN tipo_comprobante;

-- Step 5: Rename new column
ALTER TABLE configuracion.puntos_emision_secuenciales 
RENAME COLUMN tipo_comprobante_new TO tipo_comprobante;

-- Step 6: Drop old ENUM type
DROP TYPE tipo_comprobante_sri;

-- Step 7: Rename new ENUM type
ALTER TYPE tipo_comprobante_sri_new RENAME TO tipo_comprobante_sri;

-- Step 8: Update facturacion.comprobantes_electronicos table
ALTER TABLE facturacion.comprobantes_electronicos 
ADD COLUMN tipo_comprobante_new tipo_comprobante_sri;

UPDATE facturacion.comprobantes_electronicos
SET tipo_comprobante_new = CASE 
    WHEN tipo_comprobante = 'FACTURA' THEN '01'
    WHEN tipo_comprobante = 'NOTA_CREDITO' THEN '04'
    WHEN tipo_comprobante = 'NOTA_DEBITO' THEN '05'
    WHEN tipo_comprobante = 'GUIA_REMISION' THEN '06'
    WHEN tipo_comprobante = 'COMPROBANTE_RETENCION' THEN '07'
END;

ALTER TABLE facturacion.comprobantes_electronicos 
DROP COLUMN tipo_comprobante;

ALTER TABLE facturacion.comprobantes_electronicos 
RENAME COLUMN tipo_comprobante_new TO tipo_comprobante;

-- Verification
SELECT 'Migration completed successfully. Verify data:' as status;
SELECT tipo_comprobante, COUNT(*) 
FROM configuracion.puntos_emision_secuenciales 
GROUP BY tipo_comprobante;
