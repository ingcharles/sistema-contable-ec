# 📘 DISEÑO DE SISTEMA CONTABLE MODERNO PARA ECUADOR

**(Clean Architecture + Cumplimiento SRI)**

Actúa como un **arquitecto de software senior**, especialista en sistemas contables y tributarios de Ecuador, con profundo conocimiento de:

* Normativa SRI (ATS, REOC, IVA, ICE, IR, XML electrónicos)
* Facturación electrónica (XML, autorizaciones SRI)
* NIIF / NEC
* Sistemas ERP contables multiempresa
* Arquitectura limpia (Clean Architecture)
* Principios SOLID
* React 19 + Next.js (App Router)
* TypeScript estricto
* TailwindCSS
* Seguridad, auditoría y trazabilidad CONTABLE

Tu objetivo es **DISEÑAR Y DEFINIR UN SISTEMA CONTABLE MODERNO PARA ECUADOR**,
**multiempresa, multiusuario y multisucursal**, que permita llevar la contabilidad completa de varias empresas en un solo sistema, **cumpliendo estrictamente con el SRI**.

---

## 1️⃣ CONSIDERACIONES GENERALES DEL SISTEMA

1. Todo el código debe estar:

   * En **ESPAÑOL**
   * Con nombres semánticos claros
   * Sin abreviaciones confusas
2. Arquitectura basada en:

   * **Clean Architecture**
   * Separación estricta de capas
3. Código:

   * **100% TypeScript**
   * Tipado estricto
4. Componentización máxima:

   * Componentes genéricos y reutilizables
   * **Sin lógica de negocio en la UI**
5. Sistema:

   * Escalable
   * Mantenible
   * Auditable
6. Preparado para:

   * Estudios contables
   * Decenas de empresas
   * Cientos de usuarios
7. Cumplimiento legal obligatorio:

   * No permitir operaciones fuera de período
   * Control de documentos anulados
   * Auditoría obligatoria

---

## 2️⃣ STACK TECNOLÓGICO OBLIGATORIO

---

## 🖥️ FRONTEND

### Tecnologías

* React 19
* Next.js (App Router)
* TypeScript (strict)
* TailwindCSS
* Shadcn/UI
* Redux Toolkit
* React Hook Form + Zod

---

### 🧱 Arquitectura Frontend (Clean Architecture adaptada)

> ⚠️ **IMPORTANTE**
> Esta arquitectura **NO replica el backend**.
> Aplica **Clean Architecture orientada a frontend**, separando:
>
> * **Reglas de negocio**
> * **Casos de uso**
> * **Infraestructura**
> * **UI**

---

### 📂 Estructura del proyecto Frontend

```txt
src
│
├── app                        # Framework layer (Next.js)
│   ├── (auth)
│   │   └── login
│   │       └── page.tsx
│   │
│   ├── dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   └── facturacion
│       ├── page.tsx
│       └── loading.tsx
│
├── modules                    
│   └── facturacion
│       │
│       ├── application        
│       │   ├── useCases
│       │   │   ├── registrarFactura.ts
│       │   │   ├── listarFacturas.ts
│       │   │
│       │   └── models         
│       │       └── FacturaViewModel.ts
│       │
│       ├── infrastructure     
│       │   ├── api
│       │   │   └── facturacionApi.ts
│       │   └── mapper
│       │       └── facturaMapper.ts
│       │
│       └── ui                 
│           ├── components
│           │   ├── FacturaForm.tsx
│           │   ├── FacturaTable.tsx
│           │   └── FacturaFiltro.tsx
│           │
│           └── hooks
│               └── useFacturacion.ts
│
├── shared                     
│   ├── ui
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   │
│   ├── infrastructure
│   │   ├── httpClient.ts
│   │   └── authStorage.ts
│   │
│   └── utils
│       └── formatearDinero.ts
│
├── styles
│   └── globals.css
│
└── config
    └── tailwind.config.ts
```

✔️ **Correctamente alineado a Clean Architecture en frontend**
✔️ **Sin lógica de negocio en UI**
✔️ **Casos de uso aislados**

---


## 🎨 ESTILOS (TAILWIND)

```ts
theme: {
  extend: {
    colors: {
      sri: {
        blue: '#00548b',
        light: '#007cc3',
        gray: '#f4f6f9'
      }
    }
  }
}
```

---

## REQUERIMIENTOS GENERALES

1. Sistema web moderno, escalable y seguro
2. Multiempresa, multisucrusal, multiperíodo
3. Control de roles y permisos
4. Auditoría completa (logs, trazabilidad)
5. Compatible con normativa vigente del SRI
6. Automatización contable y tributaria
7. Generación de archivos oficiales:
   - ATS
   - REOC
   - XML facturación electrónica
   - Formularios 103 y 104
8. Control de documentos anulados
9. Exportación a Excel, PDF, TXT y XML
10. Preparado para integrarse con otros sistemas

---

## MÓDULOS OBLIGATORIOS DEL SISTEMA

### 🧩 SISTEMA / CONFIGURACIÓN GENERAL

- Panel principal (Dashboard)
- Cambio de usuario
- Cambio de empresa
- Cambio de contraseña
- Datos de la empresa
- Configuración general del sistema
- Salir

#### Administración
- Empresa
  - Datos generales
  - Periodos contables
  - Cierre de periodo contable
  - Sucursales
    - Crear sucursal – Contabilidad
    - Crear sucursal – Inventario
  - Series de comprobantes
  - Asignación de series a sucursales
  - Centros de costos
  - Subcentros de costos
  - Comprobantes de egreso
  - Comprobantes de ingreso
  - Tabla de intereses
  - Tabla de Impuesto a la Renta
  - División de artículos

---

### 🛒 COMPRAS
- Registro de compras
- Órdenes de compra
- Devoluciones en compras
  - Notas de crédito recibidas
- Proveedores
- Grupos de proveedores
- Importación de compras desde Excel
- Validación tributaria automática

---

### 📦 INVENTARIOS
- Control de stock
- Kardex
- Costeo
- Integración con compras y ventas

---

### 💰 VENTAS
- Facturación
- Notas de crédito emitidas
- Clientes
- Integración con facturación electrónica SRI

---

### 💳 CUENTAS POR COBRAR Y PAGAR

- Cuentas por cobrar
  - Clientes
  - Saldos a favor y utilización
- Cuentas por pagar
  - Proveedores

---

### 🏦 CAJA Y BANCOS
- Conciliación bancaria
- Carga de estados de cuenta
- Control de cheques emitidos
- Depósitos (caja → bancos)

---

### 📚 CONTABILIDAD GENERAL

- Plan de cuentas
- Asientos contables
- Comprobantes de diario
- Libro diario
- Mayor general
- Balance de comprobación
- Balance general
- Estado de pérdidas y ganancias
- Automatización de asientos desde compras, ventas y bancos

---

### 📄 DOCUMENTOS ELECTRÓNICOS

- Documentos emitidos
- Documentos recibidos
- Envío de documentos electrónicos al SRI
- Envío de documentos por email
- Procesamiento de:
  - Documentos emitidos desde otros sistemas
  - Documentos recibidos
  - Excel de compras
  - Excel de retenciones recibidas
  - Excel de retenciones emitidas
- Control de documentos anulados

---

### 🧾 IMPUESTOS (SRI)

- Anexos IVA y formularios mensuales
  - Archivo
  - Talón resumen
  - Formulario 103
  - Formulario 104
  - Errores y validaciones
- Anexos IVA y formularios semestrales
- Archivo devolución de IVA
- Anexo relación de dependencia
- Opciones ICE
- Generación ATS
- Generación REOC

---

### 👷 TRABAJADORES (INICIO DE AÑO)

- Trabajadores
- Pagos a trabajadores
- Formulario de gastos personales
- Parámetros
- Procesamiento
- Reportes laborales

---

### 📊 INFORMES

- Comprobantes de retención
- Liquidación de compras
- Compras – Impuestos
- Compras – Retenciones
- Reembolsos
- Proveedores
- Ventas
- Clientes
- Importaciones
- Exportaciones
- Otros documentos anulados
- Pagos a trabajadores
- Reporte de trabajadores

---

## AUTOMATIZACIÓN E INTELIGENCIA

Incluye funcionalidades avanzadas como:
- Generación automática de asientos contables
- Validación tributaria inteligente
- Detección de errores comunes del SRI
- Alertas de inconsistencias
- Asistente contable IA para:
  - Explicar impuestos
  - Validar deducibilidad
  - Ayudar al contador

---

## RESULTADO ESPERADO DEL MODELO

Debes entregar:
1. Arquitectura del sistema
2. Descripción técnica de cada módulo
3. Flujos contables clave
4. Modelo de datos (alto nivel)
5. Reglas tributarias clave
6. Consideraciones de seguridad y auditoría
7. Sugerencia de stack tecnológico moderno
8. Enfoque escalable y listo para producción

No simplifiques el diseño.
Piensa como si el sistema fuera a usarse en estudios contables reales en Ecuador.