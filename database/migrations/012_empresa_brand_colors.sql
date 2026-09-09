-- ============================================================================
-- Migration: Agregar Colores de Marca a Empresas
-- ============================================================================
-- Descripción: Agrega columnas para personalizar colores corporativos en RIDE
-- Fecha: 2026-02-05
-- Autor: Sistema
-- ============================================================================

-- Agregar columnas de branding a la tabla empresas
ALTER TABLE seguridad.empresas 
ADD COLUMN IF NOT EXISTS color_primario VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS color_acento VARCHAR(7) DEFAULT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN seguridad.empresas.color_primario IS 'Color primario de marca en formato hex (#RRGGBB). Usado en encabezados RIDE. NULL = usar slate-900 (#0f172a) por defecto';
COMMENT ON COLUMN seguridad.empresas.color_secundario IS 'Color secundario de marca en formato hex (#RRGGBB). Usado en detalles. NULL = usar slate-600 (#475569) por defecto';
COMMENT ON COLUMN seguridad.empresas.color_acento IS 'Color de acento en formato hex (#RRGGBB). Usado en highlights. NULL = usar slate-700 (#334155) por defecto';

-- Agregar constraint para validar formato hex
ALTER TABLE seguridad.empresas
ADD CONSTRAINT check_color_primario_format CHECK (color_primario IS NULL OR color_primario ~ '^#[0-9A-Fa-f]{6}$'),
ADD CONSTRAINT check_color_secundario_format CHECK (color_secundario IS NULL OR color_secundario ~ '^#[0-9A-Fa-f]{6}$'),
ADD CONSTRAINT check_color_acento_format CHECK (color_acento IS NULL OR color_acento ~ '^#[0-9A-Fa-f]{6}$');

-- ============================================================================
-- Fin de Migration
-- ============================================================================
