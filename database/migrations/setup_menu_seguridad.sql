-- 1. Insertar Menu Items
WITH seguridad_perm AS (SELECT id FROM seguridad.permisos WHERE codigo = 'SEGURIDAD_ROLES_VER' LIMIT 1),
     usuarios_perm AS (SELECT id FROM seguridad.permisos WHERE codigo = 'SEGURIDAD_USUARIOS_VER' LIMIT 1),
     roles_perm AS (SELECT id FROM seguridad.permisos WHERE codigo = 'SEGURIDAD_ROLES_VER' LIMIT 1)
INSERT INTO configuracion.menu_items (etiqueta, icono, ruta, orden, padre_id, permiso_id)
VALUES
('Seguridad', 'Shield', '/seguridad', 90, NULL, (SELECT id FROM seguridad_perm)),
('Roles', 'ShieldCheck', '/seguridad/roles', 1, (SELECT id FROM configuracion.menu_items WHERE etiqueta = 'Seguridad' LIMIT 1), (SELECT id FROM roles_perm)),
('Usuarios', 'Users', '/seguridad/usuarios', 2, (SELECT id FROM configuracion.menu_items WHERE etiqueta = 'Seguridad' LIMIT 1), (SELECT id FROM usuarios_perm))
ON CONFLICT DO NOTHING;

-- 2. Asignar Permisos a Planes (Todos los planes tienen acceso a Seguridad por defecto en este refactor)
INSERT INTO seguridad.planes_permisos (plan_id, permiso_id)
SELECT p.id, per.id
FROM seguridad.planes p
CROSS JOIN seguridad.permisos per
WHERE per.codigo IN ('SEGURIDAD_USUARIOS_VER', 'SEGURIDAD_ROLES_VER', 'SEGURIDAD_USUARIOS_CREAR', 'SEGURIDAD_USUARIOS_EDITAR', 'SEGURIDAD_USUARIOS_ELIMINAR', 'SEGURIDAD_ROLES_CREAR', 'SEGURIDAD_ROLES_EDITAR', 'SEGURIDAD_ROLES_ELIMINAR')
ON CONFLICT DO NOTHING;
