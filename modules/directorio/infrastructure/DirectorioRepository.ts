
import { DirectorioRepository, Tercero, TipoTercero } from '../domain/types';
import { TipoIdentificacion } from '../../../types';

const MOCK_TERCEROS: Tercero[] = [
    {
        id: 't1',
        empresaId: '1',
        tipoIdentificacion: TipoIdentificacion.RUC,
        identificacion: '1790016919001',
        razonSocial: 'CORPORACIÓN FAVORITA C.A.',
        nombreComercial: 'SUPERMAXI',
        tipo: TipoTercero.CLIENTE,
        direccion: 'Av. General Enríquez, Quito',
        telefono: '022996500',
        email: 'facturacion@favorita.com',
        esContribuyenteEspecial: true,
        obligadoContabilidad: true,
        parteRelacionada: false,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 't2',
        empresaId: '1',
        tipoIdentificacion: TipoIdentificacion.RUC,
        identificacion: '1791256115001',
        razonSocial: 'CONECEL S.A.',
        nombreComercial: 'CLARO',
        tipo: TipoTercero.PROVEEDOR,
        direccion: 'Av. Francisco de Orellana, Guayaquil',
        telefono: '042634444',
        email: 'pagos@claro.com.ec',
        esContribuyenteEspecial: true,
        obligadoContabilidad: true,
        parteRelacionada: false,
        banco: 'BANCO PICHINCHA',
        tipoCuenta: 'CORRIENTE',
        numeroCuenta: '3105544887',
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 't3',
        empresaId: '1',
        tipoIdentificacion: TipoIdentificacion.CEDULA,
        identificacion: '1712345678',
        razonSocial: 'PEREZ LOPEZ JUAN CARLOS',
        tipo: TipoTercero.AMBOS,
        direccion: 'Calle Los Pinos N45',
        telefono: '0999999999',
        email: 'juan.perez@gmail.com',
        esContribuyenteEspecial: false,
        obligadoContabilidad: false,
        parteRelacionada: false,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryDirectorioRepository implements DirectorioRepository {
    async getAll(empresaId: string): Promise<Tercero[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_TERCEROS.filter(t => t.empresaId === empresaId);
    }

    async save(tercero: Tercero): Promise<void> {
        const index = MOCK_TERCEROS.findIndex(t => t.id === tercero.id);
        if (index >= 0) {
            MOCK_TERCEROS[index] = tercero;
        } else {
            MOCK_TERCEROS.push(tercero);
        }
    }

    async delete(id: string): Promise<void> {
        const index = MOCK_TERCEROS.findIndex(t => t.id === id);
        if (index >= 0) {
            MOCK_TERCEROS.splice(index, 1);
        }
    }
}
