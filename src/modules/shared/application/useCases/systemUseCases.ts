/**
 * Base class for Use Cases to handle common validation and headers
 */
export class BaseUseCase {
    protected static getHeaders() {
        // En una app real, estos vendrían de un store global (Pinia/Redux) o sesión
        // Intentamos obtener de localStorage si están disponibles
        const empresaId = typeof window !== 'undefined' ? localStorage.getItem('current_empresa_id') : null;
        const usuarioId = typeof window !== 'undefined' ? localStorage.getItem('current_usuario_id') : null;

        return {
            'Content-Type': 'application/json',
            'x-empresa-id': empresaId || '',
            'x-usuario-id': usuarioId || ''
        };
    }

    protected static async request(url: string, options: RequestInit = {}) {
        const headers = { ...this.getHeaders(), ...options.headers };
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            const err = await res.json();
            // Crear error con detalles completos del SRI
            const error = new Error(err.error || err.message || 'Error en la petición al servidor') as any;
            error.details = err.details;
            error.xml = err.xml;
            error.success = err.success;
            error.status = res.status;
            console.error('Error API:', err);
            throw error;
        }
        return await res.json();
    }
}

/**
 * MÓDULO: DASHBOARD
 */
export class DashboardUseCases extends BaseUseCase {
    static async obtenerEstadisticas() {
        return this.request('/api/dashboard/stats');
    }
}

/**
 * MÓDULO: CONTABILIDAD
 */
export class ContabilidadUseCases extends BaseUseCase {
    static async listarCuentas() {
        return this.request('/api/contabilidad/cuentas');
    }
    static async listarTodasLasCuentas() {
        return this.request('/api/contabilidad/cuentas?all=true');
    }
    static async listarCuentasMovimiento() {
        return this.request('/api/contabilidad/cuentas?all=true&soloMovimiento=true');
    }
    static async registrarAsiento(asiento: any) {
        return this.request('/api/contabilidad/asientos', {
            method: 'POST',
            body: JSON.stringify(asiento)
        });
    }
    static async listarAsientos() {
        return this.request('/api/contabilidad/asientos');
    }
    static async listarCentrosCostos() {
        return this.request('/api/contabilidad/centros-costos');
    }
    static async obtenerBalanceGeneral(fechaCorte: string) {
        return this.request(`/api/contabilidad/reportes/balance?fecha=${fechaCorte}`);
    }
    static async obtenerEstadoResultados(desde: string, hasta: string) {
        return this.request(`/api/contabilidad/reportes/resultados?desde=${desde}&hasta=${hasta}`);
    }
    static async guardarCuenta(cuenta: any) {
        return this.request('/api/contabilidad/cuentas', {
            method: 'POST',
            body: JSON.stringify(cuenta)
        });
    }
    static async eliminarCuenta(codigo: string) {
        return this.request(`/api/contabilidad/cuentas/${codigo}`, {
            method: 'DELETE'
        });
    }

    static async obtenerFlujoEfectivo(desde: string, hasta: string) {
        return this.request(`/api/contabilidad/reportes/flujo-efectivo?desde=${desde}&hasta=${hasta}`);
    }

    static async obtenerCambiosPatrimonio(desde: string, hasta: string) {
        return this.request(`/api/contabilidad/reportes/cambios-patrimonio?desde=${desde}&hasta=${hasta}`);
    }
}

/**
 * MÓDULO: INVENTARIO
 */
export class InventarioUseCases extends BaseUseCase {
    static async listarProductos(query: string = '') {
        return this.request(`/api/inventario/productos${query}`);
    }
    static async ajustarStock(ajuste: any) {
        return this.request('/api/inventario/kardex', {
            method: 'POST',
            body: JSON.stringify(ajuste)
        });
    }
    static async listarCategorias() {
        return this.request('/api/inventario/categorias');
    }
    static async listarTodasCategorias() {
        return this.request('/api/inventario/categorias?all=true');
    }
    static async listarCategoriasPaginado(page: number = 1, limit: number = 10) {
        return this.request(`/api/inventario/categorias?page=${page}&limit=${limit}`);
    }
    static async guardarCategoria(categoria: any) {
        return this.request('/api/inventario/categorias', {
            method: 'POST',
            body: JSON.stringify(categoria)
        });
    }

    static async actualizarCategoria(id: string, categoria: any) {
        return this.request(`/api/inventario/categorias`, {
            method: 'PUT',
            body: JSON.stringify({ ...categoria, id })
        });
    }
    static async listarBodegas() {
        return this.request('/api/inventario/bodegas');
    }
    static async guardarProducto(producto: any) {
        return this.request('/api/inventario/productos', {
            method: 'POST',
            body: JSON.stringify(producto)
        });
    }
    static async guardarBodega(bodega: any) {
        return this.request('/api/inventario/bodegas', {
            method: 'POST',
            body: JSON.stringify(bodega)
        });
    }
    static async eliminarBodega(id: string) {
        return this.request(`/api/inventario/bodegas/${id}`, {
            method: 'DELETE'
        });
    }
    static async listarKardex(productoId: string, fechaInicio: string, fechaFin: string) {
        const queryParams = new URLSearchParams({
            productoId,
            desde: fechaInicio,
            hasta: fechaFin
        });
        return this.request(`/api/inventario/kardex?${queryParams.toString()}`);
    }

    static async listarTransferencias() {
        return this.request('/api/inventario/transferencias');
    }

    static async registrarTransferencia(transferencia: any) {
        return this.request('/api/inventario/transferencias', {
            method: 'POST',
            body: JSON.stringify(transferencia)
        });
    }
}

/**
 * MÓDULO: BANCOS
 */
export class BancosUseCases extends BaseUseCase {
    static async listarCuentas() {
        return this.request('/api/bancos/cuentas');
    }

    static async listarMovimientos(filtros?: any) {
        const query = filtros ? `?${new URLSearchParams(filtros).toString()}` : '';
        return this.request(`/api/bancos/movimientos${query}`);
    }

    static async registrarTransaccion(transaccion: any) {
        return this.request('/api/bancos/movimientos', {
            method: 'POST',
            body: JSON.stringify(transaccion)
        });
    }

    static async guardarCuenta(cuenta: any) {
        return this.request('/api/bancos/cuentas', {
            method: 'POST',
            body: JSON.stringify(cuenta)
        });
    }
}

/**
 * MÓDULO: NÓMINA
 */
export class NominaUseCases extends BaseUseCase {
    static async listarEmpleados() {
        return this.request('/api/nomina/empleados');
    }
    static async generarRol(periodo: string) {
        return this.request('/api/nomina/roles', {
            method: 'POST',
            body: JSON.stringify({ periodo })
        });
    }
    static async listarRoles(periodo: string) {
        return this.request(`/api/nomina/roles?periodo=${periodo}`);
    }
    static async guardarEmpleado(empleado: any) {
        return this.request('/api/nomina/empleados', {
            method: 'POST',
            body: JSON.stringify(empleado)
        });
    }
    static async pagarRol(pago: any) {
        return this.request('/api/nomina/roles', {
            method: 'PUT',
            body: JSON.stringify(pago)
        });
    }

    static async eliminarEmpleado(id: string) {
        return this.request(`/api/nomina/empleados/${id}`, {
            method: 'DELETE'
        });
    }
}

/**
 * MÓDULO: CARTERA
 */
export class CarteraUseCases extends BaseUseCase {
    static async listarCuentasPorCobrar() {
        return this.request('/api/cartera/cxc');
    }
    static async registrarPago(pago: any) {
        return this.request('/api/cartera/pagos', {
            method: 'POST',
            body: JSON.stringify(pago)
        });
    }
    static async listarDocumentosPendientes(tipo: string, terceroId?: string) {
        let url = `/api/cartera/documentos?tipo=${tipo}`;
        if (terceroId) url += `&terceroId=${terceroId}`;
        return this.request(url);
    }
    static async listarAnticipos(tipo: string) {
        return this.request(`/api/cartera/anticipos?tipo=${tipo}`);
    }
    static async registrarAnticipo(anticipo: any) {
        return this.request('/api/cartera/anticipos', {
            method: 'POST',
            body: JSON.stringify(anticipo)
        });
    }

    static async obtenerReporteAging(tipo: string) {
        return this.request(`/api/cartera/aging?tipo=${tipo}`);
    }
}

/**
 * MÓDULO: AUDITORÍA
 */
export class AuditoriaUseCases extends BaseUseCase {
    static async consultarLogs(filtros: any) {
        const query = new URLSearchParams(filtros).toString();
        return this.request(`/api/auditoria/sistema?${query}`);
    }
}

/**
 * MÓDULO: DIRECTORIO (TERCEROS)
 */
export class DirectorioUseCases extends BaseUseCase {
    private static mapTercero(t: any) {
        return {
            id: t.id,
            empresaId: t.empresa_id,
            tipoIdentificacion: t.tipo_identificacion,
            identificacion: t.identificacion,
            razonSocial: t.razon_social,
            nombreComercial: t.nombre_comercial,
            tipo: t.tipo_tercero,
            esContribuyenteEspecial: t.es_contribuyente_especial,
            llevaContabilidad: t.es_obligado_contabilidad,
            email: t.email,
            telefono: t.telefono,
            celular: t.celular,
            direccion: t.direccion,
            provincia: t.provincia,
            ciudad: t.ciudad,
            codigoPostal: t.codigo_postal,
            limiteCredito: Number(t.limite_credito),
            diasCredito: Number(t.dias_credito),
            descuentoPorcentaje: Number(t.descuento_porcentaje),
            activo: t.activo,
            createdAt: t.created_at,
            updatedAt: t.updated_at
        };
    }

    static async listarTerceros(tipo?: string, buscar?: string) {
        const params = new URLSearchParams();
        if (tipo) params.set('tipo', tipo);
        if (buscar) params.set('buscar', buscar);
        params.set('activo', 'true');

        const query = params.toString();
        const data = await this.request(`/api/directorio/terceros${query ? '?' + query : ''}`);
        return data.map(this.mapTercero);
    }

    static async guardarTercero(tercero: any) {
        return this.request('/api/directorio/terceros', {
            method: 'POST',
            body: JSON.stringify(tercero)
        });
    }

    static async actualizarTercero(id: string, tercero: any) {
        return this.request('/api/directorio/terceros', {
            method: 'PUT',
            body: JSON.stringify({ ...tercero, id })
        });
    }

    static async eliminarTercero(id: string) {
        return this.request(`/api/directorio/terceros/${id}`, {
            method: 'DELETE'
        });
    }
}

/**
 * MÓDULO: CONFIGURACIÓN
 */
export class ConfiguracionUseCases extends BaseUseCase {
    static async listarSucursales() {
        return this.request('/api/configuracion/sucursales');
    }

    static async guardarSucursal(sucursal: any) {
        return this.request('/api/configuracion/sucursales', {
            method: 'POST',
            body: JSON.stringify(sucursal)
        });
    }

    static async actualizarSucursal(sucursal: any) {
        return this.request('/api/configuracion/sucursales', {
            method: 'PUT',
            body: JSON.stringify(sucursal)
        });
    }

    static async listarPuntosEmision() {
        return this.request('/api/configuracion/puntos-emision');
    }

    static async guardarPuntoEmision(punto: any) {
        if (punto.id) {
            return this.request('/api/configuracion/puntos-emision', {
                method: 'PUT',
                body: JSON.stringify(punto)
            });
        }
        return this.request('/api/configuracion/puntos-emision', {
            method: 'POST',
            body: JSON.stringify(punto)
        });
    }

    static async listarRetenciones() {
        return this.request('/api/configuracion/retenciones');
    }

    static async guardarRetencion(retencion: any) {
        return this.request('/api/configuracion/retenciones', {
            method: 'POST',
            body: JSON.stringify(retencion)
        });
    }

    static async obtenerParametros() {
        return this.request('/api/configuracion/parametros');
    }

    static async guardarParametros(params: any) {
        return this.request('/api/configuracion/parametros', {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    static async actualizarEmpresa(empresa: any) {
        return this.request(`/api/empresas/${empresa.id}`, {
            method: 'PUT',
            body: JSON.stringify(empresa)
        });
    }

    static async crearEmpresa(empresa: any) {
        return this.request('/api/empresas', {
            method: 'POST',
            body: JSON.stringify(empresa)
        });
    }

    static async listarEmpresas() {
        return this.request('/api/empresas');
    }

    static async obtenerMenu() {
        return this.request('/api/configuracion/menu');
    }

    static async obtenerMisPuntos() {
        return this.request('/api/configuracion/puntos-emision/mis-puntos');
    }

    static async activarPuntoEmision(puntoEmisionId: string) {
        return this.request('/api/configuracion/puntos-emision/activar', {
            method: 'POST',
            body: JSON.stringify({ puntoEmisionId })
        });
    }

    static async obtenerCatalogo(tipo: string) {
        return this.request(`/api/configuracion/catalogos?tipo=${tipo}`);
    }

    static async obtenerAmbientesSRI() {
        return this.request('/api/configuracion/sri/ambientes');
    }
}

/**
 * MÓDULO: FACTURACIÓN / SRI
 */
export class FacturacionUseCases extends BaseUseCase {
    static async emitirFactura(factura: any) {
        return this.request('/api/facturacion/emitir', {
            method: 'POST',
            body: JSON.stringify(factura)
        });
    }
    static async vender(venta: any) {
        return this.request('/api/facturacion/vender', {
            method: 'POST',
            body: JSON.stringify(venta)
        });
    }
    static async registrarComprobante(comprobante: any) {
        return this.request('/api/facturacion/comprobantes', {
            method: 'POST',
            body: JSON.stringify(comprobante)
        });
    }
    static async listarComprobantes() {
        return this.request('/api/facturacion/comprobantes');
    }
    static async listarGuias() {
        return this.request('/api/facturacion/guias');
    }

    // PROFORMAS
    static async listarProformas() {
        return this.request('/api/facturacion/proformas');
    }

    static async guardarProforma(proforma: any) {
        return this.request('/api/facturacion/proformas', {
            method: proforma.id ? 'PUT' : 'POST',
            body: JSON.stringify(proforma)
        });
    }

    static async facturarProforma(id: string) {
        return this.request(`/api/facturacion/proformas/${id}/facturar`, {
            method: 'POST'
        });
    }
    static async guardarGuiaRemision(guia: any) {
        return this.request('/api/facturacion/guias', {
            method: 'POST',
            body: JSON.stringify(guia)
        });
    }
    static async actualizarGuia(guia: any) {
        return this.request('/api/facturacion/guias', {
            method: 'PUT',
            body: JSON.stringify(guia)
        });
    }
    static async listarTransportistas() {
        return this.request('/api/transportistas');
    }
    static async guardarTransportista(transportista: any) {
        return this.request('/api/transportistas', {
            method: 'POST',
            body: JSON.stringify(transportista)
        });
    }

    static async listarPuntosEmision() {
        return ConfiguracionUseCases.listarPuntosEmision();
    }

    static async obtenerSiguienteSecuencial(puntoEmisionId: string, tipoComprobante: string) {
        return this.request(`/api/facturacion/secuencial?puntoEmisionId=${puntoEmisionId}&tipoComprobante=${tipoComprobante}`);
    }
}

/**
 * MÓDULO: COMPRAS
 */
export class ComprasUseCases extends BaseUseCase {
    static async listarCompras() {
        return this.request('/api/compras');
    }

    static async registrarCompra(compra: any) {
        return this.request('/api/compras', {
            method: 'POST',
            body: JSON.stringify(compra)
        });
    }

    static async registrarCompraConRetencion(data: any) {
        return this.request('/api/compras/registrar-con-retencion', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async listarOrdenes() {
        return this.request('/api/compras/ordenes');
    }

    static async registrarOrden(orden: any) {
        return this.request('/api/compras/ordenes', {
            method: 'POST',
            body: JSON.stringify(orden)
        });
    }

    static async registrarLiquidacion(liquidacion: any) {
        return this.request('/api/compras/liquidaciones', {
            method: 'POST',
            body: JSON.stringify(liquidacion)
        });
    }

    static async generarRetencion(compraId: string) {
        return this.request('/api/compras', {
            method: 'POST',
            body: JSON.stringify({ action: 'retencion', compraId })
        });
    }
}

/**
 * MÓDULO: CAJA CHICA
 */
export class CajaChicaUseCases extends BaseUseCase {
    static async obtenerInfo(empresaId: string) {
        return this.request(`/api/caja-chica?empresaId=${empresaId}&action=info`);
    }

    static async listarVales(empresaId: string) {
        return this.request(`/api/caja-chica?empresaId=${empresaId}`);
    }

    static async guardarVale(empresaId: string, vale: any) {
        return this.request('/api/caja-chica', {
            method: 'POST',
            body: JSON.stringify({ empresaId, vale })
        });
    }

    static async anularVale(empresaId: string, valeId: string) {
        return this.request('/api/caja-chica', {
            method: 'POST',
            body: JSON.stringify({ action: 'anular', valeId, empresaId })
        });
    }
}

/**
 * MÓDULO: BUZÓN SRI
 */
export class BuzonUseCases extends BaseUseCase {
    static async listarComprobantes(empresaId: string) {
        return this.request(`/api/buzon?empresaId=${empresaId}`);
    }

    static async sincronizarSRI(empresaId: string, desde: string, hasta: string) {
        return this.request('/api/buzon', {
            method: 'POST',
            body: JSON.stringify({
                action: 'importar',
                empresaId,
                desde,
                hasta
            })
        });
    }

    static async procesarComprobante(id: string) {
        return this.request(`/api/buzon/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: 'PROCESADO' })
        });
    }
}

/**
 * MÓDULO: ACTIVOS FIJOS
 */
export class ActivosUseCases extends BaseUseCase {
    static async listarActivos() {
        return this.request('/api/activos');
    }

    static async guardarActivo(activo: any) {
        return this.request('/api/activos', {
            method: 'POST',
            body: JSON.stringify(activo)
        });
    }

    static async eliminarActivo(id: string) {
        return this.request(`/api/activos?id=${id}`, {
            method: 'DELETE'
        });
    }

    static async calcularDepreciacion(periodo: string) {
        return this.request('/api/activos', {
            method: 'POST',
            body: JSON.stringify({ action: 'depreciar', periodo })
        });
    }
}

/**
 * MÓDULO: IMPUESTOS
 */
export class ImpuestosUseCases extends BaseUseCase {
    static async listarFormularios(tipo: string) {
        return this.request(`/api/impuestos?tipo=${tipo}`);
    }

    static async generarFormulario(tipo: string, periodo: string) {
        return this.request('/api/impuestos', {
            method: 'POST',
            body: JSON.stringify({ action: 'generar', tipo, periodo })
        });
    }
}

/**
 * MÓDULO: USUARIOS Y SUSCRIPCIONES
 */
export class UsuariosUseCases extends BaseUseCase {
    static async obtenerSuscripcion() {
        return this.request('/api/users/me/subscription');
    }

    static async obtenerEstadisticasUso(periodo?: string) {
        const query = periodo ? `?periodo=${periodo}` : '';
        return this.request(`/api/users/me/usage${query}`);
    }

    // --- ADMINISTRACIÓN DE USUARIOS ---
    static async listarUsuarios(filtros?: any) {
        const query = filtros ? `?${new URLSearchParams(filtros).toString()}` : '';
        return this.request(`/api/administracion/usuarios${query}`);
    }

    static async obtenerUsuario(id: string) {
        return this.request(`/api/administracion/usuarios/${id}`);
    }

    static async guardarUsuario(usuario: any) {
        if (usuario.id) {
            return this.request(`/api/administracion/usuarios/${usuario.id}`, {
                method: 'PUT',
                body: JSON.stringify(usuario)
            });
        }
        return this.request('/api/administracion/usuarios', {
            method: 'POST',
            body: JSON.stringify(usuario)
        });
    }

    static async eliminarUsuario(id: string) {
        return this.request(`/api/administracion/usuarios/${id}`, {
            method: 'DELETE'
        });
    }

    // --- ASIGNACIÓN DE PUNTOS DE EMISIÓN ---
    static async listarAsignacionesPuntos(filtros?: any) {
        const query = filtros ? `?${new URLSearchParams(filtros).toString()}` : '';
        return this.request(`/api/administracion/puntos-emision/asignaciones${query}`);
    }

    static async guardarAsignacionPunto(asignacion: any) {
        return this.request('/api/administracion/puntos-emision/asignaciones', {
            method: 'POST',
            body: JSON.stringify(asignacion)
        });
    }

    static async eliminarAsignacionPunto(id: string) {
        return this.request(`/api/administracion/puntos-emision/asignaciones/${id}`, {
            method: 'DELETE'
        });
    }
}

/**
 * MÓDULO: TERCEROS / DIRECTORIO
 */
export class TercerosUseCases extends BaseUseCase {
    static async listarTerceros(filtros: any = {}) {
        const query = new URLSearchParams(filtros).toString();
        return this.request(`/api/directorio/terceros${query ? '?' + query : ''}`);
    }
    static async obtenerTercero(id: string) {
        return this.request(`/api/directorio/terceros/${id}`);
    }
    static async guardarTercero(tercero: any) {
        return this.request('/api/directorio/terceros', {
            method: tercero.id ? 'PUT' : 'POST',
            body: JSON.stringify(tercero)
        });
    }
}
