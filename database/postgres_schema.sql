-- ============================================================================
-- ECUCONTABLE PRO - SCHEMA POSTGRESQL 15+ COMPLETO
-- ============================================================================
-- Versión: 4.1 (Full Comments)
-- Fecha: 2024-01-20
-- Arquitectura: Multi-Tenant + Auditoría Completa + JWT
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
CREATE TYPE tipo_comprobante_sri AS ENUM ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'GUIA_REMISION', 'COMPROBANTE_RETENCION');
CREATE TYPE estado_comprobante AS ENUM ('BORRADOR', 'PENDIENTE', 'AUTORIZADO', 'RECHAZADO', 'ANULADO');
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
    obligado_contabilidad BOOLEAN DEFAULT true,
    es_contribuyente_especial BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE seguridad.empresas IS 'Empresas del sistema (multi-tenant). Cada empresa es un tenant aislado.';
COMMENT ON COLUMN seguridad.empresas.id IS 'Identificador único (UUID) de la empresa';
COMMENT ON COLUMN seguridad.empresas.ruc IS 'Registro Único de Contribuyentes (13 dígitos). Debe ser único en el sistema';
COMMENT ON COLUMN seguridad.empresas.razon_social IS 'Razón social legal de la empresa según el RUC';
COMMENT ON COLUMN seguridad.empresas.nombre_comercial IS 'Nombre comercial o de fantasía de la empresa';
COMMENT ON COLUMN seguridad.empresas.direccion IS 'Dirección matriz de la empresa';
COMMENT ON COLUMN seguridad.empresas.telefono IS 'Teléfono de contacto principal';
COMMENT ON COLUMN seguridad.empresas.email IS 'Correo electrónico para notificaciones del sistema';
COMMENT ON COLUMN seguridad.empresas.logo_url IS 'URL o path del logo de la empresa';
COMMENT ON COLUMN seguridad.empresas.obligado_contabilidad IS 'Indica si la empresa está obligada a llevar contabilidad (TRUE/FALSE)';
COMMENT ON COLUMN seguridad.empresas.es_contribuyente_especial IS 'Indica si la empresa es contribuyente especial (TRUE/FALSE)';
COMMENT ON COLUMN seguridad.empresas.activa IS 'Estado de la empresa. FALSE impide el acceso a sus usuarios';
COMMENT ON COLUMN seguridad.empresas.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN seguridad.empresas.updated_at IS 'Fecha y hora de última actualización';

-- Tabla: seguridad.usuarios
CREATE TABLE seguridad.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'OPERADOR',
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
COMMENT ON COLUMN seguridad.usuarios.rol IS 'Rol global del usuario: ADMIN, CONTADOR, OPERADOR, CONSULTA';
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
COMMENT ON COLUMN seguridad.usuarios_empresas.activo IS 'Permite deshabilitar el acceso a una empresa específica sin desactivar el usuario global';
COMMENT ON COLUMN seguridad.usuarios_empresas.created_at IS 'Fecha de asignación del permiso';

-- ============================================================================
-- 2. MÓDULO: CONTABILIDAD
-- ============================================================================

-- Tabla: contabilidad.plan_cuentas
CREATE TABLE contabilidad.plan_cuentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo tipo_cuenta NOT NULL,
    nivel INTEGER NOT NULL,
    saldo NUMERIC(18,2) DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE contabilidad.plan_cuentas IS 'Plan de cuentas contables. Estructura jerárquica para la contabilidad.';
COMMENT ON COLUMN contabilidad.plan_cuentas.id IS 'Identificador único de la cuenta contable';
COMMENT ON COLUMN contabilidad.plan_cuentas.empresa_id IS 'Empresa a la que pertenece la cuenta (tenant)';
COMMENT ON COLUMN contabilidad.plan_cuentas.usuario_id IS 'Usuario que creó o modificó la cuenta por última vez';
COMMENT ON COLUMN contabilidad.plan_cuentas.codigo IS 'Código contable jerárquico (ej: 1.1.01). Único por empresa';
COMMENT ON COLUMN contabilidad.plan_cuentas.nombre IS 'Nombre descriptivo de la cuenta';
COMMENT ON COLUMN contabilidad.plan_cuentas.tipo IS 'Clasificación: ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO';
COMMENT ON COLUMN contabilidad.plan_cuentas.nivel IS 'Profundidad en el árbol jerárquico (calculado por puntos + 1)';
COMMENT ON COLUMN contabilidad.plan_cuentas.saldo IS 'Saldo acumulado actual de la cuenta. Se actualiza con los asientos mayorizados';
COMMENT ON COLUMN contabilidad.plan_cuentas.activa IS 'Indica si la cuenta se puede usar en nuevos asientos';

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

COMMENT ON TABLE contabilidad.centros_costos IS 'Centros de costos para contabilidad analítica / distribución de gastos.';
COMMENT ON COLUMN contabilidad.centros_costos.id IS 'Identificador único del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.empresa_id IS 'Empresa propietaria del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.codigo IS 'Código identificador (ej: CC-01-02)';
COMMENT ON COLUMN contabilidad.centros_costos.nombre IS 'Nombre del centro de costos (ej: Departamento TI)';
COMMENT ON COLUMN contabilidad.centros_costos.nivel IS 'Nivel jerárquico del centro de costos';
COMMENT ON COLUMN contabilidad.centros_costos.activo IS 'Estado del centro de costos';

-- Tabla: contabilidad.asientos
CREATE TABLE contabilidad.asientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    numero VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    glosa TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'DIARIO',
    estado estado_asiento DEFAULT 'BORRADOR',
    centro_costo_id UUID REFERENCES contabilidad.centros_costos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero)
);

COMMENT ON TABLE contabilidad.asientos IS 'Cabecera de los asientos contables (Diario General).';
COMMENT ON COLUMN contabilidad.asientos.id IS 'Identificador único del asiento';
COMMENT ON COLUMN contabilidad.asientos.empresa_id IS 'Empresa a la que pertenece el asiento';
COMMENT ON COLUMN contabilidad.asientos.usuario_id IS 'Usuario que creó el asiento';
COMMENT ON COLUMN contabilidad.asientos.numero IS 'Número secuencial o código del asiento. Único por empresa';
COMMENT ON COLUMN contabilidad.asientos.fecha IS 'Fecha contable del registro';
COMMENT ON COLUMN contabilidad.asientos.glosa IS 'Descripción o detalle general del asiento';
COMMENT ON COLUMN contabilidad.asientos.tipo IS 'Tipo de asiento: DIARIO, INGRESO, EGRESO, AJUSTE, CIERRE';
COMMENT ON COLUMN contabilidad.asientos.estado IS 'Estado del ciclo de vida: BORRADOR, MAYORIZADO (afecta saldos), ANULADO';
COMMENT ON COLUMN contabilidad.asientos.centro_costo_id IS 'Referencia opcional a un centro de costos principal';

-- Tabla: contabilidad.asientos_detalles
CREATE TABLE contabilidad.asientos_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asiento_id UUID NOT NULL REFERENCES contabilidad.asientos(id) ON DELETE CASCADE,
    cuenta_codigo VARCHAR(50) NOT NULL,
    debe NUMERIC(18,2) DEFAULT 0,
    haber NUMERIC(18,2) DEFAULT 0,
    concepto TEXT
);

COMMENT ON TABLE contabilidad.asientos_detalles IS 'Detalle de líneas del asiento contable (Movimientos).';
COMMENT ON COLUMN contabilidad.asientos_detalles.id IS 'Identificador único de la línea de detalle';
COMMENT ON COLUMN contabilidad.asientos_detalles.asiento_id IS 'Referencia al asiento cabecera';
COMMENT ON COLUMN contabilidad.asientos_detalles.cuenta_codigo IS 'Código de la cuenta contable afectada (Desnormalizado para eficiencia histórica)';
COMMENT ON COLUMN contabilidad.asientos_detalles.debe IS 'Monto en la columna del DEBE (Débito)';
COMMENT ON COLUMN contabilidad.asientos_detalles.haber IS 'Monto en la columna del HABER (Crédito)';
COMMENT ON COLUMN contabilidad.asientos_detalles.concepto IS 'Descripción específica de la línea (opcional)';

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
    obligado_contabilidad BOOLEAN DEFAULT FALSE,
    
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
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    
    -- Constraints
    UNIQUE(empresa_id, identificacion),
    CONSTRAINT check_tipo_identificacion CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08')),
    CONSTRAINT check_tipo_tercero CHECK (tipo_tercero IN ('CLIENTE', 'PROVEEDOR', 'AMBOS', 'EMPLEADO', 'OTRO'))
);

COMMENT ON TABLE directorio.terceros IS 'Catálogo unificado de terceros: clientes, proveedores, empleados y otros contactos comerciales.';
COMMENT ON COLUMN directorio.terceros.id IS 'Identificador único (UUID) del tercero';
COMMENT ON COLUMN directorio.terceros.empresa_id IS 'Empresa a la que pertenece el tercero (tenant)';
COMMENT ON COLUMN directorio.terceros.tipo_identificacion IS 'Código SRI del tipo de identificación: 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final, 08=Exterior';
COMMENT ON COLUMN directorio.terceros.identificacion IS 'Número de identificación (RUC, cédula, pasaporte, etc.). Único por empresa';
COMMENT ON COLUMN directorio.terceros.razon_social IS 'Razón social o nombre legal completo del tercero';
COMMENT ON COLUMN directorio.terceros.nombre_comercial IS 'Nombre comercial o de fantasía (opcional)';
COMMENT ON COLUMN directorio.terceros.tipo_tercero IS 'Clasificación del tercero: CLIENTE, PROVEEDOR, AMBOS (cliente y proveedor), EMPLEADO, OTRO';
COMMENT ON COLUMN directorio.terceros.es_contribuyente_especial IS 'Indica si el tercero es contribuyente especial según el SRI (aplica descuentos adicionales)';
COMMENT ON COLUMN directorio.terceros.obligado_contabilidad IS 'Indica si el tercero está obligado a llevar contabilidad';
COMMENT ON COLUMN directorio.terceros.email IS 'Correo electrónico principal de contacto';
COMMENT ON COLUMN directorio.terceros.telefono IS 'Teléfono fijo de contacto';
COMMENT ON COLUMN directorio.terceros.celular IS 'Número de celular/móvil de contacto';
COMMENT ON COLUMN directorio.terceros.direccion IS 'Dirección completa del tercero';
COMMENT ON COLUMN directorio.terceros.provincia IS 'Provincia de ubicación';
COMMENT ON COLUMN directorio.terceros.ciudad IS 'Ciudad de ubicación';
COMMENT ON COLUMN directorio.terceros.codigo_postal IS 'Código postal';
COMMENT ON COLUMN directorio.terceros.limite_credito IS 'Monto máximo de crédito permitido para el tercero (si es cliente)';
COMMENT ON COLUMN directorio.terceros.dias_credito IS 'Plazo de pago en días otorgado al tercero';
COMMENT ON COLUMN directorio.terceros.descuento_porcentaje IS 'Porcentaje de descuento comercial aplicable automáticamente';
COMMENT ON COLUMN directorio.terceros.cuenta_contable_cxc IS 'Código de cuenta contable de Cuentas por Cobrar (si es cliente)';
COMMENT ON COLUMN directorio.terceros.cuenta_contable_cxp IS 'Código de cuenta contable de Cuentas por Pagar (si es proveedor)';
COMMENT ON COLUMN directorio.terceros.activo IS 'Estado del tercero. FALSE oculta el tercero de las listas activas';
COMMENT ON COLUMN directorio.terceros.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN directorio.terceros.updated_at IS 'Fecha y hora de última modificación';
COMMENT ON COLUMN directorio.terceros.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN directorio.terceros.updated_by IS 'Usuario que realizó la última modificación';

-- Índices para mejorar rendimiento de búsquedas
CREATE INDEX idx_terceros_empresa ON directorio.terceros(empresa_id);
CREATE INDEX idx_terceros_identificacion ON directorio.terceros(identificacion);
CREATE INDEX idx_terceros_tipo ON directorio.terceros(tipo_tercero);
CREATE INDEX idx_terceros_activo ON directorio.terceros(activo);
CREATE INDEX idx_terceros_razon_social ON directorio.terceros USING gin(to_tsvector('spanish', razon_social));

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
COMMENT ON COLUMN inventario.categorias_producto.id IS 'Identificador único de la categoría';
COMMENT ON COLUMN inventario.categorias_producto.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN inventario.categorias_producto.nombre IS 'Nombre de la categoría';
COMMENT ON COLUMN inventario.categorias_producto.descripcion IS 'Descripción adicional';
COMMENT ON COLUMN inventario.categorias_producto.cuenta_inventario IS 'Código cuenta contable de activo (Inventario) por defecto';
COMMENT ON COLUMN inventario.categorias_producto.cuenta_costo_venta IS 'Código cuenta contable de costo (Costo de Venta) por defecto';
COMMENT ON COLUMN inventario.categorias_producto.cuenta_venta IS 'Código cuenta contable de ingreso (Ventas) por defecto';
COMMENT ON COLUMN inventario.categorias_producto.activa IS 'Estado de la categoría';

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

COMMENT ON TABLE inventario.bodegas IS 'Almacenes físicos o lógicos donde se guardan productos.';
COMMENT ON COLUMN inventario.bodegas.id IS 'Identificador único de la bodega';
COMMENT ON COLUMN inventario.bodegas.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN inventario.bodegas.codigo IS 'Código interno de la bodega (ej: BOD-01)';
COMMENT ON COLUMN inventario.bodegas.nombre IS 'Nombre descriptivo de la bodega';
COMMENT ON COLUMN inventario.bodegas.responsable IS 'Nombre de la persona responsable del almacén';
COMMENT ON COLUMN inventario.bodegas.ubicacion IS 'Dirección física o referencia de ubicación';
COMMENT ON COLUMN inventario.bodegas.activa IS 'Estado de la bodega. FALSE impide nuevos movimientos';

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
COMMENT ON COLUMN inventario.productos.stock_actual IS 'Cantidad actual en existencia (suma de todas las bodegas)';
COMMENT ON COLUMN inventario.productos.stock_minimo IS 'Cantidad mínima para alertas de reabastecimiento';
COMMENT ON COLUMN inventario.productos.costo_promedio IS 'Costo unitario promedio ponderado. Se actualiza en cada entrada';
COMMENT ON COLUMN inventario.productos.precio_venta IS 'Precio de venta al público base (antes de impuestos)';
COMMENT ON COLUMN inventario.productos.graba_iva IS 'Indica si el producto grava IVA (TRUE) o es tarifa 0% (FALSE)';
COMMENT ON COLUMN inventario.productos.categoria_id IS 'Referencia a la categoría del producto';
COMMENT ON COLUMN inventario.productos.activo IS 'Estado del producto';

-- Tabla: inventario.kardex_movimientos
CREATE TABLE inventario.kardex_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    producto_id UUID NOT NULL REFERENCES inventario.productos(id) ON DELETE CASCADE,
    bodega_id UUID NOT NULL REFERENCES inventario.bodegas(id),
    tipo tipo_movimiento_kardex NOT NULL,
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
COMMENT ON COLUMN inventario.kardex_movimientos.stock_anterior IS 'Stock que tenía el producto antes de este movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.stock_resultante IS 'Stock que quedó después de este movimiento';
COMMENT ON COLUMN inventario.kardex_movimientos.referencia IS 'Documento de respaldo (Numero factura, etc.)';
COMMENT ON COLUMN inventario.kardex_movimientos.fecha IS 'Fecha contable del movimiento';

-- ============================================================================
-- 4. MÓDULO: NÓMINA
-- ============================================================================

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
    tipo_contrato tipo_contrato DEFAULT 'INDEFINIDO',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, cedula)
);

COMMENT ON TABLE nomina.empleados IS 'Registro maestro de empleados para nómina.';
COMMENT ON COLUMN nomina.empleados.id IS 'Identificador único del empleado';
COMMENT ON COLUMN nomina.empleados.cedula IS 'Número de cédula o identificación (único por empresa)';
COMMENT ON COLUMN nomina.empleados.nombres IS 'Nombres del empleado';
COMMENT ON COLUMN nomina.empleados.apellidos IS 'Apellidos del empleado';
COMMENT ON COLUMN nomina.empleados.sueldo_base IS 'Sueldo base contractual del empleado';
COMMENT ON COLUMN nomina.empleados.tipo_contrato IS 'Tipo de relación laboral';
COMMENT ON COLUMN nomina.empleados.activo IS 'Si el empleado está activo en la nómina';

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
    estado estado_rol_pago DEFAULT 'BORRADOR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, empleado_id, periodo)
);

COMMENT ON TABLE nomina.nomina_roles IS 'Roles de pago generados por periodo.';
COMMENT ON COLUMN nomina.nomina_roles.periodo IS 'Periodo de pago en formato YYYY-MM (ej: 2024-01)';
COMMENT ON COLUMN nomina.nomina_roles.total_ingresos IS 'Suma de sueldo, horas extra, bonos, etc.';
COMMENT ON COLUMN nomina.nomina_roles.total_egresos IS 'Suma de aportes IESS, préstamos, anticipos, multas';
COMMENT ON COLUMN nomina.nomina_roles.neto_pagar IS 'Valor final a recibir (Ingresos - Egresos)';
COMMENT ON COLUMN nomina.nomina_roles.estado IS 'Estado del rol: BORRADOR, PENDIENTE, PAGADO';

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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero_cuenta)
);

COMMENT ON TABLE bancos.bancos_cuentas IS 'Registro de cuentas bancarias de la empresa.';
COMMENT ON COLUMN bancos.bancos_cuentas.numero_cuenta IS 'Número de cuenta bancaria real';
COMMENT ON COLUMN bancos.bancos_cuentas.nombre IS 'Nombre descriptivo de la cuenta (ej: Banco Pichincha Principal)';
COMMENT ON COLUMN bancos.bancos_cuentas.banco IS 'Nombre de la institución financiera';
COMMENT ON COLUMN bancos.bancos_cuentas.saldo_actual IS 'Saldo contable actual de la cuenta';
COMMENT ON COLUMN bancos.bancos_cuentas.moneda IS 'Código ISO de la moneda (USD, EUR)';

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
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE bancos.bancos_movimientos IS 'Transacciones bancarias (Ingresos/Egresos).';
COMMENT ON COLUMN bancos.bancos_movimientos.cuenta_id IS 'Referencia a la cuenta bancaria afectada';
COMMENT ON COLUMN bancos.bancos_movimientos.fecha IS 'Fecha de la transacción';
COMMENT ON COLUMN bancos.bancos_movimientos.tipo IS 'Tipo: CHEQUE, TRANSFERENCIA, DEPOSITO, NOTA_DB/CR';
COMMENT ON COLUMN bancos.bancos_movimientos.referencia IS 'Número de cheque o comprobante bancario';
COMMENT ON COLUMN bancos.bancos_movimientos.monto IS 'Valor de la transacción';
COMMENT ON COLUMN bancos.bancos_movimientos.es_egreso IS 'TRUE si disminuye el saldo, FALSE si aumenta';
COMMENT ON COLUMN bancos.bancos_movimientos.conciliado IS 'Indica si el movimiento ya fue conciliado contra el extracto bancario';

-- ============================================================================
-- 6. MÓDULO: CARTERA (CxC / CxP)
-- ============================================================================

-- Tabla: cartera.cartera_documentos
CREATE TABLE cartera.cartera_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    tipo_cartera tipo_cartera NOT NULL,
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
COMMENT ON COLUMN cartera.cartera_documentos.tipo_cartera IS 'CXC (Clientes) o CXP (Proveedores)';
COMMENT ON COLUMN cartera.cartera_documentos.tercero_id IS 'ID del cliente o proveedor asociado';
COMMENT ON COLUMN cartera.cartera_documentos.nro_comprobante IS 'Número de factura o documento físico';
COMMENT ON COLUMN cartera.cartera_documentos.fecha_vencimiento IS 'Fecha límite de pago (para cálculo de aging)';
COMMENT ON COLUMN cartera.cartera_documentos.saldo_pendiente IS 'Valor pendiente de cobro/pago (monto_total - abonos)';

-- Tabla: cartera.cartera_anticipos
CREATE TABLE cartera.cartera_anticipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    tipo_cartera tipo_cartera NOT NULL,
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
COMMENT ON COLUMN cartera.cartera_anticipos.tercero_nombre IS 'Nombre del cliente/proveedor (desnormalizado para consultas rápidas)';
COMMENT ON COLUMN cartera.cartera_anticipos.monto_original IS 'Valor original del anticipo';
COMMENT ON COLUMN cartera.cartera_anticipos.saldo_disponible IS 'Valor restante por cruzar con facturas';

-- ============================================================================
-- 7. MÓDULO: FACTURACIÓN ELECTRÓNICA
-- ============================================================================

-- Tabla: facturacion.comprobantes_electronicos
CREATE TABLE facturacion.comprobantes_electronicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES seguridad.usuarios(id),
    tipo_comprobante tipo_comprobante_sri NOT NULL,
    secuencial INTEGER NOT NULL,
    clave_acceso VARCHAR(49) UNIQUE,
    numero_autorizacion VARCHAR(49),
    fecha_emision DATE NOT NULL,
    fecha_autorizacion TIMESTAMP,
    cliente_id UUID NOT NULL REFERENCES directorio.terceros(id),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_identificacion VARCHAR(20) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    estado estado_comprobante DEFAULT 'BORRADOR',
    ambiente_sri INTEGER DEFAULT 1,
    tipo_emision_sri INTEGER DEFAULT 1,
    direccion_partida TEXT,
    direccion_destino TEXT,
    transportista_nombre VARCHAR(255),
    placa_vehiculo VARCHAR(20),
    xml_firmado TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, tipo_comprobante, secuencial)
);

COMMENT ON TABLE facturacion.comprobantes_electronicos IS 'Comprobantes electrónicos (Facturación SRI).';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.tipo_comprobante IS 'Tipo: FACTURA, NOTA_CREDITO, GUIA_REMISION, etc.';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.secuencial IS 'Número secuencial del comprobante (incremental por tipo y empresa)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.clave_acceso IS 'Clave de acceso de 49 dígitos (SRI)';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.numero_autorizacion IS 'Número de autorización otorgado por el SRI';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.estado IS 'Estado del proceso: BORRADOR -> PENDIENTE -> AUTORIZADO';
COMMENT ON COLUMN facturacion.comprobantes_electronicos.xml_firmado IS 'Contenido XML firmado (Base64 o texto raw)';

-- Tabla: facturacion.comprobantes_detalles
CREATE TABLE facturacion.comprobantes_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID NOT NULL REFERENCES facturacion.comprobantes_electronicos(id) ON DELETE CASCADE,
    codigo_principal VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    descuento NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL
);

COMMENT ON COLUMN facturacion.comprobantes_detalles.total IS 'Subtotal de línea (Cantidad * Precio - Descuento)';

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

COMMENT ON TABLE facturacion.transportistas IS 'Catálogo de transportistas para guías de remisión.';

-- ============================================================================
-- 8. MÓDULO: AUDITORÍA
-- ============================================================================

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
    severidad severidad_log DEFAULT 'INFO',
    datos_antes JSONB,
    datos_despues JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE auditoria.auditoria_logs IS 'Bitácora centralizada de eventos del sistema.';
COMMENT ON COLUMN auditoria.auditoria_logs.empresa_id IS 'Empresa donde ocurrió el evento';
COMMENT ON COLUMN auditoria.auditoria_logs.modulo IS 'Módulo funcional origen del evento (ej: INVENTARIO)';
COMMENT ON COLUMN auditoria.auditoria_logs.evento IS 'Nombre del evento (ej: CREACION_PRODUCTO, LOGIN_FALLIDO)';
COMMENT ON COLUMN auditoria.auditoria_logs.usuario_id IS 'Usuario que provocó el evento';
COMMENT ON COLUMN auditoria.auditoria_logs.ip_address IS 'Dirección IP del cliente';
COMMENT ON COLUMN auditoria.auditoria_logs.severidad IS 'Nivel de la bitácora: INFO, WARNING, ERROR';
COMMENT ON COLUMN auditoria.auditoria_logs.datos_antes IS 'Snapshot de los datos antes del cambio (JSON)';
COMMENT ON COLUMN auditoria.auditoria_logs.datos_despues IS 'Snapshot de los datos después del cambio (JSON)';

-- ============================================================================
-- TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Función genérica para auditoría
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

-- Crear triggers de auditoría para tablas críticas
CREATE TRIGGER audit_plan_cuentas AFTER INSERT OR UPDATE OR DELETE ON contabilidad.plan_cuentas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_asientos AFTER INSERT OR UPDATE OR DELETE ON contabilidad.asientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_productos AFTER INSERT OR UPDATE OR DELETE ON inventario.productos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_kardex_movimientos AFTER INSERT OR UPDATE OR DELETE ON inventario.kardex_movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_empleados AFTER INSERT OR UPDATE OR DELETE ON nomina.empleados FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_nomina_roles AFTER INSERT OR UPDATE OR DELETE ON nomina.nomina_roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_bancos_cuentas AFTER INSERT OR UPDATE OR DELETE ON bancos.bancos_cuentas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_bancos_movimientos AFTER INSERT OR UPDATE OR DELETE ON bancos.bancos_movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_comprobantes_electronicos AFTER INSERT OR UPDATE OR DELETE ON facturacion.comprobantes_electronicos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- ÍNDICES BÁSICOS (Los detallados están en postgresql_indexes.sql)
-- ============================================================================

-- Índices multi-tenant (empresa_id debe estar en todas las consultas)
CREATE INDEX idx_plan_cuentas_empresa ON contabilidad.plan_cuentas(empresa_id);
CREATE INDEX idx_asientos_empresa ON contabilidad.asientos(empresa_id);
CREATE INDEX idx_productos_empresa ON inventario.productos(empresa_id);
CREATE INDEX idx_empleados_empresa ON nomina.empleados(empresa_id);
CREATE INDEX idx_bancos_cuentas_empresa ON bancos.bancos_cuentas(empresa_id);
CREATE INDEX idx_comprobantes_empresa ON facturacion.comprobantes_electronicos(empresa_id);

-- ============================================================================
-- COMENTARIOS GENERALES
-- ============================================================================

COMMENT ON DATABASE ecucontabledb IS 'Base de datos del sistema EcuContable Pro - Sistema contable multi-tenant para Ecuador.';

-- ============================================================================
-- 9. MÓDULO: CONFIGURACIÓN Y PARÁMETROS
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

-- Tabla: configuracion.puntos_emision
CREATE TABLE configuracion.puntos_emision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sucursal_id UUID NOT NULL REFERENCES configuracion.sucursales(id) ON DELETE CASCADE,
    codigo VARCHAR(3) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    UNIQUE(sucursal_id, codigo)
);

-- Tabla: configuracion.puntos_emision_secuenciales
-- Para manejar los secuenciales por tipo de comprobante en cada punto de emisión
CREATE TABLE configuracion.puntos_emision_secuenciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    punto_emision_id UUID NOT NULL REFERENCES configuracion.puntos_emision(id) ON DELETE CASCADE,
    tipo_comprobante tipo_comprobante_sri NOT NULL,
    secuencial_actual INTEGER DEFAULT 1,
    UNIQUE(punto_emision_id, tipo_comprobante)
);

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

-- Tabla: configuracion.parametros
CREATE TABLE configuracion.parametros (
    empresa_id UUID PRIMARY KEY REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    sbu NUMERIC(15,2) DEFAULT 460,
    iva NUMERIC(5,2) DEFAULT 15,
    max_consumidor_final NUMERIC(15,2) DEFAULT 50,
    cuenta_caja VARCHAR(50),
    cuenta_iva_ventas VARCHAR(50),
    cuenta_iva_compras VARCHAR(50),
    cuenta_ret_renta_por_pagar VARCHAR(50),
    cuenta_cxc_clientes VARCHAR(50),
    cuenta_anticipo_clientes VARCHAR(50),
    cuenta_cxp_proveedores VARCHAR(50),
    cuenta_anticipo_proveedores VARCHAR(50),
    fecha_cierre DATE,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES seguridad.usuarios(id)
);

COMMENT ON TABLE configuracion.parametros IS 'Parámetros contables y de configuración por empresa.';

-- Tabla: configuracion.sri_certificados
CREATE TABLE configuracion.sri_certificados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    ambiente VARCHAR(20) NOT NULL CHECK (ambiente IN ('PRUEBAS','PRODUCCION')),
    p12_certificado BYTEA, -- Digital certificate file stored as binary
    clave_certificado VARCHAR(255), -- Certificate password (encrypt in production)
    url_recepcion TEXT,
    url_autorizacion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES seguridad.usuarios(id),
    updated_by UUID REFERENCES seguridad.usuarios(id),
    -- Only one active config per empresa+ambiente
    UNIQUE(empresa_id, ambiente, activo)
);

COMMENT ON TABLE configuracion.sri_certificados IS 'Almacena certificados digitales P12 y configuración de endpoints del SRI para facturación electrónica';
COMMENT ON COLUMN configuracion.sri_certificados.ambiente IS 'Ambiente SRI: PRUEBAS o PRODUCCION';
COMMENT ON COLUMN configuracion.sri_certificados.p12_certificado IS 'Certificado digital P12 almacenado como BYTEA';
COMMENT ON COLUMN configuracion.sri_certificados.clave_certificado IS 'Contraseña del certificado (debe encriptarse en producción)';



-- ===========================================================================
-- MÓDULO: CATÁLOGOS DEL SISTEMA Y SRI
-- ============================================================================

-- Tabla: configuracion.catalogos_tipos
CREATE TABLE configuracion.catalogos_tipos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    sistema BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE configuracion.catalogos_tipos IS 'Definición de los tipos de catálogos disponibles en el sistema y SRI.';

-- Tabla: configuracion.categoryos_items
CREATE TABLE configuracion.catalogos_items (
    id SERIAL PRIMARY KEY,
    catalogo_codigo VARCHAR(50) NOT NULL REFERENCES configuracion.catalogos_tipos(codigo) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT,
    padre_codigo VARCHAR(20),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(catalogo_codigo, codigo)
);

COMMENT ON TABLE configuracion.catalogos_items IS 'Items individuales de cada catálogo. Aquí residen los códigos del SRI.';
COMMENT ON COLUMN configuracion.catalogos_items.codigo IS 'Código técnico (ej: 01 para Factura).';
COMMENT ON COLUMN configuracion.catalogos_items.valor IS 'Descripción legible para el usuario.';

-- Índices
CREATE INDEX idx_catalogos_items_catalogo ON configuracion.catalogos_items(catalogo_codigo);
CREATE INDEX idx_catalogos_items_codigo ON configuracion.catalogos_items(codigo);
CREATE INDEX idx_catalogos_items_activo ON configuracion.catalogos_items(catalogo_codigo, activo);

-- Vista de acceso rápido para catálogos SRI
CREATE OR REPLACE VIEW v_catalogos_sri AS
SELECT 
    ct.codigo as tipo_catalogo,
    ci.codigo as codigo_sri,
    ci.valor as descripcion,
    ci.activo
FROM configuracion.catalogos_items ci
JOIN configuracion.catalogos_tipos ct ON ci.catalogo_codigo = ct.codigo
WHERE ct.codigo LIKE 'SRI_%';

-- ============================================================================
-- MÓDULO: CAJA CHICA
-- ============================================================================

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
    tipo VARCHAR(20) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero)
);

COMMENT ON TABLE caja_chica.movimientos IS 'Registro de movimientos (vales) de caja chica.';

-- Triggers
CREATE TRIGGER audit_caja_chica AFTER INSERT OR UPDATE OR DELETE ON caja_chica.cajas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_caja_chica_vales AFTER INSERT OR UPDATE OR DELETE ON caja_chica.movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Índices
CREATE INDEX idx_caja_chica_empresa ON caja_chica.cajas(empresa_id);
CREATE INDEX idx_caja_chica_vales_caja ON caja_chica.movimientos(caja_id);
CREATE INDEX idx_caja_chica_vales_empresa ON caja_chica.movimientos(empresa_id);

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

-- Triggers
CREATE TRIGGER audit_documentos_pendientes AFTER INSERT OR UPDATE OR DELETE ON cartera.documentos_pendientes FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_anticipos AFTER INSERT OR UPDATE OR DELETE ON cartera.anticipos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_transacciones AFTER INSERT OR UPDATE OR DELETE ON cartera.transacciones FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Índices
CREATE INDEX idx_documentos_pendientes_empresa ON cartera.documentos_pendientes(empresa_id);
CREATE INDEX idx_documentos_pendientes_tercero ON cartera.documentos_pendientes(tercero_id);
CREATE INDEX idx_documentos_pendientes_tipo ON cartera.documentos_pendientes(tipo);
CREATE INDEX idx_anticipos_empresa ON cartera.anticipos(empresa_id);
CREATE INDEX idx_anticipos_tercero ON cartera.anticipos(tercero_id);
CREATE INDEX idx_transacciones_empresa ON cartera.transacciones(empresa_id);
CREATE INDEX idx_transacciones_documento ON cartera.transacciones(documento_id);

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

CREATE TABLE impuestos.ats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES seguridad.empresas(id) ON DELETE CASCADE,
    periodo VARCHAR(7) NOT NULL, -- YYYY-MM
    estado VARCHAR(20) DEFAULT 'GENERADO',
    xml_data TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, periodo)
);

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

CREATE TABLE IF NOT EXISTS compras.compras_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL REFERENCES compras.compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES inventario.productos(id),
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(18,2) NOT NULL,
    precio_unitario NUMERIC(18,2) NOT NULL,
    descuento NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS compras.ordenes_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID NOT NULL REFERENCES compras.ordenes(id) ON DELETE CASCADE,
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad NUMERIC(18,2) NOT NULL,
    precio_unitario NUMERIC(18,2) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    graba_iva BOOLEAN DEFAULT true
);

-- ============================================================================
-- Triggers de auditoría para las nuevas tablas
CREATE TRIGGER audit_activos_fijos AFTER INSERT OR UPDATE OR DELETE ON activos.activos_fijos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_compras AFTER INSERT OR UPDATE OR DELETE ON compras.compras FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_compras_ordenes AFTER INSERT OR UPDATE OR DELETE ON compras.ordenes FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

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

CREATE INDEX idx_buzon_empresa ON buzon.comprobantes_recibidos(empresa_id);
CREATE INDEX idx_buzon_ruc_emisor ON buzon.comprobantes_recibidos(ruc_emisor);
CREATE INDEX idx_buzon_estado ON buzon.comprobantes_recibidos(estado);

CREATE TRIGGER audit_buzon_comprobantes AFTER INSERT OR UPDATE OR DELETE ON buzon.comprobantes_recibidos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
