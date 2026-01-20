# EcuContable Pro - Actualización de Arquitectura Backend

## 🔧 Implementaciones Completadas

### 1. ✅ Conexión PostgreSQL Real

#### **Cliente de Base de Datos** (`src/shared/infrastructure/database/postgresql.ts`)
- **Pool de Conexiones**: Máximo 20 conexiones concurrentes
- **Context Management**: Automáticamente establece `app.current_user_id` y `app.current_empresa_id` para auditoría
- **Transaction Support**: Método `transaction()` para operaciones atómicas
- **Error Handling**: Manejo robusto de errores con logging

**Ejemplo de Uso:**
```typescript
import { db } from '@/shared/infrastructure/database/postgresql';

const result = await db.query(
    {
        text: 'SELECT * FROM plan_cuentas WHERE empresa_id = $1',
        values: [empresaId]
    },
    { empresaId, usuarioId }
);
```

---

### 2. ✅ Autenticación JWT

#### **Servicio JWT** (`src/shared/infrastructure/auth/jwt.ts`)
- **Access Token**: Duración configurable (default: 8h)
- **Refresh Token**: Duración de 7 días
- **Payload Estandarizado**: `{ userId, empresaId, email, rol }`
- **Verificación**: Con issuer y audience validation

#### **Middleware de Autenticación** (actualizado `src/shared/middleware/authContext.ts`)
- **Soporte dual**: JWT (prioritario) + Headers legacy (fallback)
- **Helper `withAuth`**: Protección declarativa de rutas

**Ejemplo de Uso:**
```typescript
// Generar token al login
const token = JWTService.generateAccessToken({
    userId: user.id,
    empresaId: empresa.id,
    email: user.email,
    rol: user.rol
});

// Proteger ruta
export const GET = withAuth(async (req, context) => {
    // context.empresaId y context.usuarioId ya están disponibles
    return NextResponse.json({ data: '...' });
});
```

---

### 3. ✅ Paginación en APIs

#### **Utilidades de Paginación** (`src/shared/utils/pagination.ts`)
- **Parámetros**: `?page=1&limit=10` (max 100 items por página)
- **Respuesta Estandarizada**:
```typescript
{
    data: [...],
    pagination: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: false
    }
}
```

#### **Implementaciones SQL**
- Helper `getPaginationSQL()` para queries
- Automática en todos los endpoints `GET` de listado

---

## 📁 Endpoints Refactorizados

### **Contabilidad**

#### `GET /api/contabilidad/cuentas`
```http
GET /api/contabilidad/cuentas?page=1&limit=20&incluirInactivas=false
Authorization: Bearer <JWT_TOKEN>
```
**Características:**
✅ Paginación automática  
✅ Filtro por estado activo/inactivo  
✅ Consulta PostgreSQL real  
✅ Auditoría automática

#### `POST /api/contabilidad/cuentas`
```http
POST /api/contabilidad/cuentas
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
    "codigo": "1.1.01.05",
    "nombre": "Bancos",
    "tipo": "ACTIVO",
    "nivel": 4,
    "saldo": 0,
    "activa": true
}
```
**Características:**
✅ Upsert (INSERT ... ON CONFLICT UPDATE)  
✅ Validación de campos Required  
✅ Auditoría automática con `usuario_id`

#### `DELETE /api/contabilidad/cuentas/{codigo}`
```http
DELETE /api/contabilidad/cuentas/1.1.01.05
Authorization: Bearer <JWT_TOKEN>
```
**Características:**
✅ Soft delete (marca como `activa=false`)  
✅ Verificación de subcuentas antes de eliminar  
✅ Auditoría automática

---

#### `GET /api/contabilidad/asientos`
```http
GET /api/contabilidad/asientos?page=1&limit=10&estado=MAYORIZADO&desde=2024-01-01&hasta=2024-12-31
Authorization: Bearer <JWT_TOKEN>
```
**Características:**
✅ Paginación  
✅ Filtros por estado, fecha desde/hasta  
✅ Incluye detalles del asiento (JSON_AGG)  
✅ Ordenado por fecha descendente

#### `POST /api/contabilidad/asientos`
```http
POST /api/contabilidad/asientos
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
    "numero": "ASI-2024-001",
    "fecha": "2024-01-20",
    "glosa": "Asiento de apertura",
    "centroCosto": "uuid-centro-1",
    "detalles": [
        {
            "cuentaCodigo": "1.1.01.01",
            "debe": 1000.00,
            "haber": 0,
            "concepto": "Ingreso caja"
        },
        {
            "cuentaCodigo": "3.1.01.01",
            "debe": 0,
            "haber": 1000.00,
            "concepto": "Capital"
        }
    ]
}
```
**Características:**
✅ **Validación de cuadratura**: Debe = Haber (tolerancia 0.01)  
✅ **Transacción atómica**: Cabecera + Detalles  
✅ **Estado inicial**: `BORRADOR`  
✅ **Auditoría multiusuario**

---

## 🔐 Variables de Entorno

Crea un archivo `.env.local` basándote en `.env.example`:

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecucontable
DB_USER=postgres
DB_PASSWORD=tu_password_seguro

# JWT
JWT_SECRET=secreto-super-seguro-de-produccion
JWT_REFRESH_SECRET=secreto-refresh-super-seguro
JWT_EXPIRES_IN=8h
```

---

## 🚀 Instalación de Dependencias

```bash
npm install pg @types/pg jsonwebtoken @types/jsonwebtoken
```

---

## 🔄 Migración desde Mock a PostgreSQL

### **Frontend (UseCases)** - Sin Cambios
Los componentes UI siguen usando exactamente los mismos métodos:
```typescript
const cuentas = await ContabilidadUseCases.listarCuentas();
```

### **Backend (APIs)** - Ahora con PostgreSQL
Las APIs ahora ejecutan queries reales en vez de retornar mocks.

---

## 📊 Arquitectura de Datos

```
┌─────────────────┐
│   Frontend UI   │
│  (Next.js)      │
└────────┬────────┘
         │ UseCases
         ▼
┌─────────────────┐
│  API Routes     │
│  (/api/...)     │
└────────┬────────┘
         │ validateContext()
         │ JWT o Headers
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  Client (Pool)  │
└────────┬────────┘
         │ set_config()
         │ (context)
         ▼
┌─────────────────┐
│  PostgreSQL DB  │
│  (Tables)       │
│  + Audit Trig.  │
└─────────────────┘
```

---

## ✨ Próximos Pasos Sugeridos

1. **Login API con JWT**: Endpoint `/api/auth/login` que devuelva tokens
2. **Refresh Token Flow**: Endpoint `/api/auth/refresh`
3. **Actualizar Frontend**: Guardar JWT en httpOnly cookies o memoria
4. **Más Endpoints**: Migrar el resto de APIs (inventario, nómina, etc.) a PostgreSQL
5. **Testing**: Crear tests unitarios e integración

---

## 📝 Notas de Seguridad

⚠️ **Producción:**
- Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Usar HTTPS en todas las comunicaciones
- Almacenar JWT en httpOnly cookies (no localStorage)
- Implementar rate limiting
- Validar todos los inputs con esquemas (Zod/Yup)

---

**Fecha de Implementación**: 2024-01-20  
**Autor**: Sistema EcuContable Pro - Arquitectura Backend  
**Versión**: 2.0
