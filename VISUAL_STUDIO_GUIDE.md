# 🎯 Guía Rápida - Visual Studio

## 🚀 Ejecutar desde Visual Studio

### Opción 1: Presionar F5 (Recomendado)
1. Abrir `STREAMDOORSystem.sln` en Visual Studio 2022
2. Presionar `F5` o hacer clic en el botón "Start"
3. Visual Studio ejecutará automáticamente:
   - **Backend API** en `https://localhost:44447`
   - **Frontend React** en el mismo puerto con proxy automático
4. El navegador se abrirá automáticamente en `https://localhost:44447`

### Opción 2: IIS Express
1. Seleccionar "IIS Express" en el menú desplegable de inicio
2. Presionar F5
3. La aplicación se ejecutará en `https://localhost:44447`

## 📋 Requisitos Previos

### 1. Base de Datos
Ejecutar los siguientes scripts en SQL Server Management Studio:

```sql
-- 1. Crear base de datos y tablas
USE master;
EXEC('CREATE DATABASE DBStreamDoor');
-- Luego ejecutar: Consultas/database.sql

-- 2. Crear procedimientos almacenados
-- Ejecutar: Consultas/procedimientos.sql

-- 3. Insertar datos iniciales
-- Ejecutar: Consultas/data.sql
```

### 2. Configurar Cadena de Conexión
Editar `appsettings.json` si es necesario:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Para SQL Server Express:
```
Server=localhost\\SQLEXPRESS;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True;
```

### 3. Instalar Dependencias de Node.js
En la primera ejecución, Visual Studio instalará automáticamente las dependencias de npm. Si hay problemas:

```bash
cd ClientApp
npm install
```

## 🔐 Credenciales de Administrador

Después de ejecutar los scripts SQL, podrás iniciar sesión con:

- **Correo:** admin@streamdoor.com
- **Contraseña:** 123

⚠️ **Importante:** Cambiar esta contraseña después del primer login por seguridad.

## 🛠️ Configuración del Proyecto

### Puertos Configurados
- **HTTPS:** 44447
- **HTTP:** 32214

### Variables de Entorno
El proyecto usa las siguientes variables en `ClientApp/.env.development`:
```
PORT=44447
```

Y en `ClientApp/.env`:
```
BROWSER=none
```

## 📊 Estructura del Proyecto

```
STREAMDOORSystem/
├── Controllers/           # Controladores API (11 controladores)
├── Models/               # Entidades y DTOs
├── Services/             # Lógica de negocio
├── Data/                 # DbContext
├── Consultas/            # Scripts SQL
│   ├── database.sql      # Creación de BD
│   ├── procedimientos.sql # Stored procedures
│   └── data.sql          # Datos iniciales + usuario admin
├── ClientApp/            # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── pages/       # Páginas principales
│   │   ├── context/     # AuthContext
│   │   ├── services/    # API calls
│   │   └── setupProxy.js # Proxy para desarrollo
│   ├── package.json
│   └── vite.config.js
├── Properties/
│   └── launchSettings.json # Configuración de Visual Studio
├── Program.cs            # Configuración principal
└── appsettings.json      # Configuración de la app
```

## 🐛 Solución de Problemas

### Error: No se puede conectar a la base de datos
1. Verificar que SQL Server esté ejecutándose
2. Verificar la cadena de conexión en `appsettings.json`
3. Probar la conexión con SQL Server Management Studio

### Error: El puerto 44447 ya está en uso
1. Cambiar el puerto en:
   - `Properties/launchSettings.json`
   - `ClientApp/vite.config.js`
   - `ClientApp/package.json` (script start)
   - `Program.cs` (CORS policy)

### Error: npm install falla
1. Eliminar la carpeta `ClientApp/node_modules`
2. Eliminar `ClientApp/package-lock.json`
3. Ejecutar `npm install` nuevamente desde `ClientApp/`

### El frontend no carga
1. Verificar que el puerto 44447 esté libre
2. Verificar que las dependencias de npm estén instaladas
3. Revisar la consola de Visual Studio para errores

## 📝 Comandos Útiles

### Compilar el proyecto
```bash
dotnet build
```

### Restaurar paquetes NuGet
```bash
dotnet restore
```

### Compilar frontend manualmente
```bash
cd ClientApp
npm run build
```

### Ejecutar frontend en modo desarrollo
```bash
cd ClientApp
npm start
```

## 🌐 Endpoints Principales

### API
- **Swagger:** https://localhost:44447/swagger
- **API Base:** https://localhost:44447/api

### Autenticación
- **Login:** POST /api/auth/login
- **Logout:** POST /api/auth/logout
- **Verify:** GET /api/auth/verify

### Módulos
- **Dashboard:** GET /api/dashboard
- **Clientes:** /api/clientes
- **Servicios:** /api/servicios
- **Correos:** /api/correos
- **Cuentas:** /api/cuentas
- **Ventas:** /api/ventas
- **Pagos:** /api/pagos
- **Medios de Pago:** /api/mediospago
- **Usuarios:** /api/usuarios

## 🎨 Características del Sistema

### Generador de Credenciales
- Disponible en módulos de Correos y Cuentas
- Genera email y contraseña automáticamente
- Botón para regenerar si no satisface

### Sistema de Alertas
- **Verde:** Activo (más de 3 días)
- **Naranja:** Próximo a vencer (3 días o menos)
- **Rojo:** Vencido

### Renovaciones
- Renovación inteligente de suscripciones
- Cálculo automático de nueva fecha de fin
- Actualización automática de estados

## 📚 Documentación Adicional

- **README.md** - Guía completa del proyecto
- **DEPLOY.md** - Guía de despliegue
- **SECURITY.md** - Configuración de seguridad
- **SUMMARY.md** - Resumen del proyecto
- **UI_GUIDE.md** - Guía de interfaz de usuario

---

**¡Listo para desarrollar! 🚀**
