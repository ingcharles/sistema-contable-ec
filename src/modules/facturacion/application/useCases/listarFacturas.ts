/**
 * Caso de uso: Listar Facturas
 * Obtiene un listado de facturas con filtros opcionales
 */

import { FacturaViewModel, FiltroFactura } from '../models/FacturaViewModel';
import { facturacionApi } from '../../infrastructure/api/facturacionApi';
import { facturaMapper } from '../../infrastructure/mapper/facturaMapper';

export interface ListarFacturasQuery {
    filtros?: FiltroFactura;
    pagina?: number;
    tamanoPagina?: number;
}

export interface ListarFacturasResult {
    success: boolean;
    facturas: FacturaViewModel[];
    total: number;
    mensaje?: string;
}

/**
 * Lista las facturas aplicando filtros opcionales
 */
export async function listarFacturas(
    query: ListarFacturasQuery = {}
): Promise<ListarFacturasResult> {
    try {
        const { filtros, pagina = 1, tamanoPagina = 10 } = query;

        // Llamar al API
        const response = await facturacionApi.listarFacturas({
            ...filtros,
            pagina,
            tamanoPagina,
        });

        // Mapear DTOs a ViewModels
        const facturas = response.data.map((dto: any) => facturaMapper.toViewModel(dto));

        return {
            success: true,
            facturas,
            total: response.total,
        };
    } catch (error) {
        console.error('Error al listar facturas:', error);
        return {
            success: false,
            facturas: [],
            total: 0,
            mensaje: error instanceof Error ? error.message : 'Error al listar facturas',
        };
    }
}
