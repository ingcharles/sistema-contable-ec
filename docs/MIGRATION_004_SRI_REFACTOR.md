# 📋 Migración 004: Refactorización SRI - Normalización de Ambientes

## 🎯 Objetivo

Mejorar la mantenibilidad de la configuración del SRI separando los ambientes (PRUEBAS/PRODUCCION) y sus URLs de servicios web en una tabla catálogo independiente.

## 🔄 Cambios Realizados

### 1. Nueva Estructura de Base de Datos

#### Tabla `configuracion.sri_ambiente` (NUEVA)
```sql
CREATE TABLE configuracion.sri_ambiente (
    id UUID PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,  -- 'PRUEBAS' o 'PRODUCCION'
    nombre VARCHAR(50),
    url_recepcion TEXT,
    url_autorizacion TEXT,
    descripcion TEXT,
    activo BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Registros iniciales:**
- PRUEBAS: URLs de celcer.sri.gob.ec
- PRODUCCION: URLs de cel.sri.gob.ec

#### Tabla `configuracion.sri_certificados` (MODIFICADA)

**ANTES:**
```sql
CREATE TABLE configuracion.sri_certificados (
    id UUID PRIMARY KEY,
    empresa_id UUID,
    ambiente VARCHAR(20),          -- ❌ Removido
    p12_certificado BYTEA,
    clave_certificado VARCHAR(255),
    url_recepcion TEXT,            -- ❌ Removido
    url_autorizacion TEXT,         -- ❌ Removido
    activo BOOLEAN,
    ...
);
```

**DESPUÉS:**
```sql
CREATE TABLE configuracion.sri_certificados (
    id UUID PRIMARY KEY,
    empresa_id UUID,
    sri_ambiente_id UUID,              -- ✅ Nuevo: FK a sri_ambiente
    p12_certificado BYTEA,
    clave_certificado VARCHAR(255),
    activo BOOLEAN,
    ...
    UNIQUE(empresa_id, sri_ambiente_id, activo)
);
```

### 2. Endpoints Modificados

#### `GET /api/configuracion/sri`
**Antes:**
```typescript
SELECT id, empresa_id, ambiente, url_recepcion, url_autorizacion
FROM configuracion.sri_certificados
WHERE empresa_id = $1 AND ambiente = $2
```

**Después:**
```typescript
SELECT 
    sc.id, sc.empresa_id,
    sa.codigo as ambiente_codigo,
    sa.url_recepcion, sa.url_autorizacion
FROM configuracion.sri_certificados sc
INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id
WHERE sc.empresa_id = $1 AND sa.codigo = $2
```

#### `POST /api/configuracion/sri`
**Cambios:**
- Ya no acepta `urlRecepcion` ni `urlAutorizacion` en el body
- Obtiene el `sri_ambiente_id` desde la tabla `sri_ambiente`
- Las URLs se obtienen automáticamente del catálogo

#### `GET /api/configuracion/sri/ambientes` (NUEVO)
Retorna la lista de ambientes disponibles con sus URLs.

### 3. Archivos Modificados

#### Backend
- ✅ `database/postgresql_schema.sql` - Nueva estructura
- ✅ `database/migrations/004_refactor_sri_ambiente.sql` - Script de migración
- ✅ `src/app/api/configuracion/sri/route.ts` - Queries actualizados
- ✅ `src/app/api/configuracion/sri/ambientes/route.ts` - Nuevo endpoint
- ✅ `src/app/api/facturacion/emitir/route.ts` - Query con JOIN

#### Documentación
- ✅ `database/README_DATABASE.md` - Actualizada

## 🚀 Guía de Migración

### Paso 1: Ejecutar el Script de Migración

```bash
psql -U postgres -d ecucontable -f database/migrations/004_refactor_sri_ambiente.sql
```

**El script realiza:**
1. ✅ Crea tabla `sri_ambiente` con los ambientes estándar
2. ✅ Crea respaldo temporal de `sri_certificados`
3. ✅ Recrea tabla `sri_certificados` con nueva estructura
4. ✅ Migra datos existentes usando JOIN
5. ✅ Recrea triggers de auditoría
6. ✅ Verifica integridad de la migración

### Paso 2: Verificar la Migración

```sql
-- Verificar ambientes creados
SELECT * FROM configuracion.sri_ambiente;

-- Verificar certificados migrados
SELECT 
    sc.id,
    sa.codigo as ambiente,
    sa.url_recepcion,
    sa.url_autorizacion
FROM configuracion.sri_certificados sc
INNER JOIN configuracion.sri_ambiente sa ON sc.sri_ambiente_id = sa.id;
```

### Paso 3: Reiniciar Aplicación

```bash
npm run dev
```

## ✅ Ventajas de la Nueva Estructura

### 1. **Mantenibilidad**
- Las URLs del SRI se actualizan en un solo lugar
- No es necesario modificar cada certificado individual
- Cambios centralizados en el catálogo `sri_ambiente`

### 2. **Consistencia**
- URLs idénticas para todos los certificados del mismo ambiente
- Evita errores de tipeo en configuraciones manuales
- Validación automática mediante FK

### 3. **Escalabilidad**
- Facilita agregar nuevos ambientes en el futuro
- Permite configuración de URLs alternativas
- Soporta ambientes de desarrollo/staging

### 4. **Normalización**
- Cumple con 3FN (Tercera Forma Normal)
- Elimina redundancia de datos
- Reduce espacio de almacenamiento

## 🔍 Puntos de Atención

### Compatibilidad con UI
La interfaz de usuario **NO requiere cambios** porque:
- El endpoint `POST /api/configuracion/sri` ya no acepta `urlRecepcion` ni `urlAutorizacion`
- Las URLs se obtienen automáticamente del catálogo
- La experiencia de usuario se mantiene igual

### Retrocompatibilidad
⚠️ **Breaking Change**: Los clientes que envíen `urlRecepcion` o `urlAutorizacion` en el POST serán ignorados.

## 📊 Impacto

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Tablas** | 1 tabla | 2 tablas (normalizado) |
| **Campos por certificado** | 7 | 5 (-2 campos redundantes) |
| **Actualización URLs** | Por certificado | Centralizada |
| **Consistencia URLs** | Manual | Automática |
| **Endpoints** | 2 | 3 (+1 para catálogo) |

## 🧪 Testing

### Casos de Prueba

1. **Obtener configuración existente**
```bash
curl -H "x-empresa-id: UUID" \
     -H "x-usuario-id: UUID" \
     "http://localhost:3000/api/configuracion/sri?ambiente=PRUEBAS"
```

2. **Guardar nueva configuración**
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "x-empresa-id: UUID" \
     -H "x-usuario-id: UUID" \
     -d '{"ambiente":"PRUEBAS","p12Base64":"...","claveCertificado":"..."}' \
     "http://localhost:3000/api/configuracion/sri"
```

3. **Listar ambientes disponibles**
```bash
curl -H "x-empresa-id: UUID" \
     -H "x-usuario-id: UUID" \
     "http://localhost:3000/api/configuracion/sri/ambientes"
```

## 📝 Notas Adicionales

- El script de migración es **transaccional** (usa BEGIN/COMMIT)
- En caso de error, se hace ROLLBACK automático
- El backup temporal se elimina al finalizar la sesión
- Se mantiene compatibilidad con la API de facturación

## 👥 Responsables

- **Migración DB**: Automática vía script SQL
- **Backend**: Queries actualizados en routes
- **Frontend**: Sin cambios requeridos
- **Testing**: Verificación post-migración

---

**Fecha de implementación:** 26 de enero de 2026  
**Versión:** 4.2  
**Estado:** ✅ Completado
