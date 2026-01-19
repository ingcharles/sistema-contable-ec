/**
 * Cliente API para el módulo de facturación
 * Maneja todas las peticiones HTTP relacionadas con facturas
 */

import { httpClient } from '@/shared/infrastructure/httpClient';

const BASE_PATH = '/facturacion';

export const facturacionApi = {
    /**
     * Registra una nueva factura
     */
    async registrarFactura(facturaDTO: any): Promise<any> {
        return httpClient.post(`${BASE_PATH}/facturas`, facturaDTO);
    },

    /**
     * Lista facturas con filtros opcionales
     */
    async listarFacturas(filtros: any): Promise<any> {
        const params = new URLSearchParams();

        if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
        if (filtros.clienteId) params.append('clienteId', filtros.clienteId);
        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.numeroFactura) params.append('numeroFactura', filtros.numeroFactura);
        if (filtros.pagina) params.append('pagina', filtros.pagina.toString());
        if (filtros.tamanoPagina) params.append('tamanoPagina', filtros.tamanoPagina.toString());

        const queryString = params.toString();
        return httpClient.get(`${BASE_PATH}/facturas${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Obtiene una factura por ID
     */
    async obtenerFactura(id: string): Promise<any> {
        return httpClient.get(`${BASE_PATH}/facturas/${id}`);
    },

    /**
     * Actualiza una factura existente
     */
    async actualizarFactura(id: string, facturaDTO: any): Promise<any> {
        return httpClient.put(`${BASE_PATH}/facturas/${id}`, facturaDTO);
    },

    /**
     * Anula una factura
     */
    async anularFactura(id: string, motivo: string): Promise<any> {
        return httpClient.post(`${BASE_PATH}/facturas/${id}/anular`, { motivo });
    },

    /**
     * Autoriza una factura en el SRI
     */
    async autorizarFactura(id: string): Promise<any> {
        return httpClient.post(`${BASE_PATH}/facturas/${id}/autorizar`);
    },

    /**
     * Obtiene el XML de una factura
     */
    async obtenerXML(id: string): Promise<any> {
        return httpClient.get(`${BASE_PATH}/facturas/${id}/xml`);
    },

    /**
     * Envía la factura por email
     */
    async enviarEmail(id: string, email: string): Promise<any> {
        return httpClient.post(`${BASE_PATH}/facturas/${id}/enviar-email`, { email });
    },
};
