'use client';

/**
 * Componente de filtros para facturas
 */

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';

export interface FacturaFiltroProps {
    onFiltrar?: (filtros: any) => void;
}

export function FacturaFiltro({ onFiltrar }: FacturaFiltroProps) {
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [estado, setEstado] = useState('');

    const handleFiltrar = () => {
        onFiltrar?.({
            fechaDesde: fechaDesde || undefined,
            fechaHasta: fechaHasta || undefined,
            numeroFactura: numeroFactura || undefined,
            estado: estado || undefined,
        });
    };

    const handleLimpiar = () => {
        setFechaDesde('');
        setFechaHasta('');
        setNumeroFactura('');
        setEstado('');
        onFiltrar?.({});
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Filtros</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Desde
                    </label>
                    <Input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Hasta
                    </label>
                    <Input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Factura
                    </label>
                    <Input
                        type="text"
                        value={numeroFactura}
                        onChange={(e) => setNumeroFactura(e.target.value)}
                        placeholder="001-001-000000001"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                    </label>
                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-sri-blue focus:ring-sri-blue"
                    >
                        <option value="">Todos</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="AUTORIZADA">Autorizada</option>
                        <option value="ANULADA">Anulada</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-2">
                <Button onClick={handleFiltrar} variant="primary">
                    Filtrar
                </Button>
                <Button onClick={handleLimpiar} variant="secondary">
                    Limpiar
                </Button>
            </div>
        </div>
    );
}
