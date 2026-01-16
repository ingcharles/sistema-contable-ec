
import { Auditable, TipoIdentificacion } from '../../../types';

export enum TipoTercero {
    CLIENTE = 'CLIENTE',
    PROVEEDOR = 'PROVEEDOR',
    AMBOS = 'AMBOS'
}

export interface Tercero extends Auditable {
    id: string;
    empresaId: string;
    tipoIdentificacion: TipoIdentificacion;
    identificacion: string; // RUC o Cédula
    razonSocial: string;
    nombreComercial?: string;
    
    // Clasificación
    tipo: TipoTercero;
    categoria?: string; // Ej: Mayorista, Minorista, Servicios
    
    // Contacto
    direccion: string;
    telefono: string;
    email: string;
    
    // Datos Tributarios
    esContribuyenteEspecial: boolean;
    obligadoContabilidad: boolean;
    parteRelacionada: boolean; // Para anexo de accionistas/dividendos
    
    // Datos Bancarios (Para Proveedores)
    banco?: string;
    tipoCuenta?: string;
    numeroCuenta?: string;
}

export interface DirectorioRepository {
    getAll(empresaId: string): Promise<Tercero[]>;
    save(tercero: Tercero): Promise<void>;
    delete(id: string): Promise<void>;
}
