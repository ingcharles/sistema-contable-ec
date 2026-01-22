'use client';

import { useState, useEffect } from 'react';
import { Landmark, Save, Hash, Building2, Coins, FileText } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { CuentaBancaria, TipoCuenta } from '../../domain/types';
import { BancosUseCases, ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';

interface CuentaBancariaModalProps {
    cuenta?: CuentaBancaria;
    onClose: () => void;
    onSave: () => void;
}

export const CuentaBancariaModal = ({ cuenta, onClose, onSave }: CuentaBancariaModalProps) => {
    const [formData, setFormData] = useState({
        banco: cuenta?.banco || '',
        numeroCuenta: cuenta?.numeroCuenta || '',
        tipoCuenta: cuenta?.tipo || TipoCuenta.CORRIENTE,
        moneda: cuenta?.moneda || 'USD',
        cuentaContableCodigo: cuenta?.cuentaContableCodigo || '',
        saldoInicial: cuenta?.saldoContable || 0,
        activa: true
    });

    const [cuentasContables, setCuentasContables] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingCuentas, setLoadingCuentas] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadCuentasContables = async () => {
            setLoadingCuentas(true);
            try {
                const response = await ContabilidadUseCases.listarCuentas();
                const cuentas = response.data || [];
                setCuentasContables(cuentas);
            } catch (error) {
                console.error('Error cargando cuentas contables:', error);
            } finally {
                setLoadingCuentas(false);
            }
        };
        loadCuentasContables();
    }, []);

    const filteredCuentas = cuentasContables.filter(c =>
        c.codigo.includes(searchTerm) ||
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await BancosUseCases.guardarCuenta({
                ...formData,
                id: cuenta?.id
            });
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error al guardar cuenta bancaria:', error);
            alert(error.message || 'Error al guardar la cuenta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={cuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            description="Configure los detalles de la cuenta y su vinculación contable."
            icon={<Landmark size={24} />}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2">
                        <Save size={18} />
                        {loading ? 'Guardando...' : 'Guardar Cuenta'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Banco */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Building2 size={16} className="text-sri-blue" /> Institución Financiera
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue focus:border-transparent outline-none transition-all"
                        placeholder="Ej: Banco Pichincha"
                        value={formData.banco}
                        onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    />
                </div>

                {/* Número de Cuenta */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Hash size={16} className="text-sri-blue" /> Número de Cuenta
                    </label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue focus:border-transparent outline-none transition-all"
                        placeholder="0000000000"
                        value={formData.numeroCuenta}
                        onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                    />
                </div>

                {/* Tipo de Cuenta */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <FileText size={16} className="text-sri-blue" /> Tipo de Cuenta
                    </label>
                    <select
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none"
                        value={formData.tipoCuenta}
                        onChange={(e) => setFormData({ ...formData, tipoCuenta: e.target.value as TipoCuenta })}
                    >
                        <option value={TipoCuenta.CORRIENTE}>Corriente</option>
                        <option value={TipoCuenta.AHORROS}>Ahorros</option>
                    </select>
                </div>

                {/* Moneda */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Coins size={16} className="text-sri-blue" /> Moneda
                    </label>
                    <select
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none"
                        value={formData.moneda}
                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    >
                        <option value="USD">Dólares (USD)</option>
                        <option value="EUR">Euros (EUR)</option>
                    </select>
                </div>

                {/* Saldo Inicial (Solo si es nueva) */}
                {!cuenta && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Landmark size={16} className="text-sri-blue" /> Saldo Inicial
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none"
                            value={formData.saldoInicial}
                            onChange={(e) => setFormData({ ...formData, saldoInicial: parseFloat(e.target.value) })}
                        />
                    </div>
                )}

                {/* Vinculación Contable */}
                <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                        <FileText size={16} className="text-sri-blue" /> Vinculación Contable
                    </label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="🔍 Buscar cuenta contable..."
                            className="w-full p-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none bg-white font-mono text-sm"
                            value={formData.cuentaContableCodigo}
                            onChange={(e) => setFormData({ ...formData, cuentaContableCodigo: e.target.value })}
                            disabled={loadingCuentas}
                        >
                            <option value="">-- Seleccionar Cuenta --</option>
                            {filteredCuentas.slice(0, 100).map((c) => (
                                <option key={c.id} value={c.codigo}>
                                    {c.codigo.padEnd(12, ' ')} | {c.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">
                        Se muestran los primeros 100 resultados. Use el buscador para filtrar por código o nombre.
                    </p>
                </div>

                {/* Estado Activa */}
                <div className="flex items-center gap-3 md:col-span-2">
                    <input
                        type="checkbox"
                        id="activa"
                        className="h-5 w-5 rounded border-slate-300 text-sri-blue focus:ring-sri-blue"
                        checked={formData.activa}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    />
                    <label htmlFor="activa" className="text-sm font-medium text-slate-700">
                        Cuenta Activa (Disponible para movimientos)
                    </label>
                </div>
            </form>
        </Modal>
    );
};
