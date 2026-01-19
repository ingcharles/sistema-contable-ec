import { Auditable } from '@/shared/types';

export enum EstadoActivo {
    OPERATIVO = 'OPERATIVO',
    EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
    DEPRECIADO = 'DEPRECIADO',
    DADO_DE_BAJA = 'DADO_DE_BAJA'
}

export enum CategoriaActivo {
    VEHICULOS = 'VEHICULOS',
    EQUIPO_COMPUTACION = 'EQUIPO_COMPUTACION',
    MUEBLES_ENSERES = 'MUEBLES_ENSERES',
    EDIFICIOS = 'EDIFICIOS',
    MAQUINARIA = 'MAQUINARIA'
}

export interface ActivoFijo extends Auditable {
    id: string;
    empresaId: string;
    codigo: string;
    nombre: string;
    categoria: CategoriaActivo;
    fechaAdquisicion: string;
    valorAdquisicion: number;
    valorResidual: number;
    vidaUtilMeses: number;
    depreciacionAcumulada: number;
    valorLibros: number;
    estado: EstadoActivo;
    ubicacion?: string;
    responsable?: string;
}

export interface ActivosRepository {
    getActivos(empresaId: string): Promise<ActivoFijo[]>;
    saveActivo(activo: ActivoFijo): Promise<void>;
    deleteActivo(id: string): Promise<void>;
    calcularDepreciacionMensual(empresaId: string, periodo: string): Promise<number>;
}
