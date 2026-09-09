-- 1. Modificar tabla de Permisos
ALTER TABLE seguridad.permisos ADD COLUMN IF NOT EXISTS codigo VARCHAR(100);
ALTER TABLE seguridad.permisos ADD COLUMN IF NOT EXISTS modulo VARCHAR(50);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permisos_codigo_key') THEN
        ALTER TABLE seguridad.permisos ADD CONSTRAINT permisos_codigo_key UNIQUE (codigo);
    END IF;
END $$;

-- 2. Asegurar que roles_permisos exista (ya existía según el usuario, pero aseguramos estructura)
CREATE TABLE IF NOT EXISTS seguridad.roles_permisos (
    rol_id UUID REFERENCES seguridad.roles(id) ON DELETE CASCADE,
    permiso_id UUID REFERENCES seguridad.permisos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (rol_id, permiso_id)
);

-- 3. Insertar Permisos (Upsert)
INSERT INTO seguridad.permisos (codigo, nombre, descripcion, modulo) VALUES
-- SEGURIDAD
('SEGURIDAD_USUARIOS_VER', 'Ver Usuarios', 'Permite listar y ver detalles de usuarios', 'SEGURIDAD'),
('SEGURIDAD_USUARIOS_CREAR', 'Crear Usuarios', 'Permite registrar nuevos usuarios', 'SEGURIDAD'),
('SEGURIDAD_USUARIOS_EDITAR', 'Editar Usuarios', 'Permite modificar usuarios existentes', 'SEGURIDAD'),
('SEGURIDAD_USUARIOS_ELIMINAR', 'Eliminar Usuarios', 'Permite eliminar/desactivar usuarios', 'SEGURIDAD'),
('SEGURIDAD_ROLES_VER', 'Ver Roles', 'Permite listar roles y permisos', 'SEGURIDAD'),
('SEGURIDAD_ROLES_CREAR', 'Crear Roles', 'Permite crear nuevos roles', 'SEGURIDAD'),
('SEGURIDAD_ROLES_EDITAR', 'Editar Roles', 'Permite modificar permisos de roles', 'SEGURIDAD'),
('SEGURIDAD_ROLES_ELIMINAR', 'Eliminar Roles', 'Permite eliminar roles', 'SEGURIDAD'),

-- CONFIGURACION
('CONFIGURACION_VER', 'Ver Configuración', 'Acceso al módulo de configuración', 'CONFIGURACION'),
('CONFIGURACION_EDITAR', 'Editar Configuración', 'Modificar parámetros del sistema', 'CONFIGURACION'),

-- CONTABILIDAD
('CONTABILIDAD_VER', 'Ver Contabilidad', 'Acceso al módulo contable', 'CONTABILIDAD'),
('CONTABILIDAD_ASIENTOS_CREAR', 'Crear Asientos', 'Permite registrar asientos manuales', 'CONTABILIDAD'),
('CONTABILIDAD_REPORTES_VER', 'Ver Reportes Contables', 'Acceso a Balances y Estado de Resultados', 'CONTABILIDAD'),

-- FACTURACION
('FACTURACION_VER', 'Ver Facturación', 'Acceso al módulo de facturación', 'FACTURACION'),
('FACTURACION_CREAR', 'Emitir Facturas', 'Permite crear y firmar facturas', 'FACTURACION'),
('FACTURACION_ANULAR', 'Anular Facturas', 'Permite anular comprobantes', 'FACTURACION'),

-- NOMINA
('NOMINA_VER', 'Ver Nómina', 'Acceso al módulo de nómina', 'NOMINA'),
('NOMINA_ROLES_GENERAR', 'Generar Roles', 'Permite generar roles de pago', 'NOMINA'),
('NOMINA_ROLES_PAGAR', 'Pagar Roles', 'Permite registrar pagos de nómina', 'NOMINA'),

-- INVENTARIO
('INVENTARIO_VER', 'Ver Inventario', 'Acceso al módulo de inventario', 'INVENTARIO'),
('INVENTARIO_MOVIMIENTOS_CREAR', 'Crear Movimientos', 'Permite registrar ingresos/egresos', 'INVENTARIO'),
('INVENTARIO_PRODUCTOS_EDITAR', 'Editar Productos', 'Permite modificar catálogo de productos', 'INVENTARIO')

ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    modulo = EXCLUDED.modulo;

-- 4. Asignar Permisos a Roles (Usando roles_permisos)
-- SUPERADMIN: Todos
WITH role_data AS (SELECT id FROM seguridad.roles WHERE nombre = 'SUPERADMIN'),
     perm_data AS (SELECT id FROM seguridad.permisos)
INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
SELECT role_data.id, perm_data.id FROM role_data, perm_data
ON CONFLICT DO NOTHING;

-- Borrar rol_permisos redundante si existe
DROP TABLE IF EXISTS seguridad.rol_permisos;
