# Mejoras en la UI - Información del Certificado Digital

## Fecha: 26/01/2026

## Objetivo
Enriquecer la interfaz de usuario para mostrar información detallada del certificado digital P12 en la página de configuración, proporcionando mayor visibilidad sobre el estado y metadatos del certificado.

## Cambios Realizados

### 1. Estados Adicionales en el Componente

Se agregaron nuevos estados para almacenar los metadatos completos del certificado:

```typescript
// Estados adicionales para metadatos del certificado
const [certFechaEmision, setCertFechaEmision] = useState<string | null>(null);
const [certFechaExpiracion, setCertFechaExpiracion] = useState<string | null>(null);
const [certSujeto, setCertSujeto] = useState<string | null>(null);
const [certEmisor, setCertEmisor] = useState<string | null>(null);
const [certNumeroSerie, setCertNumeroSerie] = useState<string | null>(null);
const [certDiasRestantes, setCertDiasRestantes] = useState<number | null>(null);
const [certEstado, setCertEstado] = useState<'VIGENTE' | 'PROXIMO_A_VENCER' | 'EXPIRADO' | 'SIN_CERTIFICADO'>('SIN_CERTIFICADO');
```

### 2. Integración con API de Metadatos

Se modificó el `useEffect` para consumir el nuevo endpoint `/api/configuracion/sri/metadata`:

**Antes:**
```typescript
const response = await fetch(`/api/configuracion/sri?ambiente=${ambiente}`);
```

**Después:**
```typescript
const response = await fetch(`/api/configuracion/sri/metadata?ambiente=${ambiente}`);
```

Esto permite obtener:
- Fecha de emisión y expiración
- Sujeto (Subject DN) y Emisor (Issuer DN)
- Número de serie
- Días restantes hasta expiración
- Estado calculado del certificado

### 3. UI Mejorada - Información del Certificado

La sección "Estado del Certificado" ahora muestra:

#### 📊 Indicadores Visuales por Estado

| Estado | Color | Descripción |
|--------|-------|-------------|
| **VIGENTE** | 🟢 Verde | Certificado válido, más de 30 días restantes |
| **PRÓXIMO A VENCER** | 🟡 Amarillo | Entre 1 y 30 días restantes |
| **EXPIRADO** | 🔴 Rojo | Certificado vencido |
| **SIN_CERTIFICADO** | ⚪ Gris | No hay certificado configurado |

#### 📋 Información Mostrada

1. **Estado**: Badge con código de colores según vigencia
2. **Días Restantes**: Contador con color dinámico según proximidad de vencimiento
3. **Fecha Emisión**: Fecha de inicio de validez (notBefore)
4. **Fecha Expiración**: Fecha de fin de validez (notAfter)
5. **Número de Serie**: Identificador único del certificado
6. **Sujeto (Subject DN)**: Información del titular del certificado
7. **Emisor (Issuer DN)**: Autoridad certificadora emisora

#### 🎨 Características Visuales

- **Colores dinámicos**: Verde (>30 días), Amarillo (8-30 días), Rojo (<7 días o expirado)
- **Tipografía monoespaciada**: Para números de serie y fechas
- **Texto adaptable**: DNs largos con `break-all` para evitar desbordamiento
- **Iconos contextuales**: Shield con color según estado

### 4. Actualización Post-Guardado

Después de guardar un nuevo certificado, el sistema automáticamente:
1. Guarda el certificado en el servidor
2. Consulta los metadatos completos
3. Actualiza todos los estados con la información fresca
4. Muestra advertencias si el certificado está próximo a vencer

```typescript
// Recargar metadatos completos del certificado
const metadataResponse = await fetch(`/api/configuracion/sri/metadata?ambiente=${ambiente}`);
if (metadataResponse.ok) {
    const metadata = await metadataResponse.json();
    // Actualizar todos los estados...
}
```

## Archivos Modificados

### Frontend
- ✅ `src/app/(dashboard)/configuracion/page.tsx`

### API Utilizada
- ✅ `GET /api/configuracion/sri/metadata` - Obtiene metadatos completos

## Beneficios

### Para el Usuario
1. **Mayor Transparencia**: Visibilidad completa de los detalles del certificado
2. **Alertas Tempranas**: Advertencias visuales antes del vencimiento
3. **Trazabilidad**: Información completa de emisor y titular
4. **Verificación Rápida**: Estado del certificado a simple vista

### Para el Sistema
1. **Prevención de Errores**: Evita intentos de facturar con certificados expirados
2. **Auditoría**: Registro completo de información del certificado
3. **Usabilidad**: Interfaz más informativa y profesional

## Screenshots de la UI

### Certificado Vigente (>30 días)
```
┌─────────────────────────────────────────┐
│ 🟢 Información del Certificado Digital │
├─────────────────────────────────────────┤
│ Estado:           [VIGENTE]             │
│ Días Restantes:   120 días             │
│ Fecha Emisión:    2024-01-15           │
│ Fecha Expiración: 2026-05-25           │
│ Número de Serie:  1A2B3C4D5E           │
│ Sujeto:          CN=EMPRESA SA, O=EC   │
│ Emisor:          CN=Security Data, C=EC│
└─────────────────────────────────────────┘
```

### Certificado Próximo a Vencer (≤30 días)
```
┌─────────────────────────────────────────┐
│ 🟡 Información del Certificado Digital │
├─────────────────────────────────────────┤
│ Estado:           [PRÓXIMO A VENCER]   │
│ Días Restantes:   15 días ⚠️          │
│ ...                                     │
└─────────────────────────────────────────┘
```

### Sin Certificado
```
┌─────────────────────────────────────────┐
│ ⚪ Información del Certificado Digital │
├─────────────────────────────────────────┤
│        ⚠️                               │
│   No se ha configurado ningún          │
│   certificado digital.                  │
│   Suba un archivo .p12 para            │
│   configurar la firma electrónica.      │
└─────────────────────────────────────────┘
```

## Testing Recomendado

### Casos de Prueba

1. **Certificado Nuevo**
   - Subir certificado con más de 30 días de vigencia
   - Verificar que muestra estado VIGENTE en verde
   - Verificar que todos los metadatos se muestran correctamente

2. **Certificado Próximo a Vencer**
   - Usar certificado con 15 días de vigencia
   - Verificar badge amarillo "PRÓXIMO A VENCER"
   - Verificar contador de días en amarillo

3. **Certificado Expirado**
   - Intentar subir certificado expirado
   - Verificar que el sistema lo rechaza
   - Verificar mensaje de error apropiado

4. **Sin Certificado**
   - Nueva empresa sin certificado
   - Verificar mensaje "No se ha configurado"
   - Verificar icono de advertencia

5. **Cambio de Ambiente**
   - Configurar certificado en PRUEBAS
   - Cambiar a PRODUCCION
   - Verificar que muestra "Sin certificado" o datos del ambiente correcto

## Compatibilidad

- ✅ React 19.x
- ✅ Next.js 16.x
- ✅ Tailwind CSS 4.x
- ✅ TypeScript 5.8

## Notas Adicionales

- Los DNs (Distinguished Names) pueden ser largos, se usa `break-all` para permitir saltos de línea
- El componente es responsivo y se adapta a diferentes tamaños de pantalla
- Los colores siguen la paleta de diseño del sistema
- La información se actualiza automáticamente al cambiar de ambiente SRI

## Próximos Pasos Sugeridos

1. **Notificaciones Proactivas**: Email/SMS cuando falten X días para vencer
2. **Historial**: Mostrar certificados anteriores y sus períodos de uso
3. **Validación Temprana**: Advertencia al cargar archivo antes de guardar
4. **Exportar Información**: Botón para descargar reporte PDF del certificado

---

**Implementado por**: Sistema de Facturación Electrónica  
**Fecha**: 26 de enero de 2026  
**Versión**: 1.0
