# 🗄️ Guía de Ejecución de Scripts de Base de Datos

Para tener el sistema EcuContable Pro 100% funcional con persistencia en PostgreSQL y los catálogos del SRI actualizados, ejecuta los siguientes scripts SQL en **ORDEN ESTRICTO**:

## 1. Estructura Principal
**Archivo:** `database/postgres_schema.sql`
- Crea todas las tablas transaccionales (facturas, asientos, usuarios).
- Crea tipos ENUM y funciones de auditoría.

## 2. Índices y Optimización
**Archivo:** `database/postgresql_indexes.sql`
- Crea índices B-Tree, GIN y parciales para rendimiento.

## 3. Schema de Catálogos (NUEVO ⭐)
**Archivo:** `database/catalogs_schema.sql`
- Crea las tablas `catalogos_tipos` y `catalogos_items`.
- Necesario para eliminar datos quemados del código.

## 4. Carga de Catálogos SRI (NUEVO ⭐)
**Archivo:** `database/sri_catalogs_data.sql`
- Inserta códigos oficiales del SRI (IVA, Comprobantes, Bancos).

## 5. Datos de Prueba (Opcional - Solo Desarrollo)
**Archivo:** `database/seed_data.sql`
- Crea empresa demo, usuario admin y productos de ejemplo.

---

### 📝 Comando rápido (psql en Windows)

```powershell
# Asumiendo que estás en la raíz del proyecto
psql -U postgres -d ecucontable -f database/postgres_schema.sql
psql -U postgres -d ecucontable -f database/postgresql_indexes.sql
psql -U postgres -d ecucontable -f database/catalogs_schema.sql
psql -U postgres -d ecucontable -f database/sri_catalogs_data.sql

# Solo si es entorno de desarrollo
psql -U postgres -d ecucontable -f database/seed_data.sql
```

---

### 🔄 Endpoint de Catálogos
Para consumir estos datos desde el Frontend, usa:
`GET /api/catalogos?codigos=SRI_TIPO_COMPROBANTE,SRI_IMPUESTO_IVA`

Esto devolverá un objeto JSON estructurado con los listados listos para usar en `<select>`.
