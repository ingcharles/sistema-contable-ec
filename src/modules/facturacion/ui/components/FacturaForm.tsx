'use client';

/**
 * Formulario para crear/editar facturas cumpliendo con requisitos SRI
 * Integrado con módulos de Terceros (Directorio) e Inventario
 * Soporta múltiples formas de pago con plazos y unidades de tiempo
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { FacturaViewModel, DetalleFactura, PagoFactura } from '../../application/models/FacturaViewModel';
import { TIPO_IDENTIFICACION, TARIFA_IVA, FORMA_PAGO, AMBIENTE, TIPO_EMISION } from '../../domain/catalogos';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Trash2, Plus, Calculator, User, FileText, CreditCard, Search } from 'lucide-react';

// Repositorios para integración
import { InMemoryDirectorioRepository } from '@/modules/directorio/infrastructure/DirectorioRepository';
import { InMemoryInventarioRepository } from '@/modules/inventario/infrastructure/InventarioRepository';
import { Tercero } from '@/modules/directorio/domain/types';
import { Producto } from '@/modules/inventario/domain/types';
import { SriStandardizer } from '../../application/services/SriStandardizer';

export interface FacturaFormProps {
    factura?: Partial<FacturaViewModel>;
    onSubmit: (factura: FacturaViewModel) => void;
    onCancel: () => void;
}

export function FacturaForm({ factura, onSubmit, onCancel }: FacturaFormProps) {
    const { currentEmpresa } = useEmpresa();

    // Estados para integración
    const [clientes, setClientes] = useState<Tercero[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

    // Cargar datos de otros módulos
    useEffect(() => {
        if (currentEmpresa) {
            const loadData = async () => {
                const dirRepo = new InMemoryDirectorioRepository();
                const invRepo = new InMemoryInventarioRepository();

                const [listaClientes, listaProductos] = await Promise.all([
                    dirRepo.getTerceros(currentEmpresa.id),
                    invRepo.getProductos(currentEmpresa.id)
                ]);

                setClientes(listaClientes);
                setProductos(listaProductos);
            };
            loadData();
        }
    }, [currentEmpresa?.id]);

    // Datos del Cliente
    const [tipoIdentificacion, setTipoIdentificacion] = useState(factura?.tipoIdentificacionAdquirente || TIPO_IDENTIFICACION.RUC);
    const [identificacion, setIdentificacion] = useState(factura?.identificacionAdquirente || '');
    const [razonSocial, setRazonSocial] = useState(factura?.razonSocialAdquirente || '');
    const [direccion, setDireccion] = useState(factura?.direccionAdquirente || '');
    const [email, setEmail] = useState(factura?.emailAdquirente || '');

    // Datos del Comprobante
    const [estab, setEstab] = useState(factura?.estab || '001');
    const [ptoEmi, setPtoEmi] = useState(factura?.ptoEmi || '001');
    const [secuencial, setSecuencial] = useState(factura?.secuencial || '');
    const [fechaEmision, setFechaEmision] = useState(factura?.fechaEmision || new Date().toISOString().split('T')[0]);

    // Detalles
    const [detalles, setDetalles] = useState<DetalleFactura[]>(factura?.detalles || [{
        productoId: '',
        codigoPrincipal: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        codigoIVA: TARIFA_IVA.IVA_15,
        baseImponible: 0,
        valorIVA: 0,
        total: 0,
    }]);

    // Pagos
    const [pagos, setPagos] = useState<PagoFactura[]>(factura?.pagos || [{
        formaPago: FORMA_PAGO.OTROS_CON_SISTEMA_FINANCIERO,
        total: 0,
        plazo: 0,
        unidadTiempo: 'Dias'
    }]);

    // Filtrado de clientes
    const clientesFiltrados = useMemo(() => {
        if (!busquedaCliente) return [];
        return clientes.filter(c =>
            c.razonSocial.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
            c.identificacion.includes(busquedaCliente)
        );
    }, [busquedaCliente, clientes]);

    const seleccionarCliente = (cliente: Tercero) => {
        setIdentificacion(cliente.identificacion);
        setRazonSocial(cliente.razonSocial);
        setDireccion(cliente.direccion);
        setEmail(cliente.email);
        setBusquedaCliente('');
        setMostrarListaClientes(false);

        // Si es consumidor final, asegurar que el tipo de identificación sea el correcto
        if (cliente.identificacion === '9999999999999') {
            setTipoIdentificacion(TIPO_IDENTIFICACION.CONSUMIDOR_FINAL);
        } else if (cliente.identificacion.length === 10) {
            setTipoIdentificacion(TIPO_IDENTIFICACION.CEDULA);
        } else if (cliente.identificacion.length === 13) {
            setTipoIdentificacion(TIPO_IDENTIFICACION.RUC);
        }
    };

    // Efecto para manejar el cambio manual a Consumidor Final
    useEffect(() => {
        if (tipoIdentificacion === TIPO_IDENTIFICACION.CONSUMIDOR_FINAL) {
            setIdentificacion('9999999999999');
            setRazonSocial('CONSUMIDOR FINAL');
            setDireccion('S/N');
            setEmail('');
        }
    }, [tipoIdentificacion]);

    const agregarDetalle = () => {
        setDetalles([...detalles, {
            productoId: '',
            codigoPrincipal: '',
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
            descuento: 0,
            codigoIVA: TARIFA_IVA.IVA_15,
            baseImponible: 0,
            valorIVA: 0,
            total: 0,
        }]);
    };

    const eliminarDetalle = (index: number) => {
        setDetalles(detalles.filter((_, i) => i !== index));
    };

    const actualizarDetalle = (index: number, campo: keyof DetalleFactura, valor: any) => {
        const nuevosDetalles = [...detalles];
        const detalle = { ...nuevosDetalles[index], [campo]: valor };

        if (campo === 'codigoPrincipal') {
            const producto = productos.find(p => p.codigoPrincipal === valor);
            if (producto) {
                detalle.productoId = producto.id;
                detalle.descripcion = producto.nombre;
                detalle.precioUnitario = producto.precioVenta;
                detalle.codigoIVA = producto.grabaIva ? TARIFA_IVA.IVA_15 : TARIFA_IVA.IVA_0;
            }
        }

        detalle.baseImponible = (detalle.cantidad * detalle.precioUnitario) - detalle.descuento;
        let porcentajeIVA = 0;
        if (detalle.codigoIVA === TARIFA_IVA.IVA_15) porcentajeIVA = 0.15;
        else if (detalle.codigoIVA === TARIFA_IVA.IVA_12) porcentajeIVA = 0.12;
        detalle.valorIVA = detalle.baseImponible * porcentajeIVA;
        detalle.total = detalle.baseImponible + detalle.valorIVA;

        nuevosDetalles[index] = detalle;
        setDetalles(nuevosDetalles);
    };

    const agregarPago = () => {
        setPagos([...pagos, {
            formaPago: FORMA_PAGO.OTROS_CON_SISTEMA_FINANCIERO,
            total: 0,
            plazo: 0,
            unidadTiempo: 'Dias'
        }]);
    };

    const eliminarPago = (index: number) => {
        setPagos(pagos.filter((_, i) => i !== index));
    };

    const actualizarPago = (index: number, campo: keyof PagoFactura, valor: any) => {
        const nuevosPagos = [...pagos];
        nuevosPagos[index] = { ...nuevosPagos[index], [campo]: valor };
        setPagos(nuevosPagos);
    };

    const calcularTotales = () => {
        const totalSinImpuestos = detalles.reduce((sum, d) => sum + d.baseImponible, 0);
        const totalDescuento = detalles.reduce((sum, d) => sum + d.descuento, 0);
        const totalIVA = detalles.reduce((sum, d) => sum + d.valorIVA, 0);
        const importeTotal = totalSinImpuestos + totalIVA;

        return { totalSinImpuestos, totalDescuento, totalIVA, importeTotal };
    };

    const totales = calcularTotales();

    // Sincronizar el total del primer pago con el total de la factura si solo hay un pago
    useEffect(() => {
        if (pagos.length === 1 && pagos[0].total !== totales.importeTotal) {
            actualizarPago(0, 'total', totales.importeTotal);
        }
    }, [totales.importeTotal]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEmpresa) return;

        const totalPagos = pagos.reduce((sum, p) => sum + p.total, 0);
        if (Math.abs(totalPagos - totales.importeTotal) > 0.01) {
            alert(`El total de las formas de pago ($${totalPagos.toFixed(2)}) debe ser igual al importe total de la factura ($${totales.importeTotal.toFixed(2)})`);
            return;
        }

        const nuevaFactura: FacturaViewModel = {
            id: factura?.id,
            ambiente: AMBIENTE.PRUEBAS,
            tipoEmision: TIPO_EMISION.NORMAL,
            razonSocial: currentEmpresa.razonSocial,
            nombreComercial: currentEmpresa.nombreComercial,
            ruc: currentEmpresa.ruc,
            codDoc: '01',
            estab,
            ptoEmi,
            secuencial,
            dirMatriz: currentEmpresa.direccionMatriz,
            fechaEmision,
            tipoIdentificacionAdquirente: tipoIdentificacion,
            razonSocialAdquirente: razonSocial,
            identificacionAdquirente: identificacion,
            direccionAdquirente: direccion,
            emailAdquirente: email,
            detalles,
            ...totales,
            pagos,
            estado: 'BORRADOR',
            obligadoContabilidad: currentEmpresa.obligadoContabilidad ? 'SI' : 'NO',
        };

        // Estandarización para el SRI
        const dataSri = SriStandardizer.standardizeFactura(nuevaFactura);
        console.log('JSON ESTANDARIZADO SRI:', JSON.stringify(dataSri, null, 2));

        onSubmit(nuevaFactura);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Encabezado Técnico */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} /> Información del Comprobante
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Establecimiento</label>
                        <Input value={estab} onChange={(e) => setEstab(e.target.value)} placeholder="001" maxLength={3} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Punto Emisión</label>
                        <Input value={ptoEmi} onChange={(e) => setPtoEmi(e.target.value)} placeholder="001" maxLength={3} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Secuencial</label>
                        <Input value={secuencial} onChange={(e) => setSecuencial(e.target.value)} placeholder="000000001" maxLength={9} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Fecha Emisión</label>
                        <Input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required />
                    </div>
                </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm relative">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <User size={16} /> Datos del Adquirente
                    </h4>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={busquedaCliente}
                            onChange={(e) => { setBusquedaCliente(e.target.value); setMostrarListaClientes(true); }}
                            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sri-blue/20"
                        />
                        {mostrarListaClientes && clientesFiltrados.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {clientesFiltrados.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => seleccionarCliente(c)}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs border-b border-slate-50 last:border-0"
                                    >
                                        <div className="font-bold text-slate-700">{c.razonSocial}</div>
                                        <div className="text-slate-400 font-mono">{c.identificacion}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tipo Identificación</label>
                            <select
                                value={tipoIdentificacion}
                                onChange={(e) => setTipoIdentificacion(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                <option value={TIPO_IDENTIFICACION.RUC}>RUC</option>
                                <option value={TIPO_IDENTIFICACION.CEDULA}>Cédula</option>
                                <option value={TIPO_IDENTIFICACION.PASAPORTE}>Pasaporte</option>
                                <option value={TIPO_IDENTIFICACION.CONSUMIDOR_FINAL}>Consumidor Final</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Identificación *</label>
                            <Input value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} placeholder="17..." required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Razón Social / Nombres *</label>
                        <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} placeholder="Nombre del cliente" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Email</label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Dirección</label>
                        <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección del cliente" />
                    </div>
                </div>
            </div>

            {/* Detalles */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calculator size={16} /> Detalles de Factura
                    </h4>
                    <Button type="button" onClick={agregarDetalle} variant="secondary" size="sm" className="flex items-center gap-2">
                        <Plus size={14} /> Agregar Ítem
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Código / Descripción</th>
                                <th className="px-4 py-3 w-24 text-center">Cant.</th>
                                <th className="px-4 py-3 w-32 text-right">P. Unit</th>
                                <th className="px-4 py-3 w-24 text-right">Desc.</th>
                                <th className="px-4 py-3 w-32 text-center">IVA</th>
                                <th className="px-4 py-3 w-32 text-right">Total</th>
                                <th className="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {detalles.map((detalle, index) => (
                                <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 space-y-1">
                                        <div className="relative">
                                            <input
                                                list={`productos-${index}`}
                                                value={detalle.codigoPrincipal}
                                                onChange={(e) => actualizarDetalle(index, 'codigoPrincipal', e.target.value)}
                                                placeholder="Cód. Principal"
                                                className="w-full bg-transparent border-none focus:ring-0 font-mono text-xs text-slate-400 outline-none"
                                            />
                                            <datalist id={`productos-${index}`}>
                                                {productos.map(p => (
                                                    <option key={p.id} value={p.codigoPrincipal}>{p.nombre} - ${p.precioVenta}</option>
                                                ))}
                                            </datalist>
                                        </div>
                                        <input
                                            value={detalle.descripcion}
                                            onChange={(e) => actualizarDetalle(index, 'descripcion', e.target.value)}
                                            placeholder="Descripción del producto"
                                            className="w-full bg-transparent border-none focus:ring-0 font-medium text-slate-700 outline-none"
                                            required
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={detalle.cantidad}
                                            onChange={(e) => actualizarDetalle(index, 'cantidad', parseFloat(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center font-bold outline-none focus:ring-2 focus:ring-sri-blue/10"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={detalle.precioUnitario}
                                            onChange={(e) => actualizarDetalle(index, 'precioUnitario', parseFloat(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-right font-bold outline-none focus:ring-2 focus:ring-sri-blue/10"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={detalle.descuento}
                                            onChange={(e) => actualizarDetalle(index, 'descuento', parseFloat(e.target.value))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-right outline-none focus:ring-2 focus:ring-sri-blue/10"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={detalle.codigoIVA}
                                            onChange={(e) => actualizarDetalle(index, 'codigoIVA', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-sri-blue/10"
                                        >
                                            <option value={TARIFA_IVA.IVA_15}>15%</option>
                                            <option value={TARIFA_IVA.IVA_12}>12%</option>
                                            <option value={TARIFA_IVA.IVA_0}>0%</option>
                                            <option value={TARIFA_IVA.NO_OBJETO}>N/O</option>
                                            <option value={TARIFA_IVA.EXENTO}>Exento</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-slate-900">
                                        ${detalle.total.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => eliminarDetalle(index)}
                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                            disabled={detalles.length === 1}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pie de Factura: Pago y Totales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <CreditCard size={16} /> Formas de Pago
                        </h4>
                        <Button type="button" onClick={agregarPago} variant="secondary" size="sm" className="flex items-center gap-2">
                            <Plus size={14} /> Agregar Pago
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {pagos.map((pago, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative group">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Forma de Pago</label>
                                    <select
                                        value={pago.formaPago}
                                        onChange={(e) => actualizarPago(idx, 'formaPago', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-sri-blue/20"
                                    >
                                        <option value={FORMA_PAGO.OTROS_CON_SISTEMA_FINANCIERO}>Otros con Sist. Finan.</option>
                                        <option value={FORMA_PAGO.SIN_SISTEMA_FINANCIERO}>Sin Utilización Sist. Finan.</option>
                                        <option value={FORMA_PAGO.TARJETA_CREDITO}>Tarjeta de Crédito</option>
                                        <option value={FORMA_PAGO.TARJETA_DEBITO}>Tarjeta de Débito</option>
                                        <option value={FORMA_PAGO.DINERO_ELECTRONICO}>Dinero Electrónico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Valor</label>
                                    <Input
                                        type="number"
                                        value={pago.total}
                                        onChange={(e) => actualizarPago(idx, 'total', parseFloat(e.target.value))}
                                        step="0.01"
                                        className="h-9 text-xs font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Plazo</label>
                                    <Input
                                        type="number"
                                        value={pago.plazo}
                                        onChange={(e) => actualizarPago(idx, 'plazo', parseInt(e.target.value))}
                                        className="h-9 text-xs"
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Unidad</label>
                                        <select
                                            value={pago.unidadTiempo}
                                            onChange={(e) => actualizarPago(idx, 'unidadTiempo', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sri-blue/20"
                                        >
                                            <option value="Dias">Días</option>
                                            <option value="Meses">Meses</option>
                                            <option value="Años">Años</option>
                                        </select>
                                    </div>
                                    {pagos.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => eliminarPago(idx)}
                                            className="mb-1 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-sri-blue p-8 rounded-3xl text-white shadow-xl shadow-blue-900/20 space-y-4">
                    <div className="flex justify-between text-blue-100 font-medium">
                        <span>Subtotal Sin Impuestos:</span>
                        <span className="font-bold text-white">${totales.totalSinImpuestos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-100 font-medium">
                        <span>Descuento Total:</span>
                        <span className="font-bold text-white">${totales.totalDescuento.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-100 font-medium">
                        <span>IVA:</span>
                        <span className="font-bold text-white">${totales.totalIVA.toFixed(2)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-lg font-black uppercase tracking-wider">Importe Total:</span>
                        <span className="text-3xl font-black">${totales.importeTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-4">
                <Button type="button" onClick={onCancel} variant="secondary" className="px-8">
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" className="px-12 bg-sri-blue hover:bg-sri-light shadow-lg shadow-blue-900/20">
                    Emitir y Autorizar SRI
                </Button>
            </div>
        </form>
    );
}
