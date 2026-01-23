-- ============================================================================
-- MIGRACIÓN: Agregar Conciliaciones Bancarias
-- Fecha: 2026-01-22
-- Descripción: Agrega tabla bancos_conciliaciones y campo conciliacion_id
-- ============================================================================

-- 1. Agregar campo conciliacion_id a bancos_movimientos
ALTER TABLE bancos.bancos_movimientos 
ADD COLUMN IF NOT EXISTS conciliacion_id UUID;

COMMENT ON COLUMN bancos.bancos_movimientos.conciliacion_id IS 'Referencia a la conciliación bancaria a la que pertenece este movimiento';

-- 2. Crear tabla bancos_conciliaciones
CREATE TABLE IF NOT EXISTS bancos.bancos_conciliaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES bancos.bancos_cuentas(id) ON DELETE CASCADE,
    fecha_corte DATE NOT NULL,
    saldo_libro NUMERIC(18,2) NOT NULL,
    saldo_extracto NUMERIC(18,2) NOT NULL,
    cheques_no_cobrados NUMERIC(18,2) DEFAULT 0,
    depositos_en_transito NUMERIC(18,2) DEFAULT 0,
    diferencia NUMERIC(18,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id)
);

COMMENT ON TABLE bancos.bancos_conciliaciones IS 'Conciliaciones bancarias para cuadrar saldos contables vs extractos bancarios.';
COMMENT ON COLUMN bancos.bancos_conciliaciones.id IS 'Identificador único de la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.empresa_id IS 'Empresa a la que pertenece la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.cuenta_id IS 'Cuenta bancaria que se está conciliando';
COMMENT ON COLUMN bancos.bancos_conciliaciones.fecha_corte IS 'Fecha de corte de la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.saldo_libro IS 'Saldo según libros contables';
COMMENT ON COLUMN bancos.bancos_conciliaciones.saldo_extracto IS 'Saldo según extracto bancario';
COMMENT ON COLUMN bancos.bancos_conciliaciones.cheques_no_cobrados IS 'Total de cheques emitidos pero no cobrados aún';
COMMENT ON COLUMN bancos.bancos_conciliaciones.depositos_en_transito IS 'Total de depósitos registrados pero no reflejados en extracto';
COMMENT ON COLUMN bancos.bancos_conciliaciones.diferencia IS 'Diferencia entre saldo libro y extracto (después de ajustes)';
COMMENT ON COLUMN bancos.bancos_conciliaciones.estado IS 'Estado: BORRADOR, CONCILIADO, APROBADO';
COMMENT ON COLUMN bancos.bancos_conciliaciones.observaciones IS 'Notas y comentarios sobre la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.created_by IS 'Usuario que creó la conciliación';

-- 3. Agregar foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_movimientos_conciliacion'
    ) THEN
        ALTER TABLE bancos.bancos_movimientos 
        ADD CONSTRAINT fk_movimientos_conciliacion 
        FOREIGN KEY (conciliacion_id) REFERENCES bancos.bancos_conciliaciones(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_conciliaciones_empresa ON bancos.bancos_conciliaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_cuenta ON bancos.bancos_conciliaciones(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_fecha ON bancos.bancos_conciliaciones(fecha_corte);
CREATE INDEX IF NOT EXISTS idx_movimientos_conciliacion ON bancos.bancos_movimientos(conciliacion_id);

-- 5. Agregar trigger de auditoría
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'audit_bancos_conciliaciones'
    ) THEN
        CREATE TRIGGER audit_bancos_conciliaciones 
        AFTER INSERT OR UPDATE OR DELETE ON bancos.bancos_conciliaciones 
        FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
    END IF;
END $$;

COMMENT ON TRIGGER audit_bancos_conciliaciones ON bancos.bancos_conciliaciones IS 'Auditoría automática de cambios en conciliaciones bancarias';
