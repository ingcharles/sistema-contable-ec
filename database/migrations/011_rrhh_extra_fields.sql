-- ============================================================================
-- MODULO RRHH: TABLAS ADICIONALES
-- ============================================================================

-- Esquema: nomina (ya existe en postgresql_schema.sql)

-- 1. Tabla: nomina.asistencia
-- Registro detallado de entradas, salidas y novedades
CREATE TABLE IF NOT EXISTS nomina.asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    empleado_id UUID NOT NULL REFERENCES nomina.empleados(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    horas_trabajadas NUMERIC(5,2) DEFAULT 0,
    horas_extras_50 NUMERIC(5,2) DEFAULT 0,
    horas_extras_100 NUMERIC(5,2) DEFAULT 0,
    novedad VARCHAR(100), -- Faltó, Atraso, Permiso, etc.
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, empleado_id, fecha)
);

COMMENT ON TABLE nomina.asistencia IS 'Control de asistencia diaria y horas extras.';

-- 2. Tabla: nomina.vacaciones
-- Gestión de periodos y solicitudes de vacaciones
CREATE TABLE IF NOT EXISTS nomina.vacaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    empleado_id UUID NOT NULL REFERENCES nomina.empleados(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_solicitados INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADA, RECHAZADA, GOZADA
    tipo_solicitud VARCHAR(50) DEFAULT 'VACACIONES', -- VACACIONES, PERMISO_MEDICO, CALAMIDAD, etc.
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nomina.vacaciones IS 'Gestión de solicitudes de vacaciones y permisos.';

-- 3. Tabla: nomina.prestamos
-- Control de préstamos de la empresa y anticipos
CREATE TABLE IF NOT EXISTS nomina.prestamos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    empleado_id UUID NOT NULL REFERENCES nomina.empleados(id) ON DELETE CASCADE,
    fecha_prestamo DATE NOT NULL,
    monto_total NUMERIC(18,2) NOT NULL,
    monto_cuota NUMERIC(18,2) NOT NULL,
    saldo_pendiente NUMERIC(18,2) NOT NULL,
    numero_cuotas INTEGER NOT NULL,
    cuotas_pagadas INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'ACTIVO', -- ACTIVO, FINALIZADO, ANULADO
    tipo_prestamo VARCHAR(50) DEFAULT 'EMPRESA', -- EMPRESA, ANTICIPO_SUELDO
    observaciones TEXT,
    asiento_id UUID REFERENCES contabilidad.asientos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nomina.prestamos IS 'Control de préstamos otorgados a empleados y su amortización.';

-- 4. Tabla: nomina.liquidaciones
-- Cálculo de actas de finiquito
CREATE TABLE IF NOT EXISTS nomina.liquidaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    empleado_id UUID NOT NULL REFERENCES nomina.empleados(id) ON DELETE CASCADE,
    fecha_salida DATE NOT NULL,
    motivo_salida VARCHAR(100), -- RENUNCIA, DESPIDO_INTEMPESTIVO, FIN_CONTRATO, etc.
    total_ingresos NUMERIC(18,2) NOT NULL,
    total_egresos NUMERIC(18,2) NOT NULL,
    valor_liquido NUMERIC(18,2) NOT NULL,
    detalle_calculo JSONB, -- Detalles de décimos proporcionales, vacaciones, indemnización
    estado VARCHAR(20) DEFAULT 'BORRADOR', -- BORRADOR, CERRADA, PAGADA
    asiento_id UUID REFERENCES contabilidad.asientos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE nomina.liquidaciones IS 'Registro de liquidaciones y actas de finiquito.';

-- Triggers para updated_at (opcional pero recomendado)
-- Estos asumen que ya existen funciones de utilidad en el esquema público o similar
-- Para simplificar en este paso, omitiremos triggers complejos a menos que se requieran.
