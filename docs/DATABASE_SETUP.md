# Configuración de Base de Datos - EcuContable Pro

## 📋 Requisitos Previos

- PostgreSQL 14+ instalado y corriendo
- Node.js 18+ instalado
- npm o yarn

## 🚀 Configuración Inicial

### 1. Instalar PostgreSQL

#### Windows:
```bash
# Descargar desde: https://www.postgresql.org/download/windows/
# O usar Chocolatey:
choco install postgresql

# Iniciar servicio
net start postgresql-x64-14
```

#### macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE ecucontable_pro;

# Crear usuario (opcional)
CREATE USER ecucontable WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE ecucontable_pro TO ecucontable;

# Salir
\q
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y actualiza la URL de conexión:

```bash
cp .env.example .env
```

Edita `.env` y actualiza:
```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/ecucontable_pro?schema=public"
```

### 4. Instalar Dependencias de Prisma

```bash
npm install prisma @prisma/client --save
npm install -D prisma
```

### 5. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 6. Crear Tablas en la Base de Datos

```bash
npx prisma db push
```

O si prefieres usar migraciones:
```bash
npx prisma migrate dev --name init
```

## 📊 Estructura del Schema

El schema de Prisma incluye los siguientes módulos:

### Módulos Implementados:

1. **Configuración**
   - `Empresa`: Datos de la empresa
   - `Sucursal`: Sucursales de la empresa
   - `PuntoEmision`: Puntos de emisión SRI
   - `CodigoRetencion`: Códigos de retención autorizados

2. **Usuarios y Seguridad**
   - `Usuario`: Usuarios del sistema con roles

3. **Inventario**
   - `CategoriaProducto`: Categorías de productos
   - `Producto`: Productos y servicios
   - `Bodega`: Bodegas de almacenamiento
   - `MovimientoKardex`: Movimientos de inventario

4. **Directorio**
   - `Tercero`: Clientes y proveedores

5. **Nómina**
   - `Empleado`: Empleados de la empresa

6. **Contabilidad**
   - `CuentaContable`: Plan de cuentas
   - `CentroCosto`: Centros de costo

7. **Facturación Electrónica**
   - `Comprobante`: Documentos electrónicos (facturas, notas, guías)
   - `DetalleComprobante`: Detalles de los comprobantes

## 🔧 Comandos Útiles de Prisma

### Ver la base de datos en el navegador
```bash
npx prisma studio
```

### Resetear la base de datos (¡CUIDADO! Borra todos los datos)
```bash
npx prisma migrate reset
```

### Generar una nueva migración
```bash
npx prisma migrate dev --name nombre_de_la_migracion
```

### Aplicar migraciones en producción
```bash
npx prisma migrate deploy
```

### Formatear el schema
```bash
npx prisma format
```

### Validar el schema
```bash
npx prisma validate
```

## 📝 Datos de Prueba (Seed)

Para cargar datos de prueba, ejecuta:

```bash
npx prisma db seed
```

## 🔍 Verificación

Para verificar que todo está funcionando:

1. Abre Prisma Studio:
   ```bash
   npx prisma studio
   ```

2. Navega a http://localhost:5555

3. Deberías ver todas las tablas creadas

## ⚠️ Troubleshooting

### Error: "Can't reach database server"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que el puerto 5432 esté disponible

### Error: "Database does not exist"
- Crea la base de datos manualmente con `CREATE DATABASE ecucontable_pro;`

### Error: "Permission denied"
- Verifica los permisos del usuario de PostgreSQL
- Ejecuta `GRANT ALL PRIVILEGES ON DATABASE ecucontable_pro TO tu_usuario;`

## 🔐 Seguridad

- **NUNCA** commitees el archivo `.env` al repositorio
- Usa contraseñas fuertes para producción
- Considera usar variables de entorno del sistema en producción
- Habilita SSL para conexiones en producción

## 📚 Recursos

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
