-- ============================================================================
-- ECUCONTABLE PRO - SCHEMA POSTGRESQL 15+ COMPLETO
-- ============================================================================
-- Versión: 4.1 (Full Comments)
-- Fecha: 2024-01-20
-- Arquitectura: Multi-Tenant + Auditorí­a Completa + JWT
-- Descripción: Esquema completo con documentación detallada de cada campo.
-- ============================================================================

-- ============================================================================
-- EXTENSIONES Y CONFIGURACIÓN
-- ============================================================================
/*
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda full-text y trigramas
*/
-- ============================================================================
-- SCHEMAS
-- ============================================================================
/*
CREATE SCHEMA IF NOT EXISTS seguridad;
CREATE SCHEMA IF NOT EXISTS contabilidad;
CREATE SCHEMA IF NOT EXISTS directorio;
CREATE SCHEMA IF NOT EXISTS inventario;
CREATE SCHEMA IF NOT EXISTS nomina;
CREATE SCHEMA IF NOT EXISTS bancos;
CREATE SCHEMA IF NOT EXISTS cartera;
CREATE SCHEMA IF NOT EXISTS facturacion;
CREATE SCHEMA IF NOT EXISTS auditoria;
CREATE SCHEMA IF NOT EXISTS configuracion;
CREATE SCHEMA IF NOT EXISTS caja_chica;
CREATE SCHEMA IF NOT EXISTS buzon;
CREATE SCHEMA IF NOT EXISTS compras;
*/

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================
CREATE TYPE tipo_cuenta AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO');
CREATE TYPE estado_asiento AS ENUM ('BORRADOR', 'MAYORIZADO', 'ANULADO');
CREATE TYPE tipo_movimiento_kardex AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO');
CREATE TYPE tipo_contrato AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'TEMPORAL', 'PROYECTO');
CREATE TYPE estado_rol_pago AS ENUM ('BORRADOR', 'PENDIENTE', 'PAGADO', 'ANULADO');
CREATE TYPE tipo_cartera AS ENUM ('CXC', 'CXP');
CREATE TYPE tipo_comprobante_sri AS ENUM ('01', '03', '04', '05', '06', '07');
CREATE TYPE estado_comprobante AS ENUM ('BORRADOR', 'PENDIENTE', 'AUTORIZADO', 'RECHAZADO', 'ANULADO','ERROR');
CREATE TYPE severidad_log AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- ============================================================================
-- 1. MÓDULO: EMPRESAS Y SEGURIDAD
-- ============================================================================

-- Tabla: seguridad.empresas
CREATE TABLE seguridad.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(13) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    es_obligado_contabilidad BOOLEAN DEFAULT true,
    es_contribuyente_especial BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguridad.empresas IS 'Empresas del sistema (multi-tenant). Cada empresa es un tenant aislado.';
COMMENT ON COLUMN seguridad.empresas.id IS 'Identificador único (UUID) de la empresa';
COMMENT ON COLUMN seguridad.empresas.ruc IS 'Registro íšnico de Contribuyentes (13 dí­gitos). Debe ser único en el sistema';
COMMENT ON COLUMN seguridad.empresas.razon_social IS 'Razón social legal de la empresa según el RUC';
COMMENT ON COLUMN seguridad.empresas.nombre_comercial IS 'Nombre comercial o de fantasí­a de la empresa';
COMMENT ON COLUMN seguridad.empresas.direccion IS 'Dirección matriz de la empresa';
COMMENT ON COLUMN seguridad.empresas.telefono IS 'Teléfono de contacto principal';
COMMENT ON COLUMN seguridad.empresas.email IS 'Correo electrónico para notificaciones del sistema';
COMMENT ON COLUMN seguridad.empresas.logo_url IS 'URL o path del logo de la empresa';
COMMENT ON COLUMN seguridad.empresas.es_obligado_contabilidad IS 'Indica si la empresa está obligada a llevar contabilidad (TRUE/FALSE)';
COMMENT ON COLUMN seguridad.empresas.es_contribuyente_especial IS 'Indica si la empresa es contribuyente especial (TRUE/FALSE)';
COMMENT ON COLUMN seguridad.empresas.activa IS 'Estado de la empresa. FALSE impide el acceso a sus usuarios';
COMMENT ON COLUMN seguridad.empresas.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN seguridad.empresas.updated_at IS 'Fecha y hora de última actualización';

-- Tipos ENUM del módulo seguridad
--CREATE TYPE seguridad.tipo_rol AS ENUM ('SUPERADMIN', 'ADMIN', 'CONTADOR', 'AUDITOR', 'ASISTENTE');

-- Tabla: seguridad.usuarios
CREATE TABLE seguridad.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    --rol seguridad.tipo_rol NOT NULL DEFAULT 'ASISTENTE',
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguridad.usuarios IS 'Usuarios del sistema con credenciales de acceso.';
COMMENT ON COLUMN seguridad.usuarios.id IS 'Identificador único (UUID) del usuario';
COMMENT ON COLUMN seguridad.usuarios.email IS 'Correo electrónico único usado para login';
COMMENT ON COLUMN seguridad.usuarios.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN seguridad.usuarios.password_hash IS 'Hash SHA-256 de la contraseña del usuario';
--COMMENT ON COLUMN seguridad.usuarios.rol IS 'Rol global del usuario: SUPERADMIN, ADMIN, CONTADOR, AUDITOR, ASISTENTE';
COMMENT ON COLUMN seguridad.usuarios.activo IS 'Estado del usuario. FALSE impide el login';
COMMENT ON COLUMN seguridad.usuarios.ultimo_acceso IS 'Timestamp del último inicio de sesión exitoso';
COMMENT ON COLUMN seguridad.usuarios.created_at IS 'Fecha de registro del usuario';
COMMENT ON COLUMN seguridad.usuarios.updated_at IS 'Fecha de última modificación de datos del usuario';

-- Tabla: seguridad.usuarios_empresas
CREATE TABLE seguridad.usuarios_empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, empresa_id)
);

COMMENT ON TABLE seguridad.usuarios_empresas IS 'Relación Many-to-Many entre Usuarios y Empresas (Multi-tenant).';
COMMENT ON COLUMN seguridad.usuarios_empresas.id IS 'Identificador único de la relación';
COMMENT ON COLUMN seguridad.usuarios_empresas.usuario_id IS 'Referencia al usuario';
COMMENT ON COLUMN seguridad.usuarios_empresas.empresa_id IS 'Referencia a la empresa a la que tiene acceso';
COMMENT ON COLUMN seguridad.usuarios_empresas.activo IS 'Permite deshabilitar el acceso a una empresa especí­fica sin desactivar el usuario global';
COMMENT ON COLUMN seguridad.usuarios_empresas.created_at IS 'Fecha de asignación del permiso';

-- ============================================================================
-- 2. MÓDULO: CONTABILIDAD
-- ============================================================================

-- Tipos ENUM del módulo contabilidad
CREATE TYPE contabilidad.tipo_cuenta AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO');
CREATE TYPE contabilidad.estado_asiento AS ENUM ('BORRADOR', 'MAYORIZADO', 'ANULADO');
CREATE TYPE contabilidad.tipo_asiento AS ENUM ('DIARIO', 'INGRESO', 'EGRESO', 'AJUSTE', 'CIERRE', 'APERTURA');

-- Tabla: contabilidad.plan_cuentas
CREATE TABLE contabilidad.plan_cuentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo contabilidad.tipo_cuenta NOT NULL,
    nivel INTEGER NOT NULL,
    saldo NUMERIC(18,2) DEFAULT 0,
    acepta_movimiento BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE contabilidad.plan_cuentas IS 'Plan de cuentas contables. Estructura jerárquica para la contabilidad.';
COMMENT ON COLUMN contabilidad.plan_cuentas.id IS 'Identificador único de la cuenta contable';
COMMENT ON COLUMN contabilidad.plan_cuentas.empresa_id IS 'Empresa a la que pertenece la cuenta (tenant)';
COMMENT ON COLUMN contabilidad.plan_cuentas.usuario_id IS 'Usuario que creó o modificó la cuenta por última vez';
COMMENT ON COLUMN contabilidad.plan_cuentas.codigo IS 'Código contable jerárquico (ej: 1.1.01). íšnico por empresa';
COMMENT ON COLUMN contabilidad.plan_cuentas.nombre IS 'Nombre descriptivo de la cuenta';
COMMENT ON COLUMN contabilidad.plan_cuentas.tipo IS 'Clasificación: ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO';
COMMENT ON COLUMN contabilidad.plan_cuentas.nivel IS 'Profundidad en el árbol jerárquico (calculado por puntos + 1)';
COMMENT ON COLUMN contabilidad.plan_cuentas.saldo IS 'Saldo acumulado actual de la cuenta. Se actualiza con los asientos mayorizados';
COMMENT ON COLUMN contabilidad.plan_cuentas.acepta_movimiento IS 'Indica si la cuenta puede recibir movimientos directos (cuentas de detalle) o solo agrupa subcuentas';
COMMENT ON COLUMN contabilidad.plan_cuentas.activa IS 'Indica si la cuenta se puede usar en nuevos asientos';
COMMENT ON COLUMN contabilidad.plan_cuentas.created_at IS 'Fecha de creación de la cuenta';
COMMENT ON COLUMN contabilidad.plan_cuentas.updated_at IS 'Fecha de última modificación';

-- Tabla: contabilidad.centros_costos
CREATE TABLE contabilidad.centros_costos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    nivel INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE contabilidad.centros_costos IS 'Centros de costos para contabilidad analí­tica / distribución de gastos.';
COMMENT ON COLUMN contabilidad.centros_costos.id IS 'Identificador único del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.empresa_id IS 'Empresa propietaria del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.codigo IS 'Código identificador (ej: CC-01-02)';
COMMENT ON COLUMN contabilidad.centros_costos.nombre IS 'Nombre del centro de costos (ej: Departamento TI)';
COMMENT ON COLUMN contabilidad.centros_costos.nivel IS 'Nivel jerárquico del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.activo IS 'Estado del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.created_at IS 'Fecha de creación del registro';

-- Tabla: contabilidad.asientos
CREATE TABLE contabilidad.asientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    numero VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    glosa TEXT NOT NULL,
    tipo contabilidad.tipo_asiento DEFAULT 'DIARIO',
    estado contabilidad.estado_asiento DEFAULT 'BORRADOR',
    centro_costo_id UUID REFERENCES contabilidad.centros_costos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero)
);

COMMENT ON TABLE contabilidad.asientos IS 'Cabecera de los asientos contables (Diario General).';
COMMENT ON COLUMN contabilidad.asientos.id IS 'Identificador único del asiento';
COMMENT ON COLUMN contabilidad.asientos.empresa_id IS 'Empresa a la que pertenece el asiento';
COMMENT ON COLUMN contabilidad.asientos.usuario_id IS 'Usuario que creó el asiento';
COMMENT ON COLUMN contabilidad.asientos.numero IS 'Número secuencial o código del asiento. íšnico por empresa';
COMMENT ON COLUMN contabilidad.asientos.fecha IS 'Fecha contable del registro';
COMMENT ON COLUMN contabilidad.asientos.glosa IS 'Descripción o detalle general del asiento';
COMMENT ON COLUMN contabilidad.asientos.tipo IS 'Tipo de asiento: DIARIO, INGRESO, EGRESO, AJUSTE, CIERRE';
COMMENT ON COLUMN contabilidad.asientos.estado IS 'Estado del ciclo de vida: BORRADOR, MAYORIZADO (afecta saldos), ANULADO';
COMMENT ON COLUMN contabilidad.asientos.centro_costo_id IS 'Referencia opcional a un centro de costos principal';
COMMENT ON COLUMN contabilidad.asientos.created_at IS 'Fecha de creación del asiento';
COMMENT ON COLUMN contabilidad.asientos.updated_at IS 'Fecha de última modificación';

-- Tabla: contabilidad.asientos_detalles
CREATE TABLE contabilidad.asientos_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asiento_id UUID NOT NULL REFERENCES contabilidad.asientos(id) ON DELETE CASCADE,
    cuenta_codigo VARCHAR(50) NOT NULL,
    debe NUMERIC(18,2) DEFAULT 0,
    haber NUMERIC(18,2) DEFAULT 0,
    concepto TEXT
);

COMMENT ON TABLE contabilidad.asientos_detalles IS 'Detalle de lí­neas del asiento contable (Movimientos).';
COMMENT ON COLUMN contabilidad.asientos_detalles.id IS 'Identificador único de la lí­nea de detalle';
COMMENT ON COLUMN contabilidad.asientos_detalles.asiento_id IS 'Referencia al asiento cabecera';
COMMENT ON COLUMN contabilidad.asientos_detalles.cuenta_codigo IS 'Código de la cuenta contable afectada (Desnormalizado para eficiencia histórica)';
COMMENT ON COLUMN contabilidad.asientos_detalles.debe IS 'Monto en la columna del DEBE (Débito)';
COMMENT ON COLUMN contabilidad.asientos_detalles.haber IS 'Monto en la columna del HABER (Crédito)';
COMMENT ON COLUMN contabilidad.asientos_detalles.concepto IS 'Descripción especí­fica de la lí­nea (opcional)';

-- ============================================================================
-- 3. MÓDULO: DIRECTORIO (TERCEROS)
-- ============================================================================

-- Tabla: directorio.terceros
CREATE TABLE directorio.terceros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    
    -- Identificación
    tipo_identificacion VARCHAR(2) NOT NULL,
    identificacion VARCHAR(20) NOT NULL,
    razon_social VARCHAR(300) NOT NULL,
    nombre_comercial VARCHAR(300),
    
    -- Clasificación
    tipo_tercero VARCHAR(20) NOT NULL,
    es_contribuyente_especial BOOLEAN DEFAULT FALSE,
    es_obligado_contabilidad BOOLEAN DEFAULT FALSE,
    
    -- Contacto
    email VARCHAR(100),
    telefono VARCHAR(20),
    celular VARCHAR(20),
    direccion TEXT,
    
    -- Ubicación
    provincia VARCHAR(50),
    ciudad VARCHAR(50),
    codigo_postal VARCHAR(10),
    
    -- Comercial
    limite_credito NUMERIC(15,2) DEFAULT 0,
    dias_credito INTEGER DEFAULT 0,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
    
    -- Contable
    cuenta_contable_cxc VARCHAR(20),
    cuenta_contable_cxp VARCHAR(20),
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    
    -- Auditorí­a
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    
    -- Constraints
    UNIQUE(empresa_id, identificacion,tipo_tercero),
    CONSTRAINT check_tipo_identificacion CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08')),
    CONSTRAINT check_tipo_tercero CHECK (tipo_tercero IN ('CLIENTE', 'PROVEEDOR', 'AMBOS', 'EMPLEADO', 'OTRO'))
);

COMMENT ON TABLE directorio.terceros IS 'Catálogo unificado de terceros: clientes, proveedores, empleados y otros contactos comerciales.';
COMMENT ON COLUMN directorio.terceros.id IS 'Identificador único (UUID) del tercero';
COMMENT ON COLUMN directorio.terceros.empresa_id IS 'Empresa a la que pertenece el tercero (tenant)';
COMMENT ON COLUMN directorio.terceros.tipo_identificacion IS 'Código SRI del tipo de identificación: 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final, 08=Exterior';
COMMENT ON COLUMN directorio.terceros.identificacion IS 'Número de identificación (RUC, cédula, pasaporte, etc.). íšnico por empresa';
COMMENT ON COLUMN directorio.terceros.razon_social IS 'Razón social o nombre legal completo del tercero';
COMMENT ON COLUMN directorio.terceros.nombre_comercial IS 'Nombre comercial o de fantasí­a (opcional)';
COMMENT ON COLUMN directorio.terceros.tipo_tercero IS 'Clasificación del tercero: CLIENTE, PROVEEDOR, AMBOS (cliente y proveedor), EMPLEADO, OTRO';
COMMENT ON COLUMN directorio.terceros.es_contribuyente_especial IS 'Indica si el tercero es contribuyente especial según el SRI (aplica descuentos adicionales)';
COMMENT ON COLUMN directorio.terceros.es_obligado_contabilidad IS 'Indica si el tercero está obligado a llevar contabilidad';
COMMENT ON COLUMN directorio.terceros.email IS 'Correo electrónico principal de contacto';
COMMENT ON COLUMN directorio.terceros.telefono IS 'Teléfono fijo de contacto';
COMMENT ON COLUMN directorio.terceros.celular IS 'Número de celular/móvil de contacto';
COMMENT ON COLUMN directorio.terceros.direccion IS 'Dirección completa del tercero';
COMMENT ON COLUMN directorio.terceros.provincia IS 'Provincia de ubicación';
COMMENT ON COLUMN directorio.terceros.ciudad IS 'Ciudad de ubicación';
COMMENT ON COLUMN directorio.terceros.codigo_postal IS 'Código postal';
COMMENT ON COLUMN directorio.terceros.limite_credito IS 'Monto máximo de crédito permitido para el tercero (si es cliente)';
COMMENT ON COLUMN directorio.terceros.dias_credito IS 'Plazo de pago en dí­as otorgado al tercero';
COMMENT ON COLUMN directorio.terceros.descuento_porcentaje IS 'Porcentaje de descuento comercial aplicable automáticamente';
COMMENT ON COLUMN directorio.terceros.cuenta_contable_cxc IS 'Código de cuenta contable de Cuentas por Cobrar (si es cliente)';
COMMENT ON COLUMN directorio.terceros.cuenta_contable_cxp IS 'Código de cuenta contable de Cuentas por Pagar (si es proveedor)';
COMMENT ON COLUMN directorio.terceros.activo IS 'Estado del tercero. FALSE oculta el tercero de las listas activas';
COMMENT ON COLUMN directorio.terceros.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN directorio.terceros.updated_at IS 'Fecha y hora de última modificación';
COMMENT ON COLUMN directorio.terceros.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN directorio.terceros.updated_by IS 'Usuario que realizó la última modificación';


-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_terceros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_terceros_updated_at
    BEFORE UPDATE ON directorio.terceros
    FOR EACH ROW
    EXECUTE FUNCTION update_terceros_updated_at();

-- ============================================================================
-- 4. MÓDULO: INVENTARIO
-- ============================================================================

-- Tipos ENUM del módulo inventario
CREATE TYPE inventario.tipo_movimiento_kardex AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO',
'DEVOLUCION_COMPRA','DEVOLUCION_VENTA','TRANSFERENCIA_ENTRADA','TRANSFERENCIA_SALIDA');

-- Tabla: inventario.categorias_producto
CREATE TABLE inventario.categorias_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cuenta_inventario VARCHAR(50),
    cuenta_costo_venta VARCHAR(50),
    cuenta_venta VARCHAR(50),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE inventario.categorias_producto IS 'Categorización de productos para organización y configuración contable automática.';
COMMENT ON COLUMN inventario.categorias_producto.id IS 'Identificador único de la categorí­a';
COMMENT ON COLUMN inventario.categorias_producto.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN inventario.categorias_producto.nombre IS 'Nombre de la categorí­a';
COMMENT ON COLUMN inventario.categorias_producto.descripcion IS 'Descripción adicional';
COMMENT ON COLUMN inventario.categorias_producto.cuenta_inventario IS 'Código cuenta contable de activo (Inventario) por defecto';
COMMENT ON COLUMN inventario.categorias_producto.cuenta_costo_venta IS 'Código cuenta contable de costo (Costo de Venta) por defecto';
COMMENT ON COLUMN inventario.categorias_producto.cuenta_venta IS 'Código cuenta contable de ingreso (Ventas) por defecto';
COMMENT ON COLUMN inventario.categorias_producto.activa IS 'Estado de la categorí­a';
COMMENT ON COLUMN inventario.categorias_producto.created_at IS 'Fecha de creación';
COMMENT ON COLUMN inventario.categorias_producto.updated_at IS 'Fecha de última actualización';

-- Tabla: inventario.bodegas
CREATE TABLE inventario.bodegas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    responsable VARCHAR(255),
    ubicacion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE inventario.bodegas IS 'Almacenes fí­sicos o lógicos donde se guardan productos.';
COMMENT ON COLUMN inventario.bodegas.id IS 'Identificador único de la bodega';
COMMENT ON COLUMN inventario.bodegas.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN inventario.bodegas.codigo IS 'Código interno de la bodega (ej: BOD-01)';
COMMENT ON COLUMN inventario.bodegas.nombre IS 'Nombre descriptivo de la bodega';
COMMENT ON COLUMN inventario.bodegas.descripcion IS 'Descripción adicional de la bodega';
COMMENT ON COLUMN inventario.bodegas.responsable IS 'Nombre de la persona responsable del almacén';
COMMENT ON COLUMN inventario.bodegas.ubicacion IS 'Dirección fí­sica o referencia de ubicación';
COMMENT ON COLUMN inventario.bodegas.activa IS 'Estado de la bodega. FALSE impide nuevos movimientos';
COMMENT ON COLUMN inventario.bodegas.created_at IS 'Fecha de creación';
COMMENT ON COLUMN inventario.bodegas.updated_at IS 'Fecha de última actualización';

-- Tabla: inventario.productos
CREATE TABLE inventario.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    codigo_principal VARCHAR(50) NOT NULL,
    codigo_auxiliar VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    stock_actual NUMERIC(18,4) DEFAULT 0,
    stock_minimo NUMERIC(18,4) DEFAULT 0,
    costo_promedio NUMERIC(18,6) DEFAULT 0,
    precio_venta NUMERIC(18,6) NOT NULL,
    graba_iva BOOLEAN DEFAULT true,
    codigo_tarifa_iva VARCHAR(5) DEFAULT '2', -- Código SRI (2: 12%, 4: 15%, 0: 0%, etc)
    unidad_medida VARCHAR(10) DEFAULT 'UND',
    categoria_id UUID REFERENCES inventario.categorias_producto(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo_principal)
);

COMMENT ON TABLE inventario.productos IS 'Catálogo maestro de productos y servicios.';
COMMENT ON COLUMN inventario.productos.id IS 'Identificador único del producto';
COMMENT ON COLUMN inventario.productos.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN inventario.productos.usuario_id IS 'Usuario creador/modificador';
COMMENT ON COLUMN inventario.productos.codigo_principal IS 'Código principal único del producto';
COMMENT ON COLUMN inventario.productos.codigo_auxiliar IS 'Código secundario o de barras (opcional)';
COMMENT ON COLUMN inventario.productos.nombre IS 'Nombre comercial del producto';
COMMENT ON COLUMN inventario.productos.descripcion IS 'Descripción detallada del producto';
COMMENT ON COLUMN inventario.productos.stock_actual IS 'Cantidad actual en existencia (suma de todas las bodegas)';
COMMENT ON COLUMN inventario.productos.stock_minimo IS 'Cantidad mí­nima para alertas de reabastecimiento';
COMMENT ON COLUMN inventario.productos.costo_promedio IS 'Costo unitario promedio ponderado. Se actualiza en cada entrada';
COMMENT ON COLUMN inventario.productos.precio_venta IS 'Precio de venta al público base (antes de impuestos)';
COMMENT ON COLUMN inventario.productos.graba_iva IS 'Indica si el producto grava IVA (TRUE) o es tarifa 0% (FALSE)';
COMMENT ON COLUMN inventario.productos.codigo_tarifa_iva IS 'Código SRI de tarifa IVA (2: 12%, 4: 15%, 0: 0%)';
COMMENT ON COLUMN inventario.productos.categoria_id IS 'Referencia a la categorí­a del producto';
COMMENT ON COLUMN inventario.productos.activo IS 'Estado del producto';
COMMENT ON COLUMN inventario.productos.created_at IS 'Fecha de creación';
COMMENT ON COLUMN inventario.productos.updated_at IS 'Fecha de última actualización';

-- Tabla: inventario.kardex_movimientos
CREATE TABLE inventario.kardex_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    producto_id UUID NOT NULL REFERENCES inventario.productos(id) ON DELETE CASCADE,
    bodega_id UUID NOT NULL REFERENCES inventario.bodegas(id),
    tipo inventario.tipo_movimiento_kardex NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    costo_unitario NUMERIC(18,6) NOT NULL,
    stock_anterior NUMERIC(18,4) NOT NULL,
    stock_resultante NUMERIC(18,4) NOT NULL,
    referencia VARCHAR(100),
    observaciones TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE inventario.kardex_movimientos IS 'Registro histórico de movimientos de inventario (Kardex).';
COMMENT ON COLUMN inventario.kardex_movimientos.id IS 'Identificador único del movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.empresa_id IS 'Empresa tenant';
COMMENT ON COLUMN inventario.kardex_movimientos.usuario_id IS 'Usuario que realizó el movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.producto_id IS 'Producto afectado';
COMMENT ON COLUMN inventario.kardex_movimientos.bodega_id IS 'Bodega donde se realizó el movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.tipo IS 'Tipo: ENTRADA, SALIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO';
COMMENT ON COLUMN inventario.kardex_movimientos.cantidad IS 'Cantidad movida (siempre positiva)';
COMMENT ON COLUMN inventario.kardex_movimientos.costo_unitario IS 'Costo unitario del producto en el momento del movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.stock_anterior IS 'Stock que tení­a el producto antes de este movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.stock_resultante IS 'Stock que quedó después de este movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.referencia IS 'Documento de respaldo (Numero factura, etc.)';
COMMENT ON COLUMN inventario.kardex_movimientos.observaciones IS 'Notas adicionales sobre el movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.fecha IS 'Fecha contable del movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.created_at IS 'Fecha de creación del registro';

-- ============================================================================
-- 4. MÓDULO: NÓMINA
-- ============================================================================

-- Tipos ENUM del módulo nomina
CREATE TYPE nomina.tipo_contrato AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'TEMPORAL', 'PROYECTO');
CREATE TYPE nomina.estado_rol_pago AS ENUM ('BORRADOR', 'PENDIENTE', 'PAGADO', 'ANULADO');

-- Tabla: nomina.empleados
CREATE TABLE nomina.empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    cedula VARCHAR(10) NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    fecha_ingreso DATE,
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    sueldo_base NUMERIC(18,2) NOT NULL,
    tipo_contrato nomina.tipo_contrato DEFAULT 'INDEFINIDO',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, cedula)
);

COMMENT ON TABLE nomina.empleados IS 'Registro maestro de empleados para nómina.';
COMMENT ON COLUMN nomina.empleados.id IS 'Identificador único del empleado';
COMMENT ON COLUMN nomina.empleados.empresa_id IS 'Empresa a la que pertenece el empleado';
COMMENT ON COLUMN nomina.empleados.usuario_id IS 'Usuario que registró el empleado';
COMMENT ON COLUMN nomina.empleados.cedula IS 'Número de cédula o identificación (único por empresa)';
COMMENT ON COLUMN nomina.empleados.nombres IS 'Nombres del empleado';
COMMENT ON COLUMN nomina.empleados.apellidos IS 'Apellidos del empleado';
COMMENT ON COLUMN nomina.empleados.email IS 'Correo electrónico del empleado';
COMMENT ON COLUMN nomina.empleados.telefono IS 'Teléfono de contacto';
COMMENT ON COLUMN nomina.empleados.fecha_ingreso IS 'Fecha de inicio de la relación laboral';
COMMENT ON COLUMN nomina.empleados.cargo IS 'Cargo o puesto del empleado';
COMMENT ON COLUMN nomina.empleados.departamento IS 'Departamento o área de trabajo';
COMMENT ON COLUMN nomina.empleados.sueldo_base IS 'Sueldo base contractual del empleado';
COMMENT ON COLUMN nomina.empleados.tipo_contrato IS 'Tipo de relación laboral: INDEFINIDO, PLAZO_FIJO, TEMPORAL, PROYECTO';
COMMENT ON COLUMN nomina.empleados.activo IS 'Si el empleado está activo en la nómina';
COMMENT ON COLUMN nomina.empleados.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN nomina.empleados.updated_at IS 'Fecha de última actualización';

-- Tabla: nomina.nomina_roles
CREATE TABLE nomina.nomina_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    empleado_id UUID NOT NULL REFERENCES nomina.empleados(id),
    periodo VARCHAR(7) NOT NULL,
    total_ingresos NUMERIC(18,2) NOT NULL,
    total_egresos NUMERIC(18,2) NOT NULL,
    neto_pagar NUMERIC(18,2) NOT NULL,
    aporte_personal NUMERIC(18,2) DEFAULT 0,
    aporte_patronal NUMERIC(18,2) DEFAULT 0,
    decimo_tercero NUMERIC(18,2) DEFAULT 0,
    decimo_cuarto NUMERIC(18,2) DEFAULT 0,
    fondos_reserva NUMERIC(18,2) DEFAULT 0,
    vacaciones NUMERIC(18,2) DEFAULT 0,
    asiento_id UUID REFERENCES contabilidad.asientos(id),
    estado nomina.estado_rol_pago DEFAULT 'BORRADOR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, empleado_id, periodo)
);

COMMENT ON TABLE nomina.nomina_roles IS 'Roles de pago generados por periodo.';
COMMENT ON COLUMN nomina.nomina_roles.id IS 'Identificador único del rol de pago';
COMMENT ON COLUMN nomina.nomina_roles.empresa_id IS 'Empresa a la que pertenece el rol';
COMMENT ON COLUMN nomina.nomina_roles.usuario_id IS 'Usuario que generó el rol';
COMMENT ON COLUMN nomina.nomina_roles.empleado_id IS 'Empleado al que corresponde el rol';
COMMENT ON COLUMN nomina.nomina_roles.periodo IS 'Periodo de pago en formato YYYY-MM (ej: 2024-01)';
COMMENT ON COLUMN nomina.nomina_roles.total_ingresos IS 'Suma de sueldo, horas extra, bonos, etc.';
COMMENT ON COLUMN nomina.nomina_roles.total_egresos IS 'Suma de aportes IESS, préstamos, anticipos, multas';
COMMENT ON COLUMN nomina.nomina_roles.neto_pagar IS 'Valor final a recibir (Ingresos - Egresos)';
COMMENT ON COLUMN nomina.nomina_roles.aporte_personal IS 'Aporte personal al IESS (9.45%)';
COMMENT ON COLUMN nomina.nomina_roles.aporte_patronal IS 'Aporte patronal al IESS (11.15%)';
COMMENT ON COLUMN nomina.nomina_roles.decimo_tercero IS 'Provisión décimo tercer sueldo';
COMMENT ON COLUMN nomina.nomina_roles.decimo_cuarto IS 'Provisión décimo cuarto sueldo';
COMMENT ON COLUMN nomina.nomina_roles.fondos_reserva IS 'Provisión fondos de reserva';
COMMENT ON COLUMN nomina.nomina_roles.vacaciones IS 'Provisión vacaciones';
COMMENT ON COLUMN nomina.nomina_roles.asiento_id IS 'Referencia al asiento contable generado';
COMMENT ON COLUMN nomina.nomina_roles.estado IS 'Estado del rol: BORRADOR, PENDIENTE, PAGADO, ANULADO';
COMMENT ON COLUMN nomina.nomina_roles.created_at IS 'Fecha de creación del rol';
COMMENT ON COLUMN nomina.nomina_roles.updated_at IS 'Fecha de última actualización';

-- ============================================================================
-- 5. MÓDULO: BANCOS
-- ============================================================================

-- Tabla: bancos.bancos_cuentas
CREATE TABLE bancos.bancos_cuentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    numero_cuenta VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo_cuenta VARCHAR(50),
    banco VARCHAR(100) NOT NULL,
    saldo_actual NUMERIC(18,2) DEFAULT 0,
    moneda VARCHAR(3) DEFAULT 'USD',
    activa BOOLEAN DEFAULT true,
    cuenta_contable_codigo VARCHAR(50), -- Código de cuenta contable asociada (ej: 1.1.01.01)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero_cuenta)
);

COMMENT ON TABLE bancos.bancos_cuentas IS 'Registro de cuentas bancarias de la empresa.';
COMMENT ON COLUMN bancos.bancos_cuentas.id IS 'Identificador único de la cuenta bancaria';
COMMENT ON COLUMN bancos.bancos_cuentas.empresa_id IS 'Empresa propietaria de la cuenta';
COMMENT ON COLUMN bancos.bancos_cuentas.usuario_id IS 'Usuario que registró la cuenta';
COMMENT ON COLUMN bancos.bancos_cuentas.numero_cuenta IS 'Número de cuenta bancaria real';
COMMENT ON COLUMN bancos.bancos_cuentas.nombre IS 'Nombre descriptivo de la cuenta (ej: Banco Pichincha Principal)';
COMMENT ON COLUMN bancos.bancos_cuentas.tipo_cuenta IS 'Tipo de cuenta (AHORROS, CORRIENTE)';
COMMENT ON COLUMN bancos.bancos_cuentas.banco IS 'Nombre de la institución financiera';
COMMENT ON COLUMN bancos.bancos_cuentas.saldo_actual IS 'Saldo contable actual de la cuenta';
COMMENT ON COLUMN bancos.bancos_cuentas.moneda IS 'Código ISO de la moneda (USD, EUR)';
COMMENT ON COLUMN bancos.bancos_cuentas.activa IS 'Estado de la cuenta bancaria';
COMMENT ON COLUMN bancos.bancos_cuentas.cuenta_contable_codigo IS 'Código de cuenta contable asociada (ej: 1.1.01.01)';
COMMENT ON COLUMN bancos.bancos_cuentas.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN bancos.bancos_cuentas.updated_at IS 'Fecha de última actualización';

-- Tabla: bancos.bancos_movimientos
CREATE TABLE bancos.bancos_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    cuenta_id UUID NOT NULL REFERENCES bancos.bancos_cuentas(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    referencia VARCHAR(100),
    beneficiario VARCHAR(255),
    concepto TEXT,
    monto NUMERIC(18,2) NOT NULL,
    es_egreso BOOLEAN NOT NULL,
    conciliado BOOLEAN DEFAULT false,
    conciliacion_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE bancos.bancos_movimientos IS 'Transacciones bancarias (Ingresos/Egresos).';
COMMENT ON COLUMN bancos.bancos_movimientos.id IS 'Identificador único del movimiento';
COMMENT ON COLUMN bancos.bancos_movimientos.empresa_id IS 'Empresa a la que pertenece el movimiento';
COMMENT ON COLUMN bancos.bancos_movimientos.usuario_id IS 'Usuario que registró el movimiento';
COMMENT ON COLUMN bancos.bancos_movimientos.cuenta_id IS 'Referencia a la cuenta bancaria afectada';
COMMENT ON COLUMN bancos.bancos_movimientos.fecha IS 'Fecha de la transacción';
COMMENT ON COLUMN bancos.bancos_movimientos.tipo IS 'Tipo: CHEQUE, TRANSFERENCIA, DEPOSITO, NOTA_DB/CR';
COMMENT ON COLUMN bancos.bancos_movimientos.referencia IS 'Número de cheque o comprobante bancario';
COMMENT ON COLUMN bancos.bancos_movimientos.beneficiario IS 'Persona o entidad que recibe o entrega el dinero';
COMMENT ON COLUMN bancos.bancos_movimientos.concepto IS 'Descripción del motivo de la transacción';
COMMENT ON COLUMN bancos.bancos_movimientos.monto IS 'Valor de la transacción';
COMMENT ON COLUMN bancos.bancos_movimientos.es_egreso IS 'TRUE si disminuye el saldo, FALSE si aumenta';
COMMENT ON COLUMN bancos.bancos_movimientos.conciliado IS 'Indica si el movimiento ya fue conciliado contra el extracto bancario';
COMMENT ON COLUMN bancos.bancos_movimientos.conciliacion_id IS 'Referencia a la conciliación bancaria a la que pertenece este movimiento';
COMMENT ON COLUMN bancos.bancos_movimientos.created_at IS 'Fecha de creación del registro';

-- Tabla: bancos.bancos_conciliaciones
CREATE TABLE bancos.bancos_conciliaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    cuenta_id UUID NOT NULL REFERENCES bancos.bancos_cuentas(id) ON DELETE CASCADE,
    fecha_corte DATE NOT NULL,
    saldo_libro NUMERIC(18,2) NOT NULL,
    saldo_extracto NUMERIC(18,2) NOT NULL,
    cheques_no_cobrados NUMERIC(18,2) DEFAULT 0,
    depositos_en_transito NUMERIC(18,2) DEFAULT 0,
    diferencia NUMERIC(18,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'BORRADOR',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id)
);

COMMENT ON TABLE bancos.bancos_conciliaciones IS 'Conciliaciones bancarias para cuadrar saldos contables vs extractos bancarios.';
COMMENT ON COLUMN bancos.bancos_conciliaciones.id IS 'Identificador único de la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.empresa_id IS 'Empresa a la que pertenece la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.cuenta_id IS 'Cuenta bancaria que se está conciliando';
COMMENT ON COLUMN bancos.bancos_conciliaciones.fecha_corte IS 'Fecha de corte de la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.saldo_libro IS 'Saldo según libros contables';
COMMENT ON COLUMN bancos.bancos_conciliaciones.saldo_extracto IS 'Saldo según extracto bancario';
COMMENT ON COLUMN bancos.bancos_conciliaciones.cheques_no_cobrados IS 'Total de cheques emitidos pero no cobrados aún';
COMMENT ON COLUMN bancos.bancos_conciliaciones.depositos_en_transito IS 'Total de depósitos registrados pero no reflejados en extracto';
COMMENT ON COLUMN bancos.bancos_conciliaciones.diferencia IS 'Diferencia entre saldo libro y extracto (después de ajustes)';
COMMENT ON COLUMN bancos.bancos_conciliaciones.estado IS 'Estado: BORRADOR, CONCILIADO, APROBADO';
COMMENT ON COLUMN bancos.bancos_conciliaciones.observaciones IS 'Notas y comentarios sobre la conciliación';
COMMENT ON COLUMN bancos.bancos_conciliaciones.created_by IS 'Usuario que creó la conciliación';

-- Agregar foreign key constraint después de crear la tabla
ALTER TABLE bancos.bancos_movimientos 
ADD CONSTRAINT fk_movimientos_conciliacion 
FOREIGN KEY (conciliacion_id) REFERENCES bancos.bancos_conciliaciones(id) ON DELETE SET NULL;



-- Trigger de auditorí­a
CREATE TRIGGER audit_bancos_conciliaciones AFTER INSERT OR UPDATE OR DELETE ON bancos.bancos_conciliaciones FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMENT ON TRIGGER audit_bancos_conciliaciones ON bancos.bancos_conciliaciones IS 'Auditorí­a automática de cambios en conciliaciones bancarias';


-- ============================================================================
-- 6. MÓDULO: CARTERA (CxC / CxP)
-- ============================================================================

-- Tipos ENUM del módulo cartera
CREATE TYPE cartera.tipo_cartera AS ENUM ('CXC', 'CXP');

-- Tabla: cartera.cartera_documentos
CREATE TABLE cartera.cartera_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    tipo_cartera cartera.tipo_cartera NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    nro_comprobante VARCHAR(50) NOT NULL,
    tercero_id UUID NOT NULL REFERENCES directorio.terceros(id),
    tercero_nombre VARCHAR(255) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto_total NUMERIC(18,2) NOT NULL,
    saldo_pendiente NUMERIC(18,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cartera.cartera_documentos IS 'Documentos de Cuentas por Cobrar y Pagar.';
COMMENT ON COLUMN cartera.cartera_documentos.id IS 'Identificador único del documento';
COMMENT ON COLUMN cartera.cartera_documentos.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN cartera.cartera_documentos.usuario_id IS 'Usuario que registró el documento';
COMMENT ON COLUMN cartera.cartera_documentos.tipo_cartera IS 'CXC (Clientes) o CXP (Proveedores)';
COMMENT ON COLUMN cartera.cartera_documentos.tipo_documento IS 'Tipo de documento (FACTURA, NOTA_CREDITO, etc.)';
COMMENT ON COLUMN cartera.cartera_documentos.nro_comprobante IS 'Número de factura o documento fí­sico';
COMMENT ON COLUMN cartera.cartera_documentos.tercero_id IS 'ID del cliente o proveedor asociado';
COMMENT ON COLUMN cartera.cartera_documentos.tercero_nombre IS 'Nombre del tercero (desnormalizado)';
COMMENT ON COLUMN cartera.cartera_documentos.fecha_emision IS 'Fecha de emisión del documento';
COMMENT ON COLUMN cartera.cartera_documentos.fecha_vencimiento IS 'Fecha lí­mite de pago (para cálculo de aging)';
COMMENT ON COLUMN cartera.cartera_documentos.monto_total IS 'Valor total del documento';
COMMENT ON COLUMN cartera.cartera_documentos.saldo_pendiente IS 'Valor pendiente de cobro/pago (monto_total - abonos)';
COMMENT ON COLUMN cartera.cartera_documentos.moneda IS 'Código de moneda (USD, EUR, etc.)';
COMMENT ON COLUMN cartera.cartera_documentos.created_at IS 'Fecha de creación';
COMMENT ON COLUMN cartera.cartera_documentos.updated_at IS 'Fecha de última actualización';

-- Tabla: cartera.cartera_anticipos
CREATE TABLE cartera.cartera_anticipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    tipo_cartera cartera.tipo_cartera NOT NULL,
    fecha DATE NOT NULL,
    tercero_id UUID NOT NULL REFERENCES directorio.terceros(id),
    tercero_nombre VARCHAR(255) NOT NULL,
    referencia VARCHAR(100),
    monto_original NUMERIC(18,2) NOT NULL,
    saldo_disponible NUMERIC(18,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cartera.cartera_anticipos IS 'Anticipos recibidos o entregados pendientes de cruzar.';
COMMENT ON COLUMN cartera.cartera_anticipos.id IS 'Identificador único del anticipo';
COMMENT ON COLUMN cartera.cartera_anticipos.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN cartera.cartera_anticipos.usuario_id IS 'Usuario que registró el anticipo';
COMMENT ON COLUMN cartera.cartera_anticipos.tipo_cartera IS 'CXC (de cliente) o CXP (a proveedor)';
COMMENT ON COLUMN cartera.cartera_anticipos.fecha IS 'Fecha del anticipo';
COMMENT ON COLUMN cartera.cartera_anticipos.tercero_id IS 'Cliente o proveedor asociado';
COMMENT ON COLUMN cartera.cartera_anticipos.tercero_nombre IS 'Nombre del cliente/proveedor (desnormalizado para consultas rápidas)';
COMMENT ON COLUMN cartera.cartera_anticipos.referencia IS 'Número de comprobante o referencia';
COMMENT ON COLUMN cartera.cartera_anticipos.monto_original IS 'Valor original del anticipo';
COMMENT ON COLUMN cartera.cartera_anticipos.saldo_disponible IS 'Valor restante por cruzar con facturas';
COMMENT ON COLUMN cartera.cartera_anticipos.moneda IS 'Código de moneda';
COMMENT ON COLUMN cartera.cartera_anticipos.observaciones IS 'Notas adicionales';
COMMENT ON COLUMN cartera.cartera_anticipos.created_at IS 'Fecha de creación';

-- ============================================================================
-- 7. MÓDULO: FACTURACIÓN ELECTRÓNICA
-- ============================================================================

-- Tipos ENUM del módulo facturacion
CREATE TYPE facturacion.tipo_comprobante_sri AS ENUM ('01', '03', '04', '05', '06', '07');
CREATE TYPE facturacion.estado_comprobante AS ENUM ('DEVUELTA', 'AUTORIZADO', 'RECHAZADO', 'ANULADO','ERROR','NO AUTORIZADO');

-- Tabla: facturacion.comprobantes_electronicos
CREATE TABLE facturacion.comprobantes_electronicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    tipo_comprobante facturacion.tipo_comprobante_sri NOT NULL,
    punto_emision_id UUID REFERENCES configuracion.puntos_emision(id),
    secuencial VARCHAR(20) NOT NULL,
    clave_acceso VARCHAR(49) UNIQUE,
    numero_autorizacion VARCHAR(49),
    fecha_emision DATE NOT NULL,
    fecha_autorizacion TIMESTAMP,
    cliente_id UUID NOT NULL REFERENCES directorio.terceros(id),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_identificacion VARCHAR(20) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    total_descuento NUMERIC(18,2) DEFAULT 0.00 NOT NULL,
    iva NUMERIC(18,2) NOT NULL,
    total NUMERIC(18,2) NOT NULL,
    estado facturacion.estado_comprobante DEFAULT 'BORRADOR',
    mensajes_sri JSONB DEFAULT NULL,
    ambiente_sri INTEGER,
    tipo_emision_sri INTEGER,
    direccion_partida TEXT,
    direccion_destino TEXT,
    transportista_nombre VARCHAR(255),
    placa_vehiculo VARCHAR(20),
    xml_firmado TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, tipo_comprobante, punto_emision_id, secuencial)
);

COMMENT ON TABLE facturacion.comprobantes_electronicos IS 'Comprobantes electrónicos (Facturación SRI).';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.id IS 'Identificador único del comprobante';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.empresa_id IS 'Empresa emisora';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.usuario_id IS 'Usuario que generó el comprobante';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.tipo_comprobante IS 'Tipo: 01=FACTURA, 03=LIQUIDACION, 04=NOTA_CREDITO, 05=NOTA_DEBITO, 06=GUIA_REMISION, 07=RETENCION';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.secuencial IS 'Número secuencial del comprobante (incremental por tipo y empresa)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.clave_acceso IS 'Clave de acceso de 49 dí­gitos (SRI)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.numero_autorizacion IS 'Número de autorización otorgado por el SRI';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.fecha_emision IS 'Fecha de emisión del comprobante';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.fecha_autorizacion IS 'Fecha y hora de autorización por el SRI';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.cliente_id IS 'Referencia al cliente (tercero)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.cliente_nombre IS 'Nombre del cliente (desnormalizado)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.cliente_identificacion IS 'RUC/Cédula del cliente';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.subtotal IS 'Subtotal antes de impuestos';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.total_descuento IS 'Total descuentos aplicados';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.iva IS 'Valor del IVA';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.total IS 'Total del comprobante';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.estado IS 'Estado del proceso: BORRADOR -> PENDIENTE -> AUTORIZADO/RECHAZADO/ANULADO';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.mensajes_sri IS 'Mensajes devueltos por el SRI (recepción/autorización) en formato JSON';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.ambiente_sri IS 'Ambiente SRI: 1=PRUEBAS, 2=PRODUCCION';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.tipo_emision_sri IS 'Tipo de emisión: 1=NORMAL, 2=CONTINGENCIA';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.direccion_partida IS 'Dirección de origen (para guí­as de remisión)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.direccion_destino IS 'Dirección de destino (para guí­as de remisión)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.transportista_nombre IS 'Nombre del transportista (para guí­as)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.placa_vehiculo IS 'Placa del vehí­culo (para guí­as)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.xml_firmado IS 'Contenido XML firmado (Base64 o texto raw)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.created_at IS 'Fecha de creación';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.updated_at IS 'Fecha de última actualización';

ALTER TABLE facturacion.comprobantes_electronicos 
ADD CONSTRAINT unq_comprobante_punto_secuencial 
UNIQUE(empresa_id, tipo_comprobante, punto_emision_id, secuencial);
COMMENT ON COLUMN facturacion.comprobantes_electronicos.punto_emision_id IS 'Referencia al punto de emisión utilizado';


-- Tabla: facturacion.comprobantes_detalles
CREATE TABLE facturacion.comprobantes_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID NOT NULL REFERENCES facturacion.comprobantes_electronicos(id) ON DELETE CASCADE,
    codigo_principal VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    descuento NUMERIC(18,2) NOT NULL,
    total NUMERIC(18,2) NOT NULL,
    codigo_iva VARCHAR(5) DEFAULT '2' NOT NULL
);

COMMENT ON TABLE facturacion.comprobantes_detalles IS 'Detalle de lí­neas de los comprobantes electrónicos.';
COMMENT ON COLUMN facturacion.comprobantes_detalles.id IS 'Identificador único de la lí­nea de detalle';
COMMENT ON COLUMN facturacion.comprobantes_detalles.comprobante_id IS 'Referencia al comprobante cabecera';
COMMENT ON COLUMN facturacion.comprobantes_detalles.codigo_principal IS 'Código del producto o servicio';
COMMENT ON COLUMN facturacion.comprobantes_detalles.descripcion IS 'Descripción del í­tem';
COMMENT ON COLUMN facturacion.comprobantes_detalles.cantidad IS 'Cantidad vendida';
COMMENT ON COLUMN facturacion.comprobantes_detalles.precio_unitario IS 'Precio unitario antes de impuestos';
COMMENT ON COLUMN facturacion.comprobantes_detalles.descuento IS 'Descuento aplicado';
COMMENT ON COLUMN facturacion.comprobantes_detalles.total IS 'Subtotal de lí­nea (Cantidad * Precio - Descuento)';

-- Tabla: facturacion.transportistas
CREATE TABLE facturacion.transportistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    identificacion VARCHAR(20) NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    placa VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, identificacion)
);

COMMENT ON TABLE facturacion.transportistas IS 'Catálogo de transportistas para guí­as de remisión.';
COMMENT ON COLUMN facturacion.transportistas.id IS 'Identificador único del transportista';
COMMENT ON COLUMN facturacion.transportistas.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN facturacion.transportistas.usuario_id IS 'Usuario que registró el transportista';
COMMENT ON COLUMN facturacion.transportistas.identificacion IS 'RUC o cédula del transportista';
COMMENT ON COLUMN facturacion.transportistas.razon_social IS 'Nombre o razón social del transportista';
COMMENT ON COLUMN facturacion.transportistas.placa IS 'Placa del vehí­culo';
COMMENT ON COLUMN facturacion.transportistas.email IS 'Correo electrónico de contacto';
COMMENT ON COLUMN facturacion.transportistas.telefono IS 'Teléfono de contacto';
COMMENT ON COLUMN facturacion.transportistas.activo IS 'Estado del transportista';

-- ============================================================================
-- 8. MÓDULO: AUDITORí�A
-- ============================================================================

-- Tipos ENUM del módulo auditoria
CREATE TYPE auditoria.severidad_log AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- Tabla: facturacion.proformas
CREATE TABLE IF NOT EXISTS facturacion.proformas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    cliente_id UUID NOT NULL REFERENCES directorio.terceros(id),
    numero VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    validez_dias INTEGER DEFAULT 15,
    subtotal_iva NUMERIC(18,2) DEFAULT 0,
    subtotal_0 NUMERIC(18,2) DEFAULT 0,
    monto_iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, FACTURADA, ANULADA
    observaciones TEXT,
    factura_id UUID REFERENCES facturacion.comprobantes_electronicos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero)
);

COMMENT ON TABLE facturacion.proformas IS 'Presupuestos o cotizaciones emitidas a clientes.';

-- Tabla: facturacion.proformas_detalle
CREATE TABLE IF NOT EXISTS facturacion.proformas_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_id UUID NOT NULL REFERENCES facturacion.proformas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES inventario.productos(id),
    descripcion VARCHAR(500) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    porcentaje_iva NUMERIC(5,2) DEFAULT 0,
    valor_iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE facturacion.proformas_detalle IS 'Líneas de detalle de las proformas.';

-- Tabla: auditoria.auditoria_logs
CREATE TABLE auditoria.auditoria_logs (
    id BIGSERIAL PRIMARY KEY,
    empresa_id UUID REFERENCES seguridad.empresas(id),
    modulo VARCHAR(50) NOT NULL,
    evento VARCHAR(100) NOT NULL,
    usuario_id UUID REFERENCES seguridad.usuarios(id),
    usuario_nombre VARCHAR(255),
    ip_address VARCHAR(45),
    metodo_http VARCHAR(10),
    ruta TEXT,
    severidad auditoria.severidad_log DEFAULT 'INFO',
    datos_antes JSONB,
    datos_despues JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE auditoria.auditoria_logs IS 'Bitácora centralizada de eventos del sistema.';
COMMENT ON COLUMN auditoria.auditoria_logs.id IS 'Identificador único autoincrementable del log';
COMMENT ON COLUMN auditoria.auditoria_logs.empresa_id IS 'Empresa donde ocurrió el evento';
COMMENT ON COLUMN auditoria.auditoria_logs.modulo IS 'Módulo funcional origen del evento (ej: INVENTARIO, CONTABILIDAD)';
COMMENT ON COLUMN auditoria.auditoria_logs.evento IS 'Nombre del evento (ej: CREACION_PRODUCTO, LOGIN_FALLIDO)';
COMMENT ON COLUMN auditoria.auditoria_logs.usuario_id IS 'Usuario que provocó el evento';
COMMENT ON COLUMN auditoria.auditoria_logs.usuario_nombre IS 'Nombre del usuario (desnormalizado para consultas rápidas)';
COMMENT ON COLUMN auditoria.auditoria_logs.ip_address IS 'Dirección IP del cliente';
COMMENT ON COLUMN auditoria.auditoria_logs.metodo_http IS 'Método HTTP de la petición (GET, POST, PUT, DELETE)';
COMMENT ON COLUMN auditoria.auditoria_logs.ruta IS 'Ruta o endpoint de la API invocada';
COMMENT ON COLUMN auditoria.auditoria_logs.severidad IS 'Nivel de la bitácora: INFO, WARNING, ERROR, CRITICAL';
COMMENT ON COLUMN auditoria.auditoria_logs.datos_antes IS 'Snapshot de los datos antes del cambio (JSON)';
COMMENT ON COLUMN auditoria.auditoria_logs.datos_despues IS 'Snapshot de los datos después del cambio (JSON)';
COMMENT ON COLUMN auditoria.auditoria_logs.created_at IS 'Fecha y hora del evento';

-- ============================================================================
-- TRIGGERS DE AUDITORí�A AUTOMí�TICA
-- ============================================================================

-- Función genérica para auditorí­a
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_empresa_id UUID;
BEGIN
    -- Obtener contexto de la sesión
    BEGIN
        current_user_id := current_setting('app.current_user_id', true)::UUID;
        current_empresa_id := current_setting('app.current_empresa_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_empresa_id := NULL;
    END;
    
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO auditoria.auditoria_logs(empresa_id, modulo, evento, usuario_id, datos_antes, created_at)
        VALUES (current_empresa_id, TG_TABLE_NAME, 'DELETE', current_user_id, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO auditoria.auditoria_logs(empresa_id, modulo, evento, usuario_id, datos_antes, datos_despues, created_at)
        VALUES (current_empresa_id, TG_TABLE_NAME, 'UPDATE', current_user_id, row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO auditoria.auditoria_logs(empresa_id, modulo, evento, usuario_id, datos_despues, created_at)
        VALUES (current_empresa_id, TG_TABLE_NAME, 'INSERT', current_user_id, row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_trigger_function() IS 'Trigger function genérica. Captura cambios (INSERT, UPDATE, DELETE) y los registra en auditoria_logs usando el contexto de sesión.';


-- ============================================================================
-- COMENTARIOS GENERALES
-- ============================================================================

COMMENT ON DATABASE ecucontabledb IS 'Base de datos del sistema EcuContable Pro - Sistema contable multi-tenant para Ecuador.';

-- ============================================================================
-- 9. MÓDULO: CONFIGURACIÓN Y PARí�METROS
-- ============================================================================

-- Tabla: configuracion.sucursales
CREATE TABLE configuracion.sucursales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(3) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    es_matriz BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE configuracion.sucursales IS 'Sucursales o establecimientos de la empresa.';
COMMENT ON COLUMN configuracion.sucursales.id IS 'Identificador único de la sucursal';
COMMENT ON COLUMN configuracion.sucursales.empresa_id IS 'Empresa a la que pertenece la sucursal';
COMMENT ON COLUMN configuracion.sucursales.codigo IS 'Código del establecimiento (3 dí­gitos, ej: 001) según el SRI';
COMMENT ON COLUMN configuracion.sucursales.nombre IS 'Nombre descriptivo de la sucursal';
COMMENT ON COLUMN configuracion.sucursales.es_matriz IS 'Indica si es la oficina matriz de la empresa';
COMMENT ON COLUMN configuracion.sucursales.activa IS 'Estado de la sucursal';

-- Tabla: configuracion.puntos_emision
CREATE TABLE configuracion.puntos_emision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sucursal_id UUID NOT NULL REFERENCES configuracion.sucursales(id) ON DELETE CASCADE,
    codigo VARCHAR(3) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    requiere_asignacion BOOLEAN DEFAULT true,
    permite_multiples_usuarios BOOLEAN DEFAULT true,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(sucursal_id, codigo)
);

COMMENT ON TABLE configuracion.puntos_emision IS 'Puntos de emisión asociados a una sucursal.';
COMMENT ON COLUMN configuracion.puntos_emision.id IS 'Identificador único del punto de emisión';
COMMENT ON COLUMN configuracion.puntos_emision.sucursal_id IS 'Sucursal a la que pertenece el punto de emisión';
COMMENT ON COLUMN configuracion.puntos_emision.codigo IS 'Código del punto de emisión (3 dí­gitos, ej: 001) según el SRI';
COMMENT ON COLUMN configuracion.puntos_emision.nombre IS 'Nombre descriptivo (ej: Caja 1)';
COMMENT ON COLUMN configuracion.puntos_emision.activo IS 'Indica si el punto está activo y puede ser usado. Permite desactivar puntos sin eliminarlos.';
COMMENT ON COLUMN configuracion.puntos_emision.requiere_asignacion IS 'Si es true, solo usuarios explí­citamente asignados pueden usar este punto. Si es false, cualquier usuario de la empresa puede usarlo.';
COMMENT ON COLUMN configuracion.puntos_emision.permite_multiples_usuarios IS 'Si es true, múltiples usuarios pueden tener este punto asignado simultáneamente. Si es false, solo un usuario a la vez.';
COMMENT ON COLUMN configuracion.puntos_emision.descripcion IS 'Descripción o notas adicionales sobre el punto de emisión (ej: "Caja principal del local matriz").';


-- ============================================================================
-- TABLA: configuracion.usuarios_puntos_emision
-- ============================================================================
-- Propósito: Relaciona usuarios con los puntos de emisión que pueden usar
-- Reglas de negocio:
--   1. Un usuario puede tener múltiples puntos asignados
--   2. Solo un punto puede estar activo a la vez por usuario-empresa
--   3. Un punto puede ser marcado como principal (se activa automáticamente)
--   4. Control de si el usuario puede cambiar de punto
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuracion.usuarios_puntos_emision (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    punto_emision_id UUID NOT NULL REFERENCES configuracion.puntos_emision(id) ON DELETE CASCADE,
    
    -- Estado y configuración
    activo BOOLEAN DEFAULT false,
    es_principal BOOLEAN DEFAULT false,
    puede_cambiar BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    
    -- Constraints
    CONSTRAINT uk_usuario_empresa_punto UNIQUE (usuario_id, empresa_id, punto_emision_id)
);



-- ============================================================================
-- FUNCIÓN: Obtener punto de emisión activo de un usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION configuracion.fn_obtener_punto_activo_usuario(
    p_usuario_id UUID,
    p_empresa_id UUID
)
RETURNS TABLE (
    punto_emision_id UUID,
    codigo_establecimiento VARCHAR(3),
    codigo_punto VARCHAR(3),
    nombre_punto VARCHAR(255),
    es_activo BOOLEAN,
    es_principal BOOLEAN
) AS $$
BEGIN
    -- Primero buscar el punto activo
    RETURN QUERY
    SELECT 
        pe.id,
        s.codigo,
        pe.codigo,
        pe.nombre,
        upe.activo,
        upe.es_principal
    FROM configuracion.usuarios_puntos_emision upe
    INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
    INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
    WHERE upe.usuario_id = p_usuario_id
    AND upe.empresa_id = p_empresa_id
    AND upe.activo = true
    AND pe.activo = true
    LIMIT 1;
    
    -- Si no hay activo, buscar el principal
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            pe.id,
            s.codigo,
            pe.codigo,
            pe.nombre,
            upe.activo,
            upe.es_principal
        FROM configuracion.usuarios_puntos_emision upe
        INNER JOIN configuracion.puntos_emision pe ON upe.punto_emision_id = pe.id
        INNER JOIN configuracion.sucursales s ON pe.sucursal_id = s.id
        WHERE upe.usuario_id = p_usuario_id
        AND upe.empresa_id = p_empresa_id
        AND upe.es_principal = true
        AND pe.activo = true
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION configuracion.fn_obtener_punto_activo_usuario IS 
'Obtiene el punto de emisión activo de un usuario. Si no tiene activo, retorna el principal.';

-- ============================================================================
-- FUNCIÓN: Activar punto de emisión para un usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION configuracion.fn_activar_punto_emision(
    p_usuario_id UUID,
    p_empresa_id UUID,
    p_punto_emision_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
BEGIN
    -- Verificar que el usuario tiene asignado ese punto
    SELECT COUNT(*) INTO v_count
    FROM configuracion.usuarios_puntos_emision
    WHERE usuario_id = p_usuario_id
    AND empresa_id = p_empresa_id
    AND punto_emision_id = p_punto_emision_id;
    
    IF v_count = 0 THEN
        RAISE EXCEPTION 'El usuario no tiene asignado este punto de emisión';
    END IF;
    
    -- Desactivar todos los puntos del usuario en esta empresa
    UPDATE configuracion.usuarios_puntos_emision
    SET activo = false, updated_at = NOW()
    WHERE usuario_id = p_usuario_id
    AND empresa_id = p_empresa_id;
    
    -- Activar el punto especificado
    UPDATE configuracion.usuarios_puntos_emision
    SET activo = true, updated_at = NOW()
    WHERE usuario_id = p_usuario_id
    AND empresa_id = p_empresa_id
    AND punto_emision_id = p_punto_emision_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION configuracion.fn_activar_punto_emision IS 
'Activa un punto de emisión para el usuario, desactivando todos los demás.';


-- ============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE configuracion.usuarios_puntos_emision IS 
'Asignación de puntos de emisión a usuarios. Controla qué usuarios pueden emitir comprobantes desde qué puntos.';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.id IS 
'Identificador único del registro de asignación';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.usuario_id IS 
'Usuario al que se asigna el punto de emisión';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.empresa_id IS 
'Empresa a la que pertenece la asignación';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.punto_emision_id IS 
'Punto de emisión asignado al usuario';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.activo IS 
'Indica si este es el punto de emisión actualmente activo para el usuario. Solo puede haber uno activo a la vez.';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.es_principal IS 
'Punto que se activa automáticamente cuando el usuario selecciona la empresa. Solo puede haber uno principal.';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.puede_cambiar IS 
'Si es false, el usuario no puede cambiar a otro punto sin ayuda del administrador.';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.created_at IS 
'Fecha y hora de creación del registro';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.updated_at IS 
'Fecha y hora de última actualización del registro';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.created_by IS 
'Usuario que creó el registro';

COMMENT ON COLUMN configuracion.usuarios_puntos_emision.updated_by IS 
'Usuario que realizó la última actualización';


-- Tabla: configuracion.puntos_emision_secuenciales
-- Para manejar los secuenciales por tipo de comprobante en cada punto de emisión
CREATE TABLE configuracion.puntos_emision_secuenciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    punto_emision_id UUID NOT NULL REFERENCES configuracion.puntos_emision(id) ON DELETE CASCADE,
    tipo_comprobante facturacion.tipo_comprobante_sri NOT NULL,
    secuencial_actual INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(punto_emision_id, tipo_comprobante)
);

COMMENT ON TABLE configuracion.puntos_emision_secuenciales IS 'Control de secuenciales por tipo de comprobante en cada punto de emisión.';
COMMENT ON COLUMN configuracion.puntos_emision_secuenciales.punto_emision_id IS 'Referencia al punto de emisión';
COMMENT ON COLUMN configuracion.puntos_emision_secuenciales.tipo_comprobante IS 'Tipo de comprobante SRI (01, 03, etc.)';
COMMENT ON COLUMN configuracion.puntos_emision_secuenciales.secuencial_actual IS 'Siguiente número secuencial a utilizar';

-- Tabla: configuracion.codigos_retencion
CREATE TABLE configuracion.codigos_retencion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL,
    concepto TEXT NOT NULL,
    porcentaje NUMERIC(5,2) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- RENTA, IVA
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(empresa_id, codigo, tipo)
);

COMMENT ON TABLE configuracion.codigos_retencion IS 'Catálogo de códigos de retención (Fuente e IVA) por empresa.';
COMMENT ON COLUMN configuracion.codigos_retencion.codigo IS 'Código de retención según el SRI (ej: 312, 1)';
COMMENT ON COLUMN configuracion.codigos_retencion.concepto IS 'Descripción del concepto de retención';
COMMENT ON COLUMN configuracion.codigos_retencion.porcentaje IS 'Porcentaje de retención aplicable';
COMMENT ON COLUMN configuracion.codigos_retencion.tipo IS 'Tipo de retención: RENTA o IVA';

-- Tabla: configuracion.parametros
CREATE TABLE configuracion.parametros (
    empresa_id UUID PRIMARY KEY REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    sbu NUMERIC(15,2) DEFAULT 460,
    iva_catalogo_item_id UUID REFERENCES configuracion.catalogos_items(id),
    max_consumidor_final NUMERIC(15,2) DEFAULT 50,
    cuenta_caja VARCHAR(20),
    cuenta_iva_ventas VARCHAR(20),
    cuenta_iva_compras VARCHAR(20),
    cuenta_ret_renta_por_pagar VARCHAR(20),
    cuenta_cxc_clientes VARCHAR(20),
    cuenta_anticipo_clientes VARCHAR(20),
    cuenta_cxp_proveedores VARCHAR(20),
    cuenta_anticipo_proveedores VARCHAR(20),
    cuenta_ventas VARCHAR(20),
    cuenta_devolucion_ventas VARCHAR(20),
    cuenta_compras VARCHAR(20),
    cuenta_inventario VARCHAR(20),
    cuenta_iva_por_pagar VARCHAR(20),
    cuenta_ret_iva_por_pagar VARCHAR(20),
    cuenta_costo_ventas VARCHAR(20),
    cuenta_descuento_ventas VARCHAR(20),
    fecha_cierre DATE,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES seguridad.usuarios(id)
);

COMMENT ON TABLE configuracion.parametros IS 'Parámetros contables y de configuración por empresa.';
COMMENT ON COLUMN configuracion.parametros.empresa_id IS 'ID de la empresa (PK)';
COMMENT ON COLUMN configuracion.parametros.sbu IS 'Salario Básico Unificado vigente';
COMMENT ON COLUMN configuracion.parametros.iva_catalogo_item_id IS 'Referencia al item del catálogo SRI_TIPO_IMPUESTO_IVA que define el IVA por defecto (Relaciona con configuracion.catalogos_items.id)';
COMMENT ON COLUMN configuracion.parametros.max_consumidor_final IS 'Monto máximo permitido para facturar a Consumidor Final sin datos';
COMMENT ON COLUMN configuracion.parametros.cuenta_caja IS 'Cuenta contable por defecto para Caja';
COMMENT ON COLUMN configuracion.parametros.cuenta_iva_ventas IS 'Cuenta contable para IVA en ventas';
COMMENT ON COLUMN configuracion.parametros.cuenta_iva_compras IS 'Cuenta contable para IVA en compras';
COMMENT ON COLUMN configuracion.parametros.cuenta_cxc_clientes IS 'Cuenta contable general de CxC Clientes';
COMMENT ON COLUMN configuracion.parametros.cuenta_cxp_proveedores IS 'Cuenta contable general de CxP Proveedores';
COMMENT ON COLUMN configuracion.parametros.fecha_cierre IS 'Fecha del último cierre contable realizado';

-- Tabla: configuracion.sri_ambiente
CREATE TABLE configuracion.sri_ambiente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE CHECK (codigo IN ('PRUEBAS','PRODUCCION')),
    nombre VARCHAR(100) NOT NULL,
    valor VARCHAR(20) NOT NULL UNIQUE CHECK (valor IN ('1', '2')),
    url_recepcion TEXT NOT NULL,
    url_autorizacion TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE configuracion.sri_ambiente IS 'Catálogo de ambientes del SRI (PRUEBAS/PRODUCCION) con sus URLs de servicios web';
COMMENT ON COLUMN configuracion.sri_ambiente.id IS 'Identificador único UUID del ambiente';
COMMENT ON COLUMN configuracion.sri_ambiente.codigo IS 'Código del ambiente: PRUEBAS o PRODUCCION';
COMMENT ON COLUMN configuracion.sri_ambiente.nombre IS 'Nombre descriptivo del ambiente';
COMMENT ON COLUMN configuracion.sri_ambiente.url_recepcion IS 'URL del servicio web de recepción de comprobantes';
COMMENT ON COLUMN configuracion.sri_ambiente.url_autorizacion IS 'URL del servicio web de autorización de comprobantes';
COMMENT ON COLUMN configuracion.sri_ambiente.descripcion IS 'Descripción adicional del ambiente';
COMMENT ON COLUMN configuracion.sri_ambiente.activo IS 'Estado del ambiente';

-- Insertar los ambientes estándar del SRI
INSERT INTO configuracion.sri_ambiente (codigo, nombre, valor, url_recepcion, url_autorizacion, descripcion) VALUES
('PRUEBAS', 'Ambiente de Pruebas', 1, 
 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
 'Ambiente de certificación y pruebas del SRI'),
('PRODUCCION', 'Ambiente de Producción', 2,
 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
 'Ambiente productivo del SRI');

-- Tabla: configuracion.sri_certificados
CREATE TABLE configuracion.sri_certificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    sri_ambiente_id UUID NOT NULL REFERENCES configuracion.sri_ambiente(id) ON DELETE RESTRICT,
    cert_p12_certificado BYTEA, -- Digital certificate file stored as binary
    cert_clave_certificado VARCHAR(255), -- Certificate password (encrypt in production)
    cert_fecha_emision TIMESTAMP,
    cert_fecha_expiracion TIMESTAMP,
    cert_sujeto TEXT,
    cert_emisor TEXT,
    cert_numero_serie VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    -- Only one active config per empresa+ambiente
    UNIQUE(empresa_id, sri_ambiente_id, activo)
);

COMMENT ON TABLE configuracion.sri_certificados IS 'Almacena certificados digitales P12 por empresa y ambiente SRI para facturación electrónica';
COMMENT ON COLUMN configuracion.sri_certificados.id IS 'Identificador único del certificado';
COMMENT ON COLUMN configuracion.sri_certificados.empresa_id IS 'Empresa propietaria del certificado';
COMMENT ON COLUMN configuracion.sri_certificados.sri_ambiente_id IS 'Referencia al ambiente SRI (PRUEBAS o PRODUCCION)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_p12_certificado IS 'Certificado digital P12 almacenado como BYTEA';
COMMENT ON COLUMN configuracion.sri_certificados.cert_clave_certificado IS 'Contraseña del certificado (debe encriptarse en producción)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_fecha_emision IS 'Fecha de emisión del certificado (notBefore)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_fecha_expiracion IS 'Fecha de expiración del certificado (notAfter)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_sujeto IS 'Sujeto del certificado (Subject DN)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_emisor IS 'Emisor del certificado (Issuer DN)';
COMMENT ON COLUMN configuracion.sri_certificados.cert_numero_serie IS 'Número de serie del certificado';



-- ===========================================================================
-- MÓDULO: CATí�LOGOS DEL SISTEMA Y SRI
-- ============================================================================

-- Tabla: configuracion.catalogos_tipos
CREATE TABLE configuracion.catalogos_tipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    sistema BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE configuracion.catalogos_tipos IS 'Definición de los tipos de catálogos disponibles en el sistema y SRI.';
COMMENT ON COLUMN configuracion.catalogos_tipos.id IS 'Identificador único autoincrementable';
COMMENT ON COLUMN configuracion.catalogos_tipos.codigo IS 'Código único del tipo de catálogo (ej: SRI_TIPO_COMPROBANTE)';
COMMENT ON COLUMN configuracion.catalogos_tipos.nombre IS 'Nombre descriptivo del tipo de catálogo';
COMMENT ON COLUMN configuracion.catalogos_tipos.descripcion IS 'Descripción detallada del propósito del catálogo';
COMMENT ON COLUMN configuracion.catalogos_tipos.sistema IS 'Indica si es un catálogo del sistema (no editable por usuarios)';
COMMENT ON COLUMN configuracion.catalogos_tipos.activo IS 'Estado del tipo de catálogo';
COMMENT ON COLUMN configuracion.catalogos_tipos.created_at IS 'Fecha de creación';

-- Tabla: configuracion.categoryos_items
CREATE TABLE configuracion.catalogos_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalogo_codigo VARCHAR(50) NOT NULL REFERENCES configuracion.catalogos_tipos(codigo) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor_numerico NUMERIC(10,2),
    padre_codigo VARCHAR(20),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(catalogo_codigo, codigo)
);

COMMENT ON TABLE configuracion.catalogos_items IS 'Items individuales de cada catálogo. Aquí­ residen los códigos del SRI.';
COMMENT ON COLUMN configuracion.catalogos_items.id IS 'Identificador único autoincrementable';
COMMENT ON COLUMN configuracion.catalogos_items.catalogo_codigo IS 'Referencia al tipo de catálogo al que pertenece';
COMMENT ON COLUMN configuracion.catalogos_items.codigo IS 'Código técnico (ej: 01 para Factura).';
COMMENT ON COLUMN configuracion.catalogos_items.valor IS 'Descripción legible para el usuario.';
COMMENT ON COLUMN configuracion.catalogos_items.descripcion IS 'Descripción adicional o notas';
COMMENT ON COLUMN configuracion.catalogos_items.padre_codigo IS 'Código del item padre (para catálogos jerárquicos)';
COMMENT ON COLUMN configuracion.catalogos_items.orden IS 'Orden de visualización';
COMMENT ON COLUMN configuracion.catalogos_items.activo IS 'Estado del item';
COMMENT ON COLUMN configuracion.catalogos_items.created_at IS 'Fecha de creación';


-- Vista de acceso rápido para catálogos SRI
CREATE OR REPLACE VIEW v_catalogos_sri AS
SELECT 
    ct.id as tipo_catalogo_id,
    ct.codigo as tipo_catalogo,
    ci.id as item_id,
    ci.codigo as codigo_sri,
    ci.valor as descripcion,
    ci.activo
FROM configuracion.catalogos_items ci
JOIN configuracion.catalogos_tipos ct ON ci.catalogo_codigo = ct.codigo
WHERE ct.codigo LIKE 'SRI_%';

-- ============================================================================
-- MÓDULO: CAJA CHICA
-- ============================================================================

-- Tipos ENUM del módulo caja_chica
CREATE TYPE caja_chica.tipo_movimiento_caja AS ENUM ('EGRESO', 'REPOSICION');
CREATE TYPE caja_chica.estado_movimiento_caja AS ENUM ('PENDIENTE', 'LIQUIDADO', 'ANULADO');

-- Tabla: caja_chica.cajas
CREATE TABLE IF NOT EXISTS caja_chica.cajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    responsable VARCHAR(255) NOT NULL,
    monto_asignado NUMERIC(18,2) NOT NULL DEFAULT 0,
    saldo_actual NUMERIC(18,2) NOT NULL DEFAULT 0,
    ultima_reposicion TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, nombre)
);

COMMENT ON TABLE caja_chica.cajas IS 'Configuración de fondos de caja chica por empresa.';
COMMENT ON COLUMN caja_chica.cajas.id IS 'Identificador único de la caja chica';
COMMENT ON COLUMN caja_chica.cajas.nombre IS 'Nombre descriptivo de la caja';
COMMENT ON COLUMN caja_chica.cajas.responsable IS 'Nombre del custodio o responsable del fondo';
COMMENT ON COLUMN caja_chica.cajas.monto_asignado IS 'Monto total del fondo fijo asignado';
COMMENT ON COLUMN caja_chica.cajas.saldo_actual IS 'Saldo disponible en efectivo en la caja';
COMMENT ON COLUMN caja_chica.cajas.ultima_reposicion IS 'Fecha y hora del último proceso de reposición de fondo';
COMMENT ON COLUMN caja_chica.cajas.activa IS 'Estado de la caja chica';

-- Tabla: caja_chica.movimientos
CREATE TABLE IF NOT EXISTS caja_chica.movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caja_id UUID NOT NULL REFERENCES caja_chica.cajas(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    numero VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    beneficiario VARCHAR(255) NOT NULL,
    concepto TEXT NOT NULL,
    monto NUMERIC(18,2) NOT NULL,
    tipo caja_chica.tipo_movimiento_caja NOT NULL,
    estado caja_chica.estado_movimiento_caja NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero)
);

COMMENT ON TABLE caja_chica.movimientos IS 'Registro de movimientos (vales) de caja chica.';
COMMENT ON COLUMN caja_chica.movimientos.id IS 'Identificador único del movimiento';
COMMENT ON COLUMN caja_chica.movimientos.caja_id IS 'Caja chica afectada';
COMMENT ON COLUMN caja_chica.movimientos.numero IS 'Número secuencial del vale de caja';
COMMENT ON COLUMN caja_chica.movimientos.fecha IS 'Fecha del gasto';
COMMENT ON COLUMN caja_chica.movimientos.beneficiario IS 'Persona o entidad que recibe el pago';
COMMENT ON COLUMN caja_chica.movimientos.concepto IS 'Descripción detallada del gasto';
COMMENT ON COLUMN caja_chica.movimientos.monto IS 'Valor del movimiento';
COMMENT ON COLUMN caja_chica.movimientos.tipo IS 'Tipo de movimiento: EGRESO, REPOSICION';
COMMENT ON COLUMN caja_chica.movimientos.estado IS 'Estado del vale: PENDIENTE, LIQUIDADO, ANULADO';

-- Triggers
CREATE TRIGGER audit_caja_chica AFTER INSERT OR UPDATE OR DELETE ON caja_chica.cajas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_caja_chica_vales AFTER INSERT OR UPDATE OR DELETE ON caja_chica.movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMENT ON TRIGGER audit_caja_chica ON caja_chica.cajas IS 'Auditorí­a automática de cambios en cajas chicas';
COMMENT ON TRIGGER audit_caja_chica_vales ON caja_chica.movimientos IS 'Auditorí­a automática de movimientos de caja chica';


-- ============================================================================
-- MÓDULO: CARTERA (CXC y CXP)
-- ============================================================================

-- Tabla: cartera.documentos_pendientes
CREATE TABLE IF NOT EXISTS cartera.documentos_pendientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL,
    tercero_id UUID NOT NULL REFERENCES directorio.terceros(id),
    nro_comprobante VARCHAR(50) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    dias_credito INTEGER NOT NULL DEFAULT 0,
    monto_total NUMERIC(18,2) NOT NULL,
    total_pagado NUMERIC(18,2) NOT NULL DEFAULT 0,
    saldo_pendiente NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, nro_comprobante)
);

COMMENT ON TABLE cartera.documentos_pendientes IS 'Documentos pendientes de cobro (CXC) o pago (CXP).';
COMMENT ON COLUMN cartera.documentos_pendientes.id IS 'Identificador único del documento pendiente';
COMMENT ON COLUMN cartera.documentos_pendientes.tipo IS 'Tipo de cartera: CXC o CXP';
COMMENT ON COLUMN cartera.documentos_pendientes.tercero_id IS 'Referencia al cliente o proveedor';
COMMENT ON COLUMN cartera.documentos_pendientes.nro_comprobante IS 'Número de factura o documento fí­sico';
COMMENT ON COLUMN cartera.documentos_pendientes.fecha_emision IS 'Fecha de emisión del documento';
COMMENT ON COLUMN cartera.documentos_pendientes.fecha_vencimiento IS 'Fecha de vencimiento para el cobro/pago';
COMMENT ON COLUMN cartera.documentos_pendientes.monto_total IS 'Valor total original del documento';
COMMENT ON COLUMN cartera.documentos_pendientes.total_pagado IS 'Suma de abonos y cruces realizados';
COMMENT ON COLUMN cartera.documentos_pendientes.saldo_pendiente IS 'Valor restante por liquidar';

-- Tabla: cartera.anticipos
CREATE TABLE IF NOT EXISTS cartera.anticipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL,
    tercero_id UUID NOT NULL REFERENCES directorio.terceros(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    referencia VARCHAR(255),
    monto_original NUMERIC(18,2) NOT NULL,
    monto_usado NUMERIC(18,2) NOT NULL DEFAULT 0,
    saldo_disponible NUMERIC(18,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cartera.anticipos IS 'Anticipos de clientes o a proveedores que pueden usarse para cruzar con documentos.';
COMMENT ON COLUMN cartera.anticipos.id IS 'Identificador único del anticipo';
COMMENT ON COLUMN cartera.anticipos.tipo IS 'Tipo de anticipo: CXC (de cliente) o CXP (a proveedor)';
COMMENT ON COLUMN cartera.anticipos.tercero_id IS 'Cliente o proveedor asociado';
COMMENT ON COLUMN cartera.anticipos.monto_original IS 'Valor total del anticipo recibido/entregado';
COMMENT ON COLUMN cartera.anticipos.monto_usado IS 'Valor ya aplicado a documentos';
COMMENT ON COLUMN cartera.anticipos.saldo_disponible IS 'Valor restante para futuros cruces';
COMMENT ON COLUMN cartera.anticipos.estado IS 'Estado: DISPONIBLE, AGOTADO, ANULADO';

-- Tabla: cartera.transacciones
CREATE TABLE IF NOT EXISTS cartera.transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    documento_id UUID REFERENCES cartera.documentos_pendientes(id),
    tipo_cartera VARCHAR(10) NOT NULL,
    forma_pago VARCHAR(30) NOT NULL,
    valor_efectivo NUMERIC(18,2) DEFAULT 0,
    valor_retencion NUMERIC(18,2) DEFAULT 0,
    valor_cruce NUMERIC(18,2) DEFAULT 0,
    anticipo_id UUID REFERENCES cartera.anticipos(id),
    referencia VARCHAR(255),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cartera.transacciones IS 'Registro de pagos y cobros realizados.';
COMMENT ON COLUMN cartera.transacciones.id IS 'Identificador único de la transacción';
COMMENT ON COLUMN cartera.transacciones.documento_id IS 'Documento pendiente que se está afectando';
COMMENT ON COLUMN cartera.transacciones.forma_pago IS 'Método de pago (EFECTIVO, CHEQUE, TRANSFERENCIA, CRUCE)';
COMMENT ON COLUMN cartera.transacciones.valor_efectivo IS 'Monto pagado en dinero';
COMMENT ON COLUMN cartera.transacciones.valor_retencion IS 'Monto cubierto por retenciones';
COMMENT ON COLUMN cartera.transacciones.valor_cruce IS 'Monto cubierto por cruce de anticipos o notas de crédito';
COMMENT ON COLUMN cartera.transacciones.anticipo_id IS 'Referencia al anticipo usado en caso de cruce';

-- Triggers
CREATE TRIGGER audit_documentos_pendientes AFTER INSERT OR UPDATE OR DELETE ON cartera.documentos_pendientes FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_anticipos AFTER INSERT OR UPDATE OR DELETE ON cartera.anticipos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_transacciones AFTER INSERT OR UPDATE OR DELETE ON cartera.transacciones FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- ============================================================================
-- 10. MÓDULO: ACTIVOS FIJOS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS activos;

CREATE TABLE activos.activos_fijos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- VEHICULO, MAQUINARIA, EQUIPO_COMPUTACION, MUEBLES_ENSERES, EDIFICIO
    fecha_adquisicion DATE NOT NULL,
    valor_adquisicion NUMERIC(18,2) NOT NULL,
    valor_residual NUMERIC(18,2) DEFAULT 0,
    vida_util_meses INTEGER NOT NULL,
    depreciacion_acumulada NUMERIC(18,2) DEFAULT 0,
    valor_libros NUMERIC(18,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'OPERATIVO', -- OPERATIVO, MANTENIMIENTO, DADO_BAJA
    ubicacion TEXT,
    responsable VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE activos.activos_fijos IS 'Registro maestro de activos fijos de la empresa.';
COMMENT ON COLUMN activos.activos_fijos.id IS 'Identificador único del activo';
COMMENT ON COLUMN activos.activos_fijos.empresa_id IS 'Empresa propietaria del activo';
COMMENT ON COLUMN activos.activos_fijos.usuario_id IS 'Usuario que registró el activo';
COMMENT ON COLUMN activos.activos_fijos.codigo IS 'Código interno de inventario del activo';
COMMENT ON COLUMN activos.activos_fijos.nombre IS 'Nombre o descripción del activo';
COMMENT ON COLUMN activos.activos_fijos.categoria IS 'Categorí­a (VEHICULO, MAQUINARIA, EQUIPO_COMPUTACION, MUEBLES_ENSERES, EDIFICIO)';
COMMENT ON COLUMN activos.activos_fijos.fecha_adquisicion IS 'Fecha de compra o incorporación';
COMMENT ON COLUMN activos.activos_fijos.valor_adquisicion IS 'Costo histórico de adquisición';
COMMENT ON COLUMN activos.activos_fijos.valor_residual IS 'Valor estimado al final de la vida útil';
COMMENT ON COLUMN activos.activos_fijos.vida_util_meses IS 'Vida útil total estimada en meses';
COMMENT ON COLUMN activos.activos_fijos.depreciacion_acumulada IS 'Suma de depreciaciones mensuales procesadas';
COMMENT ON COLUMN activos.activos_fijos.valor_libros IS 'Valor actual contable (Adquisición - Acumulada)';
COMMENT ON COLUMN activos.activos_fijos.estado IS 'Estado operativo del activo: OPERATIVO, MANTENIMIENTO, DADO_BAJA';
COMMENT ON COLUMN activos.activos_fijos.ubicacion IS 'Ubicación fí­sica del activo';
COMMENT ON COLUMN activos.activos_fijos.responsable IS 'Persona responsable del activo';

CREATE TABLE activos.depreciaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activo_id UUID NOT NULL REFERENCES activos.activos_fijos(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    valor NUMERIC(18,2) NOT NULL,
    fecha_proceso TIMESTAMP DEFAULT NOW(),
    asiento_id UUID REFERENCES contabilidad.asientos(id),
    UNIQUE(activo_id, periodo)
);

COMMENT ON TABLE activos.depreciaciones IS 'Registro histórico de depreciaciones mensuales procesadas.';
COMMENT ON COLUMN activos.depreciaciones.activo_id IS 'Activo fijo depreciado';
COMMENT ON COLUMN activos.depreciaciones.periodo IS 'Mes y año del proceso (YYYY-MM)';
COMMENT ON COLUMN activos.depreciaciones.valor IS 'Monto depreciado en el periodo';
COMMENT ON COLUMN activos.depreciaciones.asiento_id IS 'Referencia al asiento contable generado';

-- ============================================================================
-- 11. MÓDULO: IMPUESTOS (SRI)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS impuestos;

CREATE TABLE impuestos.formularios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL, -- 101, 104, etc.
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    total_ventas NUMERIC(18,2) DEFAULT 0,
    total_compras NUMERIC(18,2) DEFAULT 0,
    valor_a_pagar NUMERIC(18,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'GENERADO',
    xml_data TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, tipo, periodo)
);

COMMENT ON TABLE impuestos.formularios IS 'Registro de formularios de impuestos generados (104, 103, etc.).';
COMMENT ON COLUMN impuestos.formularios.id IS 'Identificador único del formulario';
COMMENT ON COLUMN impuestos.formularios.tipo IS 'Tipo de formulario SRI (ej: 104 para IVA, 103 para Retenciones)';
COMMENT ON COLUMN impuestos.formularios.periodo IS 'Periodo fiscal (YYYY-MM)';
COMMENT ON COLUMN impuestos.formularios.total_ventas IS 'Monto total de ventas reportadas en el periodo';
COMMENT ON COLUMN impuestos.formularios.total_compras IS 'Monto total de compras reportadas en el periodo';
COMMENT ON COLUMN impuestos.formularios.valor_a_pagar IS 'Impuesto causado a pagar al SRI';
COMMENT ON COLUMN impuestos.formularios.estado IS 'Estado del formulario: GENERADO, DECLARADO, ANULADO';
COMMENT ON COLUMN impuestos.formularios.xml_data IS 'Contenido XML del formulario para carga en el SRI';

CREATE TABLE impuestos.ats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    estado VARCHAR(20) DEFAULT 'GENERADO',
    xml_data TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, periodo)
);

COMMENT ON TABLE impuestos.ats IS 'Anexo Transaccional Simplificado (ATS) generado mensualmente.';
COMMENT ON COLUMN impuestos.ats.id IS 'Identificador único del ATS';
COMMENT ON COLUMN impuestos.ats.periodo IS 'Periodo del anexo (YYYY-MM)';
COMMENT ON COLUMN impuestos.ats.estado IS 'Estado: GENERADO, VALIDADO, ANULADO';
COMMENT ON COLUMN impuestos.ats.xml_data IS 'Contenido XML del anexo para el DIMm SRI';

-- ============================================================================
-- 12. MÓDULO: COMPRAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS compras.compras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    proveedor_id UUID NOT NULL REFERENCES directorio.terceros(id),
    tipo_comprobante VARCHAR(2) NOT NULL,
    secuencial VARCHAR(20) NOT NULL,
    autorizacion VARCHAR(50),
    fecha_emision DATE NOT NULL,
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    sustento VARCHAR(2),
    descripcion TEXT,
    subtotal_iva NUMERIC(18,2) DEFAULT 0,
    subtotal_0 NUMERIC(18,2) DEFAULT 0,
    monto_iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    orden_compra_id UUID,
    tiene_retencion BOOLEAN DEFAULT false,
    estado_retencion VARCHAR(20) DEFAULT 'PENDIENTE',
    nro_retencion VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, proveedor_id, secuencial)
);

COMMENT ON TABLE compras.compras IS 'Registro de facturas de compra y gastos recibidos.';
COMMENT ON COLUMN compras.compras.id IS 'Identificador único de la compra';
COMMENT ON COLUMN compras.compras.empresa_id IS 'Empresa a la que pertenece la compra';
COMMENT ON COLUMN compras.compras.usuario_id IS 'Usuario que registró la compra';
COMMENT ON COLUMN compras.compras.proveedor_id IS 'Referencia al proveedor (tercero)';
COMMENT ON COLUMN compras.compras.tipo_comprobante IS 'Código SRI del tipo de comprobante (01, etc.)';
COMMENT ON COLUMN compras.compras.secuencial IS 'Número de factura del proveedor (ej: 001-001-000000001)';
COMMENT ON COLUMN compras.compras.autorizacion IS 'Número de autorización SRI de la factura del proveedor';
COMMENT ON COLUMN compras.compras.fecha_emision IS 'Fecha de emisión de la factura fí­sica/electrónica';
COMMENT ON COLUMN compras.compras.fecha_registro IS 'Fecha en que se ingresa al sistema contable';
COMMENT ON COLUMN compras.compras.sustento IS 'Código SRI del sustento tributario';
COMMENT ON COLUMN compras.compras.descripcion IS 'Descripción o detalle de la compra';
COMMENT ON COLUMN compras.compras.subtotal_iva IS 'Base imponible que grava IVA';
COMMENT ON COLUMN compras.compras.subtotal_0 IS 'Base imponible tarifa 0%';
COMMENT ON COLUMN compras.compras.monto_iva IS 'Valor del IVA calculado';
COMMENT ON COLUMN compras.compras.total IS 'Valor total de la compra';
COMMENT ON COLUMN compras.compras.orden_compra_id IS 'Referencia a la orden de compra asociada (opcional)';
COMMENT ON COLUMN compras.compras.tiene_retencion IS 'Indica si se generó comprobante de retención para esta compra';
COMMENT ON COLUMN compras.compras.estado_retencion IS 'Estado de la retención: PENDIENTE, EMITIDA, ANULADA';
COMMENT ON COLUMN compras.compras.nro_retencion IS 'Número secuencial de la retención emitida';
COMMENT ON COLUMN compras.compras.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN compras.compras.updated_at IS 'Fecha de última actualización';

CREATE TABLE IF NOT EXISTS compras.compras_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL REFERENCES compras.compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES inventario.productos(id),
    descripcion VARCHAR(500) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    porcentaje_iva NUMERIC(5,2) DEFAULT 0,
    valor_iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE compras.compras_detalle IS 'Detalle de productos/servicios en cada factura de compra';
COMMENT ON COLUMN compras.compras_detalle.id IS 'Identificador único del detalle';
COMMENT ON COLUMN compras.compras_detalle.compra_id IS 'Referencia a la compra (factura)';
COMMENT ON COLUMN compras.compras_detalle.producto_id IS 'Producto inventariable (NULL si es servicio)';
COMMENT ON COLUMN compras.compras_detalle.descripcion IS 'Descripción del í­tem comprado';
COMMENT ON COLUMN compras.compras_detalle.cantidad IS 'Cantidad comprada';
COMMENT ON COLUMN compras.compras_detalle.precio_unitario IS 'Precio unitario de compra';
COMMENT ON COLUMN compras.compras_detalle.subtotal IS 'Subtotal sin IVA (cantidad í— precio)';
COMMENT ON COLUMN compras.compras_detalle.porcentaje_iva IS 'Porcentaje de IVA aplicado (0, 15, etc)';
COMMENT ON COLUMN compras.compras_detalle.valor_iva IS 'Valor calculado del IVA';
COMMENT ON COLUMN compras.compras_detalle.total IS 'Total con IVA incluido';
CREATE TABLE IF NOT EXISTS compras.ordenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    proveedor_id UUID NOT NULL REFERENCES directorio.terceros(id),
    secuencial VARCHAR(20) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_entrega DATE,
    observacion TEXT,
    subtotal NUMERIC(18,2) DEFAULT 0,
    iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADA, FACTURADA, ANULADA
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, secuencial)
);

COMMENT ON TABLE compras.ordenes IS 'Órdenes de compra generadas para proveedores.';
COMMENT ON COLUMN compras.ordenes.id IS 'Identificador único de la orden';
COMMENT ON COLUMN compras.ordenes.secuencial IS 'Número secuencial interno de la orden de compra';
COMMENT ON COLUMN compras.ordenes.fecha_emision IS 'Fecha de creación de la orden';
COMMENT ON COLUMN compras.ordenes.fecha_entrega IS 'Fecha estimada de recepción de los productos';
COMMENT ON COLUMN compras.ordenes.total IS 'Valor total estimado de la orden';
COMMENT ON COLUMN compras.ordenes.estado IS 'Estado: PENDIENTE, APROBADA, FACTURADA, ANULADA';

CREATE TABLE IF NOT EXISTS compras.ordenes_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID NOT NULL REFERENCES compras.ordenes(id) ON DELETE CASCADE,
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad NUMERIC(18,2) NOT NULL,
    precio_unitario NUMERIC(18,2) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    graba_iva BOOLEAN DEFAULT true
);

COMMENT ON TABLE compras.ordenes_detalles IS 'Detalle de productos solicitados en la orden de compra.';
COMMENT ON COLUMN compras.ordenes_detalles.orden_id IS 'Referencia a la cabecera de la orden';
COMMENT ON COLUMN compras.ordenes_detalles.producto_nombre IS 'Nombre o descripción del producto solicitado';
COMMENT ON COLUMN compras.ordenes_detalles.cantidad IS 'Cantidad solicitada';
COMMENT ON COLUMN compras.ordenes_detalles.precio_unitario IS 'Precio unitario referencial';

CREATE TABLE IF NOT EXISTS compras.notas_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES directorio.terceros(id),
    factura_id UUID REFERENCES compras.compras(id),
    secuencial VARCHAR(20) NOT NULL,
    fecha_emision DATE NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    iva NUMERIC(18,2) NOT NULL,
    total NUMERIC(18,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'REGISTRADO',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, proveedor_id, secuencial)
);

COMMENT ON TABLE compras.notas_credito IS 'Notas de crédito recibidas de proveedores.';

CREATE TABLE IF NOT EXISTS compras.notas_credito_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nota_credito_id UUID NOT NULL REFERENCES compras.notas_credito(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES inventario.productos(id),
    cantidad NUMERIC(18,2) NOT NULL,
    precio_unitario NUMERIC(18,2) NOT NULL,
    total NUMERIC(18,2) NOT NULL
);

COMMENT ON TABLE compras.notas_credito_detalles IS 'Detalles de items devueltos o ajustados en NC compra.';

-- ============================================================================
-- Triggers de auditorí­a para las nuevas tablas
CREATE IF NOT EXISTS TRIGGER audit_activos_fijos AFTER INSERT OR UPDATE OR DELETE ON activos.activos_fijos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE IF NOT EXISTS TRIGGER audit_compras AFTER INSERT OR UPDATE OR DELETE ON compras.compras FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE IF NOT EXISTS TRIGGER audit_compras_ordenes AFTER INSERT OR UPDATE OR DELETE ON compras.ordenes FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- 13. MÓDULO: BUZÓN XML
-- ============================================================================
CREATE TABLE buzon.comprobantes_recibidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(2) NOT NULL, -- 01, 03, 04, 05, 06, 07
    secuencial VARCHAR(20) NOT NULL,
    ruc_emisor VARCHAR(13) NOT NULL,
    razon_social_emisor VARCHAR(300) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_recepcion TIMESTAMP DEFAULT NOW(),
    monto_total NUMERIC(18,2) NOT NULL,
    clave_acceso VARCHAR(49) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'RECIBIDO', -- RECIBIDO, PROCESADO, RECHAZADO
    asociado_a UUID, -- ID de la compra o gasto asociado
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE buzon.comprobantes_recibidos IS 'Buzón de comprobantes electrónicos recibidos desde el SRI (Compras/Gastos).';
COMMENT ON COLUMN buzon.comprobantes_recibidos.id IS 'Identificador único del comprobante recibido';
COMMENT ON COLUMN buzon.comprobantes_recibidos.empresa_id IS 'Empresa que recibe el comprobante';
COMMENT ON COLUMN buzon.comprobantes_recibidos.tipo IS 'Tipo de comprobante SRI (01: Factura, 04: Nota de Crédito, etc.)';
COMMENT ON COLUMN buzon.comprobantes_recibidos.secuencial IS 'Número secuencial del comprobante del emisor';
COMMENT ON COLUMN buzon.comprobantes_recibidos.ruc_emisor IS 'RUC del proveedor que emite el comprobante';
COMMENT ON COLUMN buzon.comprobantes_recibidos.razon_social_emisor IS 'Nombre o razón social del proveedor';
COMMENT ON COLUMN buzon.comprobantes_recibidos.fecha_emision IS 'Fecha en que se emitió el comprobante';
COMMENT ON COLUMN buzon.comprobantes_recibidos.fecha_recepcion IS 'Fecha y hora en que el sistema detectó el comprobante';
COMMENT ON COLUMN buzon.comprobantes_recibidos.monto_total IS 'Valor total del comprobante';
COMMENT ON COLUMN buzon.comprobantes_recibidos.clave_acceso IS 'Clave de acceso de 49 dí­gitos del SRI';
COMMENT ON COLUMN buzon.comprobantes_recibidos.estado IS 'Estado de procesamiento: RECIBIDO, PROCESADO, RECHAZADO';
COMMENT ON COLUMN buzon.comprobantes_recibidos.asociado_a IS 'ID de la compra o gasto al que se vinculó este XML';


CREATE TRIGGER audit_buzon_comprobantes AFTER INSERT OR UPDATE OR DELETE ON buzon.comprobantes_recibidos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- 1. Crear Tablas de Seguridad si no existen
CREATE TABLE IF NOT EXISTS seguridad.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguridad.roles IS 'Tabla de roles del sistema';
COMMENT ON COLUMN seguridad.roles.id IS 'Identificador único (UUID)';
COMMENT ON COLUMN seguridad.roles.nombre IS 'Nombre único del rol';
COMMENT ON COLUMN seguridad.roles.descripcion IS 'Descripción del rol';
COMMENT ON COLUMN seguridad.roles.created_at IS 'Fecha de creación del rol';


-- Trigger de auditorí­a
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON seguridad.roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMENT ON TRIGGER audit_roles ON seguridad.roles IS 'Auditorí­a automática de cambios en roles de seguridad';



CREATE TABLE IF NOT EXISTS seguridad.usuarios_roles (
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES seguridad.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (usuario_id, rol_id)
);

COMMENT ON TABLE seguridad.usuarios_roles IS 'Relación entre usuarios y roles';
COMMENT ON COLUMN seguridad.usuarios_roles.usuario_id IS 'Identificador del usuario';
COMMENT ON COLUMN seguridad.usuarios_roles.rol_id IS 'Identificador del rol';

-- Trigger de auditorí­a
CREATE TRIGGER audit_usuarios_roles AFTER INSERT OR UPDATE OR DELETE ON seguridad.usuarios_roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMENT ON TRIGGER audit_usuarios_roles ON seguridad.usuarios_roles IS 'Auditorí­a automática de asignación de roles a usuarios';



-- 2. Crear Tablas de Planes y Menú


-- Tabla: seguridad.planes
CREATE TABLE IF NOT EXISTS seguridad.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    precio_mensual DECIMAL(10, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguridad.planes IS 'Catálogo de planes de suscripción disponibles en el sistema.';
COMMENT ON COLUMN seguridad.planes.id IS 'Identificador único del plan';
COMMENT ON COLUMN seguridad.planes.codigo IS 'Código único del plan (ej: GRATUITO, PROFESIONAL)';
COMMENT ON COLUMN seguridad.planes.nombre IS 'Nombre comercial del plan';
COMMENT ON COLUMN seguridad.planes.descripcion IS 'Descripción detallada de las características del plan';
COMMENT ON COLUMN seguridad.planes.precio_mensual IS 'Costo mensual de la suscripción';
COMMENT ON COLUMN seguridad.planes.activo IS 'Estado del plan para nuevas suscripciones';
COMMENT ON COLUMN seguridad.planes.created_at IS 'Fecha de creación del registro';
COMMENT ON COLUMN seguridad.planes.updated_at IS 'Fecha de última actualización';



CREATE TABLE IF NOT EXISTS configuracion.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    padre_id UUID REFERENCES configuracion.menu_items(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    path VARCHAR(200) NOT NULL,
    orden INT DEFAULT 0,
    plan_id UUID REFERENCES seguridad.planes(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE configuracion.menu_items IS 'Tabla de ítems de menú configurables';
COMMENT ON COLUMN configuracion.menu_items.id IS 'Identificador único (UUID)';
COMMENT ON COLUMN configuracion.menu_items.label IS 'Etiqueta visible del menú';
COMMENT ON COLUMN configuracion.menu_items.icon_name IS 'Nombre del ícono asociado';
COMMENT ON COLUMN configuracion.menu_items.path IS 'Ruta o URL del ítem';
COMMENT ON COLUMN configuracion.menu_items.orden IS 'Orden de aparición en el menú';
COMMENT ON COLUMN configuracion.menu_items.plan_id IS 'Plan mínimo requerido para ver el ítem (referencia a planes)';
COMMENT ON COLUMN configuracion.menu_items.activo IS 'Estado de activación del ítem';
COMMENT ON COLUMN configuracion.menu_items.created_at IS 'Fecha de creación del ítem';


-- Trigger de auditorí­a
CREATE TRIGGER audit_menu_items AFTER INSERT OR UPDATE OR DELETE ON configuracion.menu_items FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMENT ON TRIGGER audit_menu_items ON configuracion.menu_items IS 'Auditorí­a automática de cambios en í­tems de menú';



CREATE TABLE IF NOT EXISTS configuracion.menu_item_roles (
    menu_item_id UUID NOT NULL REFERENCES configuracion.menu_items(id) ON DELETE CASCADE,
    rol_id UUID NOT NULL REFERENCES seguridad.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_item_id, rol_id)
);

COMMENT ON TABLE configuracion.menu_item_roles IS 'Relación entre í­tems de menú y roles';
COMMENT ON COLUMN configuracion.menu_item_roles.menu_item_id IS 'Identificador del í­tem de menú';
COMMENT ON COLUMN configuracion.menu_item_roles.rol_id IS 'Identificador del rol asociado';

-- Trigger de auditorí­a
CREATE TRIGGER audit_menu_item_roles AFTER INSERT OR UPDATE OR DELETE ON configuracion.menu_item_roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Crear triggers de auditorí­a para tablas crí­ticas
-- Seguridad
CREATE TRIGGER audit_empresas AFTER INSERT OR UPDATE OR DELETE ON seguridad.empresas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_usuarios AFTER INSERT OR UPDATE OR DELETE ON seguridad.usuarios FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_usuarios_empresas AFTER INSERT OR UPDATE OR DELETE ON seguridad.usuarios_empresas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- Directorio
CREATE TRIGGER audit_terceros AFTER INSERT OR UPDATE OR DELETE ON directorio.terceros FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Contabilidad
CREATE TRIGGER audit_plan_cuentas AFTER INSERT OR UPDATE OR DELETE ON contabilidad.plan_cuentas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_centros_costos AFTER INSERT OR UPDATE OR DELETE ON contabilidad.centros_costos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_asientos AFTER INSERT OR UPDATE OR DELETE ON contabilidad.asientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_asientos_detalles AFTER INSERT OR UPDATE OR DELETE ON contabilidad.asientos_detalles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Inventario
CREATE TRIGGER audit_categorias_producto AFTER INSERT OR UPDATE OR DELETE ON inventario.categorias_producto FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_bodegas AFTER INSERT OR UPDATE OR DELETE ON inventario.bodegas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_productos AFTER INSERT OR UPDATE OR DELETE ON inventario.productos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_kardex_movimientos AFTER INSERT OR UPDATE OR DELETE ON inventario.kardex_movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Nómina
CREATE TRIGGER audit_empleados AFTER INSERT OR UPDATE OR DELETE ON nomina.empleados FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_nomina_roles AFTER INSERT OR UPDATE OR DELETE ON nomina.nomina_roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Bancos
CREATE TRIGGER audit_bancos_cuentas AFTER INSERT OR UPDATE OR DELETE ON bancos.bancos_cuentas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_bancos_movimientos AFTER INSERT OR UPDATE OR DELETE ON bancos.bancos_movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Cartera
CREATE TRIGGER audit_cartera_documentos AFTER INSERT OR UPDATE OR DELETE ON cartera.cartera_documentos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_cartera_anticipos AFTER INSERT OR UPDATE OR DELETE ON cartera.cartera_anticipos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Facturación
CREATE TRIGGER audit_comprobantes_electronicos AFTER INSERT OR UPDATE OR DELETE ON facturacion.comprobantes_electronicos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_transportistas AFTER INSERT OR UPDATE OR DELETE ON facturacion.transportistas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Configuración
CREATE TRIGGER audit_sucursales AFTER INSERT OR UPDATE OR DELETE ON configuracion.sucursales FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_puntos_emision AFTER INSERT OR UPDATE OR DELETE ON configuracion.puntos_emision FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_codigos_retencion AFTER INSERT OR UPDATE OR DELETE ON configuracion.codigos_retencion FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_sri_ambiente AFTER INSERT OR UPDATE OR DELETE ON configuracion.sri_ambiente FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_sri_certificados AFTER INSERT OR UPDATE OR DELETE ON configuracion.sri_certificados FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Caja Chica
CREATE TRIGGER audit_caja_chica_cajas AFTER INSERT OR UPDATE OR DELETE ON caja_chica.cajas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_caja_chica_movimientos AFTER INSERT OR UPDATE OR DELETE ON caja_chica.movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Activos Fijos
CREATE TRIGGER audit_activos_fijos AFTER INSERT OR UPDATE OR DELETE ON activos.activos_fijos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_depreciaciones AFTER INSERT OR UPDATE OR DELETE ON activos.depreciaciones FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Impuestos
CREATE TRIGGER audit_formularios AFTER INSERT OR UPDATE OR DELETE ON impuestos.formularios FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_ats AFTER INSERT OR UPDATE OR DELETE ON impuestos.ats FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Compras
CREATE TRIGGER audit_compras AFTER INSERT OR UPDATE OR DELETE ON compras.compras FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_ordenes_compra AFTER INSERT OR UPDATE OR DELETE ON compras.ordenes FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Buzón XML
CREATE TRIGGER audit_comprobantes_recibidos AFTER INSERT OR UPDATE OR DELETE ON buzon.comprobantes_recibidos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- ============================================================================
-- FUNCIONES DE UTILIDAD PARA CERTIFICADOS DIGITALES
-- ============================================================================

-- Función: Verificar si un certificado está vigente
CREATE OR REPLACE FUNCTION configuracion.es_certificado_vigente(fecha_expiracion TIMESTAMP)
RETURNS BOOLEAN AS $$
BEGIN
    IF fecha_expiracion IS NULL THEN
        RETURN NULL; -- Unknown status if no expiration date
    END IF;
    RETURN NOW() < fecha_expiracion;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION configuracion.es_certificado_vigente(TIMESTAMP) IS 
    'Verifica si un certificado está vigente comparando la fecha de expiración con la fecha actual';

-- Función: Calcular dí­as hasta la expiración
-- CREATE OR REPLACE FUNCTION configuracion.dias_hasta_expiracion(fecha_expiracion TIMESTAMP)
-- RETURNS INTEGER AS $$
-- BEGIN
--     IF fecha_expiracion IS NULL THEN
--         RETURN NULL;
--     END IF;
--     RETURN EXTRACT(DAY FROM (fecha_expiracion - NOW()))::INTEGER;
-- END;
-- $$ LANGUAGE plpgsql IMMUTABLE;

-- COMMENT ON FUNCTION configuracion.dias_hasta_expiracion(TIMESTAMP) IS 
--     'Calcula dí­as restantes hasta la expiración del certificado. Retorna número negativo si ya expiró';

-- Función: Obtener metadatos completos del certificado
-- CREATE OR REPLACE FUNCTION configuracion.obtener_metadata_certificado(
--     p_empresa_id UUID,
--     p_ambiente_codigo VARCHAR
-- )
-- RETURNS TABLE (
--     certificado_id UUID,
--     ambiente VARCHAR,
--     fecha_emision TIMESTAMP,
--     fecha_expiracion TIMESTAMP,
--     sujeto TEXT,
--     emisor TEXT,
--     numero_serie VARCHAR,
--     es_vigente BOOLEAN,
--     dias_restantes INTEGER,
--     tiene_certificado BOOLEAN
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT 
--         sc.id,
--         sa.codigo,
--         sc.cert_fecha_emision,
--         sc.cert_fecha_expiracion,
--         sc.cert_sujeto,
--         sc.cert_emisor,
--         sc.cert_numero_serie,
--         configuracion.es_certificado_vigente(sc.cert_fecha_expiracion) as es_vigente,
--         configuracion.dias_hasta_expiracion(sc.cert_fecha_expiracion) as dias_restantes,
--         (sc.cert_p12_certificado IS NOT NULL) as tiene_certificado
--     FROM configuracion.sri_certificados sc
--     INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
--     WHERE sc.empresa_id = p_empresa_id 
--       AND sa.codigo = p_ambiente_codigo
--       AND sc.activo = TRUE
--     LIMIT 1;
-- END;
-- $$ LANGUAGE plpgsql STABLE;

-- COMMENT ON FUNCTION configuracion.obtener_metadata_certificado(UUID, VARCHAR) IS 
--     'Obtiene los metadatos completos del certificado digital activo para una empresa y ambiente, incluyendo estado de vigencia';


-- FIN DEL SCHEMA
-- ============================================================================

COMMENT ON TRIGGER trigger_terceros_updated_at ON directorio.terceros IS 'Actualiza automáticamente el campo updated_at al modificar un tercero';
COMMENT ON TRIGGER audit_plan_cuentas ON contabilidad.plan_cuentas IS 'Auditorí­a de cambios en el plan de cuentas';
COMMENT ON TRIGGER audit_asientos ON contabilidad.asientos IS 'Auditorí­a de cambios en asientos contables';
COMMENT ON TRIGGER audit_productos ON inventario.productos IS 'Auditorí­a de cambios en el catálogo de productos';
COMMENT ON TRIGGER audit_kardex_movimientos ON inventario.kardex_movimientos IS 'Auditorí­a de movimientos de inventario';
COMMENT ON TRIGGER audit_empleados ON nomina.empleados IS 'Auditorí­a de cambios en datos de empleados';
COMMENT ON TRIGGER audit_nomina_roles ON nomina.nomina_roles IS 'Auditorí­a de generación y cambios en roles de pago';
COMMENT ON TRIGGER audit_bancos_cuentas ON bancos.bancos_cuentas IS 'Auditorí­a de cambios en cuentas bancarias';
COMMENT ON TRIGGER audit_bancos_movimientos ON bancos.bancos_movimientos IS 'Auditorí­a de transacciones bancarias';
COMMENT ON TRIGGER audit_comprobantes_electronicos ON facturacion.comprobantes_electronicos IS 'Auditorí­a de emisión de comprobantes electrónicos';
COMMENT ON TRIGGER audit_documentos_pendientes ON cartera.documentos_pendientes IS 'Auditorí­a de cambios en cartera de clientes/proveedores';
COMMENT ON TRIGGER audit_anticipos ON cartera.anticipos IS 'Auditorí­a de gestión de anticipos';
COMMENT ON TRIGGER audit_transacciones ON cartera.transacciones IS 'Auditorí­a de cobros y pagos';
COMMENT ON TRIGGER audit_activos_fijos ON activos.activos_fijos IS 'Auditorí­a de gestión de activos fijos';
COMMENT ON TRIGGER audit_compras ON compras.compras IS 'Auditorí­a de registro de compras';
COMMENT ON TRIGGER audit_compras_ordenes ON compras.ordenes IS 'Auditorí­a de órdenes de compra';
COMMENT ON TRIGGER audit_buzon_comprobantes ON buzon.comprobantes_recibidos IS 'Auditorí­a de recepción de comprobantes electrónicos';
COMMENT ON TRIGGER audit_menu_item_roles ON configuracion.menu_item_roles IS 'Auditorí­a automática de asignación de roles a í­tems de menú';
-- ============================================================================
-- TRIGGER: Auditoría automática
-- ============================================================================

CREATE TRIGGER audit_usuarios_puntos_emision
    AFTER INSERT OR UPDATE OR DELETE ON configuracion.usuarios_puntos_emision
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();

COMMENT ON TRIGGER audit_usuarios_puntos_emision ON configuracion.usuarios_puntos_emision IS 
'Auditoría automática de asignaciones de puntos de emisión a usuarios';
