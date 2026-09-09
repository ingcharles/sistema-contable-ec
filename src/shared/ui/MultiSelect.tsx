
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const removeValue = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    return (
        <div className={`w-full ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
            <div
                className="relative w-full border border-slate-300 rounded-lg bg-white min-h-[42px] cursor-pointer focus-within:ring-2 focus-within:ring-sri-blue/20 transition-all flex items-center justify-between px-3 py-1.5"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1.5">
                    {value.length === 0 ? (
                        <span className="text-slate-400 text-sm">{placeholder}</span>
                    ) : (
                        value.map(val => {
                            const option = options.find(o => o.value === val);
                            return (
                                <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sri-blue/10 text-sri-blue rounded text-xs font-bold border border-sri-blue/20">
                                    {option?.label || val}
                                    <span
                                        onClick={(e) => removeValue(e, val)}
                                        className="hover:text-red-500 cursor-pointer"
                                    >
                                        <X size={12} />
                                    </span>
                                </span>
                            );
                        })
                    )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {options.map(option => {
                            const isSelected = value.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 flex items-center justify-between ${isSelected ? 'bg-sri-blue/5' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOption(option.value);
                                    }}
                                >
                                    <span className={isSelected ? 'font-bold text-sri-blue' : 'text-slate-700'}>
                                        {option.label}
                                    </span>
                                    {isSelected && <Check size={16} className="text-sri-blue" />}
                                </div>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="px-3 py-2 text-sm text-slate-400 text-center italic">
                                No hay opciones disponibles
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
