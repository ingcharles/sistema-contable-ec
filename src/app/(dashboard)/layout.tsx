'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/shared/constants';
import { Bell, Search, ChevronDown, Menu, User, Building, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { AsistenteFloating } from '@/shared/ui/AsistenteFloating';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isEmpresaMenuOpen, setEmpresaMenuOpen] = useState(false);
    const pathname = usePathname();

    const { user, logout } = useAuth();
    const { currentEmpresa, setCurrentEmpresa, empresas } = useEmpresa();

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans selection:bg-sri-blue/10 selection:text-sri-blue">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden transition-all duration-500"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl lg:shadow-none border-r border-slate-800/50 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="h-20 flex items-center px-6 border-b border-slate-800/30 bg-[#0f172a]/50 backdrop-blur-xl sticky top-0 z-10">
                    <span className="text-xl font-bold tracking-tight text-white flex items-center gap-3 group cursor-default">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sri-blue via-sri-light to-sky-400 flex items-center justify-center shadow-lg shadow-sri-blue/20 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles size={20} className="text-white animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="leading-none">EcuContable</span>
                            <span className="text-sky-400 font-light text-xs tracking-[0.2em] uppercase mt-1">Pro Edition</span>
                        </div>
                    </span>
                </div>

                <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-12rem)] custom-scrollbar">
                    <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 opacity-80">Módulos del Sistema</div>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${isActive
                                    ? 'bg-gradient-to-r from-sri-blue to-sri-light text-white shadow-lg shadow-sri-blue/30 scale-[1.02]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                                )}
                                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-sky-400'} transition-colors duration-300`} />
                                <span className="relative z-10">{item.label}</span>
                                {!isActive && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sri-blue scale-0 group-hover:scale-100 transition-transform duration-300" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-800/50 bg-[#0f172a]/80 backdrop-blur-xl">
                    <button onClick={logout} className="flex items-center gap-3 w-full hover:bg-white/5 p-2.5 rounded-xl transition-all duration-300 group border border-transparent hover:border-slate-700/50">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 ring-2 ring-slate-800 group-hover:ring-sri-blue/50 transition-all duration-500 shadow-inner">
                            <User size={20} />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
                                {user?.nombre || 'Usuario'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email}</p>
                        </div>
                        <LogOut size={16} className="text-slate-600 group-hover:text-rose-400 transition-colors" />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-6">
                        <button onClick={toggleSidebar} className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            <Menu size={24} />
                        </button>

                        {/* Multi-Tenant Company Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setEmpresaMenuOpen(!isEmpresaMenuOpen)}
                                className="flex items-center gap-4 bg-slate-50/50 hover:bg-white p-2.5 pr-4 rounded-2xl transition-all duration-300 border border-slate-100 hover:border-sri-blue/30 hover:shadow-xl hover:shadow-sri-blue/5 group"
                            >
                                <div className="relative">
                                    {currentEmpresa.logoUrl ? (
                                        <img src={currentEmpresa.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl bg-white object-cover ring-1 ring-slate-200 shadow-sm transition-transform group-hover:scale-105" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-sri-blue flex items-center justify-center shadow-sm border border-indigo-100">
                                            <Building size={20} />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                </div>
                                <div className="text-left hidden md:block">
                                    <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-sri-blue transition-colors">{currentEmpresa.razonSocial}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">RUC: {currentEmpresa.ruc}</span>
                                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                                        <span className="text-[9px] font-bold text-sri-blue/60 bg-sri-blue/5 px-1.5 py-0.5 rounded uppercase">Producción</span>
                                    </div>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isEmpresaMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isEmpresaMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setEmpresaMenuOpen(false)} />
                                    <div className="absolute top-[calc(100%+12px)] left-0 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="px-5 py-2 border-b border-slate-50 mb-2 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mis Empresas</span>
                                            <span className="text-[10px] font-medium text-sri-blue bg-blue-50 px-2 py-0.5 rounded-full">{empresas.length} Activas</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto custom-scrollbar px-2">
                                            {empresas.map(empresa => (
                                                <button
                                                    key={empresa.id}
                                                    onClick={() => {
                                                        setCurrentEmpresa(empresa);
                                                        setEmpresaMenuOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-4 transition-all duration-200 mb-1 ${currentEmpresa.id === empresa.id
                                                        ? 'bg-blue-50/80 text-sri-blue ring-1 ring-blue-100'
                                                        : 'hover:bg-slate-50 text-slate-600'
                                                        }`}
                                                >
                                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${currentEmpresa.id === empresa.id ? 'bg-sri-blue text-white rotate-3' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        {empresa.razonSocial.substring(0, 2)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-bold truncate ${currentEmpresa.id === empresa.id ? 'text-sri-blue' : 'text-slate-700'}`}>
                                                            {empresa.razonSocial}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{empresa.ruc}</p>
                                                    </div>
                                                    {currentEmpresa.id === empresa.id && (
                                                        <div className="h-5 w-5 rounded-full bg-sri-blue text-white flex items-center justify-center shadow-lg shadow-sri-blue/20">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-2 pt-2 px-4">
                                            <button className="w-full py-3 rounded-xl text-xs font-bold text-sri-blue hover:bg-sri-blue hover:text-white transition-all duration-300 border border-dashed border-blue-200 hover:border-transparent flex items-center justify-center gap-2">
                                                <span>+</span> Agregar Nueva Empresa
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="hidden md:flex relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sri-blue transition-colors duration-300" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar (Ctrl+K)"
                                className="pl-11 pr-4 py-2.5 bg-slate-100/80 border-none rounded-2xl text-sm focus:ring-2 focus:ring-sri-blue/20 focus:bg-white transition-all duration-300 w-72 placeholder:text-slate-400 shadow-inner"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 hover:text-sri-blue rounded-xl transition-all duration-300 group">
                                <Bell size={22} className="group-hover:rotate-12 transition-transform" />
                                <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full ring-4 ring-white animate-pulse"></span>
                            </button>
                            <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block"></div>
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-800">Soporte Premium</span>
                                <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> En línea
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Body */}
                <main className="flex-1 p-6 lg:p-10 overflow-y-auto scroll-smooth custom-scrollbar bg-[#f8fafc]">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>

                {/* AI Assistant Floating Button */}
                <AsistenteFloating empresaId={currentEmpresa.id} />
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
