/**
 * ARCHIVO DE FACHADA PARA CASOS DE USO (SOLID REFACING)
 * Este archivo re-exporta los casos de uso modularizados para mantener compatibilidad 
 * mientras se migran las importaciones en el resto del proyecto.
 */

export { BaseUseCase } from './BaseUseCase';
export { DashboardUseCases } from './DashboardUseCases';
export { ContabilidadUseCases } from '@/modules/contabilidad/application/useCases/ContabilidadUseCases';
export { InventarioUseCases } from '@/modules/inventario/application/useCases/InventarioUseCases';
export { BancosUseCases } from '@/modules/bancos/application/useCases/BancosUseCases';
export { NominaUseCases } from '@/modules/nomina/application/useCases/NominaUseCases';
export { CarteraUseCases } from '@/modules/cartera/application/useCases/CarteraUseCases';
export { AuditoriaUseCases } from './AuditoriaUseCases';
export { DirectorioUseCases, DirectorioUseCases as TercerosUseCases } from '@/modules/directorio/application/useCases/DirectorioUseCases';
export { ConfiguracionUseCases } from '@/modules/configuracion/application/useCases/ConfiguracionUseCases';
export { FacturacionUseCases } from '@/modules/facturacion/application/useCases/FacturacionUseCases';
export { ComprasUseCases } from '@/modules/compras/application/useCases/ComprasUseCases';
export { CajaChicaUseCases } from '@/modules/caja-chica/application/useCases/CajaChicaUseCases';
export { BuzonUseCases } from './BuzonUseCases';
export { ActivosUseCases } from '@/modules/activos/application/useCases/ActivosUseCases';
export { ImpuestosUseCases } from './ImpuestosUseCases';
export { PlanesUseCases } from './PlanesUseCases';
export { UsuariosUseCases } from './UsuariosUseCases';
export { SriUseCases } from './SriUseCases';

// Nota: se mantiene el alias TercerosUseCases para compatibilidad total con el código existente
