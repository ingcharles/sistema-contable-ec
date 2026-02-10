
DO $$
DECLARE
    role_id UUID;
    parent_id UUID;
    perm_id_ver UUID;
BEGIN
    -- 1. Insertar Permisos de Planes
    INSERT INTO seguridad.permisos (codigo, nombre, descripcion, modulo) VALUES
    ('SEGURIDAD_PLANES_VER', 'Ver Planes', 'Permite listar planes de suscripción', 'SEGURIDAD'),
    ('SEGURIDAD_PLANES_CREAR', 'Crear Planes', 'Permite crear nuevos planes', 'SEGURIDAD'),
    ('SEGURIDAD_PLANES_EDITAR', 'Editar Planes', 'Permite modificar planes', 'SEGURIDAD'),
    ('SEGURIDAD_PLANES_ELIMINAR', 'Eliminar Planes', 'Permite eliminar planes', 'SEGURIDAD')
    ON CONFLICT (codigo) DO NOTHING;

    -- 2. Asignar Permisos a SUPERADMIN
    SELECT id INTO role_id FROM seguridad.roles WHERE nombre = 'SUPERADMIN' LIMIT 1;
    
    IF role_id IS NOT NULL THEN
        INSERT INTO seguridad.roles_permisos (rol_id, permiso_id)
        SELECT role_id, id FROM seguridad.permisos WHERE codigo LIKE 'SEGURIDAD_PLANES_%'
        ON CONFLICT DO NOTHING;
    END IF;

    -- 3. Crear Menu Item
    SELECT id INTO parent_id FROM configuracion.menu_items WHERE etiqueta = 'Seguridad' LIMIT 1;
    SELECT id INTO perm_id_ver FROM seguridad.permisos WHERE codigo = 'SEGURIDAD_PLANES_VER' LIMIT 1;

    IF parent_id IS NOT NULL AND perm_id_ver IS NOT NULL THEN
        INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, padre_id, permiso_id)
        VALUES ('Planes', 'CreditCard', '/seguridad/planes', 3, parent_id, perm_id_ver)
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4. Asignar Permisos a TODOS los Planes (Para que el filtro de plan lo permita)
    INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
    SELECT p.id, per.id 
    FROM seguridad.planes p, seguridad.permisos per
    WHERE per.codigo LIKE 'SEGURIDAD_PLANES_%'
    ON CONFLICT DO NOTHING;

END $$;
