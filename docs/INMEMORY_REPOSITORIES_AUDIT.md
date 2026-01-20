# Auditoría de Repositorios InMemory y Estado de Migración

**Fecha**: 2026-01-20
**Objetivo**: Identificar todos los repositorios `InMemory` restantes y crear un plan para su eliminación

---

## ✅ Módulos CON Hooks Personalizados Creados

### 1. **Inventario** ✅
- **Hooks**: `useInventario.ts`, `useKardex.ts`
- **UseCase**: `InventarioUseCases`
- **Estado**: ✅ **COMPLETADO** - Repositorio InMemory eliminado
- **Componentes migrados**:
  - `ProductoModal` → Usa `useInventario` y `useInventarioMutations`
  - `KardexModal` → Usa `useKardex`
  - `BodegaModal` → Usa `InventarioUseCases.guardarBodega`
  - `CategoriaModal` → Usa `InventarioUseCases` (Create/Update)
  - `FacturaForm` → Usa `InventarioUseCases.listarProductos`

### 2. **Contabilidad** ✅
- **Hook**: `useContabilidad.ts` (NUEVO)
  - `useCuentasContables`
  - `useAsientosContables`
  - `useCentrosCostos`
  - `useContabilidadMutations`
  - `useReportesContables`
- **UseCase**: `ContabilidadUseCases`
- **Estado**: ⚠️ **HOOKS CREADOS - PENDIENTE MIGRACIÓN**
- **InMemory Repository**: `InMemoryContabilidadRepository` **AÚN EN USO**

### 3. **Bancos** ✅
- **Hook**: `useBancos.ts` (NUEVO)
  - `useCuentasBancarias`
  - `useMovimientosBancarios`
  - `useBancosMutations`
- **UseCase**: `BancosUseCases`
- **Estado**: ⚠️ **HOOKS CREADOS - PENDIENTE MIGRACIÓN**
- **InMemory Repository**: `InMemoryBancosRepository` **AÚN EN USO**

### 4. **Nómina** ✅
- **Hook**: `useNomina.ts` (NUEVO)
  - `useEmpleados`
  - `useRolesPago`
  - `useNominaMutations`
- **UseCase**: `NominaUseCases`
- **Estado**: ⚠️ **HOOKS CREADOS - PENDIENTE MIGRACIÓN**
- **InMemory Repository**: `InMemoryNominaRepository` **AÚN EN USO**

### 5. **Cartera** ✅
- **Hook**: `useCartera.ts` (NUEVO)
  - `useCuentasPorCobrar`
  - `useDocumentosPendientes`
  - `useAnticipos`
  - `useCarteraMutations`
- **UseCase**: `CarteraUseCases`
- **Estado**: ⚠️ **HOOKS CREADOS - PENDIENTE MIGRACIÓN**
- **InMemory Repository**: `InMemoryCarteraRepository` **AÚN EN USO**

### 6. **Facturación** ✅
- **Hook**: `useFacturacion.ts` (NUEVO)
  - `useComprobantes`
  - `useGuiasRemision`
  - `useFacturacionMutations`
- **UseCase**: `FacturacionUseCases`
- **Estado**: ⚠️ **HOOKS CREADOS - PENDIENTE MIGRACIÓN**
- **InMemory Repositories**: 
  - `InMemoryVentasRepository` **AÚN EN USO**
  - `InMemoryGuiaRemisionRepository` **AÚN EN USO**

### 7. **Auditoría** ✅
- **Hook**: `useAuditoria.ts` (NUEVO)
  - `useAuditoria`
- **UseCase**: `AuditoriaUseCases`
- **Estado**: ⚠️ **HOOKS CREADOS - PENDIENTE MIGRACIÓN**
- **InMemory Repository**: `InMemoryAuditoriaRepository` **AÚN EN USO**

---

## ⚠️ Módulos CON Repositorios InMemory (SIN Hooks ni UseCases)

### 8. **Directorio**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE en `systemUseCases.ts`
- **InMemory Repository**: `InMemoryDirectorioRepository`
- **Componentes afectados**:
  - `TerceroModal.tsx` (2 usos)
  - `FacturaForm.tsx` (1 uso)
  - `RegistroAnticipoModal.tsx` (1 uso)
  - `directorio/page.tsx` (3 usos)
- **Acción requerida**: 
  - Crear endpoint `/api/directorio/terceros` (GET, POST, PUT, DELETE)
  - Crear `DirectorioUseCases` en `systemUseCases.ts`
  - Crear hook `useDirectorio.ts`

### 9. **Configuración**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE en `systemUseCases.ts`
- **InMemory Repository**: `InMemoryConfiguracionRepository`
- **Componentes afectados**:
  - `BodegaModal.tsx` (sucursales)
  - `RetencionModal.tsx`
  - `PuntoEmisionModal.tsx`
  - `CruceCuentasModal.tsx`
  - `RegistroAnticipoModal.tsx`
  - `CobroPagoModal.tsx`
  - `NuevaCompraModal.tsx`
  - `configuracion/page.tsx` (4 usos)
- **Acción requerida**:
  - Crear endpoints `/api/configuracion/*` (empresas, sucursales, retenciones, puntos de emisión)
  - Crear `ConfiguracionUseCases` en `systemUseCases.ts`
  - Crear hook `useConfiguracion.ts`

### 10. **Compras**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE en `systemUseCases.ts`
- **InMemory Repository**: `InMemoryCompraRepository`
- **Componentes afectados**:
  - `NuevaOrdenModal.tsx`
  - `NuevaCompraModal.tsx` (múltiples usos)
- **Acción requerida**:
  - Crear endpoints `/api/compras/ordenes` y `/api/compras/facturas`
  - Crear `ComprasUseCases` en `systemUseCases.ts`
  - Crear hook `useCompras.ts`

### 11. **Impuestos**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE en `systemUseCases.ts`
- **InMemory Repository**: `InMemoryImpuestosRepository`
- **Componentes afectados**: *(Requiere búsqueda detallada)*
- **Acción requerida**:
  - Crear endpoints `/api/impuestos/*` (declaraciones, retenciones, ATS)
  - Crear `ImpuestosUseCases`
  - Crear hook `useImpuestos.ts`

### 12. **Caja Chica**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE en `systemUseCases.ts`
- **InMemory Repository**: `InMemoryCajaChicaRepository`
- **Componentes afectados**:
  - `MovimientoCajaModal.tsx`
- **Acción requerida**:
  - Crear endpoints `/api/caja-chica/*`
  - Crear `CajaChicaUseCases`
  - Crear hook `useCajaChica.ts`

### 13. **Reportes**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE (pero hay métodos en `ContabilidadUseCases`)
- **InMemory Repository**: `InMemoryReportesRepository`
- **Componentes afectados**: *(Requiere búsqueda detallada)*
- **Acción requerida**:
  - Los reportes contables ya están en `ContabilidadUseCases`
  - Extender con reportes de otros módulos si es necesario
  - Crear hook `useReportes.ts` si se centraliza

### 14. **Activos**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE
- **InMemory Repository**: Detectado en búsqueda (archivo existe)
- **Acción requerida**: *(Requiere análisis de uso)*

### 15. **Buzón**
- **Hook**: ❌ NO EXISTE
- **UseCase**: ❌ NO EXISTE
- **InMemory Repository**: Detectado en búsqueda (archivo existe)
- **Acción requerida**: *(Requiere análisis de uso)*

---

## 📊 Resumen Estadístico

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| ✅ Hooks creados y migrados (Inventario) | 1 | 7% |
| ⚠️ Hooks creados, pendiente migración | 6 | 40% |
| ❌ Sin hooks, con InMemory activo | 8 | 53% |
| **TOTAL** | **15** | **100%** |

---

## 🎯 Plan de Acción Priorizado

### **FASE 1: Migrar componentes que YA tienen hooks** (Alta prioridad)
Estos módulos ya tienen hooks creados, solo falta refactorizar los componentes:

1. **Contabilidad** → Migrar componentes de `CategoriaModal`, `NuevaCompraModal`, `CobroPagoModal`, etc.
2. **Bancos** → Migrar `CobroPagoModal` y componentes del módulo Bancos
3. **Nómina** → Migrar `EmpleadoModal`
4. **Cartera** → Migrar `CobroPagoModal`, `CruceCuentasModal`, `RegistroAnticipoModal`
5. **Facturación** → Migrar `GuiaRemisionModal`
6. **Auditoría** → Migrar componentes de auditoría (si existen)

### **FASE 2: Crear backend + UseCases + Hooks para módulos críticos** (Prioridad media)
Estos módulos son de uso frecuente:

7. **Directorio** → Backend + UseCases + Hook + Migración (clientes/terceros son críticos)
8. **Configuración** → Backend + UseCases + Hook + Migración (sucursales, puntos de emisión)
9. **Compras** → Backend + UseCases + Hook + Migración

### **FASE 3: Completar módulos restantes** (Prioridad baja)
10. **Impuestos**
11. **Caja Chica**
12. **Activos**
13. **Buzón**
14. **Reportes** (consolidar)

---

## 🔍 Componentes que usan múltiples repositorios InMemory

Estos componentes son los más complejos de migrar porque dependen de varios módulos:

- **`CobroPagoModal.tsx`**: Usa 4 repos (Cartera, Configuración, Contabilidad, Bancos)
- **`CruceCuentasModal.tsx`**: Usa 3 repos (Cartera, Contabilidad, Configuración)
- **`RegistroAnticipoModal.tsx`**: Usa 3 repos (Directorio, Contabilidad, Configuración)
- **`NuevaCompraModal.tsx`**: Usa 3 repos (Compra, Configuración, Contabilidad)

**Recomendación**: Migrar estos componentes **al final** de cada fase, una vez que sus repos dependientes estén listos.

---

## ✅ Próximos Pasos Inmediatos

1. **Migrar `CategoriaModal.tsx`** → Reemplazar `InMemoryContabilidadRepository` con `useCuentasContables()`
2. **Migrar `EmpleadoModal.tsx`** → Usar hooks de `useNomina.ts`
3. **Migrar `GuiaRemisionModal.tsx`** → Usar hooks de `useFacturacion.ts`
4. **Crear backend y hooks para Directorio** (bloqueador importante)
5. **Crear backend y hooks para Configuración** (bloqueador importante)

---

**Nota**: Esta auditoría identifica **todos** los repositorios InMemory. La estrategia de migración debe ir módulo por módulo, priorizando aquellos con mayor impacto en la funcionalidad del usuario.
