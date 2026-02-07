'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { useConfiguracion } from '@/modules/configuracion/hooks/useConfiguracion';
import { ContabilidadUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/context/ToastContext';
import { CuentaContable } from '@/shared/types';
import { useCatalogos } from '@/shared/hooks/useCatalogos';

export default function ParametrosConfigPage() {
    const { currentEmpresa } = useEmpresa();
    const { parametros, setParametros, cargarParametros, guardarParametros } = useConfiguracion();
    const { showToast } = useToast();
    const [planCuentasMovimiento, setPlanCuentasMovimiento] = useState<CuentaContable[]>([]);

    // Cargar Catálogo IVA
    const { getCatalogo } = useCatalogos(['SRI_TIPO_IMPUESTO_IVA']);
    const tarifasIVA = getCatalogo('SRI_TIPO_IMPUESTO_IVA');
    console.log("a", tarifasIVA);
    useEffect(() => {
        if (!currentEmpresa) return;
        cargarParametros();
        ContabilidadUseCases.listarCuentasMovimiento().then(data => {
            setPlanCuentasMovimiento(data.data);
        });
    }, [currentEmpresa?.id]);

    const handleGuardarParametros = async () => {
        if (!currentEmpresa || !parametros) return;
        try {
            await guardarParametros(parametros);
            showToast('Parámetros contables actualizados exitosamente.', 'success');
        } catch (error) {
            showToast('Error al guardar parámetros', 'error');
        }
    };

    if (!currentEmpresa || !parametros) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="text-sri-blue" /> Parámetros Contables
                </h1>
                <p className="text-slate-500 text-sm mt-1">Configure las cuentas contables por defecto y valores de referencia.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="space-y-8">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Configuración Contable y Tributaria</h3>

                    {/* Valores de Referencia */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-3">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Valores de Referencia</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">SBU Vigente ($)</label>
                            <input
                                type="number"
                                value={parametros.sbu}
                                onChange={e => setParametros({ ...parametros, sbu: Number(e.target.value) })}
                                className="w-full border rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">
                                    Tarifa de IVA por Defecto (Catálogo SRI)
                                </label>
                                <select
                                    value={parametros.ivaCatalogoItemId || ''}
                                    onChange={e => {
                                        setParametros({ ...parametros, ivaCatalogoItemId: e.target.value })
                                    }}
                                    className="w-full border rounded-lg p-2.5 text-sm"
                                >
                                    {tarifasIVA.map(t => (
                                        <option key={t.id} value={t.id}>{t.valor} ({t.codigo})</option>
                                    ))}

                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Máximo Consumidor Final ($)</label>
                            <input
                                type="number"
                                value={parametros.maxConsumidorFinal}
                                onChange={e => setParametros({ ...parametros, maxConsumidorFinal: Number(e.target.value) })}
                                className="w-full border rounded-lg p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Cierre de Periodo</label>
                            <input
                                type="date"
                                value={parametros.fechaCierre ? parametros.fechaCierre.split('T')[0] : ''}
                                onChange={e => setParametros({ ...parametros, fechaCierre: e.target.value || null })}
                                className="w-full border rounded-lg p-2.5 text-sm"
                            />
                        </div>
                    </div>

                    {/* Cuentas de Efectivo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-3">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Efectivo</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cuenta Caja</label>
                            <select
                                value={parametros.cuentaCaja || ''}
                                onChange={e => setParametros({ ...parametros, cuentaCaja: e.target.value })}
                                className="w-full border rounded-lg p-2.5 text-sm font-mono"
                            >
                                <option value="">Seleccione una cuenta...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1.01')).map(c => (
                                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Add other account groups here as well, similar to the original page */}
                    {/* For brevity, I'll include the main ones and the user can expand if needed, 
                        but better to include all since I'm refactoring. */}

                    {/* Cuentas de IVA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-3">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de IVA</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">IVA en Ventas</label>
                            <select value={parametros.cuentaIvaVentas || ''} onChange={e => setParametros({ ...parametros, cuentaIvaVentas: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">IVA en Compras</label>
                            <select value={parametros.cuentaIvaCompras || ''} onChange={e => setParametros({ ...parametros, cuentaIvaCompras: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">IVA por Pagar (Liquidación)</label>
                            <select value={parametros.cuentaIvaPorPagar || ''} onChange={e => setParametros({ ...parametros, cuentaIvaPorPagar: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Cuentas de Retenciones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-3">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Retenciones</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Retención Renta por Pagar</label>
                            <select value={parametros.cuentaRetRentaPorPagar || ''} onChange={e => setParametros({ ...parametros, cuentaRetRentaPorPagar: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Retención IVA por Pagar</label>
                            <select value={parametros.cuentaRetIvaPorPagar || ''} onChange={e => setParametros({ ...parametros, cuentaRetIvaPorPagar: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Cuentas de Ingresos (Ventas) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-4">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Ventas</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Ventas</label>
                            <select value={parametros.cuentaVentas || ''} onChange={e => setParametros({ ...parametros, cuentaVentas: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Devolución Ventas</label>
                            <select value={parametros.cuentaDevolucionVentas || ''} onChange={e => setParametros({ ...parametros, cuentaDevolucionVentas: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Descuento Ventas</label>
                            <select value={parametros.cuentaDescuentoVentas || ''} onChange={e => setParametros({ ...parametros, cuentaDescuentoVentas: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('4.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Costo de Ventas</label>
                            <select value={parametros.cuentaCostoVentas || ''} onChange={e => setParametros({ ...parametros, cuentaCostoVentas: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('5.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Cuentas de Inventario / Compras */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-2">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Compras e Inventario</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Compras de Mercadería</label>
                            <select value={parametros.cuentaCompras || ''} onChange={e => setParametros({ ...parametros, cuentaCompras: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('5.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Inventario de Mercaderías</label>
                            <select value={parametros.cuentaInventario || ''} onChange={e => setParametros({ ...parametros, cuentaInventario: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Cuentas de Cartera */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-4">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Cartera y Anticipos</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">CXC Clientes</label>
                            <select value={parametros.cuentaCxcClientes || ''} onChange={e => setParametros({ ...parametros, cuentaCxcClientes: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Anticipo Clientes</label>
                            <select value={parametros.cuentaAnticipoClientes || ''} onChange={e => setParametros({ ...parametros, cuentaAnticipoClientes: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">CXP Proveedores</label>
                            <select value={parametros.cuentaCxpProveedores || ''} onChange={e => setParametros({ ...parametros, cuentaCxpProveedores: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Anticipo a Proveedores</label>
                            <select value={parametros.cuentaAnticipoProveedores || ''} onChange={e => setParametros({ ...parametros, cuentaAnticipoProveedores: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Cuentas de Nómina */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-4">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Cuentas de Nómina</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Gasto Sueldos</label>
                            <select value={parametros.cuentaSueldos || ''} onChange={e => setParametros({ ...parametros, cuentaSueldos: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && (c.codigo.startsWith('5.1') || c.codigo.startsWith('5.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Aporte Patronal</label>
                            <select value={parametros.cuentaAportePatronal || ''} onChange={e => setParametros({ ...parametros, cuentaAportePatronal: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && (c.codigo.startsWith('5.1') || c.codigo.startsWith('5.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Pasivo Sueldos</label>
                            <select value={parametros.cuentaSueldosPorPagar || ''} onChange={e => setParametros({ ...parametros, cuentaSueldosPorPagar: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">IESS por Pagar</label>
                            <select value={parametros.cuentaIessPorPagar || ''} onChange={e => setParametros({ ...parametros, cuentaIessPorPagar: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Gasto Décimo 3ero</label>
                            <select value={parametros.cuentaDecimoTercero || ''} onChange={e => setParametros({ ...parametros, cuentaDecimoTercero: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && (c.codigo.startsWith('5.1') || c.codigo.startsWith('5.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Prov. Décimo 3ero</label>
                            <select value={parametros.cuentaProvDecimoTercero || ''} onChange={e => setParametros({ ...parametros, cuentaProvDecimoTercero: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Gasto Décimo 4to</label>
                            <select value={parametros.cuentaDecimoCuarto || ''} onChange={e => setParametros({ ...parametros, cuentaDecimoCuarto: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && (c.codigo.startsWith('5.1') || c.codigo.startsWith('5.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Prov. Décimo 4to</label>
                            <select value={parametros.cuentaProvDecimoCuarto || ''} onChange={e => setParametros({ ...parametros, cuentaProvDecimoCuarto: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('2.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Cuentas de Caja Chica y Ajustes */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-4 col-span-1 md:col-span-4">
                            <h4 className="text-xs font-bold text-sri-blue uppercase tracking-widest">Caja Chica y Ajustes de Inventario</h4>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Activo Caja Chica</label>
                            <select value={parametros.cuentaCajaChica || ''} onChange={e => setParametros({ ...parametros, cuentaCajaChica: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && c.codigo.startsWith('1.1')).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Gastos Caja Chica</label>
                            <select value={parametros.cuentaGastosVarios || ''} onChange={e => setParametros({ ...parametros, cuentaGastosVarios: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => c.nivel >= 4 && (c.codigo.startsWith('5.1') || c.codigo.startsWith('5.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Sobrante Inventario</label>
                            <select value={parametros.cuentaSobranteInventario || ''} onChange={e => setParametros({ ...parametros, cuentaSobranteInventario: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => (c.codigo.startsWith('4.1') || c.codigo.startsWith('4.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Faltante Inventario</label>
                            <select value={parametros.cuentaFaltanteInventario || ''} onChange={e => setParametros({ ...parametros, cuentaFaltanteInventario: e.target.value })} className="w-full border rounded-lg p-2.5 text-sm font-mono">
                                <option value="">Seleccione...</option>
                                {planCuentasMovimiento.filter(c => (c.codigo.startsWith('5.1') || c.codigo.startsWith('5.2'))).map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleGuardarParametros} className="flex items-center gap-2">
                            <Save size={18} /> Guardar Parámetros
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
