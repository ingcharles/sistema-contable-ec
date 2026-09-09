-- MIGRATION 010: Corregir tabla comprobantes_electronicos
-- Agrega columnas faltantes y actualiza restricciones

-- 1. Agregar columna punto_emision_id si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='facturacion' AND table_name='comprobantes_electronicos' AND column_name='punto_emision_id') THEN
        ALTER TABLE facturacion.comprobantes_electronicos 
        ADD COLUMN punto_emision_id UUID REFERENCES configuracion.puntos_emision(id);
    END IF;
END $$;

-- 2. Asegurar que las columnas de Guía de Remisión también existan (por si acaso)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='facturacion' AND table_name='comprobantes_electronicos' AND column_name='direccion_partida') THEN
        ALTER TABLE facturacion.comprobantes_electronicos ADD COLUMN direccion_partida TEXT;
        ALTER TABLE facturacion.comprobantes_electronicos ADD COLUMN direccion_destino TEXT;
        ALTER TABLE facturacion.comprobantes_electronicos ADD COLUMN transportista_nombre VARCHAR(255);
        ALTER TABLE facturacion.comprobantes_electronicos ADD COLUMN placa_vehiculo VARCHAR(20);
    END IF;
END $$;

-- 3. Actualizar el CONSTRAINT de unicidad para incluir punto_emision_id
-- Primero eliminamos el antiguo si existe (podría llamarse diferente o no estar)
DO $$ 
BEGIN 
    ALTER TABLE facturacion.comprobantes_electronicos DROP CONSTRAINT IF EXISTS comprobantes_electronicos_empresa_id_tipo_comprobante_sec_key;
    ALTER TABLE facturacion.comprobantes_electronicos DROP CONSTRAINT IF EXISTS unq_comprobante_secuencial;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Creamos el nuevo constraint que garantiza unicidad por punto de emisión también
ALTER TABLE facturacion.comprobantes_electronicos 
ADD CONSTRAINT unq_comprobante_punto_secuencial 
UNIQUE(empresa_id, tipo_comprobante, punto_emision_id, secuencial);

COMMENT ON COLUMN facturacion.comprobantes_electronicos.punto_emision_id IS 'Referencia al punto de emisión utilizado';
