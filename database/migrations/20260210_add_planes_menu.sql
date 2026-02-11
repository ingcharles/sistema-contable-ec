-- -- Migración para habilitar el módulo de Planes en el Menú y Permisos
-- DO $$ 
-- DECLARE 
--     perm_id UUID;
--     sistema_padre_id UUID := '6dc40c52-676b-4a2a-a868-cd7bb7b6c1a7';
-- BEGIN 
--     -- 1. Insertar Permiso si no existe
--     INSERT INTO seguridad.permisos (codigo, nombre, descripcion, modulo)
--     VALUES ('SEGURIDAD_PLANES', 'Gestionar Planes', 'Permite crear, editar y eliminar planes comerciales y sus límites.', 'SISTEMA')
--     ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre
--     RETURNING id INTO perm_id;

--     -- 2. Asignar al Rol SUPERADMIN
--     INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
--     SELECT id, perm_id FROM seguridad.roles WHERE nombre = 'SUPERADMIN'
--     ON CONFLICT DO NOTHING;

--     -- 3. Asignar a todos los planes existentes
--     INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
--     SELECT id, perm_id FROM seguridad.planes
--     ON CONFLICT DO NOTHING;

--     -- 4. Insertar Item de Menú
--     INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id, activo)
--     VALUES (sistema_padre_id, 'Planes y Límites', 'Package', '/configuracion/planes', 35, perm_id, true)
--     ON CONFLICT (ruta) DO UPDATE SET etiqueta = EXCLUDED.etiqueta, icono = EXCLUDED.icono, permiso_id = EXCLUDED.permiso_id;

-- END $$;



-- -- Migración para habilitar el módulo de Planes en el Menú y Permisos
-- DO $$ 
-- DECLARE 
--     perm_id UUID;
--     sistema_padre_id UUID := '6dc40c52-676b-4a2a-a868-cd7bb7b6c1a7';
-- BEGIN 
--     -- 1. Insertar Permiso si no existe
--     INSERT INTO seguridad.permisos (codigo, nombre, descripcion, modulo)
--     VALUES ('SEGURIDAD_PLANES', 'Gestionar Planes', 'Permite crear, editar y eliminar planes comerciales y sus límites.', 'SISTEMA')
--     ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre
--     RETURNING id INTO perm_id;

--     -- 2. Asignar al Rol SUPERADMIN
--     INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
--     SELECT id, '8ebfa5d9-02d0-4736-9293-b2f52ded3e79' FROM seguridad.roles WHERE nombre = 'SUPERADMIN'
--     ON CONFLICT DO NOTHING;

--     -- 3. Asignar a todos los planes existentes
--     INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
--     SELECT id, '8ebfa5d9-02d0-4736-9293-b2f52ded3e79' FROM seguridad.planes
--     ON CONFLICT DO NOTHING;

--     -- 4. Insertar Item de Menú
--     INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id, activo)
--     VALUES ('Planes y Límites', 'Package', '/configuracion/planes', 35, '8ebfa5d9-02d0-4736-9293-b2f52ded3e79', true)
--     ON CONFLICT (ruta) DO UPDATE SET etiqueta = EXCLUDED.etiqueta, icono = EXCLUDED.icono, permiso_id = EXCLUDED.permiso_id;

-- END $$;

SELECT * FROM seguridad.permisos where CODIGO = 'SEGURIDAD_PLANES'-- Migración para habilitar el módulo de Planes en el Menú y Permisos
DO $$ 
DECLARE 
    perm_id UUID;
    sistema_padre_id UUID := '6dc40c52-676b-4a2a-a868-cd7bb7b6c1a7';
BEGIN 
    -- 1. Insertar Permiso si no existe
    INSERT INTO seguridad.permisos (codigo, nombre, descripcion, modulo)
    VALUES ('SEGURIDAD_PLANES', 'Gestionar Planes', 'Permite crear, editar y eliminar planes comerciales y sus límites.', 'SISTEMA')
    ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre
    RETURNING id INTO perm_id;

    -- 2. Asignar al Rol SUPERADMIN
    INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
    SELECT id, '8ebfa5d9-02d0-4736-9293-b2f52ded3e79' FROM seguridad.roles WHERE nombre = 'SUPERADMIN'
    ON CONFLICT DO NOTHING;

    -- 3. Asignar a todos los planes existentes
    INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
    SELECT id, '8ebfa5d9-02d0-4736-9293-b2f52ded3e79' FROM seguridad.planes
    ON CONFLICT DO NOTHING;

    -- 4. Insertar Item de Menú
    INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, permiso_id, activo)
    VALUES ('Planes y Límites', 'Package', '/configuracion/planes', 35, '8ebfa5d9-02d0-4736-9293-b2f52ded3e79', true)
    ON CONFLICT (ruta) DO UPDATE SET etiqueta = EXCLUDED.etiqueta, icono = EXCLUDED.icono, permiso_id = EXCLUDED.permiso_id;

END $$;

SELECT * FROM seguridad.permisos where CODIGO = 'SEGURIDAD_PLANES'