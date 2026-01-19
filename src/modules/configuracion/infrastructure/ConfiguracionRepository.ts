import { Sucursal, PuntoEmision, UsuarioSistema, CodigoRetencion, ParametrosContables, ConfiguracionRepository } from '../domain/types';
import { TipoComprobante } from '@/shared/types';

const MOCK_SUCURSALES: Sucursal[] = [
    {
        id: 's1', empresaId: '1', codigo: '001', nombre: 'MATRIZ - QUITO', direccion: 'Av. Amazonas y Naciones Unidas', esMatriz: true, activa: true,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 's2', empresaId: '1', codigo: '002', nombre: 'SUCURSAL GUAYAQUIL', direccion: 'Av. 9 de Octubre y Boyacá', esMatriz: false, activa: true,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_PUNTOS_EMISION: PuntoEmision[] = [
    {
        id: 'pto1', sucursalId: 's1', codigo: '001', nombre: 'Caja General Matriz', activo: true,
        secuenciales: [
            { tipoComprobante: TipoComprobante.FACTURA, secuencialActual: 4522 },
            { tipoComprobante: TipoComprobante.RETENCION, secuencialActual: 124 },
            { tipoComprobante: TipoComprobante.NOTA_CREDITO, secuencialActual: 56 }
        ],
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 'pto2', sucursalId: 's2', codigo: '001', nombre: 'Caja 1 Guayaquil', activo: true,
        secuenciales: [
            { tipoComprobante: TipoComprobante.FACTURA, secuencialActual: 1050 },
            { tipoComprobante: TipoComprobante.GUIA_REMISION, secuencialActual: 300 }
        ],
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_USUARIOS: UsuarioSistema[] = [
    { id: 'u1', empresaId: '1', nombreCompleto: 'Juan Pérez (Contador)', email: 'juan@empresa.com', rol: 'CONTADOR', estado: 'ACTIVO', createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'u2', empresaId: '1', nombreCompleto: 'Maria Velez (Cajera)', email: 'maria@empresa.com', rol: 'CAJERO', estado: 'ACTIVO', sucursalAsignadaId: 's2', createdAt: '', updatedAt: '', createdBy: '' }
];

const MOCK_RETENCIONES: CodigoRetencion[] = [
    { id: 'r1', empresaId: '1', codigo: '312', concepto: 'Transferencia de bienes muebles de naturaleza corporal', porcentaje: 1.75, tipo: 'RENTA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'r2', empresaId: '1', codigo: '3440', concepto: 'Otras compras de bienes y servicios no sujetas a retención', porcentaje: 0, tipo: 'RENTA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'r3', empresaId: '1', codigo: '303', concepto: 'Honorarios profesionales y demás pagos por servicios relacionados', porcentaje: 10, tipo: 'RENTA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'r4', empresaId: '1', codigo: '343', concepto: '1% Combustibles / RIMPE Emprendedor', porcentaje: 1, tipo: 'RENTA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'r5', empresaId: '1', codigo: '320', concepto: 'Arrendamiento de bienes inmuebles', porcentaje: 8, tipo: 'RENTA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'iv1', empresaId: '1', codigo: '9', concepto: 'Retención IVA 30% (Bienes)', porcentaje: 30, tipo: 'IVA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'iv2', empresaId: '1', codigo: '10', concepto: 'Retención IVA 70% (Servicios)', porcentaje: 70, tipo: 'IVA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'iv3', empresaId: '1', codigo: '11', concepto: 'Retención IVA 100% (Liquidación / Profesionales)', porcentaje: 100, tipo: 'IVA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
    { id: 'iv4', empresaId: '1', codigo: '0', concepto: 'No Retiene IVA (0%)', porcentaje: 0, tipo: 'IVA', activo: true, createdAt: '', updatedAt: '', createdBy: '' },
];

let MOCK_PARAMS: ParametrosContables = {
    sbu: 460,
    iva: 15,
    maxConsumidorFinal: 50,
    cuentaCaja: '1.1.01.01',
    cuentaIvaVentas: '2.1.07.01',
    cuentaIvaCompras: '1.1.05.01',
    cuentaRetRentaPorPagar: '2.1.03.01'
};

let MOCK_FECHA_CIERRE = '2023-09-30';

export class InMemoryConfiguracionRepository implements ConfiguracionRepository {
    async getSucursales(empresaId: string): Promise<Sucursal[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_SUCURSALES.filter(s => s.empresaId === empresaId);
    }

    async getPuntosEmision(empresaId: string): Promise<PuntoEmision[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        const sucursalesIds = MOCK_SUCURSALES.filter(s => s.empresaId === empresaId).map(s => s.id);
        return MOCK_PUNTOS_EMISION.filter(p => sucursalesIds.includes(p.sucursalId));
    }

    async getUsuarios(empresaId: string): Promise<UsuarioSistema[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_USUARIOS.filter(u => u.empresaId === empresaId);
    }

    async saveSucursal(sucursal: Sucursal): Promise<void> {
        const index = MOCK_SUCURSALES.findIndex(s => s.id === sucursal.id);
        if (index >= 0) {
            MOCK_SUCURSALES[index] = sucursal;
        } else {
            MOCK_SUCURSALES.push(sucursal);
        }
    }

    async savePuntoEmision(punto: PuntoEmision): Promise<void> {
        const index = MOCK_PUNTOS_EMISION.findIndex(p => p.id === punto.id);
        if (index >= 0) {
            MOCK_PUNTOS_EMISION[index] = punto;
        } else {
            MOCK_PUNTOS_EMISION.push(punto);
        }
    }

    async getFechaCierre(_empresaId: string): Promise<string> {
        return MOCK_FECHA_CIERRE;
    }

    async setFechaCierre(_empresaId: string, fecha: string): Promise<void> {
        MOCK_FECHA_CIERRE = fecha;
    }

    async validarPeriodoAbierto(_empresaId: string, fechaTransaccion: string): Promise<boolean> {
        if (!MOCK_FECHA_CIERRE) return true;
        return fechaTransaccion > MOCK_FECHA_CIERRE;
    }

    async getParametros(_empresaId: string): Promise<ParametrosContables> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_PARAMS;
    }

    async saveParametros(_empresaId: string, params: ParametrosContables): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 200));
        MOCK_PARAMS = params;
    }

    async getCodigosRetencion(empresaId: string): Promise<CodigoRetencion[]> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return MOCK_RETENCIONES.filter(r => r.empresaId === empresaId);
    }

    async saveCodigoRetencion(retencion: CodigoRetencion): Promise<void> {
        const index = MOCK_RETENCIONES.findIndex(r => r.id === retencion.id);
        if (index >= 0) {
            MOCK_RETENCIONES[index] = retencion;
        } else {
            MOCK_RETENCIONES.push(retencion);
        }
    }

    async deleteCodigoRetencion(id: string): Promise<void> {
        const index = MOCK_RETENCIONES.findIndex(r => r.id === id);
        if (index >= 0) {
            MOCK_RETENCIONES.splice(index, 1);
        }
    }
}
