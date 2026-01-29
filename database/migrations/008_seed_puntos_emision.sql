-- ============================================================================
-- DATOS DE PRUEBA: Sistema de Puntos de Emisión
-- ============================================================================
-- Descripción: Carga datos de ejemplo para el sistema de puntos de emisión
--              Incluye asignaciones de usuarios a puntos para testing
-- ============================================================================

-- ============================================================================
-- ASIGNACIONES DE PUNTOS DE EMISIÓN A USUARIOS
-- ============================================================================
-- Escenarios de prueba:
--   1. Usuario con un solo punto (caso simple)
--   2. Usuario con múltiples puntos (debe elegir)
--   3. Usuario sin puntos asignados (debe mostrar error al emitir)
-- ============================================================================

-- --------------------------------------------------
-- Usuario 1: Admin con 2 puntos asignados
-- --------------------------------------------------
-- Este usuario puede emitir desde dos puntos diferentes
-- El punto 001-001 es su principal y se activa automáticamente

INSERT INTO configuracion.usuarios_puntos_emision (
    usuario_id, 
    empresa_id, 
    punto_emision_id,
    activo,
    es_principal,
    puede_cambiar,
    created_by
)
SELECT 
    u.id,
    e.id,
    pe.id,
    true,                           -- Activo por defecto
    (pe.codigo = '001'),           -- 001 es principal
    true,                           -- Puede cambiar de punto
    u.id
FROM auth.usuarios u
CROSS JOIN configuracion.empresas e
INNER JOIN configuracion.sucursales s ON s.empresa_id = e.id AND s.es_matriz = true
INNER JOIN configuracion.puntos_emision pe ON pe.sucursal_id = s.id
WHERE u.email = 'admin@demo.com'                    -- Usuario administrador
AND e.ruc = '1722039953001'                         -- Empresa demo
AND pe.codigo IN ('001', '002')                     -- Asignar punto 001 y 002
ON CONFLICT (usuario_id, empresa_id, punto_emision_id) DO NOTHING;

-- --------------------------------------------------
-- Usuario 2: Contador con un solo punto
-- --------------------------------------------------
-- Este usuario solo puede emitir desde un punto
-- Configuración más simple y restrictiva

INSERT INTO configuracion.usuarios_puntos_emision (
    usuario_id, 
    empresa_id, 
    punto_emision_id,
    activo,
    es_principal,
    puede_cambiar,
    created_by
)
SELECT 
    u.id,
    e.id,
    pe.id,
    true,                           -- Activo (es el único)
    true,                           -- Es principal
    false,                          -- NO puede cambiar (solo tiene uno)
    u.id
FROM auth.usuarios u
CROSS JOIN configuracion.empresas e
INNER JOIN configuracion.sucursales s ON s.empresa_id = e.id AND s.es_matriz = true
INNER JOIN configuracion.puntos_emision pe ON pe.sucursal_id = s.id
WHERE u.email = 'contador@demo.com'                 -- Usuario contador
AND e.ruc = '1722039953001'                         -- Empresa demo
AND pe.codigo = '001'                               -- Solo punto 001
ON CONFLICT (usuario_id, empresa_id, punto_emision_id) DO NOTHING;

-- --------------------------------------------------
-- Usuario 3: Asistente SIN puntos asignados
-- --------------------------------------------------
-- Este escenario prueba el manejo de usuarios sin acceso a puntos
-- El sistema debe mostrar un error claro al intentar emitir

-- No insertar ninguna asignación para este usuario
-- Para verificar: 
--   SELECT * FROM auth.usuarios WHERE email = 'asistente@demo.com';
-- No debería tener registros en usuarios_puntos_emision

-- ============================================================================
-- ACTUALIZAR PUNTOS DE EMISIÓN CON INFORMACIÓN ADICIONAL
-- ============================================================================

-- Agregar descripciones a los puntos de emisión existentes
UPDATE configuracion.puntos_emision pe
SET 
    descripcion = CASE 
        WHEN pe.codigo = '001' THEN 'Caja principal - Matriz'
        WHEN pe.codigo = '002' THEN 'Caja secundaria - Matriz'
        ELSE 'Punto de emisión ' || pe.codigo
    END,
    activo = true,
    requiere_asignacion = true,         -- Todos requieren asignación explícita
    permite_multiples_usuarios = true   -- Permite asignar a varios usuarios
WHERE pe.id IN (
    SELECT id FROM configuracion.puntos_emision
    WHERE sucursal_id IN (
        SELECT id FROM configuracion.sucursales 
        WHERE empresa_id IN (
            SELECT id FROM configuracion.empresas WHERE ruc = '1722039953001'
        )
    )
);

-- ============================================================================
-- VERIFICACIÓN DE DATOS CARGADOS
-- ============================================================================

-- Ver asignaciones creadas
-- SELECT 
--     u.nombre as usuario,
--     u.email,
--     s.codigo || '-' || pe.codigo as punto,
--     upe.activo,
--     upe.es_principal,
--     upe.puede_cambiar
-- FROM configuracion.usuarios_puntos_emision upe
-- INNER JOIN auth.usuarios u ON upe.usuario_id = u.id
-- INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
-- INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
-- ORDER BY u.nombre, punto;

-- ============================================================================
-- FIN DE DATOS DE PRUEBA
-- ============================================================================
