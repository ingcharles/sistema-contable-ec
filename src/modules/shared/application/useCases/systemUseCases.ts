/**
 * Base class for Use Cases to handle common validation and headers
 */
export class BaseUseCase {
    protected static getHeaders() {
        // En una app real, estos vendrían de un store global (Pinia/Redux) o sesión
        // Intentamos obtener de localStorage si están disponibles
        const empresaId = typeof window !== 'undefined' ? localStorage.getItem('current_empresa_id') : 'empresa-uuid-123';
        const usuarioId = typeof window !== 'undefined' ? localStorage.getItem('current_usuario_id') : 'usuario-uuid-456';

        return {
            'Content-Type': 'application/json',
            'x-empresa-id': empresaId || 'empresa-uuid-123',
            'x-usuario-id': usuarioId || 'usuario-uuid-456'
        };
    }

    protected static async request(url: string, options: RequestInit = {}) {
        const headers = { ...this.getHeaders(), ...options.headers };
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error en la petición al servidor');
        }
        return await res.json();
    }
}

/**
 * MÓDULO: CONTABILIDAD
 */
export class ContabilidadUseCases extends BaseUseCase {
    static async listarCuentas() {
        return this.request('/api/contabilidad/cuentas');
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
    static async listarComprobantes() {
        return this.request('/api/facturacion/comprobantes');
    }
    static async listarGuias() {
        return this.request('/api/facturacion/guias');
    }
    static async guardarGuiaRemision(guia: any) {
        return this.request('/api/facturacion/guias', {
            method: 'POST',
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
}

/**
 * MÓDULO: NÓMINA
 */
export class NominaUseCases extends BaseUseCase {
    static async listarEmpleados() {
        return this.request('/api/nomina/empleados');
    }
    static async generarRol(periodo: string) {
        return this.request('/api/nomina/roles/generar', {
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
    static async listarDocumentosPendientes(tipo: string) {
        return this.request(`/api/cartera/documentos?tipo=${tipo}`);
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
            llevaContabilidad: t.obligado_contabilidad,
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

    static async listarOrdenes() {
        return this.request('/api/compras/ordenes');
    }

    static async registrarOrden(orden: any) {
        return this.request('/api/compras/ordenes', {
            method: 'POST',
            body: JSON.stringify(orden)
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
}
