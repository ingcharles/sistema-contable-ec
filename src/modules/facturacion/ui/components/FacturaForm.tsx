'use client';

/**
 * Formulario para crear/editar facturas cumpliendo con requisitos SRI
 * Integrado con módulos de Terceros (Directorio) e Inventario
 * Soporta múltiples formas de pago con plazos y unidades de tiempo
 * UPDATED: Consume catálogos dinámicos desde la API.
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { FacturaViewModel, DetalleFactura, PagoFactura } from '../../domain/FacturaViewModel';
import { useEmpresa } from '@/shared/context/EmpresaContext';
import { Trash2, Plus, Calculator, User, FileText, CreditCard, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { validarIdentificacion } from '@/shared/utils/validacionesIdentificacion';
import { formatearDinero } from '@/shared/utils/formatearDinero';
import { useCatalogos } from '@/shared/hooks/useCatalogos';
import { usePuntoEmision } from '@/shared/context/PuntoEmisionContext';
import { useToast } from '@/shared/context/ToastContext';

// Repositorios para integración
import { InventarioUseCases, FacturacionUseCases } from '@/modules/shared/application/useCases/systemUseCases';
import { useTerceros } from '@/modules/directorio/hooks/useDirectorio';
import { Tercero } from '@/modules/directorio/domain/types';
import { Producto } from '@/modules/inventario/domain/types';
import { getLocalDateIso } from '@/shared/utils/dateUtils';

export interface FacturaFormProps {
    factura?: Partial<FacturaViewModel>;
    onSubmit: (factura: FacturaViewModel) => void;
    onCancel: () => void;
    id?: string;
    showButtons?: boolean;
}

export function FacturaForm({ factura, onSubmit, onCancel, id = 'factura-form', showButtons = true }: FacturaFormProps) {
    const { currentEmpresa } = useEmpresa();
    const { puntoActivo } = usePuntoEmision();
    const { showToast } = useToast();

    // Determinar IVA por defecto desde parámetros globales de la empresa
    const parametros = currentEmpresa?.parametros;

    // Cargar catálogos dinámicos
    const { terceros: clientes, cargarTerceros: cargarClientes } = useTerceros();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

    // Cargar catálogos dinámicos
    const { getCatalogo } = useCatalogos([
        'SRI_TIPO_IDENTIFICACION',
        'SRI_FORMA_PAGO'
    ]);

    const tiposIdentificacion = getCatalogo('SRI_TIPO_IDENTIFICACION');
    const formasPago = getCatalogo('SRI_FORMA_PAGO');

    const defaultIVA = useMemo(() => {
        return parametros?.ivaCodigo || '4';
    }, [parametros?.ivaCodigo]);



    // Cargar secuencial automático
    useEffect(() => {
        const cargarSecuencial = async () => {
            if (puntoActivo?.puntoEmisionId && !factura?.id) {
                try {
                    const data = await FacturacionUseCases.obtenerSiguienteSecuencial(puntoActivo.puntoEmisionId, '01');
                    if (data.success) {
                        setSecuencial(data.secuencial);
                    }
                } catch (error) {
                    console.error('Error al cargar secuencial:', error);
                }
            }
        };
        cargarSecuencial();
    }, [puntoActivo?.puntoEmisionId, factura?.id]);

    // Cargar datos de otros módulos
    useEffect(() => {
        if (currentEmpresa) {
            const loadData = async () => {
                await cargarClientes('CLIENTE');

                const productosResponse = await InventarioUseCases.listarProductos('?limit=1000');
                const productosData = productosResponse.data || [];

                const listaProductos: Producto[] = productosData.map((p: any) => ({
                    id: p.id,
                    empresaId: p.empresaId || currentEmpresa.id,
                    codigoPrincipal: p.codigoPrincipal,
                    codigoAuxiliar: p.codigoAuxiliar || '',
                    nombre: p.nombre,
                    categoriaId: p.categoriaId,
                    categoriaNombre: p.categoriaNombre || '',
                    stockActual: Number(p.stockActual),
                    costoPromedio: Number(p.costoPromedio),
                    precioVenta: Number(p.precioVenta),
                    grabaIva: p.grabaIva,
                    stockMinimo: Number(p.stockMinimo),
                    createdAt: p.createdAt || '',
                    updatedAt: p.updatedAt || '',
                    createdBy: ''
                }));

                setProductos(listaProductos);
            };
            loadData();
        }
    }, [currentEmpresa?.id]);

    // Datos del Cliente
    const [tipoIdentificacion, setTipoIdentificacion] = useState(factura?.tipoIdentificacionComprador || '04');
    const [identificacion, setIdentificacion] = useState(factura?.identificacionComprador || '');
    const [razonSocial, setRazonSocial] = useState(factura?.razonSocialComprador || '');
    const [direccion, setDireccion] = useState(factura?.direccionComprador || '');
    const [email, setEmail] = useState(factura?.emailComprador || '');
    const [clienteId, setClienteId] = useState<string | undefined>(undefined);

    // Estado de validación
    const [errorIdentificacion, setErrorIdentificacion] = useState('');
    const [identificacionValida, setIdentificacionValida] = useState(false);
    const [errorSubmit, setErrorSubmit] = useState<string | null>(null);

    // Datos del Comprobante
    const [estab, setEstab] = useState(factura?.estab || puntoActivo?.codigoEstablecimiento);
    const [ptoEmi, setPtoEmi] = useState(factura?.ptoEmi || puntoActivo?.codigoPunto);
    const [secuencial, setSecuencial] = useState(factura?.secuencial);
    const [fechaEmision, setFechaEmision] = useState(factura?.fechaEmision || getLocalDateIso());

    // Actualizar estab y ptoEmi cuando cambie el punto activo
    useEffect(() => {
        if (puntoActivo && !factura?.id) {
            setEstab(puntoActivo.codigoEstablecimiento);
            setPtoEmi(puntoActivo.codigoPunto);
        }
    }, [puntoActivo, factura?.id]);



    // Detalles
    const [detalles, setDetalles] = useState<DetalleFactura[]>(factura?.detalles || [{
        productoId: '',
        codigoPrincipal: '',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuento: 0,
        codigoIVA: defaultIVA,
        baseImponible: 0,
        valorIVA: 0,
        tarifa: parametros?.ivaValor || 15,
        total: 0,
    }]);

    const handleNumeroFacturaChange = (val: string) => {
        const parts = val.split('-');
        if (parts[0] !== undefined) setEstab(parts[0]);
        if (parts[1] !== undefined) setPtoEmi(parts[1]);
        if (parts[2] !== undefined) setSecuencial(parts[2]);
    };

    // Pagos
    const [pagos, setPagos] = useState<PagoFactura[]>(factura?.pagos || [{
        formaPago: '20', // Otros con sistema financiero es lo más común
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
        setClienteId(cliente.id);
        setBusquedaCliente('');
        setMostrarListaClientes(false);
        setTipoIdentificacion(cliente.tipoIdentificacion);

    };

    // Validar identificación en tiempo real
    useEffect(() => {
        if (!identificacion) {
            setErrorIdentificacion('');
            return;
        }
        const resultado = validarIdentificacion(
            tipoIdentificacion as '04' | '05' | '06' | '07' | '08',
            identificacion
        );

        if (!resultado.isValid) {
            setErrorIdentificacion(resultado.error || 'Identificación inválida');
            setIdentificacionValida(false);
        } else {
            setErrorIdentificacion('');
            setIdentificacionValida(true);
        }

    }, [identificacion, tipoIdentificacion]);

    // Efecto para manejar el cambio manual a Consumidor Final
    useEffect(() => {
        if (tipoIdentificacion === '07') {
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
            codigoIVA: defaultIVA,
            baseImponible: 0,
            valorIVA: 0,
            tarifa: parametros?.ivaValor || 15,
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
                // If product is taxable, use default IVA from params
                detalle.codigoIVA = producto.grabaIva ? defaultIVA : '0';
            }
        }

        detalle.baseImponible = (detalle.cantidad * detalle.precioUnitario) - detalle.descuento;

        let porcentajeIVA = 0;
        if (detalle.codigoIVA === (parametros?.ivaCodigo)) {
            porcentajeIVA = (parametros?.ivaValor || 15) / 100;
        } else {
            porcentajeIVA = 0;
        }

        detalle.valorIVA = detalle.baseImponible * porcentajeIVA;
        detalle.tarifa = porcentajeIVA * 100;
        detalle.total = detalle.baseImponible + detalle.valorIVA;

        nuevosDetalles[index] = detalle;
        setDetalles(nuevosDetalles);
    };

    const agregarPago = () => {
        setPagos([...pagos, {
            formaPago: '20',
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
        const totalSinImpuestos = detalles.reduce((sum, d) => sum + (Number(d.baseImponible) || 0), 0);
        const totalDescuento = detalles.reduce((sum, d) => sum + (Number(d.descuento) || 0), 0);
        const totalIVA = detalles.reduce((sum, d) => sum + (Number(d.valorIVA) || 0), 0);
        const importeTotal = totalSinImpuestos + totalIVA;

        return { totalSinImpuestos, totalDescuento, totalIVA, importeTotal };
    };

    const totales = calcularTotales();

    useEffect(() => {
        if (pagos.length === 1 && Math.abs(pagos[0].total - totales.importeTotal) > 0.001) {
            actualizarPago(0, 'total', parseFloat(totales.importeTotal.toFixed(2)));
        }
    }, [totales.importeTotal]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEmpresa) return;

        const totalPagos = pagos.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

        if (Math.abs(totalPagos - totales.importeTotal) > 0.02) {
            setErrorSubmit(`El total de las formas de pago ($${totalPagos.toFixed(2)}) debe ser igual al importe total de la factura ($${totales.importeTotal.toFixed(2)})`);
            return;
        }

        setErrorSubmit(null);

        const nuevaFactura: FacturaViewModel = {
            id: factura?.id,
            ambiente: '1',
            tipoEmision: '1',
            razonSocial: currentEmpresa.razonSocial,
            nombreComercial: currentEmpresa.nombreComercial,
            ruc: currentEmpresa.ruc,
            codDoc: '01',
            estab: estab || '',
            ptoEmi: ptoEmi || '',
            secuencial: secuencial || '',
            dirMatriz: currentEmpresa.direccionMatriz,
            fechaEmision,
            tipoIdentificacionComprador: tipoIdentificacion,
            razonSocialComprador: razonSocial,
            identificacionComprador: identificacion,
            direccionComprador: direccion,
            emailComprador: email,
            detalles,
            ...totales,
            pagos,
            estado: 'BORRADOR',
            obligadoContabilidad: currentEmpresa.obligadoContabilidad ? 'SI' : 'NO',
        };

        try {
            const res = await FacturacionUseCases.vender({
                ...nuevaFactura,
                ambiente: currentEmpresa?.ambienteSriNombre || '1',
                puntoEmisionId: puntoActivo?.puntoEmisionId,
                clienteId: clienteId || identificacion,
                clienteNombre: razonSocial,
                clienteIdentificacion: identificacion,
                ivaRate: parametros?.ivaValor,
                // Pass the configured code to the backend use case if needed, 
                // though the standardizer will handle it based on detail codes now.
            });

            if (res.success) {
                if (res.estado === 'AUTORIZADO') {
                    showToast(`Factura emitida y autorizada: ${res.numeroAutorizacion}`, 'success');
                } else {
                    showToast(`Factura guardada localmente. Estado SRI: ${res.estado}. Deberá reintentar el envío después.`, 'success');
                }
                onSubmit({ ...nuevaFactura, id: res.id, estado: res.estado });
            }
        } catch (error: any) {
            console.error('Error en proceso de venta:', error);
            setErrorSubmit(`Error al procesar la venta: ${error.message}`);
        }
    };

    return (
        <form id={id} onSubmit={handleSubmit} className="space-y-8">
            {/* Encabezado Técnico */}
            <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-sri-blue/10">
                    <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                        <FileText size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Información del Comprobante</h3>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Número de factura (Estab-PtoEmi-Secuencial)</label>
                        <Input
                            value={`${estab}-${ptoEmi}-${secuencial}`}
                            onChange={(e) => handleNumeroFacturaChange(e.target.value)}
                            placeholder="001-001-000000001"
                            className="font-mono font-bold text-sri-blue bg-slate-100"
                            required
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Fecha Emisión</label>
                        <Input
                            type="date"
                            value={fechaEmision}
                            onChange={(e) => setFechaEmision(e.target.value)}
                            className="bg-slate-100"
                            required
                            disabled
                        />
                    </div>
                </div>
            </div>

            {/* Datos del Cliente */}
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-sri-blue/10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <User size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Datos del Comprador</h3>
                    </div>
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
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tipo Identificación</label>
                            <select
                                value={tipoIdentificacion}
                                onChange={(e) => setTipoIdentificacion(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sri-blue/20 outline-none"
                            >
                                {tiposIdentificacion && tiposIdentificacion.length > 0 ? (
                                    tiposIdentificacion.map(tipo => (
                                        <option key={tipo.codigo} value={tipo.codigo}>
                                            {tipo.valor}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="04">RUC</option>
                                        <option value="05">CEDULA</option>
                                        <option value="06">PASAPORTE</option>
                                        <option value="07">CONSUMIDOR FINAL</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Identificación *</label>
                            <div className="relative">
                                <Input
                                    value={identificacion}
                                    onChange={(e) => setIdentificacion(e.target.value)}
                                    placeholder="17..."
                                    required
                                    className={`pr-10 ${errorIdentificacion ? 'border-red-300 focus:ring-red-200' : identificacionValida ? 'border-green-300 focus:ring-green-200' : ''}`}
                                />
                                {identificacion.length >= 5 && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {identificacionValida ? (
                                            <CheckCircle2 size={18} className="text-green-500" />
                                        ) : errorIdentificacion ? (
                                            <AlertCircle size={18} className="text-red-500" />
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            {errorIdentificacion && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {errorIdentificacion}
                                </p>
                            )}
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
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sri-blue/10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                            <Calculator size={16} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Detalles de Factura</h3>
                    </div>
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
                                        <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-center text-slate-600">
                                            {detalle.codigoIVA === (parametros?.ivaCodigo)
                                                ? (parametros?.ivaEtiqueta || '15%')
                                                : '0%'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-slate-900">
                                        ${(Number(detalle.total) || 0).toFixed(2)}
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
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-sri-blue/10">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-sri-blue text-white rounded-lg shadow-lg shadow-sri-blue/20">
                                <CreditCard size={16} />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Formas de Pago</h3>
                        </div>
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
                                        {formasPago && formasPago.length > 0 ? (
                                            formasPago.map(forma => (
                                                <option key={forma.codigo} value={forma.codigo}>
                                                    {forma.valor}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="20">Otros con Sist. Finan.</option>
                                        )}
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

                <div className="flex justify-end pt-4 border-t border-slate-100">
                    <div className="w-80 space-y-2 text-right">
                        <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                            <span>Subtotal Sin Impuestos:</span>
                            <span className="font-mono text-sm">{formatearDinero(totales.totalSinImpuestos)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                            <span>Descuento Total:</span>
                            <span className="font-mono text-sm">{formatearDinero(totales.totalDescuento)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                            <span>IVA ({parametros?.ivaEtiqueta || '15%'}):</span>
                            <span className="font-mono text-sm">{formatearDinero(totales.totalIVA)}</span>
                        </div>
                        <div className="flex justify-between font-black text-sri-blue pt-2 mt-2 border-t border-slate-200">
                            <span className="text-xs uppercase tracking-widest">Importe Total:</span>
                            <span className="text-2xl font-mono">{formatearDinero(totales.importeTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerta de Error de Envío */}
            {errorSubmit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-medium">{errorSubmit}</p>
                </div>
            )}

            {/* Botones de Acción */}
            {showButtons && (
                <div className="flex justify-end gap-4">
                    <Button type="button" onClick={onCancel} variant="secondary" className="px-8">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" className="px-12 bg-sri-blue hover:bg-sri-light shadow-lg shadow-blue-900/20">
                        Emitir y Autorizar SRI
                    </Button>
                </div>
            )}
        </form>
    );
}
