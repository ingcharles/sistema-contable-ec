# Migration 006: Renombrar Columnas de Certificado para Consistencia

## Fecha: 26/01/2026

## Objetivo
Renombrar las columnas `p12_certificado` y `clave_certificado` a `cert_p12_certificado` y `cert_clave_certificado` respectivamente para mantener consistencia con la nomenclatura de otros campos del certificado (como `cert_fecha_emision`, `cert_fecha_expiracion`, etc.).

## Cambios Realizados

### 1. Schema PostgreSQL (`database/postgresql_schema.sql`)
- ✅ Renombrado `p12_certificado` → `cert_p12_certificado`
- ✅ Renombrado `clave_certificado` → `cert_clave_certificado`
- ✅ Actualizados los comentarios de las columnas
- ✅ Actualizada la función `configuracion.obtener_metadata_certificado()`

### 2. Migraciones
- ✅ Creado `database/migrations/006_rename_certificado_columns.sql`
- ✅ Actualizado `database/migrations/005_add_certificate_metadata.sql`

### 3. API Routes

#### `src/app/api/configuracion/sri/route.ts`
- ✅ GET: Query actualizado para usar `cert_p12_certificado` y `cert_clave_certificado`
- ✅ GET: Conversión BYTEA a base64 actualizada
- ✅ POST: Query INSERT actualizado con nuevos nombres de columnas

#### `src/app/api/facturacion/emitir/route.ts`
- ✅ Query SELECT actualizado para usar nuevos nombres
- ✅ Uso de `config.cert_p12_certificado` en lugar de `config.p12_certificado`
- ✅ Uso de `config.cert_clave_certificado` en lugar de `config.clave_certificado`

### 4. UI Components
- ℹ️ No requieren cambios (usan `p12Base64` y `claveCertificado` en el request body, que son diferentes campos)

## Nomenclatura Consistente
Todos los campos relacionados con el certificado ahora usan el prefijo `cert_`:

| Campo                      | Descripción                           |
|---------------------------|---------------------------------------|
| `cert_p12_certificado`    | Certificado digital P12 (BYTEA)      |
| `cert_clave_certificado`  | Contraseña del certificado           |
| `cert_fecha_emision`      | Fecha de emisión (notBefore)         |
| `cert_fecha_expiracion`   | Fecha de expiración (notAfter)       |
| `cert_sujeto`             | Subject DN                           |
| `cert_emisor`             | Issuer DN                            |
| `cert_numero_serie`       | Número de serie                      |

## Instrucciones de Aplicación

### Para Base de Datos Nueva
El schema principal ya contiene los nombres correctos. Ejecutar:
```bash
psql -d ecucontabledb -f database/postgresql_schema.sql
```

### Para Base de Datos Existente
Ejecutar la migración 006:
```bash
psql -d ecucontabledb -f database/migrations/006_rename_certificado_columns.sql
```

## Compatibilidad
- ⚠️ **Breaking Change**: Cualquier query o código que use los nombres antiguos debe actualizarse
- ✅ Todos los archivos del sistema han sido actualizados
- ✅ La migración se ejecuta dentro de una transacción (ROLLBACK automático en caso de error)

## Testing Recomendado
1. Verificar que la configuración SRI se guarde correctamente
2. Verificar que se puedan emitir comprobantes electrónicos
3. Verificar que la consulta de metadatos del certificado funcione
4. Verificar que el certificado se pueda cargar y validar

## Notas Adicionales
- Los archivos de documentación histórica (`MIGRATION_004_SRI_REFACTOR.md`) mantienen los nombres originales para referencia histórica
- Las migraciones anteriores (`004_refactor_sri_ambiente.sql`) también mantienen sus nombres originales ya que documentan el estado en ese momento
