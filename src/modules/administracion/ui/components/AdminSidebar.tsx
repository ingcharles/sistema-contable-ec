'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    Building2,
    Store,
    Settings,
    FileText,
    LayoutDashboard,
    ShieldCheck
} from 'lucide-react';

const ADMIN_MENU_ITEMS = [
    {
        label: 'Dashboard',
        path: '/administracion',
        icon: LayoutDashboard
    },
    {
        label: 'Usuarios',
        path: '/administracion/usuarios',
        icon: Users
    },
    {
        label: 'Puntos de Emisión',
        path: '/administracion/puntos-emision',
        icon: Building2
    },
    {
        label: 'Sucursales',
        path: '/administracion/sucursales',
        icon: Store
    },
    {
        label: 'Configuración',
        path: '/administracion/configuracion',
        icon: Settings
    },
    {
        label: 'Auditoría',
        path: '/administracion/auditoria',
        icon: FileText
    }
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-5rem)] hidden lg:block">
            <div className="p-6">
                <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="p-2 bg-slate-900 rounded-lg text-white">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-sm">Administración</h2>
                        <p className="text-xs text-slate-500">Panel de Control</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {ADMIN_MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <Icon size={18} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-6 mt-auto border-t border-slate-100">
                <div className="bg-blue-50 p-4 rounded-xl">
                    <h3 className="text-xs font-bold text-blue-800 mb-1">Modo Administrador</h3>
                    <p className="text-[10px] text-blue-600 leading-relaxed">
                        Estás realizando cambios que afectan a toda la configuración de la empresa.
                    </p>
                </div>
            </div>
        </aside>
    );
}
