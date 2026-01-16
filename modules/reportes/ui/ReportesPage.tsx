
import React from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, Table } from 'lucide-react';
import { PLAN_CUENTAS } from '../../../constants';

const exportToCSV = (title: string, data: any[]) => {
    if (!data.length) {
        alert("No hay datos para exportar");
        return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Datos Mock para demostración de reportes funcionales
const MOCK_BALANCE = PLAN_CUENTAS.map(c => ({
    Codigo: c.codigo,
    Cuenta: c.nombre,
    Nivel: c.nivel,
    Tipo: c.tipo,
    Saldo: c.saldo
}));

const MOCK_RESULTADOS = [
    { Cuenta: "VENTAS NETAS", Saldo: 24500.00 },
    { Cuenta: "COSTO DE VENTAS", Saldo: -12500.00 },
    { Cuenta: "UTILIDAD BRUTA", Saldo: 12000.00 },
    { Cuenta: "GASTOS ADMINISTRATIVOS", Saldo: -4500.00 },
    { Cuenta: "GASTOS VENTAS", Saldo: -2000.00 },
    { Cuenta: "UTILIDAD OPERATIVA", Saldo: 5500.00 }
];

const ReportCard = ({ title, description, icon: Icon, color, onGenerate }: { title: string, description: string, icon: any, color: string, onGenerate: () => void }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <Icon size={24} className="text-white" />
        </div>
        <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-4 h-10">{description}</p>
        <button 
            onClick={onGenerate}
            className="text-sm font-medium text-slate-600 hover:text-sri-blue flex items-center gap-2 group-hover:underline w-full"
        >
            <Download size={16} /> Descargar CSV
        </button>
    </div>
);

export const ReportesPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800">Centro de Reportes</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Generación de informes contables, financieros y tributarios.
                </p>
                
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Rango de Fechas</label>
                        <div className="flex items-center gap-2">
                             <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-sri-blue/20" />
                             <span className="text-slate-400">-</span>
                             <input type="date" className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-sri-blue/20" />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Formato de Salida</label>
                         <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full outline-none bg-white">
                            <option>CSV (Excel Compatible)</option>
                            <option>PDF (Documento Adobe)</option>
                            <option>XML (Formato SRI)</option>
                         </select>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Sección Contable */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Table className="text-sri-blue" size={20} /> Estados Financieros (NIIF)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ReportCard 
                            title="Balance General" 
                            description="Estado de situación financiera de la empresa a la fecha de corte."
                            icon={BarChart3}
                            color="bg-blue-500"
                            onGenerate={() => exportToCSV('Balance_General', MOCK_BALANCE)}
                        />
                        <ReportCard 
                            title="Estado de Resultados" 
                            description="Pérdidas y Ganancias (P&G) detallado por cuentas de ingreso y gasto."
                            icon={PieChart}
                            color="bg-emerald-500"
                            onGenerate={() => exportToCSV('Estado_Resultados', MOCK_RESULTADOS)}
                        />
                         <ReportCard 
                            title="Libro Diario" 
                            description="Detalle cronológico de todos los asientos contables generados."
                            icon={FileText}
                            color="bg-slate-600"
                            onGenerate={() => alert('Generando Libro Diario completo...')}
                        />
                        <ReportCard 
                            title="Balance de Comprobación" 
                            description="Resumen de saldos deudor y acreedor de todas las cuentas."
                            icon={Table}
                            color="bg-indigo-500"
                            onGenerate={() => exportToCSV('Balance_Comprobacion', MOCK_BALANCE)}
                        />
                    </div>
                </div>

                {/* Sección Tributaria */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="text-sri-blue" size={20} /> Reportes Tributarios (SRI)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <ReportCard 
                            title="Reporte de Retenciones" 
                            description="Retenciones en la fuente de IVA y Renta emitidas y recibidas."
                            icon={FileText}
                            color="bg-orange-500"
                            onGenerate={() => alert('Descargando reporte de retenciones...')}
                        />
                        <ReportCard 
                            title="Talón Resumen 104" 
                            description="Datos consolidados para el formulario de IVA Mensual."
                            icon={FileText}
                            color="bg-rose-500"
                            onGenerate={() => alert('Generando talón resumen...')}
                        />
                         <ReportCard 
                            title="Anexo Transaccional (ATS)" 
                            description="Generación del XML para el Anexo Transaccional Simplificado."
                            icon={FileText}
                            color="bg-violet-500"
                            onGenerate={() => alert('Vaya al módulo de impuestos para generar el ATS completo.')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
