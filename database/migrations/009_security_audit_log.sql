-- ============================================================================
-- MIGRATION 009: AUDITORÍA DE SEGURIDAD - INTENTOS DE ACCESO NO AUTORIZADO
-- ============================================================================
-- Descripción: Tabla para registrar intentos de acceso a puntos de emisión
--              no asignados, con información de usuario, IP, y detalles.
-- Fecha: 2026-01-28
-- ============================================================================

-- Crear esquema de auditoría si no existe
CREATE SCHEMA IF NOT EXISTS auditoria;

-- Tabla para registrar intentos de acceso no autorizado
CREATE TABLE IF NOT EXISTS auditoria.intentos_acceso_no_autorizado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    usuario_nombre VARCHAR(255), -- Nombre del usuario (desnormalizado para consultas rápidas)
    punto_emision_id UUID NOT NULL REFERENCES configuracion.puntos_emision(id) ON DELETE CASCADE,
    accion VARCHAR(50) NOT NULL, -- 'EMITIR_FACTURA', 'EMITIR_RETENCION', 'EMITIR_NOTA_CREDITO', etc.
    resultado VARCHAR(20) DEFAULT 'BLOQUEADO', -- 'BLOQUEADO', 'PERMITIDO' (para casos especiales)
    mensaje_error TEXT, -- Mensaje de error mostrado al usuario
    ip_address VARCHAR(45), -- IPv4 o IPv6
    user_agent TEXT,
    detalles JSONB, -- Información adicional del intento (proveedor, monto, etc.)
    fecha_intento TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_intentos_empresa 
ON auditoria.intentos_acceso_no_autorizado(empresa_id);

CREATE INDEX IF NOT EXISTS idx_intentos_usuario 
ON auditoria.intentos_acceso_no_autorizado(usuario_id);

CREATE INDEX IF NOT EXISTS idx_intentos_fecha 
ON auditoria.intentos_acceso_no_autorizado(fecha_intento DESC);

CREATE INDEX IF NOT EXISTS idx_intentos_punto 
ON auditoria.intentos_acceso_no_autorizado(punto_emision_id);

-- Comentarios para documentación
COMMENT ON TABLE auditoria.intentos_acceso_no_autorizado IS 
'Registro de intentos de acceso no autorizado a puntos de emisión. Almacena información de seguridad cuando un usuario intenta usar un punto de emisión que no tiene asignado.';

COMMENT ON COLUMN auditoria.intentos_acceso_no_autorizado.usuario_nombre IS 
'Nombre del usuario que realizó el intento (desnormalizado para consultas rápidas sin JOIN)';

COMMENT ON COLUMN auditoria.intentos_acceso_no_autorizado.accion IS 
'Tipo de acción que se intentó realizar: EMITIR_FACTURA, EMITIR_RETENCION, EMITIR_NOTA_CREDITO, etc.';

COMMENT ON COLUMN auditoria.intentos_acceso_no_autorizado.resultado IS 
'Resultado del intento: BLOQUEADO (acceso denegado), PERMITIDO (casos especiales donde se permitió)';

COMMENT ON COLUMN auditoria.intentos_acceso_no_autorizado.mensaje_error IS 
'Mensaje de error que se mostró al usuario cuando se bloqueó el acceso';

COMMENT ON COLUMN auditoria.intentos_acceso_no_autorizado.ip_address IS 
'Dirección IP desde donde se realizó el intento (IPv4 o IPv6)';

COMMENT ON COLUMN auditoria.intentos_acceso_no_autorizado.detalles IS 
'Información adicional en formato JSON sobre el intento (proveedor, cliente, monto, etc.)';

-- ============================================================================
-- FIN DE MIGRATION 009
-- ============================================================================
