-- ============================================================================
-- MIGRACIÓN: Estructura Organizacional RRHH
-- ============================================================================
-- Versión: 1.0
-- Descripción: Crea estructura organizacional completa con áreas, cargos y 
--              tipos de contrato por empresa, con permisos y menús
-- ============================================================================

-- 1. TIPOS DE CONTRATO POR EMPRESA
-- ============================================================================

-- Tabla de tipos de contrato (POR EMPRESA, no catálogo global)
CREATE TABLE IF NOT EXISTS nomina.tipos_contrato (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requiere_fecha_fin BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE nomina.tipos_contrato IS 'Tipos de contrato laboral configurables por empresa';
COMMENT ON COLUMN nomina.tipos_contrato.id IS 'Identificador único del tipo de contrato';
COMMENT ON COLUMN nomina.tipos_contrato.empresa_id IS 'Empresa propietaria del tipo de contrato';
COMMENT ON COLUMN nomina.tipos_contrato.codigo IS 'Código único del tipo (ej: INDEFINIDO, PLAZO_FIJO)';
COMMENT ON COLUMN nomina.tipos_contrato.nombre IS 'Nombre descriptivo del tipo de contrato';
COMMENT ON COLUMN nomina.tipos_contrato.descripcion IS 'Descripción detallada del tipo de contrato';
COMMENT ON COLUMN nomina.tipos_contrato.requiere_fecha_fin IS 'Si el contrato requiere fecha de finalización (plazo fijo, temporal, etc.)';
COMMENT ON COLUMN nomina.tipos_contrato.activo IS 'Estado del tipo de contrato';
COMMENT ON COLUMN nomina.tipos_contrato.created_at IS 'Fecha de creación';
COMMENT ON COLUMN nomina.tipos_contrato.updated_at IS 'Fecha de última actualización';

-- Seed inicial de tipos de contrato estándar para empresas existentes
INSERT INTO nomina.tipos_contrato (empresa_id, codigo, nombre, descripcion, requiere_fecha_fin, activo)
SELECT 
    e.id as empresa_id,
    tipo.codigo,
    tipo.nombre,
    tipo.descripcion,
    tipo.requiere_fecha_fin,
    true
FROM seguridad.empresas e
CROSS JOIN (VALUES
    ('INDEFINIDO', 'Contrato Indefinido', 'Contrato de trabajo por tiempo indefinido', false),
    ('PLAZO_FIJO', 'Contrato a Plazo Fijo', 'Contrato temporal con fecha de fin definida', true),
    ('EVENTUAL', 'Contrato Eventual', 'Para atender necesidades emergentes o extraordinarias', true),
    ('OCASIONAL', 'Contrato Ocasional', 'Trabajo ocasional no permanente', true),
    ('TEMPORAL', 'Contrato Temporal', 'Reemplazo temporal de personal', true),
    ('POR_OBRA', 'Contrato por Obra o Servicio', 'Contrato para ejecución de obra o servicio específico', false),
    ('PASANTIA', 'Pasantía', 'Prácticas pre-profesionales o pasantías', true)
) AS tipo(codigo, nombre, descripcion, requiere_fecha_fin)
ON CONFLICT (empresa_id, codigo) DO NOTHING;

-- 2. TABLAS DE ESTRUCTURA ORGANIZACIONAL
-- ============================================================================

-- Tabla de Áreas/Departamentos
CREATE TABLE IF NOT EXISTS nomina.areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    area_padre_id UUID REFERENCES nomina.areas(id),
    responsable_id UUID REFERENCES nomina.empleados(id),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE nomina.areas IS 'Áreas o departamentos organizacionales de la empresa';
COMMENT ON COLUMN nomina.areas.id IS 'Identificador único del área';
COMMENT ON COLUMN nomina.areas.empresa_id IS 'Empresa propietaria del área';
COMMENT ON COLUMN nomina.areas.codigo IS 'Código único del área (ej: CONT, RRHH, TI)';
COMMENT ON COLUMN nomina.areas.nombre IS 'Nombre del área o departamento';
COMMENT ON COLUMN nomina.areas.descripcion IS 'Descripción de las funciones del área';
COMMENT ON COLUMN nomina.areas.area_padre_id IS 'Permite jerarquía de áreas (ej: Auditoría Interna bajo Contabilidad)';
COMMENT ON COLUMN nomina.areas.responsable_id IS 'Empleado responsable o director del área';
COMMENT ON COLUMN nomina.areas.activa IS 'Estado del área';
COMMENT ON COLUMN nomina.areas.created_at IS 'Fecha de creación';
COMMENT ON COLUMN nomina.areas.updated_at IS 'Fecha de última actualización';

-- Tabla de Cargos/Posiciones
CREATE TABLE IF NOT EXISTS nomina.cargos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    area_id UUID REFERENCES nomina.areas(id),
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel_jerarquico INTEGER DEFAULT 1,
    sueldo_minimo NUMERIC(18,2),
    sueldo_maximo NUMERIC(18,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE nomina.cargos IS 'Cargos o posiciones laborales con rangos salariales';
COMMENT ON COLUMN nomina.cargos.id IS 'Identificador único del cargo';
COMMENT ON COLUMN nomina.cargos.empresa_id IS 'Empresa propietaria del cargo';
COMMENT ON COLUMN nomina.cargos.area_id IS 'Área a la que pertenece el cargo (opcional, puede ser global)';
COMMENT ON COLUMN nomina.cargos.codigo IS 'Código único del cargo (ej: CONT-GEN, ASIST-ADM)';
COMMENT ON COLUMN nomina.cargos.nombre IS 'Nombre del cargo o posición';
COMMENT ON COLUMN nomina.cargos.descripcion IS 'Descripción de funciones y responsabilidades';
COMMENT ON COLUMN nomina.cargos.nivel_jerarquico IS 'Nivel jerárquico: 1=Directivo, 2=Gerencial, 3=Supervisión, 4=Operativo';
COMMENT ON COLUMN nomina.cargos.sueldo_minimo IS 'Sueldo mínimo para el cargo';
COMMENT ON COLUMN nomina.cargos.sueldo_maximo IS 'Sueldo máximo para el cargo';
COMMENT ON COLUMN nomina.cargos.activo IS 'Estado del cargo';
COMMENT ON COLUMN nomina.cargos.created_at IS 'Fecha de creación';
COMMENT ON COLUMN nomina.cargos.updated_at IS 'Fecha de última actualización';

-- 3. ACTUALIZACIÓN DE TABLA EMPLEADOS
-- ============================================================================

ALTER TABLE nomina.empleados
    ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES nomina.areas(id),
    ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES nomina.cargos(id),
    ADD COLUMN IF NOT EXISTS tipo_contrato_id UUID REFERENCES nomina.tipos_contrato(id),
    ADD COLUMN IF NOT EXISTS banco VARCHAR(100),
    ADD COLUMN IF NOT EXISTS numero_cuenta VARCHAR(30);

COMMENT ON COLUMN nomina.empleados.area_id IS 'Área/departamento al que pertenece el empleado';
COMMENT ON COLUMN nomina.empleados.cargo_id IS 'Cargo/posición del empleado';
COMMENT ON COLUMN nomina.empleados.tipo_contrato_id IS 'Referencia a nomina.tipos_contrato (por empresa)';
COMMENT ON COLUMN nomina.empleados.banco IS 'Institución financiera para pago de nómina';
COMMENT ON COLUMN nomina.empleados.numero_cuenta IS 'Número de cuenta bancaria del empleado';

-- 4. MIGRACIÓN DE DATOS EXISTENTES
-- ============================================================================

-- Crear área genérica "Sin Clasificar" para empleados sin clasificar
DO $$
DECLARE
    v_empresa_id UUID;
    v_area_id UUID;
BEGIN
    FOR v_empresa_id IN SELECT DISTINCT empresa_id FROM nomina.empleados
    LOOP
        INSERT INTO nomina.areas (empresa_id, codigo, nombre, descripcion, activa)
        VALUES (v_empresa_id, 'SIN-CLASIFICAR', 'Sin Clasificar', 'Área temporal para migración de datos. Reasignar empleados a áreas apropiadas.', true)
        ON CONFLICT (empresa_id, codigo) DO NOTHING
        RETURNING id INTO v_area_id;
        
        -- Si ya existía, obtener el ID
        IF v_area_id IS NULL THEN
            SELECT id INTO v_area_id FROM nomina.areas 
            WHERE empresa_id = v_empresa_id AND codigo = 'SIN-CLASIFICAR';
        END IF;
        
        -- Asignar empleados sin área al área genérica
        UPDATE nomina.empleados 
        SET area_id = v_area_id 
        WHERE empresa_id = v_empresa_id AND area_id IS NULL;
    END LOOP;
END $$;

-- 5. PERMISOS DE SEGURIDAD
-- ============================================================================

-- Insertar permisos para módulo RRHH
INSERT INTO seguridad.permisos (codigo, nombre, descripcion, modulo) VALUES
-- Empleados
('RRHH_EMPLEADOS_VER', 'Ver Empleados', 'Permite acceder al listado de empleados', 'RRHH'),
('RRHH_EMPLEADOS_CREAR', 'Crear Empleados', 'Permite registrar nuevos empleados', 'RRHH'),
('RRHH_EMPLEADOS_EDITAR', 'Editar Empleados', 'Permite modificar datos de empleados', 'RRHH'),
('RRHH_EMPLEADOS_ELIMINAR', 'Eliminar Empleados', 'Permite eliminar/desactivar empleados', 'RRHH'),
-- Configuración Organizacional
('RRHH_CONFIG_VER', 'Ver Configuración RRHH', 'Acceder a configuración de áreas, cargos y contratos', 'RRHH'),
('RRHH_AREAS_GESTIONAR', 'Gestionar Áreas', 'Crear, editar y eliminar áreas organizacionales', 'RRHH'),
('RRHH_CARGOS_GESTIONAR', 'Gestionar Cargos', 'Crear, editar y eliminar cargos/posiciones', 'RRHH'),
('RRHH_CONTRATOS_GESTIONAR', 'Gestionar Tipos de Contrato', 'Administrar tipos de contrato de la empresa', 'RRHH')
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    modulo = EXCLUDED.modulo;

-- Asignar permisos al rol SUPERADMIN
WITH role_data AS (SELECT id FROM seguridad.roles WHERE nombre = 'SUPERADMIN'),
     perm_data AS (SELECT id FROM seguridad.permisos WHERE modulo = 'RRHH')
INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
SELECT role_data.id, perm_data.id FROM role_data, perm_data
ON CONFLICT DO NOTHING;

-- Asignar permisos a todos los planes
INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
SELECT p.id, per.id
FROM seguridad.planes p
CROSS JOIN seguridad.permisos per
WHERE per.modulo = 'RRHH'
ON CONFLICT DO NOTHING;

-- 6. MENÚ DE NAVEGACIÓN
-- ============================================================================

-- Crear menús de RRHH con estructura completa
DO $$
DECLARE
    v_rrhh_menu_id UUID;
    v_config_menu_id UUID;
    v_perm_empleados_ver UUID;
    v_perm_config UUID;
    v_perm_areas UUID;
    v_perm_cargos UUID;
    v_perm_contratos UUID;
BEGIN
    -- Obtener IDs de permisos
    SELECT id INTO v_perm_empleados_ver FROM seguridad.permisos WHERE codigo = 'RRHH_EMPLEADOS_VER';
    SELECT id INTO v_perm_config FROM seguridad.permisos WHERE codigo = 'RRHH_CONFIG_VER';
    SELECT id INTO v_perm_areas FROM seguridad.permisos WHERE codigo = 'RRHH_AREAS_GESTIONAR';
    SELECT id INTO v_perm_cargos FROM seguridad.permisos WHERE codigo = 'RRHH_CARGOS_GESTIONAR';
    SELECT id INTO v_perm_contratos FROM seguridad.permisos WHERE codigo = 'RRHH_CONTRATOS_GESTIONAR';
    
    -- Menú principal RRHH
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id, activo)
    VALUES ('RRHH', 'Users', '/rrhh', 40, v_perm_empleados_ver, true)
    ON CONFLICT (ruta) DO UPDATE SET etiqueta = EXCLUDED.etiqueta, icono = EXCLUDED.icono, permiso_id = EXCLUDED.permiso_id
    RETURNING id INTO v_rrhh_menu_id;
    
    -- Si ya existía, obtener el ID
    IF v_rrhh_menu_id IS NULL THEN
        SELECT id INTO v_rrhh_menu_id FROM configuracion.menu_items WHERE ruta = '/rrhh';
    END IF;
    
    -- Submenús principales
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id, activo) VALUES
    (v_rrhh_menu_id, 'Empleados', 'UserCircle', '/rrhh/empleados', 1, v_perm_empleados_ver, true),
    (v_rrhh_menu_id, 'Configuración', 'Settings', '/rrhh/configuracion', 10, v_perm_config, true)
    ON CONFLICT (ruta) DO UPDATE SET 
        etiqueta = EXCLUDED.etiqueta, 
        icono = EXCLUDED.icono, 
        padre_id = EXCLUDED.padre_id,
        permiso_id = EXCLUDED.permiso_id
    RETURNING id INTO v_config_menu_id;
    
    -- Si Configuración ya existía, obtener el ID
    IF v_config_menu_id IS NULL THEN
        SELECT id INTO v_config_menu_id FROM configuracion.menu_items WHERE ruta = '/rrhh/configuracion';
    END IF;
    
    -- Submenús de Configuración RRHH
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id, activo) VALUES
    (v_config_menu_id, 'Áreas', 'Building2', '/rrhh/configuracion/areas', 1, v_perm_areas, true),
    (v_config_menu_id, 'Cargos', 'Briefcase', '/rrhh/configuracion/cargos', 2, v_perm_cargos, true),
    (v_config_menu_id, 'Tipos de Contrato', 'FileText', '/rrhh/configuracion/contratos', 3, v_perm_contratos, true)
    ON CONFLICT (ruta) DO UPDATE SET 
        etiqueta = EXCLUDED.etiqueta, 
        icono = EXCLUDED.icono, 
        padre_id = EXCLUDED.padre_id,
        permiso_id = EXCLUDED.permiso_id;
END $$;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
