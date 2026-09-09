-- ============================================================================
-- MIGRATION: RBAC & USER-CENTRIC PLANS REFACTOR (Fully Documented)
-- ============================================================================

-- 0. Ensure Plans Table Structure (User Alignment)
-- Validar que la tabla planes tenga la columna precio_mensual
CREATE TABLE IF NOT EXISTS seguridad.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    precio_mensual DECIMAL(10, 2) NOT NULL DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
    -- Si existe la columna antigua 'precio', renombrarla a 'precio_mensual'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'seguridad' AND table_name = 'planes' AND column_name = 'precio') THEN
        ALTER TABLE seguridad.planes RENAME COLUMN precio TO precio_mensual;
    END IF;
END $$;

COMMENT ON TABLE seguridad.planes IS 'Catálogo de planes de suscripción disponibles en el sistema.';

-- 1. Create Permissions Table
-- Catalogo de capacidades del sistema (granular)
CREATE TABLE IF NOT EXISTS seguridad.permisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguridad.permisos IS 'Catálogo maestro de todos los permisos y capacidades funcionales del sistema.';
COMMENT ON COLUMN seguridad.permisos.id IS 'Identificador único del permiso.';
COMMENT ON COLUMN seguridad.permisos.codigo IS 'Código único para validación en backend/frontend (ej: VER_VENTAS).';
COMMENT ON COLUMN seguridad.permisos.nombre IS 'Nombre legible del permiso para mostrar en UI.';
COMMENT ON COLUMN seguridad.permisos.descripcion IS 'Descripción detallada de qué funcionalidades habilita este permiso.';
COMMENT ON COLUMN seguridad.permisos.created_at IS 'Fecha de creación del registro.';

-- 2. Re-Create Menu Items Table (Spanish Columns)
-- Estructura jerárquica del menú de navegación
DROP TABLE IF EXISTS configuracion.menu_items CASCADE;
CREATE TABLE configuracion.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    padre_id UUID REFERENCES configuracion.menu_items(id) ON DELETE CASCADE,
    etiqueta VARCHAR(100) NOT NULL,
    icono VARCHAR(50) NOT NULL,
    ruta VARCHAR(200) NOT NULL,
    orden INT DEFAULT 0,
    permiso_id UUID REFERENCES seguridad.permisos(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE configuracion.menu_items IS 'Definición jerárquica de las opciones del menú de navegación del sistema.';
COMMENT ON COLUMN configuracion.menu_items.id IS 'Identificador único del ítem de menú.';
COMMENT ON COLUMN configuracion.menu_items.padre_id IS 'Referencia al menú padre. NULL indica que es un menú raíz (Primer Nivel).';
COMMENT ON COLUMN configuracion.menu_items.etiqueta IS 'Texto visible del menú en la interfaz (Label).';
COMMENT ON COLUMN configuracion.menu_items.icono IS 'Nombre del icono (Lucide React) o referencia al asset visual.';
COMMENT ON COLUMN configuracion.menu_items.ruta IS 'Ruta de navegación (URL) a la que dirige este menú.';
COMMENT ON COLUMN configuracion.menu_items.orden IS 'Número para ordenar los ítems visualmente de menor a mayor.';
COMMENT ON COLUMN configuracion.menu_items.permiso_id IS 'Permiso requerido para ver este menú. Si es NULL, es público (o manejo inusual).';
COMMENT ON COLUMN configuracion.menu_items.activo IS 'Indica si el menú está visible/habilitado geberalmente.';

-- 3. Create Roles-Permissions (Many-to-Many)
-- Asignación de permisos a roles
CREATE TABLE IF NOT EXISTS seguridad.roles_permisos (
    rol_id UUID NOT NULL REFERENCES seguridad.roles(id) ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES seguridad.permisos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (rol_id, permiso_id)
);

COMMENT ON TABLE seguridad.roles_permisos IS 'Tabla intermedia que define qué permisos tiene asignado cada rol.';
COMMENT ON COLUMN seguridad.roles_permisos.rol_id IS 'Referencia al rol.';
COMMENT ON COLUMN seguridad.roles_permisos.permiso_id IS 'Referencia al permiso otorgado.';

-- 4. Create Plans-Permissions (Many-to-Many)
-- Asignación de permisos a planes (Feature Gating)
CREATE TABLE IF NOT EXISTS seguridad.planes_permisos (
    plan_id UUID NOT NULL REFERENCES seguridad.planes(id) ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES seguridad.permisos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (plan_id, permiso_id)
);

COMMENT ON TABLE seguridad.planes_permisos IS 'Tabla intermedia que define qué características (permisos) incluye cada plan de suscripción.';
COMMENT ON COLUMN seguridad.planes_permisos.plan_id IS 'Referencia al plan de suscripción.';
COMMENT ON COLUMN seguridad.planes_permisos.permiso_id IS 'Referencia al permiso/feature incluido en el plan.';

-- 5. Modify Users Table (User-Centric Plan + Remove Redundant Role)
-- Actualización del usuario para vincularlo directamente a un plan
ALTER TABLE seguridad.usuarios ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES seguridad.planes(id);
ALTER TABLE seguridad.usuarios DROP COLUMN IF EXISTS rol;

COMMENT ON COLUMN seguridad.usuarios.plan_id IS 'Plan de suscripción actual asignado directamente al usuario (Dueño de cuenta).';

-- 6. Remove Redundant Tables
DROP TABLE IF EXISTS configuracion.menu_item_roles;

-- 7. Audit Triggers
-- Triggers para mantener auditoría de cambios en seguridad
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger_function') THEN
        CREATE TRIGGER audit_permisos AFTER INSERT OR UPDATE OR DELETE ON seguridad.permisos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        CREATE TRIGGER audit_roles_permisos AFTER INSERT OR UPDATE OR DELETE ON seguridad.roles_permisos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        CREATE TRIGGER audit_planes_permisos AFTER INSERT OR UPDATE OR DELETE ON seguridad.planes_permisos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
        
        COMMENT ON TRIGGER audit_permisos ON seguridad.permisos IS 'Registra cambios en la tabla de permisos para auditoría.';
        COMMENT ON TRIGGER audit_roles_permisos ON seguridad.roles_permisos IS 'Registra cambios en asignación de permisos a roles.';
        COMMENT ON TRIGGER audit_planes_permisos ON seguridad.planes_permisos IS 'Registra cambios en asignación de permisos a planes.';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
