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
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda full-text y trigramas

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

-- Tabla: empresas
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(13) NOT NULL UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    obligado_contabilidad BOOLEAN DEFAULT true,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE empresas IS 'Empresas del sistema (multi-tenant). Cada empresa es un tenant aislado.';
COMMENT ON COLUMN empresas.id IS 'Identificador único (UUID) de la empresa';
COMMENT ON COLUMN empresas.ruc IS 'Registro Único de Contribuyentes (13 dígitos). Debe ser único en el sistema';
COMMENT ON COLUMN empresas.razon_social IS 'Razón social legal de la empresa según el RUC';
COMMENT ON COLUMN empresas.nombre_comercial IS 'Nombre comercial o de fantasía de la empresa';
COMMENT ON COLUMN empresas.direccion IS 'Dirección matriz de la empresa';
COMMENT ON COLUMN empresas.telefono IS 'Teléfono de contacto principal';
COMMENT ON COLUMN empresas.email IS 'Correo electrónico para notificaciones del sistema';
COMMENT ON COLUMN empresas.logo_url IS 'URL o path del logo de la empresa';
COMMENT ON COLUMN empresas.obligado_contabilidad IS 'Indica si la empresa está obligada a llevar contabilidad (TRUE/FALSE)';
COMMENT ON COLUMN empresas.activa IS 'Estado de la empresa. FALSE impide el acceso a sus usuarios';
COMMENT ON COLUMN empresas.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN empresas.updated_at IS 'Fecha y hora de última actualización';

-- Tabla: usuarios
CREATE TABLE usuarios (
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

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con credenciales de acceso.';
COMMENT ON COLUMN usuarios.id IS 'Identificador único (UUID) del usuario';
COMMENT ON COLUMN usuarios.email IS 'Correo electrónico único usado para login';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash SHA-256 de la contraseña del usuario';
COMMENT ON COLUMN usuarios.rol IS 'Rol global del usuario: ADMIN, CONTADOR, OPERADOR, CONSULTA';
COMMENT ON COLUMN usuarios.activo IS 'Estado del usuario. FALSE impide el login';
COMMENT ON COLUMN usuarios.ultimo_acceso IS 'Timestamp del último inicio de sesión exitoso';
COMMENT ON COLUMN usuarios.created_at IS 'Fecha de registro del usuario';
COMMENT ON COLUMN usuarios.updated_at IS 'Fecha de última modificación de datos del usuario';

-- Tabla: usuarios_empresas
CREATE TABLE usuarios_empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(usuario_id, empresa_id)
);

COMMENT ON TABLE usuarios_empresas IS 'Relación Many-to-Many entre Usuarios y Empresas (Multi-tenant).';
COMMENT ON COLUMN usuarios_empresas.id IS 'Identificador único de la relación';
COMMENT ON COLUMN usuarios_empresas.usuario_id IS 'Referencia al usuario';
COMMENT ON COLUMN usuarios_empresas.empresa_id IS 'Referencia a la empresa a la que tiene acceso';
COMMENT ON COLUMN usuarios_empresas.activo IS 'Permite deshabilitar el acceso a una empresa específica sin desactivar el usuario global';
COMMENT ON COLUMN usuarios_empresas.created_at IS 'Fecha de asignación del permiso';

-- ============================================================================
-- 2. MÓDULO: CONTABILIDAD
-- ============================================================================

-- Tabla: plan_cuentas
CREATE TABLE plan_cuentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
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

COMMENT ON TABLE plan_cuentas IS 'Plan de cuentas contables. Estructura jerárquica para la contabilidad.';
COMMENT ON COLUMN plan_cuentas.id IS 'Identificador único de la cuenta contable';
COMMENT ON COLUMN plan_cuentas.empresa_id IS 'Empresa a la que pertenece la cuenta (tenant)';
COMMENT ON COLUMN plan_cuentas.usuario_id IS 'Usuario que creó o modificó la cuenta por última vez';
COMMENT ON COLUMN plan_cuentas.codigo IS 'Código contable jerárquico (ej: 1.1.01). Único por empresa';
COMMENT ON COLUMN plan_cuentas.nombre IS 'Nombre descriptivo de la cuenta';
COMMENT ON COLUMN plan_cuentas.tipo IS 'Clasificación: ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO';
COMMENT ON COLUMN plan_cuentas.nivel IS 'Profundidad en el árbol jerárquico (calculado por puntos + 1)';
COMMENT ON COLUMN plan_cuentas.saldo IS 'Saldo acumulado actual de la cuenta. Se actualiza con los asientos mayorizados';
COMMENT ON COLUMN plan_cuentas.activa IS 'Indica si la cuenta se puede usar en nuevos asientos';

-- Tabla: centros_costos
CREATE TABLE centros_costos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    nivel INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE centros_costos IS 'Centros de costos para contabilidad analítica / distribución de gastos.';
COMMENT ON COLUMN centros_costos.id IS 'Identificador único del centro de costos';
COMMENT ON COLUMN centros_costos.empresa_id IS 'Empresa propietaria del centro de costos';
COMMENT ON COLUMN centros_costos.codigo IS 'Código identificador (ej: CC-01-02)';
COMMENT ON COLUMN centros_costos.nombre IS 'Nombre del centro de costos (ej: Departamento TI)';
COMMENT ON COLUMN centros_costos.nivel IS 'Nivel jerárquico del centro de costos';
COMMENT ON COLUMN centros_costos.activo IS 'Estado del centro de costos';

-- Tabla: asientos_cab
CREATE TABLE asientos_cab (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    numero VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    glosa TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'DIARIO',
    estado estado_asiento DEFAULT 'BORRADOR',
    centro_costo_id UUID REFERENCES centros_costos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, numero)
);

COMMENT ON TABLE asientos_cab IS 'Cabecera de los asientos contables (Diario General).';
COMMENT ON COLUMN asientos_cab.id IS 'Identificador único del asiento';
COMMENT ON COLUMN asientos_cab.empresa_id IS 'Empresa a la que pertenece el asiento';
COMMENT ON COLUMN asientos_cab.usuario_id IS 'Usuario que creó el asiento';
COMMENT ON COLUMN asientos_cab.numero IS 'Número secuencial o código del asiento. Único por empresa';
COMMENT ON COLUMN asientos_cab.fecha IS 'Fecha contable del registro';
COMMENT ON COLUMN asientos_cab.glosa IS 'Descripción o detalle general del asiento';
COMMENT ON COLUMN asientos_cab.tipo IS 'Tipo de asiento: DIARIO, INGRESO, EGRESO, AJUSTE, CIERRE';
COMMENT ON COLUMN asientos_cab.estado IS 'Estado del ciclo de vida: BORRADOR, MAYORIZADO (afecta saldos), ANULADO';
COMMENT ON COLUMN asientos_cab.centro_costo_id IS 'Referencia opcional a un centro de costos principal';

-- Tabla: asientos_det
CREATE TABLE asientos_det (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asiento_id UUID NOT NULL REFERENCES asientos_cab(id) ON DELETE CASCADE,
    cuenta_codigo VARCHAR(50) NOT NULL,
    debe NUMERIC(18,2) DEFAULT 0,
    haber NUMERIC(18,2) DEFAULT 0,
    concepto TEXT
);

COMMENT ON TABLE asientos_det IS 'Detalle de líneas del asiento contable (Movimientos).';
COMMENT ON COLUMN asientos_det.id IS 'Identificador único de la línea de detalle';
COMMENT ON COLUMN asientos_det.asiento_id IS 'Referencia al asiento cabecera';
COMMENT ON COLUMN asientos_det.cuenta_codigo IS 'Código de la cuenta contable afectada (Desnormalizado para eficiencia histórica)';
COMMENT ON COLUMN asientos_det.debe IS 'Monto en la columna del DEBE (Débito)';
COMMENT ON COLUMN asientos_det.haber IS 'Monto en la columna del HABER (Crédito)';
COMMENT ON COLUMN asientos_det.concepto IS 'Descripción específica de la línea (opcional)';

-- ============================================================================
-- 3. MÓDULO: DIRECTORIO (TERCEROS)
-- ============================================================================

-- Tabla: terceros
CREATE TABLE terceros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
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
    created_by UUID REFERENCES usuarios(id),
    updated_by UUID REFERENCES usuarios(id),
    
    -- Constraints
    UNIQUE(empresa_id, identificacion),
    CONSTRAINT check_tipo_identificacion CHECK (tipo_identificacion IN ('04', '05', '06', '07', '08')),
    CONSTRAINT check_tipo_tercero CHECK (tipo_tercero IN ('CLIENTE', 'PROVEEDOR', 'AMBOS', 'EMPLEADO', 'OTRO'))
);

COMMENT ON TABLE terceros IS 'Catálogo unificado de terceros: clientes, proveedores, empleados y otros contactos comerciales.';
COMMENT ON COLUMN terceros.id IS 'Identificador único (UUID) del tercero';
COMMENT ON COLUMN terceros.empresa_id IS 'Empresa a la que pertenece el tercero (tenant)';
COMMENT ON COLUMN terceros.tipo_identificacion IS 'Código SRI del tipo de identificación: 04=RUC, 05=Cédula, 06=Pasaporte, 07=Consumidor Final, 08=Exterior';
COMMENT ON COLUMN terceros.identificacion IS 'Número de identificación (RUC, cédula, pasaporte, etc.). Único por empresa';
COMMENT ON COLUMN terceros.razon_social IS 'Razón social o nombre legal completo del tercero';
COMMENT ON COLUMN terceros.nombre_comercial IS 'Nombre comercial o de fantasía (opcional)';
COMMENT ON COLUMN terceros.tipo_tercero IS 'Clasificación del tercero: CLIENTE, PROVEEDOR, AMBOS (cliente y proveedor), EMPLEADO, OTRO';
COMMENT ON COLUMN terceros.es_contribuyente_especial IS 'Indica si el tercero es contribuyente especial según el SRI (aplica descuentos adicionales)';
COMMENT ON COLUMN terceros.obligado_contabilidad IS 'Indica si el tercero está obligado a llevar contabilidad';
COMMENT ON COLUMN terceros.email IS 'Correo electrónico principal de contacto';
COMMENT ON COLUMN terceros.telefono IS 'Teléfono fijo de contacto';
COMMENT ON COLUMN terceros.celular IS 'Número de celular/móvil de contacto';
COMMENT ON COLUMN terceros.direccion IS 'Dirección completa del tercero';
COMMENT ON COLUMN terceros.provincia IS 'Provincia de ubicación';
COMMENT ON COLUMN terceros.ciudad IS 'Ciudad de ubicación';
COMMENT ON COLUMN terceros.codigo_postal IS 'Código postal';
COMMENT ON COLUMN terceros.limite_credito IS 'Monto máximo de crédito permitido para el tercero (si es cliente)';
COMMENT ON COLUMN terceros.dias_credito IS 'Plazo de pago en días otorgado al tercero';
COMMENT ON COLUMN terceros.descuento_porcentaje IS 'Porcentaje de descuento comercial aplicable automáticamente';
COMMENT ON COLUMN terceros.cuenta_contable_cxc IS 'Código de cuenta contable de Cuentas por Cobrar (si es cliente)';
COMMENT ON COLUMN terceros.cuenta_contable_cxp IS 'Código de cuenta contable de Cuentas por Pagar (si es proveedor)';
COMMENT ON COLUMN terceros.activo IS 'Estado del tercero. FALSE oculta el tercero de las listas activas';
COMMENT ON COLUMN terceros.created_at IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN terceros.updated_at IS 'Fecha y hora de última modificación';
COMMENT ON COLUMN terceros.created_by IS 'Usuario que creó el registro';
COMMENT ON COLUMN terceros.updated_by IS 'Usuario que realizó la última modificación';

-- Índices para mejorar rendimiento de búsquedas
CREATE INDEX idx_terceros_empresa ON terceros(empresa_id);
CREATE INDEX idx_terceros_identificacion ON terceros(identificacion);
CREATE INDEX idx_terceros_tipo ON terceros(tipo_tercero);
CREATE INDEX idx_terceros_activo ON terceros(activo);
CREATE INDEX idx_terceros_razon_social ON terceros USING gin(to_tsvector('spanish', razon_social));

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_terceros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_terceros_updated_at
    BEFORE UPDATE ON terceros
    FOR EACH ROW
    EXECUTE FUNCTION update_terceros_updated_at();

-- ============================================================================
-- 4. MÓDULO: INVENTARIO
-- ============================================================================

-- Tabla: categorias_producto
CREATE TABLE categorias_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cuenta_inventario VARCHAR(50),
    cuenta_costo_venta VARCHAR(50),
    cuenta_venta VARCHAR(50),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE categorias_producto IS 'Categorización de productos para organización y configuración contable automática.';
COMMENT ON COLUMN categorias_producto.id IS 'Identificador único de la categoría';
COMMENT ON COLUMN categorias_producto.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN categorias_producto.nombre IS 'Nombre de la categoría';
COMMENT ON COLUMN categorias_producto.descripcion IS 'Descripción adicional';
COMMENT ON COLUMN categorias_producto.cuenta_inventario IS 'Código cuenta contable de activo (Inventario) por defecto';
COMMENT ON COLUMN categorias_producto.cuenta_costo_venta IS 'Código cuenta contable de costo (Costo de Venta) por defecto';
COMMENT ON COLUMN categorias_producto.cuenta_venta IS 'Código cuenta contable de ingreso (Ventas) por defecto';
COMMENT ON COLUMN categorias_producto.activa IS 'Estado de la categoría';

-- Tabla: bodegas
CREATE TABLE bodegas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
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

COMMENT ON TABLE bodegas IS 'Almacenes físicos o lógicos donde se guardan productos.';
COMMENT ON COLUMN bodegas.id IS 'Identificador único de la bodega';
COMMENT ON COLUMN bodegas.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN bodegas.codigo IS 'Código interno de la bodega (ej: BOD-01)';
COMMENT ON COLUMN bodegas.nombre IS 'Nombre descriptivo de la bodega';
COMMENT ON COLUMN bodegas.responsable IS 'Nombre de la persona responsable del almacén';
COMMENT ON COLUMN bodegas.ubicacion IS 'Dirección física o referencia de ubicación';
COMMENT ON COLUMN bodegas.activa IS 'Estado de la bodega. FALSE impide nuevos movimientos';

-- Tabla: productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    codigo_principal VARCHAR(50) NOT NULL,
    codigo_auxiliar VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    stock_actual NUMERIC(18,4) DEFAULT 0,
    stock_minimo NUMERIC(18,4) DEFAULT 0,
    costo_promedio NUMERIC(18,6) DEFAULT 0,
    precio_venta NUMERIC(18,6) NOT NULL,
    graba_iva BOOLEAN DEFAULT true,
    categoria_id UUID REFERENCES categorias_producto(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, codigo_principal)
);

COMMENT ON TABLE productos IS 'Catálogo maestro de productos y servicios.';
COMMENT ON COLUMN productos.id IS 'Identificador único del producto';
COMMENT ON COLUMN productos.empresa_id IS 'Empresa propietaria';
COMMENT ON COLUMN productos.usuario_id IS 'Usuario creador/modificador';
COMMENT ON COLUMN productos.codigo_principal IS 'Código principal único del producto';
COMMENT ON COLUMN productos.codigo_auxiliar IS 'Código secundario o de barras (opcional)';
COMMENT ON COLUMN productos.nombre IS 'Nombre comercial del producto';
COMMENT ON COLUMN productos.stock_actual IS 'Cantidad actual en existencia (suma de todas las bodegas)';
COMMENT ON COLUMN productos.stock_minimo IS 'Cantidad mínima para alertas de reabastecimiento';
COMMENT ON COLUMN productos.costo_promedio IS 'Costo unitario promedio ponderado. Se actualiza en cada entrada';
COMMENT ON COLUMN productos.precio_venta IS 'Precio de venta al público base (antes de impuestos)';
COMMENT ON COLUMN productos.graba_iva IS 'Indica si el producto grava IVA (TRUE) o es tarifa 0% (FALSE)';
COMMENT ON COLUMN productos.categoria_id IS 'Referencia a la categoría del producto';
COMMENT ON COLUMN productos.activo IS 'Estado del producto';

-- Tabla: kardex_movimientos
CREATE TABLE kardex_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    bodega_id UUID NOT NULL REFERENCES bodegas(id),
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

COMMENT ON TABLE kardex_movimientos IS 'Registro histórico de movimientos de inventario (Kardex).';
COMMENT ON COLUMN kardex_movimientos.id IS 'Identificador único del movimiento';
COMMENT ON COLUMN kardex_movimientos.empresa_id IS 'Empresa tenant';
COMMENT ON COLUMN kardex_movimientos.usuario_id IS 'Usuario que realizó el movimiento';
COMMENT ON COLUMN kardex_movimientos.producto_id IS 'Producto afectado';
COMMENT ON COLUMN kardex_movimientos.bodega_id IS 'Bodega donde se realizó el movimiento';
COMMENT ON COLUMN kardex_movimientos.tipo IS 'Tipo: ENTRADA, SALIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO';
COMMENT ON COLUMN kardex_movimientos.cantidad IS 'Cantidad movida (siempre positiva)';
COMMENT ON COLUMN kardex_movimientos.costo_unitario IS 'Costo unitario del producto en el momento del movimiento';
COMMENT ON COLUMN kardex_movimientos.stock_anterior IS 'Stock que tenía el producto antes de este movimiento';
COMMENT ON COLUMN kardex_movimientos.stock_resultante IS 'Stock que quedó después de este movimiento';
COMMENT ON COLUMN kardex_movimientos.referencia IS 'Documento de respaldo (Numero factura, etc.)';
COMMENT ON COLUMN kardex_movimientos.fecha IS 'Fecha contable del movimiento';

-- ============================================================================
-- 4. MÓDULO: NÓMINA
-- ============================================================================

-- Tabla: empleados
CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
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

COMMENT ON TABLE empleados IS 'Registro maestro de empleados para nómina.';
COMMENT ON COLUMN empleados.id IS 'Identificador único del empleado';
COMMENT ON COLUMN empleados.cedula IS 'Número de cédula o identificación (único por empresa)';
COMMENT ON COLUMN empleados.nombres IS 'Nombres del empleado';
COMMENT ON COLUMN empleados.apellidos IS 'Apellidos del empleado';
COMMENT ON COLUMN empleados.sueldo_base IS 'Sueldo base contractual del empleado';
COMMENT ON COLUMN empleados.tipo_contrato IS 'Tipo de relación laboral';
COMMENT ON COLUMN empleados.activo IS 'Si el empleado está activo en la nómina';

-- Tabla: nomina_roles
CREATE TABLE nomina_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    periodo VARCHAR(7) NOT NULL,
    total_ingresos NUMERIC(18,2) NOT NULL,
    total_egresos NUMERIC(18,2) NOT NULL,
    neto_pagar NUMERIC(18,2) NOT NULL,
    estado estado_rol_pago DEFAULT 'BORRADOR',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(empresa_id, empleado_id, periodo)
);

COMMENT ON TABLE nomina_roles IS 'Roles de pago generados por periodo.';
COMMENT ON COLUMN nomina_roles.periodo IS 'Periodo de pago en formato YYYY-MM (ej: 2024-01)';
COMMENT ON COLUMN nomina_roles.total_ingresos IS 'Suma de sueldo, horas extra, bonos, etc.';
COMMENT ON COLUMN nomina_roles.total_egresos IS 'Suma de aportes IESS, préstamos, anticipos, multas';
COMMENT ON COLUMN nomina_roles.neto_pagar IS 'Valor final a recibir (Ingresos - Egresos)';
COMMENT ON COLUMN nomina_roles.estado IS 'Estado del rol: BORRADOR, PENDIENTE, PAGADO';

-- ============================================================================
-- 5. MÓDULO: BANCOS
-- ============================================================================

-- Tabla: bancos_cuentas
CREATE TABLE bancos_cuentas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
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

COMMENT ON TABLE bancos_cuentas IS 'Registro de cuentas bancarias de la empresa.';
COMMENT ON COLUMN bancos_cuentas.numero_cuenta IS 'Número de cuenta bancaria real';
COMMENT ON COLUMN bancos_cuentas.nombre IS 'Nombre descriptivo de la cuenta (ej: Banco Pichincha Principal)';
COMMENT ON COLUMN bancos_cuentas.banco IS 'Nombre de la institución financiera';
COMMENT ON COLUMN bancos_cuentas.saldo_actual IS 'Saldo contable actual de la cuenta';
COMMENT ON COLUMN bancos_cuentas.moneda IS 'Código ISO de la moneda (USD, EUR)';

-- Tabla: bancos_movimientos
CREATE TABLE bancos_movimientos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    cuenta_id UUID NOT NULL REFERENCES bancos_cuentas(id) ON DELETE CASCADE,
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

COMMENT ON TABLE bancos_movimientos IS 'Transacciones bancarias (Ingresos/Egresos).';
COMMENT ON COLUMN bancos_movimientos.cuenta_id IS 'Referencia a la cuenta bancaria afectada';
COMMENT ON COLUMN bancos_movimientos.fecha IS 'Fecha de la transacción';
COMMENT ON COLUMN bancos_movimientos.tipo IS 'Tipo: CHEQUE, TRANSFERENCIA, DEPOSITO, NOTA_DB/CR';
COMMENT ON COLUMN bancos_movimientos.referencia IS 'Número de cheque o comprobante bancario';
COMMENT ON COLUMN bancos_movimientos.monto IS 'Valor de la transacción';
COMMENT ON COLUMN bancos_movimientos.es_egreso IS 'TRUE si disminuye el saldo, FALSE si aumenta';
COMMENT ON COLUMN bancos_movimientos.conciliado IS 'Indica si el movimiento ya fue conciliado contra el extracto bancario';

-- ============================================================================
-- 6. MÓDULO: CARTERA (CxC / CxP)
-- ============================================================================

-- Tabla: cartera_documentos
CREATE TABLE cartera_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_cartera tipo_cartera NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    nro_comprobante VARCHAR(50) NOT NULL,
    tercero_id UUID NOT NULL,
    tercero_nombre VARCHAR(255) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    monto_total NUMERIC(18,2) NOT NULL,
    saldo_pendiente NUMERIC(18,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cartera_documentos IS 'Documentos de Cuentas por Cobrar y Pagar.';
COMMENT ON COLUMN cartera_documentos.tipo_cartera IS 'CXC (Clientes) o CXP (Proveedores)';
COMMENT ON COLUMN cartera_documentos.tercero_id IS 'ID del cliente o proveedor asociado';
COMMENT ON COLUMN cartera_documentos.nro_comprobante IS 'Número de factura o documento físico';
COMMENT ON COLUMN cartera_documentos.fecha_vencimiento IS 'Fecha límite de pago (para cálculo de aging)';
COMMENT ON COLUMN cartera_documentos.saldo_pendiente IS 'Valor pendiente de cobro/pago (monto_total - abonos)';

-- Tabla: cartera_anticipos
CREATE TABLE cartera_anticipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_cartera tipo_cartera NOT NULL,
    fecha DATE NOT NULL,
    tercero_id UUID NOT NULL,
    tercero_nombre VARCHAR(255) NOT NULL,
    referencia VARCHAR(100),
    monto_original NUMERIC(18,2) NOT NULL,
    saldo_disponible NUMERIC(18,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE cartera_anticipos IS 'Anticipos recibidos o entregados pendientes de cruzar.';
COMMENT ON COLUMN cartera_anticipos.tercero_nombre IS 'Nombre del cliente/proveedor (desnormalizado para consultas rápidas)';
COMMENT ON COLUMN cartera_anticipos.monto_original IS 'Valor original del anticipo';
COMMENT ON COLUMN cartera_anticipos.saldo_disponible IS 'Valor restante por cruzar con facturas';

-- ============================================================================
-- 7. MÓDULO: FACTURACIÓN ELECTRÓNICA
-- ============================================================================

-- Tabla: comprobantes_electronicos
CREATE TABLE comprobantes_electronicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo_comprobante tipo_comprobante_sri NOT NULL,
    secuencial INTEGER NOT NULL,
    clave_acceso VARCHAR(49) UNIQUE,
    numero_autorizacion VARCHAR(49),
    fecha_emision DATE NOT NULL,
    fecha_autorizacion TIMESTAMP,
    cliente_id UUID NOT NULL,
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

COMMENT ON TABLE comprobantes_electronicos IS 'Comprobantes electrónicos (Facturación SRI).';
COMMENT ON COLUMN comprobantes_electronicos.tipo_comprobante IS 'Tipo: FACTURA, NOTA_CREDITO, GUIA_REMISION, etc.';
COMMENT ON COLUMN comprobantes_electronicos.secuencial IS 'Número secuencial del comprobante (incremental por tipo y empresa)';
COMMENT ON COLUMN comprobantes_electronicos.clave_acceso IS 'Clave de acceso de 49 dígitos (SRI)';
COMMENT ON COLUMN comprobantes_electronicos.numero_autorizacion IS 'Número de autorización otorgado por el SRI';
COMMENT ON COLUMN comprobantes_electronicos.estado IS 'Estado del proceso: BORRADOR -> PENDIENTE -> AUTORIZADO';
COMMENT ON COLUMN comprobantes_electronicos.xml_firmado IS 'Contenido XML firmado (Base64 o texto raw)';

-- Tabla: comprobantes_detalles
CREATE TABLE comprobantes_detalles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comprobante_id UUID NOT NULL REFERENCES comprobantes_electronicos(id) ON DELETE CASCADE,
    codigo_principal VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    descuento NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL
);

COMMENT ON TABLE comprobantes_detalles IS 'Detalle de items de los comprobantes electrónicos.';
COMMENT ON COLUMN comprobantes_detalles.comprobante_id IS 'Referencia a la cabecera del comprobante';
COMMENT ON COLUMN comprobantes_detalles.codigo_principal IS 'Código del producto o servicio facturado';
COMMENT ON COLUMN comprobantes_detalles.cantidad IS 'Cantidad vendida';
COMMENT ON COLUMN comprobantes_detalles.precio_unitario IS 'Precio unitario';
COMMENT ON COLUMN comprobantes_detalles.total IS 'Subtotal de línea (Cantidad * Precio - Descuento)';

-- ============================================================================
-- 8. MÓDULO: AUDITORÍA
-- ============================================================================

-- Tabla: auditoria_logs
CREATE TABLE auditoria_logs (
    id BIGSERIAL PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id),
    modulo VARCHAR(50) NOT NULL,
    evento VARCHAR(100) NOT NULL,
    usuario_id UUID REFERENCES usuarios(id),
    usuario_nombre VARCHAR(255),
    ip_address VARCHAR(45),
    metodo_http VARCHAR(10),
    ruta TEXT,
    severidad severidad_log DEFAULT 'INFO',
    datos_antes JSONB,
    datos_despues JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE auditoria_logs IS 'Bitácora centralizada de eventos del sistema.';
COMMENT ON COLUMN auditoria_logs.empresa_id IS 'Empresa donde ocurrió el evento';
COMMENT ON COLUMN auditoria_logs.modulo IS 'Módulo funcional origen del evento (ej: INVENTARIO)';
COMMENT ON COLUMN auditoria_logs.evento IS 'Nombre del evento (ej: CREACION_PRODUCTO, LOGIN_FALLIDO)';
COMMENT ON COLUMN auditoria_logs.usuario_id IS 'Usuario que provocó el evento';
COMMENT ON COLUMN auditoria_logs.ip_address IS 'Dirección IP del cliente';
COMMENT ON COLUMN auditoria_logs.severidad IS 'Nivel de la bitácora: INFO, WARNING, ERROR';
COMMENT ON COLUMN auditoria_logs.datos_antes IS 'Snapshot de los datos antes del cambio (JSON)';
COMMENT ON COLUMN auditoria_logs.datos_despues IS 'Snapshot de los datos después del cambio (JSON)';

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
        INSERT INTO auditoria_logs(empresa_id, modulo, evento, usuario_id, datos_antes, created_at)
        VALUES (current_empresa_id, TG_TABLE_NAME, 'DELETE', current_user_id, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO auditoria_logs(empresa_id, modulo, evento, usuario_id, datos_antes, datos_despues, created_at)
        VALUES (current_empresa_id, TG_TABLE_NAME, 'UPDATE', current_user_id, row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO auditoria_logs(empresa_id, modulo, evento, usuario_id, datos_despues, created_at)
        VALUES (current_empresa_id, TG_TABLE_NAME, 'INSERT', current_user_id, row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit_trigger_function() IS 'Trigger function genérica. Captura cambios (INSERT, UPDATE, DELETE) y los registra en auditoria_logs usando el contexto de sesión.';

-- Crear triggers de auditoría para tablas críticas
CREATE TRIGGER audit_plan_cuentas AFTER INSERT OR UPDATE OR DELETE ON plan_cuentas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_asientos_cab AFTER INSERT OR UPDATE OR DELETE ON asientos_cab FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_productos AFTER INSERT OR UPDATE OR DELETE ON productos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_kardex_movimientos AFTER INSERT OR UPDATE OR DELETE ON kardex_movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_empleados AFTER INSERT OR UPDATE OR DELETE ON empleados FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_nomina_roles AFTER INSERT OR UPDATE OR DELETE ON nomina_roles FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_bancos_cuentas AFTER INSERT OR UPDATE OR DELETE ON bancos_cuentas FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_bancos_movimientos AFTER INSERT OR UPDATE OR DELETE ON bancos_movimientos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_comprobantes_electronicos AFTER INSERT OR UPDATE OR DELETE ON comprobantes_electronicos FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- ÍNDICES BÁSICOS (Los detallados están en postgresql_indexes.sql)
-- ============================================================================

-- Índices multi-tenant (empresa_id debe estar en todas las consultas)
CREATE INDEX idx_plan_cuentas_empresa ON plan_cuentas(empresa_id);
CREATE INDEX idx_asientos_cab_empresa ON asientos_cab(empresa_id);
CREATE INDEX idx_productos_empresa ON productos(empresa_id);
CREATE INDEX idx_empleados_empresa ON empleados(empresa_id);
CREATE INDEX idx_bancos_cuentas_empresa ON bancos_cuentas(empresa_id);
CREATE INDEX idx_comprobantes_empresa ON comprobantes_electronicos(empresa_id);

-- ============================================================================
-- COMENTARIOS GENERALES
-- ============================================================================

COMMENT ON DATABASE ecucontable IS 'Base de datos del sistema EcuContable Pro - Sistema contable multi-tenant para Ecuador.';

-- ============================================================================
-- 9. MÓDULO: CONFIGURACIÓN Y PARÁMETROS
-- ============================================================================

-- Tabla: sucursales
CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(3) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    es_matriz BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    UNIQUE(empresa_id, codigo)
);

COMMENT ON TABLE sucursales IS 'Sucursales o establecimientos de la empresa.';

-- Tabla: puntos_emision
CREATE TABLE puntos_emision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    codigo VARCHAR(3) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    UNIQUE(sucursal_id, codigo)
);

-- Tabla: puntos_emision_secuenciales
-- Para manejar los secuenciales por tipo de comprobante en cada punto de emisión
CREATE TABLE puntos_emision_secuenciales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    punto_emision_id UUID NOT NULL REFERENCES puntos_emision(id) ON DELETE CASCADE,
    tipo_comprobante tipo_comprobante_sri NOT NULL,
    secuencial_actual INTEGER DEFAULT 1,
    UNIQUE(punto_emision_id, tipo_comprobante)
);

-- Tabla: codigos_retencion
CREATE TABLE codigos_retencion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL,
    concepto TEXT NOT NULL,
    porcentaje NUMERIC(5,2) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- RENTA, IVA
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    UNIQUE(empresa_id, codigo, tipo)
);

-- Tabla: configuracion_parametros
CREATE TABLE configuracion_parametros (
    empresa_id UUID PRIMARY KEY REFERENCES empresas(id) ON DELETE CASCADE,
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
    updated_by UUID REFERENCES usuarios(id)
);

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
