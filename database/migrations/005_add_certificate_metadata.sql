-- Migration: Add certificate metadata columns to sri_certificados
-- Date: 2024
-- Description: Adds columns to store P12 certificate metadata (issue date, expiration, subject, issuer, serial number)
--              and creates PostgreSQL functions to validate certificate status

BEGIN;

-- Add metadata columns to sri_certificados
ALTER TABLE configuracion.sri_certificados
    ADD COLUMN IF NOT EXISTS cert_fecha_emision TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cert_fecha_expiracion TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cert_sujeto TEXT,
    ADD COLUMN IF NOT EXISTS cert_emisor TEXT,
    ADD COLUMN IF NOT EXISTS cert_numero_serie VARCHAR(100);

-- Add column comments
COMMENT ON COLUMN configuracion.sri_certificados.cert_fecha_emision IS 'Fecha de emisión del certificado (notBefore)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_fecha_expiracion IS 'Fecha de expiración del certificado (notAfter)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_sujeto IS 'Sujeto del certificado (Subject DN)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_emisor IS 'Emisor del certificado (Issuer DN)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_numero_serie IS 'Número de serie del certificado';

-- Create function to check if certificate is valid (not expired)
CREATE OR REPLACE FUNCTION configuracion.es_certificado_vigente(fecha_expiracion TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
    IF fecha_expiracion IS NULL THEN
        RETURN NULL; -- Unknown status if no expiration date
    END IF;
    RETURN NOW() < fecha_expiracion;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION configuracion.es_certificado_vigente(TIMESTAMP) IS 
    'Verifica si un certificado está vigente comparando la fecha de expiración con la fecha actual';

-- Create function to get days until expiration (negative if expired)
CREATE OR REPLACE FUNCTION configuracion.dias_hasta_expiracion(fecha_expiracion TIMESTAMP)
RETURNS INTEGER AS $$
BEGIN
    IF fecha_expiracion IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN EXTRACT(DAY FROM (fecha_expiracion - NOW()))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION configuracion.dias_hasta_expiracion(TIMESTAMP) IS 
    'Calcula días restantes hasta la expiración del certificado. Retorna número negativo si ya expiró';

-- Create function to get certificate metadata for an empresa and ambiente
CREATE OR REPLACE FUNCTION configuracion.obtener_metadata_certificado(
    p_empresa_id UUID,
    p_ambiente_codigo VARCHAR
)
RETURNS TABLE (
    certificado_id UUID,
    ambiente VARCHAR,
    fecha_emision TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    sujeto TEXT,
    emisor TEXT,
    numero_serie VARCHAR,
    es_vigente BOOLEAN,
    dias_restantes INTEGER,
    tiene_certificado BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sa.codigo,
        sc.cert_fecha_emision,
        sc.cert_fecha_expiracion,
        sc.cert_sujeto,
        sc.cert_emisor,
        sc.cert_numero_serie,
        configuracion.es_certificado_vigente(sc.cert_fecha_expiracion) as es_vigente,
        configuracion.dias_hasta_expiracion(sc.cert_fecha_expiracion) as dias_restantes,
        (sc.cert_p12_certificado IS NOT NULL) as tiene_certificado
    FROM configuracion.sri_certificados sc
    INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
    WHERE sc.empresa_id = p_empresa_id 
      AND sa.codigo = p_ambiente_codigo
      AND sc.activo = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION configuracion.obtener_metadata_certificado(UUID, VARCHAR) IS 
    'Obtiene los metadatos completos del certificado digital activo para una empresa y ambiente, incluyendo estado de vigencia';

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'configuracion' 
  AND table_name = 'sri_certificados'
  AND column_name IN ('cert_fecha_emision', 'cert_fecha_expiracion', 'cert_sujeto', 'cert_emisor', 'cert_numero_serie')
ORDER BY column_name;

COMMIT;

-- Expected result: 5 rows showing the new columns
-- cert_emisor | text | YES
-- cert_fecha_emision | timestamp without time zone | YES
-- cert_fecha_expiracion | timestamp without time zone | YES
-- cert_numero_serie | character varying | YES
-- cert_sujeto | text | YES

-- Example usage of new functions:
-- SELECT configuracion.es_certificado_vigente('2025-12-31'::TIMESTAMP); -- Returns TRUE if not expired
-- SELECT configuracion.dias_hasta_expiracion('2025-12-31'::TIMESTAMP); -- Returns remaining days
-- SELECT * FROM configuracion.obtener_metadata_certificado('empresa-uuid', 'PRUEBAS');
