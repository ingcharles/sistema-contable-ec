import { Auditable } from '@/shared/types';

export interface Sucursal extends Auditable {
    id: string;
    empresaId: string;
    codigo: string; // Ej: 001 (Establecimiento SRI)
    nombre: string; // Ej: Matriz, Sucursal Centro
    direccion: string;
    telefono?: string;
    esMatriz: boolean;
    activa: boolean;
}

export interface SecuencialDocumento {
    tipoComprobanteId: string; // ID from catalogos_items (SRI_TIPO_COMPROBANTE)
    secuencialActual: number; // Último número usado
}

export interface PuntoEmision extends Auditable {
    id: string;
    sucursalId: string;
    codigo: string; // Ej: 001, 002 (Punto de Emisión)
    nombre: string; // Ej: Caja Principal, Caja Secundaria
    secuenciales: SecuencialDocumento[];
    activo: boolean;
    requiereAsignacion?: boolean;
    permiteMultiplesUsuarios?: boolean;
    descripcion?: string;
    usuariosAsignados?: string[]; // IDs of users assigned to this point
}

export interface UsuarioSistema extends Auditable {
    id: string;
    empresaId: string; // Empresa activa
    nombreCompleto: string;
    email: string;
    rol: 'ADMINISTRADOR' | 'CONTADOR' | 'CAJERO' | 'AUDITOR';
    estado: 'ACTIVO' | 'INACTIVO';
    sucursalAsignadaId?: string; // Para restringir facturación a una sucursal
}

export interface CodigoRetencion extends Auditable {
    id: string;
    empresaId: string;
    codigo: string; // Ej: 312, 303
    concepto: string; // Ej: Transferencia bienes muebles
    porcentaje: number; // Ej: 1.75
    tipo: 'RENTA' | 'IVA';
    activo: boolean;
}

export interface ParametrosContables {
    sbu: number;
    iva: number;
    maxConsumidorFinal: number;
    cuentaCaja: string;
    cuentaIvaVentas: string;
    cuentaIvaCompras: string;
    cuentaRetRentaPorPagar: string;
    cuentaCxcClientes: string;
    cuentaAnticipoClientes: string;
    cuentaCxpProveedores: string;
    cuentaAnticipoProveedores: string;

    // Nómina
    aportePersonalIess?: number;
    aportePatronalIess?: number;
    fondoReservaPorcentaje?: number;
    cuentaSueldos?: string;
    cuentaAportePatronal?: string;
    cuentaDecimoTercero?: string;
    cuentaDecimoCuarto?: string;
    cuentaSueldosPorPagar?: string;
    cuentaIessPorPagar?: string;
    cuentaProvDecimoTercero?: string;
    cuentaProvDecimoCuarto?: string;

    // Caja Chica e Inventario
    cuentaCajaChica?: string;
    cuentaGastosVarios?: string;
    cuentaSobranteInventario?: string;
    cuentaFaltanteInventario?: string;

    // Others
    cuentaCostoVentas?: string;
    cuentaDescuentoVentas?: string;
    cuentaDevolucionVentas?: string;
    cuentaRetIvaPorPagar?: string;
    divisorVacaciones?: number;
    ivaCatalogoItemId?: string;
    sriTipoEmision?: string;
    fechaCierre?: string | null;
}

export interface MenuItem {
    id: string;
    label: string;
    icon?: string;
    path?: string;
    parentId?: string;
    order: number;
    children?: MenuItem[];
    planId?: string;
}

export interface CatalogoItem {
    id: string;
    codigo: string;
    valor: string;
    tipo: string;
    padreId?: string;
    valorNumerico?: number;
    esEditable: boolean;
    activo: boolean;
}

export interface AmbienteSRI {
    codigo: string; // 1 o 2
    nombre: string; // PRUEBAS o PRODUCCION
    url_recepcion: string;
    url_autorizacion: string;
}

export interface ConfiguracionRepository {
    getSucursales(empresaId: string): Promise<Sucursal[]>;
    getPuntosEmision(empresaId: string): Promise<PuntoEmision[]>;
    getUsuarios(empresaId: string): Promise<UsuarioSistema[]>;
    saveSucursal(sucursal: Sucursal): Promise<void>;
    savePuntoEmision(punto: PuntoEmision): Promise<void>;
    getFechaCierre(empresaId: string): Promise<string>;
    setFechaCierre(empresaId: string, fecha: string): Promise<void>;
    validarPeriodoAbierto(empresaId: string, fechaTransaccion: string): Promise<boolean>;
    getParametros(empresaId: string): Promise<ParametrosContables>;
    saveParametros(empresaId: string, params: ParametrosContables): Promise<void>;
    getCodigosRetencion(empresaId: string): Promise<CodigoRetencion[]>;
    saveCodigoRetencion(retencion: CodigoRetencion): Promise<void>;
    deleteCodigoRetencion(id: string): Promise<void>;
}
