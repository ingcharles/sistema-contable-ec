'use client';

import { useState } from 'react';
import { CalendarOff, AlertTriangle, Lock } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { useToast } from '@/shared/context/ToastContext';

export default function CierrePeriodosConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { parametros, guardarParametros } = useConfiguracion();
    const { showToast } = useToast();
    const [fechaCierre, setFechaCierre] = useState(parametros?.fechaCierre || '');

    const handleGuardarCierre = async () => {
        if (!currentEmpresa || !parametros) return;
        try {
            await guardarParametros({ ...parametros, fechaCierre });
            showToast('Fecha de cierre actualizada exitosamente.', 'success');
        } catch (error) {
            showToast('Error al actualizar fecha de cierre', 'error');
        }
    };

    if (!currentEmpresa) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CalendarOff className="text-sri-blue" /> Cierre de Periodos
                </h1>
                <p className="text-slate-500 text-sm mt-1">Bloquee periodos contables para evitar modificaciones históricas.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Lock size={20} className="text-red-500" /> Bloqueo de Periodos
                    </h3>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-600 mt-1" size={20} />
                            <div>
                                <h4 className="text-sm font-bold text-red-800">Advertencia de Seguridad</h4>
                                <p className="text-xs text-red-700 mt-1">
                                    Al establecer una fecha de cierre, el sistema <strong>bloqueará</strong> la creación, edición o anulación de cualquier documento con fecha anterior.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="max-w-md">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Cierre Efectiva</label>
                        <div className="flex gap-4 items-center">
                            <input
                                type="date"
                                value={fechaCierre}
                                onChange={e => setFechaCierre(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                            />
                            <button
                                onClick={handleGuardarCierre}
                                className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg transition-colors whitespace-nowrap"
                            >
                                Bloquear Periodos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
