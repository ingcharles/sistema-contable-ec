-- ============================================================================
-- ECUCONTABLE PRO - CONFIGURACIÓN DE PLANES Y CUOTAS
-- ============================================================================
-- Descripción: Script para configurar el sistema de planes, características
-- y seguimiento de uso (cuotas mensuales).
-- ============================================================================

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_plan_usuario' AND typnamespace = 'seguridad'::regnamespace) THEN
        CREATE TYPE seguridad.estado_plan_usuario AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'EXPIRADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_valor_caracteristica' AND typnamespace = 'seguridad'::regnamespace) THEN
        CREATE TYPE seguridad.tipo_valor_caracteristica AS ENUM ('NUMERO', 'BOOLEANO');
    END IF;
END $$;

-- ============================================================================
-- TABLAS DE PLANES Y SUSCRIPCIONES
-- ============================================================================


-- Tabla: seguridad.plan_caracteristicas
CREATE TABLE IF NOT EXISTS seguridad.plan_caracteristicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES seguridad.planes(id) ON DELETE CASCADE,
    clave_caracteristica VARCHAR(50) NOT NULL,
    tipo_documento facturacion.tipo_comprobante_sri NULL,
    tipo_valor seguridad.tipo_valor_caracteristica NOT NULL,
    valor_numero INT,
    valor_booleano BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_caracteristica_tipo_doc 
    ON seguridad.plan_caracteristicas(plan_id, tipo_documento) 
    WHERE tipo_documento IS NOT NULL;

COMMENT ON TABLE seguridad.plan_caracteristicas IS 'Características y límites específicos de cada plan.';
COMMENT ON COLUMN seguridad.plan_caracteristicas.id IS 'Identificador único de la característica';
COMMENT ON COLUMN seguridad.plan_caracteristicas.plan_id IS 'Referencia al plan';
COMMENT ON COLUMN seguridad.plan_caracteristicas.clave_caracteristica IS 'Nombre técnico de la característica (ej: MAX_EMPRESAS)';
COMMENT ON COLUMN seguridad.plan_caracteristicas.tipo_documento IS 'Código SRI si la característica es un límite por tipo de documento';
COMMENT ON COLUMN seguridad.plan_caracteristicas.tipo_valor IS 'Tipo de dato del valor: NUMERO o BOOLEANO';
COMMENT ON COLUMN seguridad.plan_caracteristicas.valor_numero IS 'Valor numérico si tipo_valor es NUMERO';
COMMENT ON COLUMN seguridad.plan_caracteristicas.valor_booleano IS 'Valor booleano si tipo_valor es BOOLEANO';
COMMENT ON COLUMN seguridad.plan_caracteristicas.created_at IS 'Fecha de creación';
COMMENT ON COLUMN seguridad.plan_caracteristicas.updated_at IS 'Fecha de última actualización';

-- Tabla: seguridad.usuario_estadisticas_uso
CREATE TABLE IF NOT EXISTS seguridad.usuario_estadisticas_uso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL,
    tipo_documento facturacion.tipo_comprobante_sri NOT NULL,
    cantidad INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, periodo, tipo_documento)
);

CREATE INDEX IF NOT EXISTS idx_estadisticas_uso_usuario_periodo 
    ON seguridad.usuario_estadisticas_uso(usuario_id, periodo);

COMMENT ON TABLE seguridad.usuario_estadisticas_uso IS 'Seguimiento mensual del uso de cuotas por usuario.';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.id IS 'Identificador único del registro de uso';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.usuario_id IS 'Referencia al usuario';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.periodo IS 'Período de consumo en formato YYYY-MM';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.tipo_documento IS 'Tipo de documento emitido (Código SRI)';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.cantidad IS 'Cantidad acumulada en el período';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.created_at IS 'Fecha de primer consumo en el período';
COMMENT ON COLUMN seguridad.usuario_estadisticas_uso.updated_at IS 'Fecha del último consumo registrado';

-- ============================================================================
-- ACTUALIZACIÓN DE TABLA USUARIOS
-- ============================================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'plan_id') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN plan_id UUID REFERENCES seguridad.planes(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'estado_plan') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN estado_plan seguridad.estado_plan_usuario DEFAULT 'ACTIVO';
    ELSE
        -- Convertir de VARCHAR a ENUM si ya existe
        ALTER TABLE seguridad.usuarios ALTER COLUMN estado_plan TYPE seguridad.estado_plan_usuario USING estado_plan::seguridad.estado_plan_usuario;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'fecha_inicio_plan') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN fecha_inicio_plan TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'fecha_fin_plan') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN fecha_fin_plan TIMESTAMP;
    END IF;
END $$;

COMMENT ON COLUMN seguridad.usuarios.plan_id IS 'Referencia al plan de suscripción actual del usuario';
COMMENT ON COLUMN seguridad.usuarios.estado_plan IS 'Estado de la suscripción: ACTIVO, INACTIVO, SUSPENDIDO, EXPIRADO';
COMMENT ON COLUMN seguridad.usuarios.fecha_inicio_plan IS 'Fecha de inicio del plan actual';
COMMENT ON COLUMN seguridad.usuarios.fecha_fin_plan IS 'Fecha de vencimiento del plan actual';

-- ============================================================================
-- FUNCIONES Y TRIGGERS (updated_at)
-- ============================================================================
/*CREATE OR REPLACE FUNCTION seguridad.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Triggers para seguridad.planes
DROP TRIGGER IF EXISTS trg_planes_updated_at ON seguridad.planes;
CREATE TRIGGER trg_planes_updated_at
    BEFORE UPDATE ON seguridad.planes
    FOR EACH ROW EXECUTE FUNCTION seguridad.update_updated_at_column();

-- Triggers para seguridad.plan_caracteristicas
DROP TRIGGER IF EXISTS trg_plan_caracteristicas_updated_at ON seguridad.plan_caracteristicas;
CREATE TRIGGER trg_plan_caracteristicas_updated_at
    BEFORE UPDATE ON seguridad.plan_caracteristicas
    FOR EACH ROW EXECUTE FUNCTION seguridad.update_updated_at_column();

-- Triggers para seguridad.usuario_estadisticas_uso
DROP TRIGGER IF EXISTS trg_usuario_estadisticas_uso_updated_at ON seguridad.usuario_estadisticas_uso;
CREATE TRIGGER trg_usuario_estadisticas_uso_updated_at
    BEFORE UPDATE ON seguridad.usuario_estadisticas_uso
    FOR EACH ROW EXECUTE FUNCTION seguridad.update_updated_at_column()*/

-- ============================================================================
-- SEED DATA: PLANES E INSERCIÓN DE CARACTERÍSTICAS
-- ============================================================================
INSERT INTO seguridad.planes (codigo, nombre, precio_mensual) VALUES
('GRATUITO', 'Plan Gratuito', 0.00),
('PROFESIONAL', 'Plan Profesional', 29.99),
('EMPRESARIAL', 'Plan Empresarial', 99.99)
ON CONFLICT (codigo) DO NOTHING;

DO $$
DECLARE
    plan_gratuito_id UUID;
    plan_profesional_id UUID;
    plan_empresarial_id UUID;
BEGIN
    SELECT id INTO plan_gratuito_id FROM seguridad.planes WHERE codigo = 'GRATUITO';
    SELECT id INTO plan_profesional_id FROM seguridad.planes WHERE codigo = 'PROFESIONAL';
    SELECT id INTO plan_empresarial_id FROM seguridad.planes WHERE codigo = 'EMPRESARIAL';

    -- Limpiar características existentes para evitar duplicados en re-runs
    DELETE FROM seguridad.plan_caracteristicas WHERE plan_id IN (plan_gratuito_id, plan_profesional_id, plan_empresarial_id);

    -- PLAN GRATUITO
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_gratuito_id, 'MAX_EMPRESAS', 'NUMERO', 1, NULL),
    (plan_gratuito_id, 'IA_ACCESO_LOCAL', 'BOOLEANO', NULL, TRUE),
    (plan_gratuito_id, 'IA_ACCESO_NUBE', 'BOOLEANO', NULL, FALSE);
    
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_documento, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_gratuito_id, 'MAX_FACTURAS_MENSUALES', '01', 'NUMERO', 30, NULL),
    (plan_gratuito_id, 'MAX_RETENCIONES_MENSUALES', '07', 'NUMERO', 20, NULL),
    (plan_gratuito_id, 'MAX_NOTAS_CREDITO_MENSUALES', '04', 'NUMERO', 10, NULL),
    (plan_gratuito_id, 'MAX_GUIAS_MENSUALES', '06', 'NUMERO', 10, NULL);

    -- PLAN PROFESIONAL
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_profesional_id, 'MAX_EMPRESAS', 'NUMERO', 5, NULL),
    (plan_profesional_id, 'IA_ACCESO_LOCAL', 'BOOLEANO', NULL, TRUE),
    (plan_profesional_id, 'IA_ACCESO_NUBE', 'BOOLEANO', NULL, TRUE);

    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_documento, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_profesional_id, 'MAX_FACTURAS_MENSUALES', '01', 'NUMERO', 500, NULL),
    (plan_profesional_id, 'MAX_RETENCIONES_MENSUALES', '07', 'NUMERO', 300, NULL),
    (plan_profesional_id, 'MAX_NOTAS_CREDITO_MENSUALES', '04', 'NUMERO', 100, NULL),
    (plan_profesional_id, 'MAX_GUIAS_MENSUALES', '06', 'NUMERO', 200, NULL);

    -- PLAN EMPRESARIAL
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_empresarial_id, 'MAX_EMPRESAS', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'IA_ACCESO_LOCAL', 'BOOLEANO', NULL, TRUE),
    (plan_empresarial_id, 'IA_ACCESO_NUBE', 'BOOLEANO', NULL, TRUE);

    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_documento, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_empresarial_id, 'MAX_FACTURAS_MENSUALES', '01', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'MAX_RETENCIONES_MENSUALES', '07', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'MAX_NOTAS_CREDITO_MENSUALES', '04', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'MAX_GUIAS_MENSUALES', '06', 'NUMERO', 999999, NULL);
    
END $$;
