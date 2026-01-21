/**
 * Mapper para convertir entre DTOs del backend y ViewModels del frontend
 */

import { FacturaViewModel } from './FacturaViewModel';

/**
 * DTO que viene del backend (ajustar según la estructura real del backend)
 */
interface FacturaDTO {
    id?: string;
    numeroFactura: string;
    fechaEmision: string;
    cliente: {
        id: string;
        ruc: string;
        razonSocial: string;
        direccion: string;
        email?: string;
    };
    detalles: DetalleDTO[];
    subtotal: number;
    totalDescuento: number;
    subtotalSinImpuestos: number;
    totalIVA: number;
    total: number;
    formaPago: string;
    estado: string;
    claveAcceso?: string;
    fechaAutorizacion?: string;
    numeroAutorizacion?: string;
    observaciones?: string;
}

interface DetalleDTO {
    id?: string;
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    codigoIVA: string;
    subtotal: number;
    iva: number;
    total: number;
}

export const facturaMapper = {
    /**
     * Convierte ViewModel a DTO para enviar al backend
     */
    toDTO(viewModel: FacturaViewModel): FacturaDTO {
        return {
            id: viewModel.id,
            numeroFactura: `${viewModel.estab}-${viewModel.ptoEmi}-${viewModel.secuencial}`,
            fechaEmision: viewModel.fechaEmision,
            cliente: {
                id: '', // No disponible en el ViewModel actual
                ruc: viewModel.identificacionAdquirente,
                razonSocial: viewModel.razonSocialAdquirente,
                direccion: viewModel.direccionAdquirente || '',
                email: viewModel.emailAdquirente,
            },
            detalles: viewModel.detalles.map((detalle) => ({
                id: detalle.id,
                productoId: detalle.productoId,
                descripcion: detalle.descripcion,
                cantidad: detalle.cantidad,
                precioUnitario: detalle.precioUnitario,
                descuento: detalle.descuento,
                codigoIVA: detalle.codigoIVA,
                subtotal: detalle.baseImponible,
                iva: detalle.valorIVA,
                total: detalle.total,
            })),
            subtotal: viewModel.totalSinImpuestos,
            totalDescuento: viewModel.totalDescuento,
            subtotalSinImpuestos: viewModel.totalSinImpuestos,
            totalIVA: viewModel.totalIVA,
            total: viewModel.importeTotal,
            formaPago: viewModel.pagos[0]?.formaPago || '01',
            estado: viewModel.estado,
            claveAcceso: viewModel.claveAcceso,
            fechaAutorizacion: viewModel.fechaAutorizacion,
            numeroAutorizacion: viewModel.numeroAutorizacion,
            observaciones: viewModel.observaciones,
        };
    },

    /**
     * Convierte DTO del backend a ViewModel para el frontend
     */
    toViewModel(dto: FacturaDTO): FacturaViewModel {
        const [estab, ptoEmi, secuencial] = dto.numeroFactura.split('-');
        return {
            id: dto.id,
            ambiente: '1',
            tipoEmision: '1',
            razonSocial: '', // Info de la empresa emisora
            ruc: '',
            codDoc: '01',
            estab: estab || '001',
            ptoEmi: ptoEmi || '001',
            secuencial: secuencial || '000000001',
            dirMatriz: '',
            fechaEmision: dto.fechaEmision,
            obligadoContabilidad: 'NO',
            tipoIdentificacionAdquirente: '05', // Default cédula
            razonSocialAdquirente: dto.cliente.razonSocial,
            identificacionAdquirente: dto.cliente.ruc,
            direccionAdquirente: dto.cliente.direccion,
            emailAdquirente: dto.cliente.email,
            detalles: dto.detalles.map((detalle) => ({
                id: detalle.id,
                productoId: detalle.productoId,
                codigoPrincipal: '',
                descripcion: detalle.descripcion,
                cantidad: detalle.cantidad,
                precioUnitario: detalle.precioUnitario,
                descuento: detalle.descuento,
                codigoIVA: detalle.codigoIVA,
                baseImponible: detalle.subtotal,
                valorIVA: detalle.iva,
                total: detalle.total,
            })),
            totalSinImpuestos: dto.subtotalSinImpuestos,
            totalDescuento: dto.totalDescuento,
            totalIVA: dto.totalIVA,
            importeTotal: dto.total,
            pagos: [{ formaPago: dto.formaPago, total: dto.total }],
            estado: dto.estado as 'BORRADOR' | 'AUTORIZADA' | 'ANULADA',
            claveAcceso: dto.claveAcceso,
            fechaAutorizacion: dto.fechaAutorizacion,
            numeroAutorizacion: dto.numeroAutorizacion,
            observaciones: dto.observaciones,
        };
    },
};
