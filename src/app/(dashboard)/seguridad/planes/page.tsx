
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { PlanesUseCases } from '@/modules/seguridad/application/useCases/PlanesUseCases';
import { Plan } from '@/shared/types';
import { useToast } from '@/shared/context/ToastContext';

export default function PlanesPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarPlanes();
    }, []);

    const cargarPlanes = async () => {
        try {
            setLoading(true);
            const data = await PlanesUseCases.listarPlanes();
            setPlanes(data);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar planes', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="text-sri-blue" /> Gestión de Planes
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Configure los planes de suscripción y sus permisos.</p>
                </div>
                <Button onClick={() => router.push('/seguridad/planes/nuevo')}>
                    <Plus size={18} className="mr-2" /> Nuevo Plan
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                        <tr>
                            <th className="p-4">Código</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Precio</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Cargando planes...</td></tr>
                        ) : planes.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay planes registrados.</td></tr>
                        ) : (
                            planes.map((plan) => (
                                <tr key={plan.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-500">{plan.codigo}</td>
                                    <td className="p-4 font-medium text-slate-800">{plan.nombre}</td>
                                    <td className="p-4 text-slate-600 font-bold">
                                        {plan.precioMensual > 0 ? `$${plan.precioMensual.toFixed(2)}` : 'Gratis'}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${plan.activo ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                            {plan.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {plan.activo ? 'ACTIVO' : 'INACTIVO'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button
                                            onClick={() => router.push(`/seguridad/planes/${plan.id}`)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Permisos"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
