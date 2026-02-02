-- Update Configuration Menu Items to point to new submodule routes

DO $$
DECLARE
    sg_config UUID;
    sg_factel UUID;
    g_sistema UUID;
BEGIN
    -- Get parents
    SELECT id INTO g_sistema FROM configuracion.menu_items WHERE etiqueta = 'Sistema' AND padre_id IS NULL;
    SELECT id INTO sg_config FROM configuracion.menu_items WHERE etiqueta = 'Configuración' AND padre_id = g_sistema;
    SELECT id INTO sg_factel FROM configuracion.menu_items WHERE etiqueta = 'Fact. Electrónica' AND padre_id = g_sistema;

    -- Update existing items under Configuración
    UPDATE configuracion.menu_items 
    SET ruta = '/configuracion/empresa', icono = 'Building2'
    WHERE etiqueta = 'Empresa' AND padre_id = sg_config;

    UPDATE configuracion.menu_items 
    SET ruta = '/configuracion/sucursales', icono = 'Database'
    WHERE etiqueta = 'Sucursales' AND padre_id = sg_config;

    UPDATE configuracion.menu_items 
    SET ruta = '/configuracion/puntos-emision', icono = 'Monitor'
    WHERE etiqueta = 'Puntos Emisión' AND padre_id = sg_config;

    UPDATE configuracion.menu_items 
    SET ruta = '/configuracion/parametros', icono = 'Settings'
    WHERE etiqueta = 'Parámetros' AND padre_id = sg_config;

    -- Update existing items under Fact. Electrónica
    UPDATE configuracion.menu_items 
    SET ruta = '/configuracion/firma-electronica', icono = 'Shield'
    WHERE etiqueta = 'Firma Electrónica' AND padre_id = sg_factel;

    -- Add missing items under Configuración
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES 
    (sg_config, 'Impuestos', 'CheckCircle2', '/configuracion/impuestos', 45, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG')),
    (sg_config, 'Cierre de Periodos', 'CalendarOff', '/configuracion/cierre-periodos', 50, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_CONFIG'))
    ON CONFLICT (etiqueta, padre_id) DO UPDATE SET ruta = EXCLUDED.ruta, icono = EXCLUDED.icono;

    -- Update Usuarios under Seguridad if needed, but it's better to keep it there.
    -- However, the user had it in the tabs. Let's add it to Configuración as well if they want it there.
    INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
    VALUES 
    (sg_config, 'Usuarios y Roles', 'Users', '/configuracion/usuarios', 15, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_SYS_SEGURIDAD'))
    ON CONFLICT (etiqueta, padre_id) DO UPDATE SET ruta = EXCLUDED.ruta, icono = EXCLUDED.icono;

END $$;
