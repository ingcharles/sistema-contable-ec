import { GuiaRemision, GuiaRemisionRepository, Transportista } from '../domain/guias';
import { EstadoSRI } from '@/shared/types';

export class InMemoryGuiaRemisionRepository implements GuiaRemisionRepository {
    private static guias: GuiaRemision[] = [
        {
            id: 'g1',
            empresaId: 'emp1',
            secuencial: '001-001-000000001',
            fechaEmision: '2023-10-25',
            fechaInicioTraslado: '2023-10-25',
            fechaFinTraslado: '2023-10-26',
            puntoPartida: 'Quito, Av. Amazonas N32',
            transportista: {
                id: 't1',
                razonSocial: 'TRANSPORTE RAPIDO S.A.',
                ruc: '1790001234001',
                placa: 'PBA-1234'
            },
            destinatarios: [
                {
                    identificacion: '1790016919001',
                    razonSocial: 'SUPERMAXI S.A.',
                    direccionDestino: 'Guayaquil, Av. Juan Tanca Marengo',
                    motivoTraslado: '01' as any,
                    ruta: 'Quito - Guayaquil',
                    items: [
                        { codigo: 'P001', descripcion: 'LAPTOP HP', cantidad: 5 }
                    ]
                }
            ],
            estado: EstadoSRI.AUTORIZADO,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'admin'
        }
    ];

    private static transportistas: Transportista[] = [
        { id: 't1', razonSocial: 'TRANSPORTE RAPIDO S.A.', ruc: '1790001234001', placa: 'PBA-1234' },
        { id: 't2', razonSocial: 'LOGISTICA EXPRESS', ruc: '1790005555001', placa: 'PCQ-5678' }
    ];

    async getGuias(empresaId: string): Promise<GuiaRemision[]> {
        return InMemoryGuiaRemisionRepository.guias.filter(g => g.empresaId === empresaId);
    }

    async saveGuia(guia: GuiaRemision): Promise<void> {
        InMemoryGuiaRemisionRepository.guias.push(guia);
    }

    async getTransportistas(_empresaId: string): Promise<Transportista[]> {
        return InMemoryGuiaRemisionRepository.transportistas;
    }
}
