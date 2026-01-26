# 📦 SISTEMA DE INVENTARIO COMPLETO - GUÍA DE USO

## ✅ IMPLEMENTACIONES COMPLETADAS

### 1. **Modal de Ajuste de Stock** ✨
- Botón "Nuevo Ajuste" agregado al KardexModal
- Interfaz completa para registrar movimientos de inventario
- Soporte para 6 tipos de movimiento

### 2. **Integración Compras → Kardex** 🛒
- Las facturas de compra ahora actualizan automáticamente el inventario
- Se registra cada producto comprado en el kardex
- Cálculo automático de costo promedio ponderado

### 3. **Tipos de Movimiento Ampliados** 🔄
- `ENTRADA`: Compras normales de mercadería
- `SALIDA`: Ventas y egresos
- `AJUSTE_POSITIVO`: Correcciones al alza
- `AJUSTE_NEGATIVO`: Mermas, daños, pérdidas
- `DEVOLUCION_VENTA`: Cliente devuelve mercadería (+ inventario)
- `DEVOLUCION_COMPRA`: Devolver mercadería al proveedor (- inventario)
- `TRANSFERENCIA_ENTRADA/SALIDA`: Movimientos entre bodegas

---

## 📋 PASOS PARA EJECUTAR LAS MIGRACIONES

### **Paso 1: Ejecutar Migraciones SQL**

Ejecuta los siguientes archivos SQL en este orden:

```bash
# 1. Tabla de detalle de compras
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/002_add_compras_detalle.sql

# 2. Tipos de movimiento adicionales
psql -U tu_usuario -d tu_base_de_datos -f database/migrations/003_add_kardex_movimiento_types.sql
```

O manualmente desde tu cliente PostgreSQL (pgAdmin, DBeaver, etc):

**002_add_compras_detalle.sql**:
```sql
CREATE TABLE IF NOT EXISTS compras.compras_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compra_id UUID NOT NULL REFERENCES compras.compras(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES inventario.productos(id),
    descripcion VARCHAR(500) NOT NULL,
    cantidad NUMERIC(18,4) NOT NULL,
    precio_unitario NUMERIC(18,6) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    porcentaje_iva NUMERIC(5,2) DEFAULT 0,
    valor_iva NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_detalle_compra ON compras.compras_detalle(compra_id);
CREATE INDEX IF NOT EXISTS idx_compras_detalle_producto ON compras.compras_detalle(producto_id);
```

**003_add_kardex_movimiento_types.sql**:
```sql
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'DEVOLUCION_COMPRA';
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'DEVOLUCION_VENTA';
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_ENTRADA';
ALTER TYPE inventario.tipo_movimiento_kardex ADD VALUE IF NOT EXISTS 'TRANSFERENCIA_SALIDA';
```

---

## 🎯 FLUJO COMPLETO DE INVENTARIO

### **1. CREAR PRODUCTO**
1. Ir a **Inventario → Kardex & Productos**
2. Clic en **"Nuevo"**
3. Llenar:
   - Nombre
   - Código
   - Categoría
   - Precio de venta
   - Stock mínimo
4. Guardar

**Resultado**: Producto creado con stock 0 + registro inicial en kardex

---

### **2. REGISTRAR COMPRA (Alimentar Inventario)** 🛒

#### **Opción A: Mediante Compras (Recomendado)**

**Payload esperado** en `POST /api/compras`:

```json
{
  "proveedorId": "1234567890001",
  "tipoComprobante": "01",
  "secuencial": "001-001-000000123",
  "autorizacion": "1234567890",
  "fechaEmision": "2026-01-24",
  "fechaRegistro": "2026-01-24",
  "sustento": "01",
  "descripcion": "Compra de mercadería",
  "subtotalIva": 100.00,
  "subtotal0": 0,
  "montoIva": 15.00,
  "total": 115.00,
  "detalles": [
    {
      "productoId": "uuid-del-producto",
      "descripcion": "COCINA ELECTRICA",
      "cantidad": 10,
      "precioUnitario": 10.00,
      "subtotal": 100.00,
      "porcentajeIva": 15,
      "valorIva": 15.00,
      "total": 115.00
    }
  ]
}
```

**Qué hace**:
- ✅ Registra la factura de compra
- ✅ Actualiza stock: `stock_actual = stock_actual + cantidad`
- ✅ Calcula costo promedio ponderado
- ✅ Registra movimiento tipo `ENTRADA` en kardex
- ✅ Crea cuenta por pagar

---

#### **Opción B: Ajuste Manual (Para inventarios iniciales)**

1. Ir a **Inventario → Kardex & Productos**
2. Clic en **"Kardex"** del producto
3. Clic en **"Nuevo Ajuste"**
4. Seleccionar tipo: **"Entrada"** o **"Ajuste +"**
5. Ingresar:
   - Bodega
   - Cantidad
   - Costo unitario
   - Referencia: "INVENTARIO_INICIAL_2026"
6. Guardar

**Qué hace**:
- ✅ Actualiza stock
- ✅ Calcula nuevo costo promedio
- ✅ Registra movimiento en kardex

---

### **3. REGISTRAR VENTA** 🧾
- Al emitir una factura desde **Facturación**, automáticamente:
  - ✅ Reduce el stock
  - ✅ Registra movimiento tipo `SALIDA` en kardex
  - ✅ Utiliza el costo promedio actual

---

### **4. DEVOLUCIONES**

#### **Devolución de Cliente (Nota de Crédito)**
1. Ir a Kardex del producto
2. Nuevo Ajuste → **"Dev. Cliente"**
3. Ingresar cantidad devuelta
4. Referencia: Número de nota de crédito

**Resultado**: Stock aumenta, se registra como `DEVOLUCION_VENTA`

#### **Devolución a Proveedor**
1. Ir a Kardex del producto
2. Nuevo Ajuste → **"Dev. Proveedor"**
3. Ingresar cantidad devuelta
4. Referencia: Nota de crédito del proveedor

**Resultado**: Stock disminuye, se registra como `DEVOLUCION_COMPRA`

---

### **5. AJUSTES Y CORRECCIONES**

#### **Mercadería encontrada / Error en sistema**
- Tipo: **"Ajuste +"**
- Observaciones: Justificar el ajuste

#### **Mercadería dañada / Merma / Pérdida**
- Tipo: **"Ajuste -"**
- Observaciones: Motivo del daño/pérdida

---

## 🔍 VERIFICACIÓN DEL KARDEX

### **Ver Historial Completo**
1. Ir a producto
2. Clic en **"Kardex"**
3. Ver tabla con:
   - Fecha
   - Tipo de movimiento
   - Entradas (cantidad, costo, total)
   - Salidas (cantidad, costo, total)
   - Saldos (cantidad, costo promedio, valor total)

### **Columnas del Kardex**:
- **Entradas**: Compras, devoluciones de clientes, ajustes +
- **Salidas**: Ventas, devoluciones a proveedores, ajustes -
- **Saldo Cantidad**: Stock actual después de cada movimiento
- **Costo Promedio**: Costo ponderado después de cada movimiento
- **Saldo Valor**: Valor total del inventario (cantidad × costo promedio)

---

## ⚙️ CONFIGURACIÓN INICIAL

### **1. Crear Bodegas**
1. Ir a **Inventario → Configuración → Bodegas**
2. Clic en **"Nueva Bodega"**
3. Llenar:
   - Nombre: "BODEGA PRINCIPAL"
   - Sucursal
   - Responsable
4. Guardar

**Importante**: La primera bodega creada se usa automáticamente en los movimientos

### **2. Crear Categorías**
1. Ir a **Inventario → Configuración → Categorías**
2. Clic en **"Nueva Categoría"**
3. Llenar:
   - Nombre: "ELECTRODOMÉSTICOS"
   - Cuenta Inventario: Cuenta contable del activo
   - Cuenta Costo Venta: Cuenta del gasto
   - Cuenta Venta: Cuenta del ingreso
4. Guardar

---

## 📊 REPORTES Y CONSULTAS

### **Productos con Stock Bajo**
- Usar filtro `stockBajo=true` en la API
- La tabla muestra badge rojo "Stock Bajo" cuando `stock_actual <= stock_minimo`

### **Exportar Inventario**
- Clic en **"Exportar Excel"**
- Descarga CSV con todos los productos

---

## 🚨 VALIDACIONES IMPORTANTES

### **El sistema NO permite**:
- ❌ Stock negativo en salidas/ventas
- ❌ Movimientos sin bodega
- ❌ Compras sin detalle de productos (si se envía array vacío)

### **El sistema SÍ calcula automáticamente**:
- ✅ Costo promedio ponderado
- ✅ Stock resultante
- ✅ Valor total del inventario

---

## 📝 EJEMPLO PRÁCTICO COMPLETO

```
DÍA 1: Crear producto "COCINA"
- Código: 001
- Precio Venta: $500
- Stock: 0
→ Se crea registro kardex inicial con stock 0

DÍA 2: Compra a proveedor (Factura 001-001-123)
- Cantidad: 10 unidades
- Costo: $300 c/u
→ Stock: 10 | Costo Promedio: $300

DÍA 3: Segunda compra (Factura 001-001-124)
- Cantidad: 5 unidades
- Costo: $320 c/u
→ Stock: 15 | Costo Promedio: $306.67
  Cálculo: (10×300 + 5×320) / 15 = 4600/15 = 306.67

DÍA 4: Venta a cliente (Factura 001-001-001)
- Cantidad: 3 unidades
→ Stock: 12 | Costo Promedio: $306.67
  Costo de Venta registrado: 3 × 306.67 = $920.01

DÍA 5: Cliente devuelve 1 unidad (N/C 001-001-001)
- Tipo: DEVOLUCION_VENTA
- Cantidad: 1
→ Stock: 13 | Costo Promedio: $306.67

DÍA 6: Daño de 2 unidades (Acta de baja)
- Tipo: AJUSTE_NEGATIVO
- Cantidad: 2
→ Stock Final: 11
```

---

## 🎓 RECOMENDACIONES CONTABLES

1. **Documentar todo**: Cada movimiento debe tener referencia de documento
2. **Inventarios físicos periódicos**: Usar ajustes para reconciliar
3. **Autorización**: Ajustes negativos deben estar autorizados
4. **Backup diario**: El kardex es información crítica
5. **Auditoría**: Revisar kardex mensualmente para detectar anomalías

---

## 🔧 ARCHIVOS MODIFICADOS/CREADOS

### **Nuevos Archivos**:
- `src/modules/inventario/ui/components/AjusteStockModal.tsx`
- `database/migrations/002_add_compras_detalle.sql`
- `database/migrations/003_add_kardex_movimiento_types.sql`

### **Archivos Modificados**:
- `src/app/api/inventario/productos/route.ts` (registro inicial en kardex)
- `src/app/api/inventario/kardex/route.ts` (nuevos tipos de movimiento)
- `src/app/api/compras/route.ts` (integración con kardex)
- `src/modules/inventario/ui/components/KardexModal.tsx` (botón ajuste)
- `src/modules/inventario/domain/types.ts` (enum actualizado)

---

## ✅ ESTADO FINAL

| Funcionalidad | Estado |
|--------------|--------|
| Inventario Inicial | ✅ Implementado |
| Compras → Kardex | ✅ Implementado |
| Ventas → Kardex | ✅ Ya existía |
| Ajustes Manuales (UI) | ✅ Implementado |
| Devoluciones | ✅ Implementado |
| Transferencias Bodegas | ⚠️ Estructura lista, falta UI |
| Costo Promedio Ponderado | ✅ Implementado |
| Kardex Valorado | ✅ Implementado |

---

**Sistema listo para usar según mejores prácticas contables ecuatorianas** 🇪🇨 ✅
