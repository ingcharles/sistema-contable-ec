-- Migración para añadir parámetros contables faltantes (Nómina, Caja Chica e Inventario)

ALTER TABLE configuracion.parametros 
-- Nómina
ADD COLUMN cuenta_sueldos VARCHAR(20),
ADD COLUMN cuenta_aporte_patronal VARCHAR(20),
ADD COLUMN cuenta_decimo_tercero VARCHAR(20),
ADD COLUMN cuenta_decimo_cuarto VARCHAR(20),
ADD COLUMN cuenta_iess_por_pagar VARCHAR(20),
ADD COLUMN cuenta_sueldos_por_pagar VARCHAR(20),
ADD COLUMN cuenta_prov_decimo_tercero VARCHAR(20),
ADD COLUMN cuenta_prov_decimo_cuarto VARCHAR(20),

-- Caja Chica
ADD COLUMN cuenta_caja_chica VARCHAR(20),
ADD COLUMN cuenta_gastos_varios VARCHAR(20),

-- Inventario
ADD COLUMN cuenta_sobrante_inventario VARCHAR(20),
ADD COLUMN cuenta_faltante_inventario VARCHAR(20);
