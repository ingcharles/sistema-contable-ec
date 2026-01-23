-- ============================================================================
-- SCRIPT UNIFICADO: CONFIGURACIÓN DE PLANES Y CUOTAS (TODO EN ESPAÑOL)
-- ============================================================================

-- 1. Crear catálogo de tipos de comprobante (Nombres legibles)
CREATE TABLE IF NOT EXISTS facturacion.tipos_comprobante (
    codigo tipo_comprobante_sri PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- Seed de tipos de comprobante
INSERT INTO facturacion.tipos_comprobante (codigo, nombre) VALUES
('01', 'Facturas'),
('03', 'Liquidaciones de Compra'),
('04', 'Notas de Crédito'),
('05', 'Notas de Débito'),
('06', 'Guías de Remisión'),
('07', 'Retenciones')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre;


-- 2. Crear tabla de Planes en esquema SEGURIDAD
CREATE TABLE IF NOT EXISTS seguridad.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio_mensual DECIMAL(10, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- 3. Crear tabla de Características del Plan (Con soporte para tipos de documento)
CREATE TABLE IF NOT EXISTS seguridad.plan_caracteristicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES seguridad.planes(id) ON DELETE CASCADE,
    clave_caracteristica VARCHAR(50) NOT NULL,
    tipo_documento tipo_comprobante_sri, -- Vinculación opcional a tipo de documento
    tipo_valor VARCHAR(20) NOT NULL CHECK (tipo_valor IN ('NUMERO', 'BOOLEANO')),
    valor_numero INT,
    valor_booleano BOOLEAN,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índice único parcial: Un plan no puede tener dos reglas para el mismo tipo de documento
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_caracteristica_tipo_doc 
    ON seguridad.plan_caracteristicas(plan_id, tipo_documento) 
    WHERE tipo_documento IS NOT NULL;


-- 4. Crear tabla de estadísticas de uso por usuario
CREATE TABLE IF NOT EXISTS seguridad.usuario_estadisticas_uso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    tipo_documento tipo_comprobante_sri NOT NULL,
    cantidad INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, periodo, tipo_documento)
);

CREATE INDEX IF NOT EXISTS idx_estadisticas_uso_usuario_periodo 
    ON seguridad.usuario_estadisticas_uso(usuario_id, periodo);


-- 5. Actualizar tabla de Usuarios (Columnas de suscripción)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'plan_id') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN plan_id UUID REFERENCES seguridad.planes(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'estado_plan') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN estado_plan VARCHAR(20) DEFAULT 'ACTIVO';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'fecha_inicio_plan') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN fecha_inicio_plan TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'usuarios' AND column_name = 'fecha_fin_plan') THEN
        ALTER TABLE seguridad.usuarios ADD COLUMN fecha_fin_plan TIMESTAMP;
    END IF;
END $$;


-- 6. Seed Data: Planes e Inserción de Características
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

    -- ========================================================================
    -- PLAN GRATUITO
    -- ========================================================================
    -- Generales
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_gratuito_id, 'MAX_EMPRESAS', 'NUMERO', 1, NULL),
    (plan_gratuito_id, 'IA_ACCESO_LOCAL', 'BOOLEANO', NULL, TRUE),
    (plan_gratuito_id, 'IA_ACCESO_NUBE', 'BOOLEANO', NULL, FALSE);
    
    -- Límites por Documento (Vinculados a tipo_documento)
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_documento, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_gratuito_id, 'MAX_FACTURAS_MENSUALES', '01', 'NUMERO', 30, NULL),
    (plan_gratuito_id, 'MAX_RETENCIONES_MENSUALES', '07', 'NUMERO', 20, NULL),
    (plan_gratuito_id, 'MAX_NOTAS_CREDITO_MENSUALES', '04', 'NUMERO', 10, NULL),
    (plan_gratuito_id, 'MAX_GUIAS_MENSUALES', '06', 'NUMERO', 10, NULL);


    -- ========================================================================
    -- PLAN PROFESIONAL
    -- ========================================================================
    -- Generales
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_profesional_id, 'MAX_EMPRESAS', 'NUMERO', 5, NULL),
    (plan_profesional_id, 'IA_ACCESO_LOCAL', 'BOOLEANO', NULL, TRUE),
    (plan_profesional_id, 'IA_ACCESO_NUBE', 'BOOLEANO', NULL, TRUE);

    -- Límites por Documento
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_documento, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_profesional_id, 'MAX_FACTURAS_MENSUALES', '01', 'NUMERO', 500, NULL),
    (plan_profesional_id, 'MAX_RETENCIONES_MENSUALES', '07', 'NUMERO', 300, NULL),
    (plan_profesional_id, 'MAX_NOTAS_CREDITO_MENSUALES', '04', 'NUMERO', 100, NULL),
    (plan_profesional_id, 'MAX_GUIAS_MENSUALES', '06', 'NUMERO', 200, NULL);


    -- ========================================================================
    -- PLAN EMPRESARIAL (Ilimitado = 999999)
    -- ========================================================================
    -- Generales
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_empresarial_id, 'MAX_EMPRESAS', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'IA_ACCESO_LOCAL', 'BOOLEANO', NULL, TRUE),
    (plan_empresarial_id, 'IA_ACCESO_NUBE', 'BOOLEANO', NULL, TRUE);

    -- Límites por Documento
    INSERT INTO seguridad.plan_caracteristicas (plan_id, clave_caracteristica, tipo_documento, tipo_valor, valor_numero, valor_booleano) VALUES
    (plan_empresarial_id, 'MAX_FACTURAS_MENSUALES', '01', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'MAX_RETENCIONES_MENSUALES', '07', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'MAX_NOTAS_CREDITO_MENSUALES', '04', 'NUMERO', 999999, NULL),
    (plan_empresarial_id, 'MAX_GUIAS_MENSUALES', '06', 'NUMERO', 999999, NULL);
    
END $$;
