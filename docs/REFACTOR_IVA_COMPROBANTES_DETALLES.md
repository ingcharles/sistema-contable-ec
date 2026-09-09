# Refactorización IVA Storage en Comprobantes Detalles

## Resumen de Cambios

Se ha completado la refactorización del almacenamiento de IVA en `facturacion.comprobantes_detalles`, reemplazando los campos `codigo_iva` (VARCHAR) y `tarifa` (NUMERIC) con `iva_catalogo_item_id` (UUID) que referencia al catálogo centralizado `configuracion.catalogos_items`.

## Archivos Modificados

### 1. Migración SQL
**Archivo**: `database/migrations/015_refactor_iva_comprobantes_detalles.sql`

**Acciones**:
- ✅ Verificación y creación de columna `iva_catalogo_item_id` (si no existe)
- ✅ Migración automática de datos existentes desde `codigo_iva` a `iva_catalogo_item_id`
- ✅ Eliminación de columnas obsoletas `codigo_iva` y `tarifa`
- ✅ Creación de índice `idx_comprobantes_detalles_iva_catalogo` para mejorar performance
- ✅ Comentarios descriptivos en la columna

**Características de la migración**:
- Es **idempotente** (puede ejecutarse múltiples veces sin errores)
- Preserva datos existentes mapeándolos al catálogo
- Usa IVA por defecto (código '4' = 15%) para registros sin match

### 2. API Route: Vender (Facturas)
**Archivo**: `src/app/api/facturacion/vender/route.ts`

**Cambios**:
- ✅ Agregado mapeo `codeToIdMap` para convertir códigos IVA a UUIDs del catálogo
- ✅ Actualizado INSERT en `comprobantes_detalles`:
  - **Antes**: `(comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, total, codigo_iva)`
  - **Después**: `(comprobante_id, codigo_principal, descripcion, cantidad, precio_unitario, descuento, total, valor_iva, iva_catalogo_item_id)`
- ✅ Se resuelve `iva_catalogo_item_id` dinámicamente basado en `codigoIVA` del detalle

### 3. API Route: Notas de Débito
**Archivo**: `src/app/api/facturacion/notas-debito/emitir/route.ts`

**Cambios**:
- ✅ Agregado mapeo `codeToIdMap` para convertir códigos IVA a UUIDs del catálogo
- ✅ Actualizado INSERT en `comprobantes_detalles`:
  - **Antes**: Incluía `codigo_iva` y `tarifa`
  - **Después**: Usa `valor_iva` e `iva_catalogo_item_id`
- ✅ Se resuelve `iva_catalogo_item_id` dinámicamente basado en `codigoIVA` del detalle

### 4. API Route: Notas de Crédito
**Archivo**: `src/app/api/facturacion/notas-credito/emitir/route.ts`

**Cambios**:
- ✅ **MEJORA ADICIONAL**: Se agregó lógica faltante para insertar detalles en `comprobantes_detalles` (antes no se guardaban)
- ✅ Agregado mapeo `codeToIdMap` para convertir códigos IVA a UUIDs del catálogo
- ✅ Enriquecimiento de detalles con códigos de IVA antes de procesarlos
- ✅ Nuevo INSERT en `comprobantes_detalles` con:
  - `comprobante_id`, `codigo_principal`, `descripcion`, `cantidad`, `precio_unitario`, `descuento`, `total`, `valor_iva`, `iva_catalogo_item_id`

### 5. Schema Base de Datos
**Archivo**: `database/postgresql_schema.sql`

**Cambios**:
- ✅ Eliminadas columnas `codigo_iva` y `tarifa` de la definición de tabla
- ✅ Columna `iva_catalogo_item_id` ya estaba presente, se actualizó comentario descriptivo
- ✅ Agregados comentarios detallados en todas las columnas

## Lógica de Resolución de IVA

Todas las rutas ahora siguen este patrón:

1. **Carga del Catálogo IVA** al inicio de la transacción:
   ```typescript
   const ivaCatalogResult = await db.query(
       { text: "SELECT id, codigo, valor_numerico FROM configuracion.catalogos_items WHERE catalogo_codigo = 'SRI_TIPO_IMPUESTO_IVA'" }
   );
   ```

2. **Mapeo Bidireccional**:
   - `ivaRatesMap[codigo] = tarifa` (para cálculos)
   - `idToCodeMap[id] = codigo` (para obtener código desde parámetros)
   - `codeToIdMap[codigo] = id` (para INSERT)

3. **Resolución del IVA por Defecto**:
   ```typescript
   const defaultIvaCode = idToCodeMap[paramsRow.iva_catalogo_item_id] || '4';
   const defaultIvaId = paramsRow.iva_catalogo_item_id || codeToIdMap['4'];
   ```

4. **INSERT con UUID del Catálogo**:
   ```typescript
   const ivaId = codeToIdMap[d.codigoIVA] || defaultIvaId;
   ```

## Beneficios de la Refactorización

✅ **Estandarización**: Todo el IVA se maneja desde el catálogo centralizado  
✅ **Consistencia**: Elimina duplicación de datos (código + tarifa)  
✅ **Mantenibilidad**: Cambios en tarifas de IVA se hacen solo en el catálogo  
✅ **Integridad**: Foreign key asegura que solo existan IVAs válidos  
✅ **Performance**: Índice en `iva_catalogo_item_id` mejora JOINs  
✅ **Auditoría**: Histórico de comprobantes mantiene referencia al tipo de IVA usado

## Plan de Verificación

### 1. Aplicar Migración
```bash
psql -U postgres -d ecucontable_pro -f database/migrations/015_refactor_iva_comprobantes_detalles.sql
```

### 2. Verificar Estructura
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'facturacion' 
  AND table_name = 'comprobantes_detalles';
```

**Resultado esperado**: Solo debe aparecer `iva_catalogo_item_id`, NO `codigo_iva` ni `tarifa`

### 3. Pruebas Manuales

#### a) Emitir Factura
```bash
POST /api/facturacion/vender
{
  "puntoEmisionId": "<uuid>",
  "fechaEmision": "2026-02-06",
  "clienteId": "<uuid>",
  "clienteNombre": "Test Cliente",
  "clienteIdentificacion": "0999999999",
  "detalles": [{
    "codigoPrincipal": "PROD001",
    "descripcion": "Producto Test",
    "cantidad": 1,
    "precioUnitario": 100,
    "descuento": 0,
    "total": 100,
    "baseImponible": 100,
    "codigoIVA": "4",
    "valorIVA": 15
  }]
}
```

**Verificar en DB**:
```sql
SELECT 
    cd.id,
    cd.descripcion,
    cd.iva_catalogo_item_id,
    ci.codigo as codigo_iva,
    ci.valor_numerico as tarifa_iva
FROM facturacion.comprobantes_detalles cd
INNER JOIN configuracion.catalogos_items ci ON cd.iva_catalogo_item_id = ci.id
ORDER BY cd.created_at DESC
LIMIT 1;
```

**Resultado esperado**: `iva_catalogo_item_id` debe tener un UUID válido, `codigo_iva` debe ser '4', `tarifa_iva` debe ser 15

#### b) Emitir Nota de Débito
```bash
POST /api/facturacion/notas-debito/emitir
{
  "puntoEmisionId": "<uuid>",
  "fechaEmision": "2026-02-06",
  "clienteId": "<uuid>",
  "motivo": "Intereses por mora",
  "codDocModificado": "01",
  "numDocModificado": "001-001-000000123",
  "fechaEmisionDocSustento": "2026-01-15",
  "detalles": [{
    "descripcion": "Interés por mora",
    "cantidad": 1,
    "precioUnitario": 10,
    "descuento": 0,
    "valorModificacion": 10,
    "baseImponible": 8.70,
    "codigoIVA": "4",
    "valorIVA": 1.30
  }]
}
```

**Verificar igual que factura**

#### c) Emitir Nota de Crédito
```bash
POST /api/facturacion/notas-credito/emitir
{
  "puntoEmisionId": "<uuid>",
  "fechaEmision": "2026-02-06",
  "clienteId": "<uuid>",
  "motivo": "Devolución de mercadería",
  "codDocModificado": "01",
  "numDocModificado": "001-001-000000123",
  "fechaEmisionDocSustento": "2026-01-15",
  "detalles": [{
    "codigoPrincipal": "PROD001",
    "descripcion": "Producto devuelto",
    "cantidad": 1,
    "precioUnitario": 100,
    "descuento": 0,
    "baseImponible": 100,
    "codigoIVA": "4",
    "valorIVA": 15
  }]
}
```

**Verificar igual que factura**

### 4. Pruebas de Integridad

#### a) Verificar que NO hay NULLs no deseados
```sql
SELECT COUNT(*) as registros_sin_iva
FROM facturacion.comprobantes_detalles
WHERE iva_catalogo_item_id IS NULL;
```

**Resultado esperado**: 0 (o los que existían antes de la migración si no tenían codigo_iva)

#### b) Verificar Foreign Keys válidas
```sql
SELECT 
    cd.id,
    cd.iva_catalogo_item_id,
    ci.id IS NOT NULL as iva_valido
FROM facturacion.comprobantes_detalles cd
LEFT JOIN configuracion.catalogos_items ci ON cd.iva_catalogo_item_id = ci.id
WHERE ci.id IS NULL;
```

**Resultado esperado**: 0 registros (todas las referencias deben ser válidas)

## Reversión (Si es necesario)

Si se requiere revertir los cambios:

```sql
-- ADVERTENCIA: Esto causará pérdida de datos si hay detalles nuevos

-- 1. Agregar columnas antiguas
ALTER TABLE facturacion.comprobantes_detalles 
ADD COLUMN codigo_iva VARCHAR(2),
ADD COLUMN tarifa NUMERIC(5,2);

-- 2. Migrar datos de vuelta
UPDATE facturacion.comprobantes_detalles cd
SET 
    codigo_iva = ci.codigo,
    tarifa = ci.valor_numerico
FROM configuracion.catalogos_items ci
WHERE cd.iva_catalogo_item_id = ci.id;

-- 3. Eliminar columna nueva
ALTER TABLE facturacion.comprobantes_detalles 
DROP COLUMN iva_catalogo_item_id;
```

⚠️ **NO RECOMENDADO**: Los cambios en el código TypeScript también deberían revertirse.

## Notas Importantes

- ✅ La migración es **segura** y preserva datos existentes
- ✅ Los comprobantes antiguos seguirán funcionando después de la migración
- ✅ Las Notas de Crédito ahora **guardan detalles** (mejora adicional)
- ✅ El sistema es **compatible hacia atrás** durante la transición
- ⚠️ **Ejecutar backup** antes de aplicar en producción
- ⚠️ **Verificar** que `configuracion.catalogos_items` tiene todos los códigos de IVA necesarios antes de migrar

## Próximos Pasos (Opcional)

1. **Considerar hacer NOT NULL**: Si todos los comprobantes deben tener IVA
   ```sql
   ALTER TABLE facturacion.comprobantes_detalles 
   ALTER COLUMN iva_catalogo_item_id SET NOT NULL;
   ```

2. **Agregar validación en aplicación**: Verificar que `iva_catalogo_item_id` siempre se proporciona

3. **Documentar en README**: Actualizar documentación del proyecto

---

**Fecha**: 6 de febrero de 2026  
**Estado**: ✅ COMPLETADO  
**Requiere Revisión**: ⚠️ SÍ (Cambios breaking en schema)
