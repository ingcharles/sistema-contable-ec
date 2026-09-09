'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { CuentaContable } from '@/modules/contabilidad/domain/types';

interface CuentaSelectProps {
    value?: string;
    onChange: (codigo: string) => void;
    placeholder?: string;
    className?: string;
}

export function CuentaSelect({ value, onChange, placeholder = "Seleccionar cuenta...", className = "" }: CuentaSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCuenta, setSelectedCuenta] = useState<CuentaContable | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCuentas = async () => {
            setLoading(true);
            try {
                const response = await ContabilidadUseCases.listarCuentasMovimiento();

                let cuentasData: CuentaContable[] = [];
                if (Array.isArray(response)) {
                    cuentasData = response;
                } else if (response && Array.isArray(response.data)) {
                    cuentasData = response.data;
                } else {
                    console.error('Data retornada no es valida:', response);
                    cuentasData = [];
                }

                setCuentas(cuentasData);

                if (value) {
                    const found = cuentasData.find((c: any) => c.codigo === value);
                    if (found) setSelectedCuenta(found);
                }
            } catch (error) {
                console.error('Error cargando cuentas:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCuentas();
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCuentas = (Array.isArray(cuentas) ? cuentas : []).filter(c =>
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50); // Limitar a 50 para rendimiento

    const handleSelect = (cuenta: CuentaContable) => {
        setSelectedCuenta(cuenta);
        onChange(cuenta.codigo);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all cursor-pointer group ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-200' : ''}`}
            >
                <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cuenta Contable</span>
                    <span className={`text-sm font-bold truncate ${selectedCuenta ? 'text-slate-700' : 'text-slate-300'}`}>
                        {selectedCuenta ? `${selectedCuenta.codigo} - ${selectedCuenta.nombre}` : placeholder}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {selectedCuenta && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleSelect({ codigo: '', nombre: '' } as any); }}
                            className="p-1 hover:bg-slate-200 rounded-full text-slate-400"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={18} className={`text-indigo-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Buscar por código o nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {filteredCuentas.length > 0 ? (
                            filteredCuentas.map((cuenta) => (
                                <div
                                    key={cuenta.codigo}
                                    onClick={() => handleSelect(cuenta)}
                                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors ${selectedCuenta?.codigo === cuenta.codigo ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-black font-mono ${selectedCuenta?.codigo === cuenta.codigo ? 'text-indigo-400' : 'text-slate-400'}`}>{cuenta.codigo}</span>
                                        <span className="text-sm font-bold">{cuenta.nombre}</span>
                                    </div>
                                    {selectedCuenta?.codigo === cuenta.codigo && <Check size={16} className="text-indigo-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <p className="text-sm font-bold">No se encontraron cuentas</p>
                                <p className="text-[10px] uppercase mt-1">Intente con otro término</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
