-- ============================================================================
-- MIGRACIÓN: ACTUALIZACIÓN DE RUTAS DE MENÚ (FASE 3 REFACTORING)
-- ============================================================================

DO $$
DECLARE
    -- IDs de menus padres para busqueda
    g_rrhh UUID;
    sg_rrhh_empleados UUID;
    sg_rrhh_nomina UUID;
    sg_rrhh_prestamos UUID;
    sg_rrhh_beneficios UUID;
    sg_rrhh_asistencia UUID;
    sg_rrhh_vacaciones UUID;
    sg_rrhh_liquidaciones UUID;

    g_comercial UUID;
    sg_inventario UUID;
    sg_cartera UUID;
    sg_cajachica UUID;
BEGIN
    -- 1. RRHH: Actualizar rutas para apuntar a las paginas principales de cada submodulo
    -- En vez de /ficha, /contratos, etc, apuntamos a la raiz del submodulo que hemos creado
    
    UPDATE configuracion.menu_items SET ruta = '/rrhh/empleados' WHERE ruta = '/rrhh/empleados/ficha';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/nomina' WHERE ruta = '/rrhh/nomina/roles';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/prestamos' WHERE ruta = '/rrhh/prestamos/anticipos';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/beneficios' WHERE ruta = '/rrhh/beneficios/decimos';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/asistencia' WHERE ruta = '/rrhh/asistencia/horas-extras';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/vacaciones' WHERE ruta = '/rrhh/vacaciones/solicitudes';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/liquidaciones' WHERE ruta = '/rrhh/liquidaciones/actas';

    -- Ocultar items secundarios de RRHH que ahora estan integrados en la pagina principal
    -- (Opcional: podriamos borrarlos, pero por ahora los dejamos visibles o los redirigimos a la misma)
    -- Para simplificar, vamos a hacer que TODOS los subitems apunten a la pagina principal
    UPDATE configuracion.menu_items SET ruta = '/rrhh/empleados' WHERE ruta = '/rrhh/empleados/contratos';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/prestamos' WHERE ruta = '/rrhh/prestamos/prestamos';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/beneficios' WHERE ruta LIKE '/rrhh/beneficios/%';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/asistencia' WHERE ruta LIKE '/rrhh/asistencia/%';
    UPDATE configuracion.menu_items SET ruta = '/rrhh/vacaciones' WHERE ruta LIKE '/rrhh/vacaciones/%';

    -- 2. INVENTARIO
    -- Kardex ahora es /inventario/kardex
    UPDATE configuracion.menu_items SET ruta = '/inventario/kardex' WHERE ruta = '/inventario';
    
    -- 3. CARTERA
    -- CXC -> Clientes, CXP -> Proveedores
    --UPDATE configuracion.menu_items SET ruta = '/cartera/clientes' WHERE ruta = '/cartera/cxc';
    --UPDATE configuracion.menu_items SET ruta = '/cartera/proveedores' WHERE ruta = '/cartera/cxp';
    
    -- Agregar Anticipos si no existe (Necesitariamos el ID del padre sg_cartera)
    SELECT id INTO sg_cartera FROM configuracion.menu_items WHERE etiqueta = 'Cartera' AND ruta = '#';
    
    IF sg_cartera IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM configuracion.menu_items WHERE ruta = '/cartera/anticipos') THEN
             INSERT INTO configuracion.menu_items (padre_id, etiqueta, icono, ruta, orden, permiso_id)
             VALUES (sg_cartera, 'Anticipos', 'Coins', '/cartera/anticipos', 30, (SELECT id FROM seguridad.permisos WHERE codigo = 'VER_CARTERA'));
        END IF;
    END IF;

    -- 4. CAJA CHICA
    -- Redirigir todos a /caja-chica/vales
    UPDATE configuracion.menu_items SET ruta = '/caja-chica/vales', etiqueta = 'Vales y Caja' WHERE ruta = '/caja-chica/mis-cajas';
    -- Eliminar items sobrantes para limpieza visual (Gastos, Reposiciones) ya que todo esta en Vales
    DELETE FROM configuracion.menu_items WHERE ruta IN ('/caja-chica/gastos', '/caja-chica/reposiciones');

END $$;
