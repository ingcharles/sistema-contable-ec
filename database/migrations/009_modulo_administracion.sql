-- ============================================================================
-- MIGRACIÓN 009: MÓDULO DE ADMINISTRACIÓN Y AUDITORÍA
-- ============================================================================
-- Descripción: Configuración de tablas para auditoría avanzada y parámetros
--              globales del sistema.
-- Fecha: 2026-01-28
-- ============================================================================

-- ============================================================================
-- TABLA: auditoria.auditoria_logs (Asegurar estructura)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auditoria.auditoria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES seguridad.empresas(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES seguridad.usuarios(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(255),
    modulo VARCHAR(50) NOT NULL, -- AUTH, FACTURACION, COMPRAS, etc.
    evento VARCHAR(100) NOT NULL, -- LOGIN_SUCCESS, CREATE_FACTURA, etc.
    descripcion TEXT,
    data_anterior JSONB,
    data_nueva JSONB,
    severidad severidad_log DEFAULT 'INFO',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_empresa_fecha ON auditoria.auditoria_logs(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria.auditoria_logs(usuario_id);

-- ============================================================================
-- TABLA: configuracion.parametros_sistema
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion.parametros_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    clave VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) DEFAULT 'GENERAL',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, clave)
);

-- ============================================================================
-- SEED DATA INICIAL PARA PARÁMETROS
-- ============================================================================
INSERT INTO configuracion.parametros_sistema (empresa_id, clave, valor, descripcion, categoria)
SELECT 
    id, 'IVA_DEFECTO', '15', 'Porcentaje de IVA por defecto para nuevos productos', 'FACTURACION'
FROM seguridad.empresas
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DE MIGRACIÓN 009
-- ============================================================================
