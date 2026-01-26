-- ============================================================================
-- MIGRACIÓN: Agregar tabla de detalle de compras para tracking de productos
-- ============================================================================

-- Crear tabla de detalle de compras (productos comprados)
CREATE TABLE IF NOT EXISTS compras.compras_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL REFERENCES compras.compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES inventario.productos(id),
    descripcion VARCHAR(500) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    porcentaje_iva NUMERIC(5,2) DEFAULT 0,
    valor_iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE compras.compras_detalle IS 'Detalle de productos/servicios en cada factura de compra';
COMMENT ON COLUMN compras.compras_detalle.id IS 'Identificador único del detalle';
COMMENT ON COLUMN compras.compras_detalle.compra_id IS 'Referencia a la compra (factura)';
COMMENT ON COLUMN compras.compras_detalle.producto_id IS 'Producto inventariable (NULL si es servicio)';
COMMENT ON COLUMN compras.compras_detalle.descripcion IS 'Descripción del ítem comprado';
COMMENT ON COLUMN compras.compras_detalle.cantidad IS 'Cantidad comprada';
COMMENT ON COLUMN compras.compras_detalle.precio_unitario IS 'Precio unitario de compra';
COMMENT ON COLUMN compras.compras_detalle.subtotal IS 'Subtotal sin IVA (cantidad × precio)';
COMMENT ON COLUMN compras.compras_detalle.porcentaje_iva IS 'Porcentaje de IVA aplicado (0, 15, etc)';
COMMENT ON COLUMN compras.compras_detalle.valor_iva IS 'Valor calculado del IVA';
COMMENT ON COLUMN compras.compras_detalle.total IS 'Total con IVA incluido';

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_compras_detalle_compra ON compras.compras_detalle(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_detalle_producto ON compras.compras_detalle(producto_id);
