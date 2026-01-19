import { TipoIdentificacion } from '@/shared/types';
import { Tercero, TipoTercero, DirectorioRepository } from '../domain/types';

const MOCK_TERCEROS: Tercero[] = [
    {
        id: 't1',
        empresaId: '1',
        tipo: TipoTercero.CLIENTE,
        tipoIdentificacion: TipoIdentificacion.RUC,
        identificacion: '1790016919001',
        razonSocial: 'CORPORACIÓN FAVORITA C.A.',
        direccion: 'Av. Amazonas, Quito',
        email: 'info@favorita.com',
        esContribuyenteEspecial: true,
        llevaContabilidad: true,
        parteRelacionada: false,
        createdAt: '', updatedAt: '', createdBy: ''
    },
    {
        id: 't2',
        empresaId: '1',
        tipo: TipoTercero.PROVEEDOR,
        tipoIdentificacion: TipoIdentificacion.RUC,
        identificacion: '1791256115001',
        razonSocial: 'CONECEL S.A.',
        direccion: 'Av. Juan Tanca Marengo, Guayaquil',
        email: 'pagos@claro.com.ec',
        esContribuyenteEspecial: true,
        llevaContabilidad: true,
        parteRelacionada: false,
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryDirectorioRepository implements DirectorioRepository {
    async getTerceros(empresaId: string, tipo?: TipoTercero): Promise<Tercero[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_TERCEROS.filter(t =>
            t.empresaId === empresaId &&
            (!tipo || t.tipo === tipo || t.tipo === TipoTercero.AMBOS)
        );
    }

    async saveTercero(tercero: Tercero): Promise<void> {
        const idx = MOCK_TERCEROS.findIndex(t => t.id === tercero.id);
        if (idx >= 0) MOCK_TERCEROS[idx] = tercero;
        else MOCK_TERCEROS.push(tercero);
    }

    async deleteTercero(id: string): Promise<void> {
        const idx = MOCK_TERCEROS.findIndex(t => t.id === id);
        if (idx >= 0) MOCK_TERCEROS.splice(idx, 1);
    }
}
