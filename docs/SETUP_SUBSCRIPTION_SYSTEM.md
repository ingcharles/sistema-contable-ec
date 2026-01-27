# Configuración del Sistema de Suscripciones

## ⚙️ Pasos de Configuración

### 1. Ejecutar Script de Planes (REQUERIDO)

El sistema de suscripciones requiere que se ejecute el script de configuración de planes:

```bash
psql -U postgres -d ecucontabledb -f src/scripts/setup_plans.sql
```

Este script crea:
- ✅ Tablas de planes (`seguridad.planes`)
- ✅ Características de planes (`seguridad.plan_caracteristicas`)
- ✅ Estadísticas de uso (`seguridad.usuario_estadisticas_uso`)
- ✅ Columnas en tabla usuarios: `plan_id`, `estado_plan`, `fecha_inicio_plan`, `fecha_fin_plan`
- ✅ Planes por defecto: GRATUITO, PROFESIONAL, EMPRESARIAL

### 2. Verificar Ejecución

Verifica que las columnas existan:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'seguridad' 
  AND table_name = 'usuarios' 
  AND column_name IN ('plan_id', 'estado_plan', 'fecha_inicio_plan', 'fecha_fin_plan');
```

Deberías ver:
```
     column_name      |     data_type     
----------------------+-------------------
 plan_id              | uuid
 estado_plan          | USER-DEFINED (estado_plan_usuario)
 fecha_inicio_plan    | timestamp
 fecha_fin_plan       | timestamp
```

### 3. Asignar Plan a Usuario (Opcional)

Si deseas asignar un plan específico a un usuario:

```sql
-- Obtener ID del plan gratuito
SELECT id FROM seguridad.planes WHERE codigo = 'GRATUITO';

-- Asignar plan al usuario
UPDATE seguridad.usuarios 
SET 
    plan_id = (SELECT id FROM seguridad.planes WHERE codigo = 'GRATUITO'),
    estado_plan = 'ACTIVO',
    fecha_inicio_plan = NOW(),
    fecha_fin_plan = NOW() + INTERVAL '1 year'
WHERE email = 'admin@ecucontable.com';
```

## 📊 Arquitectura Implementada

### UseCase Pattern
El sistema ahora usa `UsuariosUseCases` en `systemUseCases.ts`:

```typescript
// Uso en componentes React
import { UsuariosUseCases } from '@/modules/shared/application/useCases/systemUseCases';

const subscriptionData = await UsuariosUseCases.obtenerSuscripcion();
const usageStats = await UsuariosUseCases.obtenerEstadisticasUso('2026-01');
```

### API Routes
- **GET** `/api/users/me/subscription` - Obtiene plan y características del usuario actual
- **GET** `/api/users/me/usage?periodo=YYYY-MM` - Obtiene estadísticas de uso mensual

### Flujo de Datos
```
AuthContext → UsuariosUseCases.obtenerSuscripcion() → /api/users/me/subscription
                      ↓                                           ↓
              BaseUseCase.request()                    validateContext(req)
              (headers automáticos)                    (x-usuario-id requerido)
```

## 🔧 Headers Automáticos

`BaseUseCase` automáticamente incluye:
- ✅ `x-empresa-id` (desde localStorage)
- ✅ `x-usuario-id` (desde localStorage)
- ✅ `Content-Type: application/json`

## ⚠️ Troubleshooting

### Error: "Error al obtener suscripción"

**Causa**: Columnas de plan no existen en la tabla `usuarios`

**Solución**: Ejecutar `src/scripts/setup_plans.sql`

### Error: "Usuario no encontrado"

**Causa**: `x-usuario-id` no está presente en headers

**Solución**: Verificar que `localStorage.getItem('current_usuario_id')` tenga un valor válido

### Sin plan asignado (planId null)

**Respuesta esperada**:
```json
{
  "planStatus": null,
  "planId": null,
  "usageStats": {
    "createdCompanies": 0,
    "currentMonthDocs": 0
  }
}
```

Esto es normal si el usuario no tiene un plan asignado. Asigna uno manualmente usando el SQL de arriba.

## 📝 Planes Disponibles

| Código | Nombre | Precio Mensual | Características |
|--------|--------|----------------|-----------------|
| GRATUITO | Plan Gratuito | $0.00 | 1 empresa, 30 facturas/mes |
| PROFESIONAL | Plan Profesional | $29.99 | 5 empresas, 500 facturas/mes |
| EMPRESARIAL | Plan Empresarial | $99.99 | Empresas ilimitadas, sin límites |
