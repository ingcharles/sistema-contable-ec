/**
 * Caso de uso: Registrar Factura
 * Orquesta el proceso de creación de una nueva factura
 */

import { FacturaViewModel } from '../models/FacturaViewModel';
import { facturacionApi } from '../../infrastructure/api/facturacionApi';
import { facturaMapper } from '../../infrastructure/mapper/facturaMapper';

export interface RegistrarFacturaCommand {
    factura: FacturaViewModel;
}

export interface RegistrarFacturaResult {
    success: boolean;
    facturaId?: string;
    mensaje: string;
    errores?: string[];
}

/**
 * Registra una nueva factura en el sistema
 */
export async function registrarFactura(
    command: RegistrarFacturaCommand
): Promise<RegistrarFacturaResult> {
    try {
        // Validaciones de negocio
        const errores = validarFactura(command.factura);
        if (errores.length > 0) {
            return {
                success: false,
                mensaje: 'La factura contiene errores de validación',
                errores,
            };
        }

        // Mapear a DTO del backend
        const facturaDTO = facturaMapper.toDTO(command.factura);

        // Llamar al API
        const response = await facturacionApi.registrarFactura(facturaDTO);

        return {
            success: true,
            facturaId: response.id,
            mensaje: 'Factura registrada exitosamente',
        };
    } catch (error) {
        console.error('Error al registrar factura:', error);
        return {
            success: false,
            mensaje: error instanceof Error ? error.message : 'Error al registrar factura',
        };
    }
}

/**
 * Validaciones de negocio para la factura
 */
function validarFactura(factura: FacturaViewModel): string[] {
    const errores: string[] = [];

    if (!factura.identificacionAdquirente) {
        errores.push('El RUC del cliente es obligatorio');
    }

    if (!factura.razonSocialAdquirente) {
        errores.push('La razón social del cliente es obligatoria');
    }

    if (!factura.detalles || factura.detalles.length === 0) {
        errores.push('La factura debe tener al menos un detalle');
    }

    if (factura.detalles) {
        factura.detalles.forEach((detalle, index) => {
            if (detalle.cantidad <= 0) {
                errores.push(`Detalle ${index + 1}: La cantidad debe ser mayor a 0`);
            }
            if (detalle.precioUnitario <= 0) {
                errores.push(`Detalle ${index + 1}: El precio unitario debe ser mayor a 0`);
            }
        });
    }

    return errores;
}
