-- Migration: Change logo_url to logo (BYTEA)
-- Author: Antigravity
-- Date: 2026-02-06

-- 1. Rename the column
ALTER TABLE seguridad.empresas RENAME COLUMN logo_url TO logo;

-- 2. Change the type to BYTEA
-- We use USING NULL if we want to clear previous URLs, 
-- or we can try to keep them if they were base64 strings, 
-- but usually logo_url was just a URL, so it's better to clear it or convert.
-- Since the user said "cambiado por un upload", we expect new uploads.
ALTER TABLE seguridad.empresas ALTER COLUMN logo TYPE BYTEA USING NULL;

-- 3. Update comments
COMMENT ON COLUMN seguridad.empresas.logo IS 'Imagen del logo de la empresa stored as BYTEA';
