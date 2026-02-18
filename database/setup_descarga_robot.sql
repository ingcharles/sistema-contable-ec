-- ============================================================================
-- MIGRACIÓN: Módulo Descarga por Robot
-- Fecha: 2026-02-12
-- Descripción: Agrega credenciales SRI a sri_certificados, crea tablas para 
--              historial de descargas y comprobantes descargados, y menú.
-- ============================================================================

-- 1. Agregar credenciales del portal SRI en línea a sri_certificados
ALTER TABLE configuracion.sri_certificados 
  ADD COLUMN IF NOT EXISTS usuario_sri VARCHAR(100),
  ADD COLUMN IF NOT EXISTS clave_sri TEXT;

COMMENT ON COLUMN configuracion.sri_certificados.usuario_sri IS 'Usuario del portal SRI en línea (generalmente RUC o cédula)';
COMMENT ON COLUMN configuracion.sri_certificados.clave_sri IS 'Clave del portal SRI en línea (encriptada AES-256)';

-- 2. Tabla: Historial de tareas de descarga por robot
CREATE TABLE IF NOT EXISTS compras.descargas_robot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    tipo_documento VARCHAR(20) NOT NULL DEFAULT 'TODOS', -- FACTURA, NOTA_CREDITO, TODOS, etc.
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','EN_CURSO','COMPLETADO','ERROR')),
    total_encontrados INTEGER DEFAULT 0,
    total_descargados INTEGER DEFAULT 0,
    total_procesados INTEGER DEFAULT 0,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    error_detalle TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, anio, mes, tipo_documento)
);

COMMENT ON TABLE compras.descargas_robot IS 'Historial de tareas de descarga automatizada de comprobantes del SRI';
COMMENT ON COLUMN compras.descargas_robot.anio IS 'Año del período a descargar';
COMMENT ON COLUMN compras.descargas_robot.mes IS 'Mes del período a descargar (1-12)';
COMMENT ON COLUMN compras.descargas_robot.tipo_documento IS 'Tipo de documento a descargar: FACTURA, NOTA_CREDITO, TODOS';
COMMENT ON COLUMN compras.descargas_robot.estado IS 'Estado: PENDIENTE, EN_CURSO, COMPLETADO, ERROR';
COMMENT ON COLUMN compras.descargas_robot.total_encontrados IS 'Cantidad de comprobantes encontrados en el SRI';
COMMENT ON COLUMN compras.descargas_robot.total_descargados IS 'Cantidad de XMLs descargados exitosamente';
COMMENT ON COLUMN compras.descargas_robot.total_procesados IS 'Cantidad cargados a compras';

-- 3. Tabla: Comprobantes individuales descargados del SRI
CREATE TABLE IF NOT EXISTS compras.comprobantes_descargados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    descarga_id UUID REFERENCES compras.descargas_robot(id) ON DELETE SET NULL,
    clave_acceso VARCHAR(49) NOT NULL,
    tipo_comprobante VARCHAR(2) NOT NULL, -- 01, 04, 05, etc.
    ruc_emisor VARCHAR(13) NOT NULL,
    razon_social_emisor VARCHAR(300),
    numero_comprobante VARCHAR(20), -- 001-001-000000001
    fecha_emision DATE,
    monto_total NUMERIC(18,2) DEFAULT 0,
    xml_contenido TEXT, -- XML completo del comprobante
    estado VARCHAR(20) NOT NULL DEFAULT 'NUEVO' CHECK (estado IN ('NUEVO','PROCESADO','IGNORADO')),
    compra_id UUID REFERENCES compras.compras(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, clave_acceso)
);

COMMENT ON TABLE compras.comprobantes_descargados IS 'Comprobantes electrónicos descargados del SRI por el robot';
COMMENT ON COLUMN compras.comprobantes_descargados.clave_acceso IS 'Clave de acceso de 49 dígitos del comprobante SRI';
COMMENT ON COLUMN compras.comprobantes_descargados.tipo_comprobante IS 'Código SRI del tipo: 01=Factura, 04=NC, 05=ND, etc.';
COMMENT ON COLUMN compras.comprobantes_descargados.xml_contenido IS 'Contenido XML completo del comprobante electrónico';
COMMENT ON COLUMN compras.comprobantes_descargados.estado IS 'NUEVO=sin procesar, PROCESADO=cargado a compras, IGNORADO=descartado';
COMMENT ON COLUMN compras.comprobantes_descargados.compra_id IS 'Referencia a la compra generada si fue procesado';

-- 4. Triggers de auditoría
CREATE TRIGGER audit_descargas_robot AFTER INSERT OR UPDATE OR DELETE ON compras.descargas_robot FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_comprobantes_descargados AFTER INSERT OR UPDATE OR DELETE ON compras.comprobantes_descargados FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 5. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_descargas_robot_empresa ON compras.descargas_robot(empresa_id);
CREATE INDEX IF NOT EXISTS idx_descargas_robot_periodo ON compras.descargas_robot(empresa_id, anio, mes);
CREATE INDEX IF NOT EXISTS idx_comprobantes_descargados_empresa ON compras.comprobantes_descargados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_descargados_estado ON compras.comprobantes_descargados(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_comprobantes_descargados_fecha ON compras.comprobantes_descargados(empresa_id, fecha_emision);

-- 6. Crear permiso para el módulo de Descarga por Robot
INSERT INTO seguridad.permisos (codigo, nombre, descripcion) VALUES
('VER_COMPRAS_ROBOT', 'Ver Descarga Robot', 'Acceso al módulo de descarga automatizada de comprobantes SRI')
ON CONFLICT (codigo) DO NOTHING;

-- 7. Asignar permiso a roles: SUPERADMIN, ADMIN, CONTADOR
DO $$
DECLARE
    v_permiso_id UUID := (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_ROBOT');
    r_super UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'SUPERADMIN');
    r_admin UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'ADMIN');
    r_cont  UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'CONTADOR');
BEGIN
    IF v_permiso_id IS NOT NULL THEN
        -- SUPERADMIN
        IF r_super IS NOT NULL THEN
            INSERT INTO seguridad.roles_permisos (rol_id, permiso_id) VALUES (r_super, v_permiso_id) ON CONFLICT DO NOTHING;
        END IF;
        -- ADMIN
        IF r_admin IS NOT NULL THEN
            INSERT INTO seguridad.roles_permisos (rol_id, permiso_id) VALUES (r_admin, v_permiso_id) ON CONFLICT DO NOTHING;
        END IF;
        -- CONTADOR
        IF r_cont IS NOT NULL THEN
            INSERT INTO seguridad.roles_permisos (rol_id, permiso_id) VALUES (r_cont, v_permiso_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- 8. Asignar permiso a todos los planes existentes
INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
SELECT p.id, per.id
FROM seguridad.planes p, seguridad.permisos per
WHERE per.codigo = 'VER_COMPRAS_ROBOT'
ON CONFLICT DO NOTHING;

-- 9. Insertar menú "Descarga por Robot" bajo "Compras" en configuracion.menu_items
DO $$
DECLARE
    v_padre_compras UUID;
    v_permiso_id UUID := (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_COMPRAS_ROBOT');
BEGIN
    -- Buscar el sub-grupo "Compras" (padre_id no nulo, con etiqueta 'Compras')
    SELECT id INTO v_padre_compras 
    FROM configuracion.menu_items 
    WHERE etiqueta = 'Compras' AND padre_id IS NOT NULL 
    LIMIT 1;

    -- Si no lo encuentra como hijo, buscar como padre directo
    IF v_padre_compras IS NULL THEN
        SELECT id INTO v_padre_compras 
        FROM configuracion.menu_items 
        WHERE etiqueta ILIKE '%Compra%' 
        LIMIT 1;
    END IF;

    -- Insertar submenú si aún no existe
    IF NOT EXISTS (SELECT 1 FROM configuracion.menu_items WHERE ruta = '/compras/descarga-robot') THEN
        INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
        VALUES (v_padre_compras, 'Descarga por Robot', 'Bot', '/compras/descarga-robot', 55, v_permiso_id);
    END IF;
END $$;

