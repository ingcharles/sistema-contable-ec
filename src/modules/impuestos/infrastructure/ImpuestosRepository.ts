import { FormularioSRI, AnexoTransaccional, ImpuestosRepository } from '../domain/types';

const MOCK_FORMULARIOS: FormularioSRI[] = [
    {
        id: 'f104-1',
        empresaId: '1',
        tipo: '104',
        periodo: '2023-09',
        totalVentas: 15000,
        totalCompras: 8000,
        impuestoCausado: 840,
        retencionesRecibidas: 200,
        saldoAFavor: 0,
        valorAPagar: 640,
        estado: 'PRESENTADO',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

const MOCK_ANEXOS: AnexoTransaccional[] = [
    {
        id: 'ats-1',
        empresaId: '1',
        periodo: '2023-09',
        estado: 'GENERADO',
        createdAt: '', updatedAt: '', createdBy: ''
    }
];

export class InMemoryImpuestosRepository implements ImpuestosRepository {
    async getFormularios(empresaId: string, tipo: string): Promise<FormularioSRI[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_FORMULARIOS.filter(f => f.empresaId === empresaId && f.tipo === tipo);
    }

    async generarFormulario(empresaId: string, tipo: string, periodo: string): Promise<FormularioSRI> {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const nuevo: FormularioSRI = {
            id: Math.random().toString(36),
            empresaId,
            tipo: tipo as '103' | '104',
            periodo,
            totalVentas: 12000,
            totalCompras: 5000,
            impuestoCausado: 1000,
            retencionesRecibidas: 150,
            saldoAFavor: 0,
            valorAPagar: 850,
            estado: 'BORRADOR',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
        };
        MOCK_FORMULARIOS.push(nuevo);
        return nuevo;
    }

    async getAnexos(empresaId: string): Promise<AnexoTransaccional[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_ANEXOS.filter(a => a.empresaId === empresaId);
    }

    async generarATS(empresaId: string, periodo: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        MOCK_ANEXOS.push({
            id: Math.random().toString(36),
            empresaId,
            periodo,
            estado: 'GENERADO',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'admin'
        });
    }
}
