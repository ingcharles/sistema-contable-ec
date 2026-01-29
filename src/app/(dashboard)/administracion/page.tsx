'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Users,
    Building2,
    Store,
    Settings,
    ShieldCheck,
    ShieldAlert,
    ArrowRight,
    TrendingUp
} from 'lucide-react';

interface Estadisticas {
    totalUsuarios: number;
    puntosActivos: number;
    totalSucursales: number;
}

const ADMIN_CARDS = [
    {
        title: 'Gestión de Usuarios',
        description: 'Administrar usuarios, roles y permisos de acceso.',
        icon: Users,
        href: '/administracion/usuarios',
        color: 'bg-blue-500',
        statKey: 'totalUsuarios' as keyof Estadisticas,
        statLabel: 'usuarios activos'
    },
    {
        title: 'Puntos de Emisión',
        description: 'Configurar puntos de emisión y asignar usuarios.',
        icon: Building2,
        href: '/administracion/puntos-emision',
        color: 'bg-emerald-500',
        statKey: 'puntosActivos' as keyof Estadisticas,
        statLabel: 'puntos configurados'
    },
    {
        title: 'Sucursales',
        description: 'Administrar establecimientos y sucursales.',
        icon: Store,
        href: '/administracion/sucursales',
        color: 'bg-violet-500',
        statKey: 'totalSucursales' as keyof Estadisticas,
        statLabel: 'establecimientos'
    },
    {
        title: 'Configuración General',
        description: 'Parámetros del sistema, SRI y firma electrónica.',
        icon: Settings,
        href: '/administracion/configuracion',
        color: 'bg-slate-600',
        statKey: null,
        statLabel: 'Ir a configuración'
    },
    {
        title: 'Auditoría de Seguridad',
        description: 'Revisar intentos de acceso no autorizado.',
        icon: ShieldAlert,
        href: '/auditoria/intentos-acceso',
        color: 'bg-red-500',
        statKey: null,
        statLabel: 'Ver intentos'
    }
];

export default function AdminDashboardPage() {
    const [estadisticas, setEstadisticas] = useState<Estadisticas>({
        totalUsuarios: 0,
        puntosActivos: 0,
        totalSucursales: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            const response = await fetch('/api/administracion/estadisticas');
            if (!response.ok) throw new Error('Error al cargar estadísticas');
            const data = await response.json();
            setEstadisticas(data);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <ShieldCheck className="text-slate-900" size={28} />
                    Administración del Sistema
                </h1>
                <p className="text-slate-500 mt-2 max-w-2xl">
                    Bienvenido al panel de administración. Aquí puedes gestionar usuarios,
                    configurar puntos de emisión y ajustar parámetros generales de la empresa.
                </p>
            </div>

            {/* Statistics Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Users size={32} className="opacity-80" />
                        <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide">Usuarios Activos</p>
                    {loading ? (
                        <div className="h-10 w-24 bg-white/20 rounded-lg animate-pulse mt-2" />
                    ) : (
                        <p className="text-4xl font-bold mt-2">{estadisticas.totalUsuarios}</p>
                    )}
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Building2 size={32} className="opacity-80" />
                        <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide">Puntos de Emisión</p>
                    {loading ? (
                        <div className="h-10 w-24 bg-white/20 rounded-lg animate-pulse mt-2" />
                    ) : (
                        <p className="text-4xl font-bold mt-2">{estadisticas.puntosActivos}</p>
                    )}
                </div>

                <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Store size={32} className="opacity-80" />
                        <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wide">Sucursales</p>
                    {loading ? (
                        <div className="h-10 w-24 bg-white/20 rounded-lg animate-pulse mt-2" />
                    ) : (
                        <p className="text-4xl font-bold mt-2">{estadisticas.totalSucursales}</p>
                    )}
                </div>
            </div>

            {/* Navigation Cards Grid */}
            <div>
                <h2 className="text-lg font-bold text-slate-700 mb-4">Accesos Rápidos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ADMIN_CARDS.map((card) => {
                        const Icon = card.icon;
                        const statValue = card.statKey ? estadisticas[card.statKey] : null;
                        const displayStat = statValue !== null
                            ? `${statValue} ${card.statLabel}`
                            : card.statLabel;

                        return (
                            <Link
                                key={card.href}
                                href={card.href}
                                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${card.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors`}>
                                        <Icon size={24} className={card.color.replace('bg-', 'text-')} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1 mb-4">
                                            {card.description}
                                        </p>
                                        <div className="flex items-center text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
                                            {loading && card.statKey ? (
                                                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                                            ) : (
                                                <>
                                                    {displayStat}
                                                    <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
