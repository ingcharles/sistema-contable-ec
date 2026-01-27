-- ============================================================================
-- MIGRATION 006: Renombrar columnas de certificado para consistencia
-- ============================================================================
-- Fecha: 26/01/2026
-- Descripción: 
--   Renombra p12_certificado y clave_certificado a cert_p12_certificado 
--   y cert_clave_certificado respectivamente para mantener consistencia
--   con la nomenclatura de otros campos del certificado (cert_fecha_emision, etc.)
-- ============================================================================

BEGIN;

-- Renombrar columnas en la tabla sri_certificados
ALTER TABLE configuracion.sri_certificados 
    RENAME COLUMN p12_certificado TO cert_p12_certificado;

ALTER TABLE configuracion.sri_certificados 
    RENAME COLUMN clave_certificado TO cert_clave_certificado;

-- Actualizar comentarios de las columnas
COMMENT ON COLUMN configuracion.sri_certificados.cert_p12_certificado IS 
    'Certificado digital P12 almacenado como BYTEA';

COMMENT ON COLUMN configuracion.sri_certificados.cert_clave_certificado IS 
    'Contraseña del certificado (debe encriptarse en producción)';

-- Recrear la función obtener_metadata_certificado con los nuevos nombres
CREATE OR REPLACE FUNCTION configuracion.obtener_metadata_certificado(
    p_empresa_id UUID,
    p_ambiente_codigo VARCHAR
)
RETURNS TABLE (
    id UUID,
    ambiente VARCHAR,
    cert_fecha_emision TIMESTAMP,
    cert_fecha_expiracion TIMESTAMP,
    cert_sujeto TEXT,
    cert_emisor TEXT,
    cert_numero_serie VARCHAR,
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

COMMIT;

-- ============================================================================
-- FIN MIGRATION 006
-- ============================================================================
