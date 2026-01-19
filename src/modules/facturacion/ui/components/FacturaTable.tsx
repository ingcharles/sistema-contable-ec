'use client';

/**
 * Tabla para mostrar listado de facturas
 */

import { FacturaViewModel } from '../../application/models/FacturaViewModel';
import { formatearDinero } from '@/shared/utils/formatearDinero';

export interface FacturaTableProps {
    facturas: FacturaViewModel[];
    loading?: boolean;
    onSeleccionar?: (factura: FacturaViewModel) => void;
}

export function FacturaTable({ facturas, loading, onSeleccionar }: FacturaTableProps) {
    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sri-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando facturas...</p>
            </div>
        );
    }

    if (facturas.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>No se encontraron facturas</p>
            </div>
        );
    }

    const getEstadoBadge = (estado: string) => {
        const badges = {
            BORRADOR: 'bg-yellow-100 text-yellow-800',
            AUTORIZADA: 'bg-green-100 text-green-800',
            ANULADA: 'bg-red-100 text-red-800',
        };
        return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Número
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            RUC
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {facturas.map((factura) => (
                        <tr
                            key={factura.id}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => onSeleccionar?.(factura)}
                        >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {factura.estab}-{factura.ptoEmi}-{factura.secuencial}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(factura.fechaEmision).toLocaleDateString('es-EC')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                                {factura.razonSocialAdquirente}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {factura.identificacionAdquirente}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                {formatearDinero(factura.importeTotal)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(factura.estado)}`}>
                                    {factura.estado}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                <button className="text-sri-blue hover:text-sri-light mr-3">
                                    Ver
                                </button>
                                {factura.estado === 'AUTORIZADA' && (
                                    <button className="text-green-600 hover:text-green-900">
                                        XML
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
