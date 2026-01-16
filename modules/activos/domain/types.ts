
import { Auditable } from '../../../types';

export enum CategoriaActivo {
    EDIFICIOS = 'EDIFICIOS', // 20 años (5%)
    MUEBLES_ENSERES = 'MUEBLES_ENSERES', // 10 años (10%)
    MAQUINARIA = 'MAQUINARIA', // 10 años (10%)
    EQUIPO_COMPUTO = 'EQUIPO_COMPUTO', // 3 años (33.33%)
    VEHICULOS = 'VEHICULOS' // 5 años (20%)
}

export enum EstadoActivo {
    ACTIVO = 'ACTIVO',
    BAJA = 'BAJA',
    VENDIDO = 'VENDIDO',
    EN_MANTENIMIENTO = 'EN_MANTENIMIENTO'
}

export interface ActivoFijo extends Auditable {
    id: string;
    empresaId: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    categoria: CategoriaActivo;
    
    // Adquisición
    fechaAdquisicion: string;
    proveedor: string;
    facturaCompra: string;
    costoAdquisicion: number;
    valorResidual: number; // Valor salvamento
    
    // Depreciación
    vidaUtilAnios: number;
    depreciacionAcumulada: number;
    depreciacionMensual: number;
    fechaUltimaDepreciacion?: string;
    
    // Control
    custodio: string;
    ubicacion: string;
    estado: EstadoActivo;
    
    // Calculados
    valorLibros: number;
}
