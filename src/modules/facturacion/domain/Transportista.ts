import { Auditable } from '@/shared/types';

export interface Transportista extends Auditable {
    id: string;
    empresaId: string;
    ruc: string;
    razonSocial: string;
    placa: string;
    email?: string;
}
