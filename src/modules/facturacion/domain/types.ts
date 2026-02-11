import { FacturaViewModel } from './FacturaViewModel';
import { SriRespuesta } from './SriTypes';
export { type FacturaViewModel, type SriRespuesta };
import { Factura } from '@/shared/types';

import { Proforma } from './Proforma';
import { Transportista } from './Transportista';
export { type Proforma, type Transportista };

export interface VentasRepository {
    getFacturas(empresaId: string): Promise<Factura[]>;
    saveFactura(factura: Factura): Promise<void>;
    deleteFactura(id: string): Promise<void>;
}
