-- ============================================================================
-- ECUCONTABLE PRO - SCHEMA DE CATÁLOGOS
-- ============================================================================
-- Descripción: Estructura genérica para manejo de catálogos del sistema y SRI.
-- Permite agregar nuevos códigos sin modificar la estructura de la BD.
-- ============================================================================

-- Tabla Maestra de Tipos de Catálogo
CREATE TABLE catalogos_tipos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE, -- Ej: SRI_TIPO_COMPROBANTE, SRI_FORMA_PAGO
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    sistema BOOLEAN DEFAULT TRUE, -- Si es TRUE, no debería ser modificado por usuario
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE catalogos_tipos IS 'Definición de los tipos de catálogos disponibles en el sistema.';

-- Tabla de Items de Catálogo
CREATE TABLE catalogos_items (
    id SERIAL PRIMARY KEY,
    catalogo_codigo VARCHAR(50) NOT NULL REFERENCES catalogos_tipos(codigo) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL, -- El código real del SRI o del sistema (Ej: '01', '04', '20')
    valor VARCHAR(255) NOT NULL, -- El valor a mostrar (Ej: 'FACTURA', 'SIN UTILIZACION DEL SISTEMA FINANCIERO')
    descripcion TEXT,
    padre_codigo VARCHAR(20), -- Para catálogos jerárquicos (opcional)
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(catalogo_codigo, codigo)
);

COMMENT ON TABLE catalogos_items IS 'Items individuales de cada catálogo. Aquí residen los códigos del SRI.';
COMMENT ON COLUMN catalogos_items.codigo IS 'Código técnico (ej: 01 para Factura). Use este campo para guardar en tablas transaccionales.';
COMMENT ON COLUMN catalogos_items.valor IS 'Descripción legible para el usuario.';

-- Índices para búsqueda rápida
CREATE INDEX idx_catalogos_items_catalogo ON catalogos_items(catalogo_codigo);
CREATE INDEX idx_catalogos_items_codigo ON catalogos_items(codigo);
CREATE INDEX idx_catalogos_items_activo ON catalogos_items(catalogo_codigo, activo);

-- ============================================================================
-- VISTA DE ACCESO RÁPIDO (Opcional, para facilitar consultas)
-- ============================================================================
CREATE OR REPLACE VIEW v_catalogos_sri AS
SELECT 
    ct.codigo as tipo_catalogo,
    ci.codigo as codigo_sri,
    ci.valor as descripcion,
    ci.activo
FROM catalogos_items ci
JOIN catalogos_tipos ct ON ci.catalogo_codigo = ct.codigo
WHERE ct.codigo LIKE 'SRI_%';
