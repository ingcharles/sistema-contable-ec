
import React, { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { NAV_ITEMS, MOCK_EMPRESAS } from '../constants';
import { Bell, Search, ChevronDown, Menu, User, Building, LogOut } from 'lucide-react';
import { Empresa } from '../types';
import { useAuth } from '../modules/auth/context/AuthContext';
import { AsistenteFloating } from '../modules/ia/ui/AsistenteFloating';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa>(MOCK_EMPRESAS[0]);
  const [isEmpresaMenuOpen, setEmpresaMenuOpen] = useState(false);
  const location = useLocation();
  
  // Auth Integration
  const { user, logout } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0f172a] text-white transition-transform duration-300 ease-out shadow-xl lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-[#0f172a]">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sri-blue to-sky-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
            EcuContable<span className="text-sky-400 font-light">Pro</span>
          </span>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Principal</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-sri-blue text-white shadow-lg shadow-sri-blue/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-[#0f172a]">
          <button onClick={logout} className="flex items-center gap-3 w-full hover:bg-slate-800 p-2 rounded-lg transition-colors group">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 ring-2 ring-slate-800 group-hover:ring-slate-600 transition-all">
              <User size={18} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-sky-400 transition-colors truncate">
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <LogOut size={16} className="text-slate-500 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            
            {/* Multi-Tenant Company Selector */}
            <div className="relative">
              <button 
                onClick={() => setEmpresaMenuOpen(!isEmpresaMenuOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 p-2 pr-3 rounded-lg transition-all border border-transparent hover:border-slate-200 group"
              >
                {selectedEmpresa.logoUrl ? (
                  <img src={selectedEmpresa.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200" />
                ) : (
                   <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Building size={16} />
                   </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-sri-blue transition-colors">{selectedEmpresa.razonSocial}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono tracking-wide">RUC: {selectedEmpresa.ruc}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400 group-hover:text-sri-blue transition-colors" />
              </button>

              {isEmpresaMenuOpen && (
                <>
                <div className="fixed inset-0 z-40" onClick={() => setEmpresaMenuOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-slate-50 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seleccionar Empresa</span>
                  </div>
                  {MOCK_EMPRESAS.map(empresa => (
                    <button
                      key={empresa.id}
                      onClick={() => {
                        setSelectedEmpresa(empresa);
                        setEmpresaMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors ${
                        selectedEmpresa.id === empresa.id ? 'bg-blue-50/50 border-l-4 border-sri-blue' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${
                           selectedEmpresa.id === empresa.id ? 'bg-sri-blue text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {empresa.razonSocial.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${selectedEmpresa.id === empresa.id ? 'text-sri-blue' : 'text-slate-700'}`}>
                          {empresa.razonSocial}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{empresa.ruc}</p>
                      </div>
                      {selectedEmpresa.id === empresa.id && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-50 mt-2 pt-2 px-2">
                    <button className="w-full py-2.5 rounded-lg text-xs font-bold text-sri-blue hover:bg-blue-50 text-center transition-colors border border-dashed border-blue-200">
                      + Agregar Nueva Empresa
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sri-blue transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar transacción (Ctrl+K)" 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-sri-blue/30 focus:bg-white transition-all w-64 placeholder:text-slate-400"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-sri-blue rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Content Body with Outlet Context */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto scroll-smooth">
            <div className="max-w-7xl mx-auto">
                {/* Pasar el contexto de la empresa seleccionada a las rutas hijas */}
                <Outlet context={{ currentEmpresa: selectedEmpresa }} />
            </div>
        </main>

        {/* AI Assistant Floating Button */}
        <AsistenteFloating empresaId={selectedEmpresa.id} />
      </div>
    </div>
  );
};
