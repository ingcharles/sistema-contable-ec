'use client';

import { PlanCuentasTree } from '@/modules/contabilidad/ui/components/PlanCuentasTree';

export default function PlanCuentasPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Plan de Cuentas</h1>
                    <p className="text-slate-500 text-sm mt-1">Estructura jerárquica de cuentas contables.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[500px]">
                <PlanCuentasTree />
            </div>
        </div>
    );
}
