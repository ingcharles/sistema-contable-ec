-- ============================================================================
-- MIGRACIÓN: Agregar tipos de movimiento adicionales al enum kardex
-- ============================================================================

-- PostgreSQL no permite agregar valores a un ENUM directamente si está en uso
-- Necesitamos recrear el tipo con los nuevos valores

-- Paso 1: Agregar nuevos valores al ENUM existente (PostgreSQL 9.1+)
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'DEVOLUCION_COMPRA';
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'DEVOLUCION_VENTA';
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_ENTRADA';
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_SALIDA';

-- Nota: Los valores ENTRADA, SALIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO ya existen
-- Ahora el enum completo tiene:
-- - ENTRADA: Compras y entradas normales de mercadería
-- - SALIDA: Ventas y salidas normales de mercadería
-- - AJUSTE_POSITIVO: Correcciones al alza (mercadería encontrada, errores)
-- - AJUSTE_NEGATIVO: Correcciones a la baja (mermas, daños, pérdidas)
-- - DEVOLUCION_COMPRA: Devolución de mercadería al proveedor (disminuye inventario)
-- - DEVOLUCION_VENTA: Devolución de mercadería por parte del cliente (aumenta inventario)
-- - TRANSFERENCIA_ENTRADA: Recepción de mercadería desde otra bodega
-- - TRANSFERENCIA_SALIDA: Envío de mercadería a otra bodega
