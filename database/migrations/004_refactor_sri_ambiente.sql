-- ============================================================================
-- MIGRACIÓN 004: Refactorización de sri_certificados con tabla sri_ambiente
-- ============================================================================
-- Fecha: 2026-01-26
-- Descripción: Normaliza la configuración del SRI separando los ambientes 
--              (PRUEBAS/PRODUCCION) y sus URLs en una tabla catálogo independiente
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Crear tabla sri_ambiente (catálogo de ambientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion.sri_ambiente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE CHECK (codigo IN ('PRUEBAS','PRODUCCION')),
    nombre VARCHAR(50) NOT NULL,
    url_recepcion TEXT NOT NULL,
    url_autorizacion TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE configuracion.sri_ambiente IS 'Catálogo de ambientes del SRI (PRUEBAS/PRODUCCION) con sus URLs de servicios web';
COMMENT ON COLUMN configuracion.sri_ambiente.id IS 'Identificador único UUID del ambiente';
COMMENT ON COLUMN configuracion.sri_ambiente.codigo IS 'Código del ambiente: PRUEBAS o PRODUCCION';
COMMENT ON COLUMN configuracion.sri_ambiente.nombre IS 'Nombre descriptivo del ambiente';
COMMENT ON COLUMN configuracion.sri_ambiente.url_recepcion IS 'URL del servicio web de recepción de comprobantes';
COMMENT ON COLUMN configuracion.sri_ambiente.url_autorizacion IS 'URL del servicio web de autorización de comprobantes';
COMMENT ON COLUMN configuracion.sri_ambiente.descripcion IS 'Descripción adicional del ambiente';
COMMENT ON COLUMN configuracion.sri_ambiente.activo IS 'Estado del ambiente';

-- ============================================================================
-- PASO 2: Insertar los ambientes estándar del SRI
-- ============================================================================
INSERT INTO configuracion.sri_ambiente (codigo, nombre, url_recepcion, url_autorizacion, descripcion)
VALUES
    ('PRUEBAS', 'Ambiente de Pruebas', 
     'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
     'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
     'Ambiente de certificación y pruebas del SRI'),
    ('PRODUCCION', 'Ambiente de Producción',
     'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
     'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
     'Ambiente productivo del SRI')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================================
-- PASO 3: Crear tabla temporal de respaldo
-- ============================================================================
CREATE TEMP TABLE sri_certificados_backup AS
SELECT * FROM configuracion.sri_certificados;

-- ============================================================================
-- PASO 4: Recrear tabla sri_certificados con nueva estructura
-- ============================================================================
DROP TABLE IF EXISTS configuracion.sri_certificados;

CREATE TABLE configuracion.sri_certificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    sri_ambiente_id UUID NOT NULL REFERENCES configuracion.sri_ambiente(id) ON DELETE RESTRICT,
    p12_certificado BYTEA,
    clave_certificado VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    -- Solo un certificado activo por empresa y ambiente
    UNIQUE(empresa_id, sri_ambiente_id, activo)
);

COMMENT ON TABLE configuracion.sri_certificados IS 'Almacena certificados digitales P12 por empresa y ambiente SRI para facturación electrónica';
COMMENT ON COLUMN configuracion.sri_certificados.id IS 'Identificador único del certificado';
COMMENT ON COLUMN configuracion.sri_certificados.empresa_id IS 'Empresa propietaria del certificado';
COMMENT ON COLUMN configuracion.sri_certificados.sri_ambiente_id IS 'Referencia al ambiente SRI (PRUEBAS o PRODUCCION)';
COMMENT ON COLUMN configuracion.sri_certificados.p12_certificado IS 'Certificado digital P12 almacenado como BYTEA';
COMMENT ON COLUMN configuracion.sri_certificados.clave_certificado IS 'Contraseña del certificado (debe encriptarse en producción)';

-- ============================================================================
-- PASO 5: Migrar datos existentes
-- ============================================================================
INSERT INTO configuracion.sri_certificados (
    id, 
    empresa_id, 
    sri_ambiente_id, 
    p12_certificado, 
    clave_certificado, 
    activo, 
    created_at, 
    updated_at, 
    created_by, 
    updated_by
)
SELECT 
    scb.id,
    scb.empresa_id,
    sa.id as sri_ambiente_id,  -- JOIN con sri_ambiente para obtener el UUID
    scb.p12_certificado,
    scb.clave_certificado,
    scb.activo,
    scb.created_at,
    scb.updated_at,
    scb.created_by,
    scb.updated_by
FROM sri_certificados_backup scb
INNER JOIN configuracion.sri_ambiente sa ON sa.codigo = scb.ambiente;

-- ============================================================================
-- PASO 6: Recrear triggers de auditoría
-- ============================================================================
DROP TRIGGER IF EXISTS audit_sri_ambiente ON configuracion.sri_ambiente;
CREATE TRIGGER audit_sri_ambiente 
    AFTER INSERT OR UPDATE OR DELETE ON configuracion.sri_ambiente 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_sri_certificados ON configuracion.sri_certificados;
CREATE TRIGGER audit_sri_certificados 
    AFTER INSERT OR UPDATE OR DELETE ON configuracion.sri_certificados 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- PASO 7: Verificación de la migración
-- ============================================================================
DO $$
DECLARE
    backup_count INT;
    new_count INT;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM sri_certificados_backup;
    SELECT COUNT(*) INTO new_count FROM configuracion.sri_certificados;
    
    IF backup_count != new_count THEN
        RAISE EXCEPTION 'ERROR: Migración incompleta. Registros originales: %, Registros migrados: %', 
            backup_count, new_count;
    ELSE
        RAISE NOTICE 'ÉXITO: Migración completada. % registros migrados correctamente.', new_count;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTA: El backup temporal se elimina automáticamente al finalizar la sesión
-- ============================================================================
