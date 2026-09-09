# Funciones PostgreSQL para Certificados Digitales

## Descripción General

Se han creado tres funciones PL/pgSQL para facilitar la validación y consulta de metadatos de certificados digitales P12 directamente desde la base de datos.

---

## 1. `es_certificado_vigente()`

### Propósito
Verifica si un certificado digital está vigente comparando su fecha de expiración con la fecha actual.

### Sintaxis
```sql
configuracion.es_certificado_vigente(fecha_expiracion TIMESTAMP) RETURNS BOOLEAN
```

### Parámetros
- `fecha_expiracion`: Fecha de expiración del certificado (TIMESTAMP)

### Retorno
- `TRUE`: El certificado está vigente (no ha expirado)
- `FALSE`: El certificado ha expirado
- `NULL`: No se proporcionó fecha de expiración

### Ejemplos de Uso
```sql
-- Verificar si un certificado con fecha específica está vigente
SELECT configuracion.es_certificado_vigente('2025-12-31'::TIMESTAMP);
-- Resultado: TRUE (si la fecha actual es anterior a 2025-12-31)

-- Verificar certificados vigentes de una empresa
SELECT id, cert_fecha_expiracion, 
       configuracion.es_certificado_vigente(cert_fecha_expiracion) as vigente
FROM configuracion.sri_certificados
WHERE empresa_id = 'uuid-empresa';
```

---

## 2. `dias_hasta_expiracion()`

### Propósito
Calcula cuántos días faltan para que expire un certificado. Si ya expiró, retorna un número negativo.

### Sintaxis
```sql
configuracion.dias_hasta_expiracion(fecha_expiracion TIMESTAMP) RETURNS INTEGER
```

### Parámetros
- `fecha_expiracion`: Fecha de expiración del certificado (TIMESTAMP)

### Retorno
- Número positivo: Días restantes hasta la expiración
- Número negativo: Días transcurridos desde la expiración
- `NULL`: No se proporcionó fecha de expiración

### Ejemplos de Uso
```sql
-- Calcular días restantes hasta expiración
SELECT configuracion.dias_hasta_expiracion('2025-12-31'::TIMESTAMP);
-- Resultado: 339 (ejemplo, depende de la fecha actual)

-- Encontrar certificados que expiran en menos de 30 días
SELECT empresa_id, cert_fecha_expiracion,
       configuracion.dias_hasta_expiracion(cert_fecha_expiracion) as dias_restantes
FROM configuracion.sri_certificados
WHERE configuracion.dias_hasta_expiracion(cert_fecha_expiracion) BETWEEN 0 AND 30
ORDER BY dias_restantes;
```

---

## 3. `obtener_metadata_certificado()`

### Propósito
Obtiene todos los metadatos del certificado digital activo para una empresa y ambiente específico, incluyendo estado de vigencia calculado.

### Sintaxis
```sql
configuracion.obtener_metadata_certificado(
    p_empresa_id UUID,
    p_ambiente_codigo VARCHAR
) RETURNS TABLE (
    certificado_id UUID,
    ambiente VARCHAR,
    fecha_emision TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    sujeto TEXT,
    emisor TEXT,
    numero_serie VARCHAR,
    es_vigente BOOLEAN,
    dias_restantes INTEGER,
    tiene_certificado BOOLEAN
)
```

### Parámetros
- `p_empresa_id`: UUID de la empresa
- `p_ambiente_codigo`: Código del ambiente SRI ('PRUEBAS' o 'PRODUCCION')

### Columnas Retornadas

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `certificado_id` | UUID | ID único del certificado |
| `ambiente` | VARCHAR | Código del ambiente (PRUEBAS/PRODUCCION) |
| `fecha_emision` | TIMESTAMP | Fecha de emisión del certificado (notBefore) |
| `fecha_expiracion` | TIMESTAMP | Fecha de expiración del certificado (notAfter) |
| `sujeto` | TEXT | Distinguished Name del sujeto |
| `emisor` | TEXT | Distinguished Name del emisor |
| `numero_serie` | VARCHAR | Número de serie del certificado |
| `es_vigente` | BOOLEAN | TRUE si el certificado está vigente |
| `dias_restantes` | INTEGER | Días hasta expiración (negativo si expiró) |
| `tiene_certificado` | BOOLEAN | TRUE si existe archivo P12 cargado |

### Ejemplos de Uso

#### Ejemplo 1: Consulta Básica
```sql
-- Obtener metadatos del certificado de pruebas
SELECT * 
FROM configuracion.obtener_metadata_certificado(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
    'PRUEBAS'
);
```

#### Ejemplo 2: Verificar Estado con Condicional
```sql
-- Obtener metadatos y mostrar advertencias
SELECT 
    *,
    CASE 
        WHEN NOT es_vigente THEN 'CERTIFICADO EXPIRADO - Renovar inmediatamente'
        WHEN dias_restantes <= 30 THEN 'ADVERTENCIA: Expira en ' || dias_restantes || ' días'
        ELSE 'Certificado vigente'
    END as mensaje
FROM configuracion.obtener_metadata_certificado(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
    'PRODUCCION'
);
```

#### Ejemplo 3: Validar Antes de Facturar
```sql
-- Verificar certificado antes de emitir factura electrónica
DO $$
DECLARE
    metadata RECORD;
BEGIN
    SELECT * INTO metadata
    FROM configuracion.obtener_metadata_certificado(
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
        'PRODUCCION'
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró certificado digital configurado';
    END IF;
    
    IF NOT metadata.tiene_certificado THEN
        RAISE EXCEPTION 'No existe archivo de certificado P12 cargado';
    END IF;
    
    IF NOT metadata.es_vigente THEN
        RAISE EXCEPTION 'El certificado digital ha expirado hace % días', ABS(metadata.dias_restantes);
    END IF;
    
    IF metadata.dias_restantes <= 7 THEN
        RAISE WARNING 'El certificado expira en % días. Renovar urgentemente', metadata.dias_restantes;
    END IF;
    
    RAISE NOTICE 'Certificado válido. Días restantes: %', metadata.dias_restantes;
END $$;
```

---

## Casos de Uso en el API

### 1. Endpoint GET `/api/configuracion/sri/metadata`

```typescript
// Usa la función obtener_metadata_certificado directamente
const result = await db.query(`
    SELECT * FROM configuracion.obtener_metadata_certificado($1, $2)
`, [empresaId, ambiente]);
```

### 2. Validación Automática en Facturación

```typescript
// Antes de emitir factura, verificar estado del certificado
const certificado = await db.query(`
    SELECT es_vigente, dias_restantes 
    FROM configuracion.obtener_metadata_certificado($1, $2)
`, [empresaId, 'PRODUCCION']);

if (!certificado.rows[0]?.es_vigente) {
    throw new Error('Certificado digital expirado');
}
```

---

## Ventajas de Usar Funciones PostgreSQL

1. **Rendimiento**: Cálculos ejecutados directamente en la base de datos
2. **Consistencia**: Misma lógica en todas las consultas
3. **Simplicidad**: Una sola llamada retorna todos los datos necesarios
4. **Reutilización**: Disponible para cualquier query, vista o procedimiento
5. **Mantenibilidad**: Lógica centralizada, fácil de actualizar

---

## Monitoreo Recomendado

### Query para Certificados que Expiran Pronto
```sql
SELECT 
    e.razon_social,
    sa.nombre as ambiente,
    m.fecha_expiracion,
    m.dias_restantes,
    m.es_vigente
FROM seguridad.empresas e
CROSS JOIN configuracion.sri_ambiente sa
CROSS JOIN LATERAL configuracion.obtener_metadata_certificado(e.id, sa.codigo) m
WHERE m.tiene_certificado = TRUE
  AND m.dias_restantes BETWEEN 0 AND 30
ORDER BY m.dias_restantes;
```

### Vista Recomendada para Dashboard
```sql
CREATE OR REPLACE VIEW configuracion.v_estado_certificados AS
SELECT 
    e.id as empresa_id,
    e.razon_social,
    sa.codigo as ambiente,
    m.*,
    CASE 
        WHEN NOT m.es_vigente THEN 'EXPIRADO'
        WHEN m.dias_restantes <= 7 THEN 'CRITICO'
        WHEN m.dias_restantes <= 30 THEN 'ADVERTENCIA'
        ELSE 'OK'
    END as nivel_alerta
FROM seguridad.empresas e
CROSS JOIN configuracion.sri_ambiente sa
CROSS JOIN LATERAL configuracion.obtener_metadata_certificado(e.id, sa.codigo) m
WHERE m.tiene_certificado = TRUE;
```

---

## Notas Importantes

- Las funciones son **IMMUTABLE** (`es_certificado_vigente`, `dias_hasta_expiracion`) o **STABLE** (`obtener_metadata_certificado`)
- No requieren permisos especiales más allá del acceso a las tablas involucradas
- Son compatibles con PostgreSQL 12+
- Retornan `NULL` de forma segura cuando faltan datos
