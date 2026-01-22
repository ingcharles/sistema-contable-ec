'use client';

import { useState, useEffect } from 'react';
import { Landmark, Save, Calendar, CreditCard } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { BancosUseCases, NominaUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface PagarRolModalProps {
    rol: any;
    onClose: () => void;
    onSave: () => void;
}

export const PagarRolModal = ({ rol, onClose, onSave }: PagarRolModalProps) => {
    const [cuentas, setCuentas] = useState<any[]>([]);
    const [cuentaId, setCuentaId] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [referencia, setReferencia] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCuentas = async () => {
            try {
                const data = await BancosUseCases.listarCuentas();
                setCuentas(data);
                if (data.length > 0) setCuentaId(data[0].id);
            } catch (error) {
                console.error('Error cargando cuentas:', error);
            }
        };
        loadCuentas();
    }, []);

    const handlePagar = async () => {
        if (!cuentaId) {
            alert('Debe seleccionar una cuenta bancaria');
            return;
        }

        setLoading(true);
        try {
            await NominaUseCases.pagarRol({
                rolId: rol.id,
                cuentaBancoId: cuentaId,
                fechaPago: fecha,
                referencia
            });
            onSave();
            onClose();
        } catch (error: any) {
            alert(error.message || 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Registrar Pago de Nómina"
            description={`Pago de sueldo para ${rol.nombres} ${rol.apellidos} - Periodo ${rol.periodo}`}
            icon={<CreditCard size={24} />}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handlePagar} disabled={loading} className="flex items-center gap-2">
                        <Save size={18} />
                        {loading ? 'Procesando...' : 'Confirmar Pago'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Valor a Pagar</p>
                        <p className="text-2xl font-black text-slate-800">{formatMoney(rol.neto_pagar)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Landmark size={16} className="text-sri-blue" /> Cuenta Bancaria
                        </label>
                        <select
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none bg-white"
                            value={cuentaId}
                            onChange={(e) => setCuentaId(e.target.value)}
                        >
                            <option value="">Seleccione una cuenta...</option>
                            {cuentas.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.banco} - {c.numero_cuenta} (Saldo: {formatMoney(c.saldo_actual)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Calendar size={16} className="text-sri-blue" /> Fecha de Pago
                        </label>
                        <input
                            type="date"
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <CreditCard size={16} className="text-sri-blue" /> Referencia / Comprobante
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Transf. 12345"
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sri-blue outline-none"
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};
