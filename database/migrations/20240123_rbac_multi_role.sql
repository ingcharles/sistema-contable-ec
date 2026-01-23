-- 1. Crear Tablas de Seguridad si no existen
CREATE TABLE IF NOT EXISTS seguridad.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seguridad.usuarios_roles (
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES seguridad.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, rol_id)
);

-- 2. Crear Tablas de Menú
CREATE TABLE IF NOT EXISTS configuracion.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    path VARCHAR(200) NOT NULL,
    orden INT DEFAULT 0,
    plan_minimo VARCHAR(20) DEFAULT 'GRATUITO',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion.menu_item_roles (
    menu_item_id UUID NOT NULL REFERENCES configuracion.menu_items(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES seguridad.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_item_id, rol_id)
);

-- 3. Poblar Roles Estándar
INSERT INTO seguridad.roles (nombre) VALUES 
('SUPERADMIN'), ('ADMIN'), ('CONTADOR'), ('AUDITOR'), ('ASISTENTE')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Migrar roles de usuarios actuales (Single -> Many)
INSERT INTO seguridad.usuarios_roles (usuario_id, rol_id)
SELECT id, (SELECT id FROM seguridad.roles WHERE nombre = u.rol)
FROM seguridad.usuarios u
ON CONFLICT DO NOTHING;

-- 5. Insertar Menu Items y sus Permisos
DO $$ 
DECLARE 
    role_superadmin UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'SUPERADMIN');
    role_admin UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'ADMIN');
    role_contador UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'CONTADOR');
    role_auditor UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'AUDITOR');
    role_asistente UUID := (SELECT id FROM seguridad.roles WHERE nombre = 'ASISTENTE');
    item_id UUID;
BEGIN
    -- Limpiar items anteriores para evitar duplicados si se re-ejecuta
    DELETE FROM configuracion.menu_items;

    -- Dashboard
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Dashboard', 'LayoutDashboard', '/dashboard', 10, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_auditor), (item_id, role_asistente);

    -- Facturación
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Facturación', 'FileText', '/facturacion', 20, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_asistente);

    -- Compras
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Compras', 'ShoppingCart', '/compras', 30, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_asistente);

    -- Buzón XML
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Buzón XML', 'UploadCloud', '/buzon', 40, 'PROFESIONAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Terceros
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Terceros', 'Contact2', '/directorio', 50, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_asistente);

    -- Cartera
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Cartera', 'Wallet', '/cartera', 60, 'PROFESIONAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_asistente);

    -- Inventario
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Inventario', 'Package', '/inventario', 70, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_asistente);

    -- Activos Fijos
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Activos Fijos', 'Monitor', '/activos', 80, 'PROFESIONAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Caja Chica
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Caja Chica', 'Coins', '/caja-chica', 90, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador), (item_id, role_asistente);

    -- Bancos
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Bancos', 'Landmark', '/bancos', 100, 'PROFESIONAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Contabilidad
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Contabilidad', 'TrendingUp', '/contabilidad', 110, 'PROFESIONAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Impuestos
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Impuestos', 'PieChart', '/impuestos', 120, 'PROFESIONAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Nómina
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Nómina', 'Users', '/nomina', 130, 'EMPRESARIAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Reportes
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Reportes', 'FileBarChart', '/reportes', 140, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin), (item_id, role_contador);

    -- Auditoría
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Auditoría', 'ShieldAlert', '/auditoria', 150, 'EMPRESARIAL') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_auditor);

    -- Configuración
    INSERT INTO configuracion.menu_items (label, icon_name, path, orden, plan_minimo)
    VALUES ('Configuración', 'Settings', '/configuracion', 160, 'GRATUITO') RETURNING id INTO item_id;
    INSERT INTO configuracion.menu_item_roles (menu_item_id, rol_id) VALUES (item_id, role_superadmin), (item_id, role_admin);

END $$;
