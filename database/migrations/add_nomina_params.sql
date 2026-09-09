ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS aporte_personal_iess NUMERIC(15,2) DEFAULT 9.45;
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS aporte_patronal_iess NUMERIC(15,2) DEFAULT 12.15;
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS fondo_reserva_porcentaje NUMERIC(15,2) DEFAULT 8.33;
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_sueldos VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_aporte_patronal VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_decimo_tercero VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_decimo_cuarto VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_sueldos_por_pagar VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_iess_por_pagar VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_prov_decimo_tercero VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS cuenta_prov_decimo_cuarto VARCHAR(20);
ALTER TABLE configuracion.parametros ADD COLUMN IF NOT EXISTS divisor_vacaciones NUMERIC(15,2) DEFAULT 24;

COMMENT ON COLUMN configuracion.parametros.aporte_personal_iess IS 'Porcentaje de aporte personal al IESS';
COMMENT ON COLUMN configuracion.parametros.aporte_patronal_iess IS 'Porcentaje de aporte patronal al IESS';
COMMENT ON COLUMN configuracion.parametros.fondo_reserva_porcentaje IS 'Porcentaje de fondo de reserva';
