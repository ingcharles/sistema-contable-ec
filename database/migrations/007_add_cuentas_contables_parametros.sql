-- =====================================================
-- Migración 007: Agregar cuentas contables adicionales a parámetros
-- Sistema Contable Ecuador
-- Fecha: 2026-01-26
-- Descripción: Agrega campos para configurar las cuentas contables
--              utilizadas en asientos automáticos de NC, ND, Retenciones, etc.
-- =====================================================

-- Agregar nuevas columnas de cuentas contables
ALTER TABLE configuracion.parametros 
ADD COLUMN IF NOT EXISTS cuenta_ventas VARCHAR(20) DEFAULT '4.1.01.01',
ADD COLUMN IF NOT EXISTS cuenta_devolucion_ventas VARCHAR(20) DEFAULT '4.1.01.02',
ADD COLUMN IF NOT EXISTS cuenta_compras VARCHAR(20) DEFAULT '5.1.01.01',
ADD COLUMN IF NOT EXISTS cuenta_inventario VARCHAR(20) DEFAULT '1.1.03.01',
ADD COLUMN IF NOT EXISTS cuenta_iva_por_pagar VARCHAR(20) DEFAULT '2.1.05.01',
ADD COLUMN IF NOT EXISTS cuenta_ret_iva_por_pagar VARCHAR(20) DEFAULT '2.1.03.02',
ADD COLUMN IF NOT EXISTS cuenta_costo_ventas VARCHAR(20) DEFAULT '5.1.01.01',
ADD COLUMN IF NOT EXISTS cuenta_descuento_ventas VARCHAR(20) DEFAULT '4.1.01.03';

-- Comentarios descriptivos
COMMENT ON COLUMN configuracion.parametros.cuenta_ventas IS 'Cuenta de ingresos por ventas (Ej: 4.1.01.01)';
COMMENT ON COLUMN configuracion.parametros.cuenta_devolucion_ventas IS 'Cuenta para devoluciones en ventas - NC (Ej: 4.1.01.02)';
COMMENT ON COLUMN configuracion.parametros.cuenta_compras IS 'Cuenta de gastos por compras (Ej: 5.1.01.01)';
COMMENT ON COLUMN configuracion.parametros.cuenta_inventario IS 'Cuenta de inventario/mercaderías (Ej: 1.1.03.01)';
COMMENT ON COLUMN configuracion.parametros.cuenta_iva_por_pagar IS 'Cuenta IVA cobrado/por pagar en ventas (Ej: 2.1.05.01)';
COMMENT ON COLUMN configuracion.parametros.cuenta_ret_iva_por_pagar IS 'Cuenta retención IVA por pagar (Ej: 2.1.03.02)';
COMMENT ON COLUMN configuracion.parametros.cuenta_costo_ventas IS 'Cuenta de costo de ventas (Ej: 5.1.01.01)';
COMMENT ON COLUMN configuracion.parametros.cuenta_descuento_ventas IS 'Cuenta de descuento en ventas (Ej: 4.1.01.03)';

-- Actualizar registros existentes con valores por defecto
UPDATE configuracion.parametros 
SET 
    cuenta_ventas = COALESCE(cuenta_ventas, '4.1.01.01'),
    cuenta_devolucion_ventas = COALESCE(cuenta_devolucion_ventas, '4.1.01.02'),
    cuenta_compras = COALESCE(cuenta_compras, '5.1.01.01'),
    cuenta_inventario = COALESCE(cuenta_inventario, '1.1.03.01'),
    cuenta_iva_por_pagar = COALESCE(cuenta_iva_por_pagar, '2.1.05.01'),
    cuenta_ret_iva_por_pagar = COALESCE(cuenta_ret_iva_por_pagar, '2.1.03.02'),
    cuenta_costo_ventas = COALESCE(cuenta_costo_ventas, '5.1.01.01'),
    cuenta_descuento_ventas = COALESCE(cuenta_descuento_ventas, '4.1.01.03')
WHERE cuenta_ventas IS NULL;
