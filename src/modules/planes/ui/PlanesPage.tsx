'use client';

import { useState, useEffect } from 'react';
import { PlanesUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Plan, PlanFeature } from '@/shared/types';
import { Check, X, Shield, Star, Zap, Building, FileText, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';

export const PlanesPage = () => {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        PlanesUseCases.listarPlanes()
            .then(setPlanes)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-sri-blue text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
                    Suscripciones
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
                    Elige el plan perfecto para tu negocio
                </h1>
                <p className="text-slate-500 text-lg leading-relaxed">
                    Potencia tu contabilidad con nuestras soluciones escalables. <br className="hidden md:block" />
                    Cambia de plan en cualquier momento según tus necesidades.
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                {planes.map((plan, index) => {
                    const isCurrent = user?.planId === plan.id;
                    const isPopular = plan.codigo === 'PROFESIONAL';

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 ${isPopular
                                ? 'bg-white ring-4 ring-sri-blue/10 shadow-2xl scale-105 z-10'
                                : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl'
                                }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sri-blue to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                    <Star size={12} fill="currentColor" /> Más Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isPopular ? 'text-sri-blue' : 'text-slate-700'}`}>
                                    {plan.codigo === 'GRATUITO' && <Shield size={18} />}
                                    {plan.codigo === 'PROFESIONAL' && <Zap size={18} />}
                                    {plan.codigo === 'EMPRESARIAL' && <Building size={18} />}
                                    {plan.nombre}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-slate-900 tracking-tight">${plan.precioMensual}</span>
                                    <span className="text-slate-500 font-medium">/mes</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2 font-medium">
                                    {plan.codigo === 'GRATUITO' ? 'Para emprendedores que inician.' :
                                        plan.codigo === 'PROFESIONAL' ? 'Para contadores y PYMES.' :
                                            'Para grandes empresas y firmas.'}
                                </p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">
                                    Incluye
                                </div>
                                {plan.features?.sort((a, b) => a.featureKey.localeCompare(b.featureKey)).map(feature => (
                                    <FeatureItem key={feature.id} feature={feature} />
                                ))}
                            </div>

                            <button
                                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isCurrent
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : isPopular
                                        ? 'bg-gradient-to-r from-sri-blue to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5'
                                        : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-sri-blue/50 hover:text-sri-blue hover:bg-blue-50/50'
                                    }`}
                                disabled={isCurrent}
                            >
                                {isCurrent ? (
                                    <>
                                        <Check size={18} /> Plan Actual
                                    </>
                                ) : (
                                    'Elegir Plan'
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente auxiliar para renderizar caraterísticas
const FeatureItem = ({ feature }: { feature: PlanFeature }) => {
    let icon = <Check size={14} />;
    let text = feature.featureKey;
    let highlight = false;

    // Formatear texto e íconos según la clave
    switch (feature.featureKey) {
        case 'MAX_EMPRESAS':
            icon = <Building size={14} />;
            text = feature.valueNumber && feature.valueNumber > 100
                ? 'Empresas Ilimitadas'
                : `Hasta ${feature.valueNumber} Empresas`;
            highlight = true;
            break;
        case 'MAX_FACTURAS_MENSUALES':
            icon = <FileText size={14} />;
            text = feature.valueNumber && feature.valueNumber > 10000
                ? 'Facturación Ilimitada'
                : `${feature.valueNumber} Facturas / mes`;
            break;
        case 'IA_ACCESO_LOCAL':
            icon = <Bot size={14} />;
            text = 'Asistente IA Local';
            break;
        case 'IA_ACCESO_NUBE':
            icon = <Sparkles size={14} />;
            text = 'IA Cloud Avanzada (GPT-4)';
            highlight = true;
            break;
        // SRI DOCS LIMITS
        case 'MAX_RETENCIONES_MENSUALES':
        case 'MAX_NOTAS_CREDITO_MENSUALES':
        case 'MAX_GUIAS_MENSUALES':
            // Ocultar estos detalles técnicos para simplificar, o agruparlos
            // Si queremos mostrarlos:
            return null; // Ocultamos para que no se vea tan saturado
        default:
            break;
    }

    const isNegative = feature.valueType === 'BOOLEANO' && feature.valueBool === false;

    if (isNegative) {
        return (
            <div className="flex items-center gap-3 opacity-50">
                <div className="p-1 rounded-full bg-slate-100 text-slate-400">
                    <X size={12} />
                </div>
                <span className="text-sm text-slate-500 line-through decoration-slate-300">
                    {text}
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full flex-shrink-0 ${highlight ? 'bg-blue-100 text-sri-blue' : 'bg-green-100 text-green-600'}`}>
                {icon}
            </div>
            <span className={`text-sm ${highlight ? 'text-slate-800 font-semibold' : 'text-slate-600'}`}>
                {text}
            </span>
        </div>
    );
};
