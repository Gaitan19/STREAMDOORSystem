# 🎬 STREAMDOORSystem - Sistema de Gestión de Streaming

Sistema web profesional para la gestión integral de suscripciones y ventas de cuentas de servicios de streaming digital.

## 🚀 Características Principales

### 📊 Dashboard
- Métricas en tiempo real (ventas, ingresos, ganancias)
- Servicios más vendidos
- Alertas de vencimiento (3 días antes)
- Gráficos y estadísticas visuales

### 👥 Gestión de Clientes
- Registro completo de clientes
- WhatsApp obligatorio para contacto
- Historial de servicios, pagos y renovaciones
- Estado de suscripciones

### 🎯 Servicios y Cuentas
- Gestión de plataformas de streaming (Netflix, Prime Video, Disney+, etc.)
- Cuentas propias y de terceros
- **Generador automático de correo y contraseña**
- Control de perfiles disponibles
- Estados visuales: 🟢 Activo | 🟠 Próximo a vencer | 🔴 Vencido

### 📧 Gestión de Correos
- Módulo independiente para administrar correos
- Generación automática de credenciales
- Asociación con servicios de streaming
- Búsqueda y filtrado avanzado

### 💰 Ventas y Pagos
- Creación y renovación de ventas
- Cálculo automático de fechas de vencimiento
- Sistema de renovaciones inteligente
- Gestión de medios de pago editables
- Historial completo de transacciones

### 👤 Usuarios del Sistema
- Autenticación segura con JWT
- Contraseñas encriptadas (BCrypt)
- Gestión de permisos
- Cookies HttpOnly para seguridad

## 🛠️ Tecnologías

### Backend
- **.NET 10.0** - Framework web
- **SQL Server 2022** - Base de datos
- **Entity Framework Core** - ORM
- **JWT** - Autenticación
- **BCrypt** - Encriptación de contraseñas

### Frontend
- **React 19** - Biblioteca UI
- **Vite 7** - Build tool
- **React Router v7** - Navegación
- **TailwindCSS 3** - Estilos
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Lucide React** - Iconos

## 📋 Requisitos Previos

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [SQL Server 2022](https://www.microsoft.com/sql-server/)

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Gaitan19/STREAMDOORSystem.git
cd STREAMDOORSystem
```

### 2. Configurar la Base de Datos

#### Crear la base de datos
```sql
-- Ejecutar en SQL Server Management Studio o Azure Data Studio
-- Archivo: Consultas/database.sql
```

#### Ejecutar procedimientos almacenados
```sql
-- Archivo: Consultas/procedimientos.sql
```

#### Insertar datos iniciales
```sql
-- Archivo: Consultas/data.sql
```

#### Actualizar la cadena de conexión
Editar `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=TU_SERVIDOR;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Configurar el Backend

```bash
# Restaurar paquetes NuGet
dotnet restore

# Compilar el proyecto
dotnet build
```

### 4. Configurar el Frontend

```bash
# Navegar a la carpeta del cliente
cd ClientApp

# Instalar dependencias
npm install

# Volver a la raíz
cd ..
```

### 5. Crear Usuario Administrador

**Importante:** El script `data.sql` incluye un usuario administrador con un placeholder para la contraseña. Debes crear el usuario real usando la API:

```bash
# POST /api/usuarios
# Body: { "nombre": "Admin", "correo": "admin@streamdoor.com", "password": "TuContraseñaSegura123!" }
```

## 🚀 Ejecutar el Proyecto

### Modo Desarrollo (Backend y Frontend separados)

#### Terminal 1 - Backend
```bash
dotnet run
# API disponible en: https://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd ClientApp
npm run dev
# UI disponible en: http://localhost:5173
```

### Modo Producción

```bash
# Compilar el frontend
cd ClientApp
npm run build
cd ..

# Ejecutar el proyecto completo
dotnet run --configuration Release
# Aplicación completa en: https://localhost:5000
```

## 📁 Estructura del Proyecto

```
STREAMDOORSystem/
├── ClientApp/              # Aplicación React (SPA)
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   ├── context/       # Context API (Auth)
│   │   ├── services/      # Llamadas a API
│   │   └── utils/         # Utilidades
│   ├── package.json
│   └── vite.config.js
├── Controllers/           # Controladores API
├── Models/               # Entidades y DTOs
├── Services/             # Lógica de negocio
├── Data/                 # Contexto de BD
├── Consultas/            # Scripts SQL
│   ├── database.sql      # Creación de BD y tablas
│   ├── procedimientos.sql # Stored procedures
│   └── data.sql          # Datos iniciales
├── Program.cs            # Configuración principal
├── appsettings.json      # Configuración
└── STREAMDOORSystem.csproj
```

## 🎯 Funcionalidades Destacadas

### Generador de Credenciales
El sistema incluye un generador automático de correo y contraseña en los módulos de **Correos** y **Cuentas**:
- Correos con formato profesional
- Contraseñas seguras (12 caracteres, mayúsculas, minúsculas, números, símbolos)
- Botón para regenerar si no es satisfactorio
- Se guardan solo al hacer clic en "Guardar"

### Sistema de Alertas
- Estados automáticos basados en fechas
- **Activo**: 🟢 Más de 3 días restantes
- **Próximo a Vencer**: 🟠 3 días o menos
- **Vencido**: 🔴 Fecha pasada
- Notificaciones en el dashboard

### Renovaciones Inteligentes
- Cálculo automático de nueva fecha de fin
- Si la venta ya venció: renueva desde hoy
- Si aún está activa: extiende desde la fecha de fin actual
- Actualización automática de estados

## 🔐 Seguridad

- **JWT Tokens** con cookies HttpOnly
- **BCrypt** para hash de contraseñas
- **CORS** configurado para permitir solo orígenes confiables
- **Rutas protegidas** en el frontend
- **Validación** en frontend y backend
- **HTTPS** recomendado en producción

## 📱 Responsive Design

La interfaz está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktop (1280px+)

## 🧪 Testing

```bash
# Compilar el proyecto
dotnet build

# Ejecutar el frontend en modo desarrollo
cd ClientApp && npm run dev
```

## 📝 API Endpoints

Documentación completa de endpoints en: `API_ENDPOINTS_REFERENCE.txt`

### Principales endpoints:
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/dashboard` - Métricas del dashboard
- `GET /api/clientes` - Listar clientes
- `POST /api/ventas` - Crear venta
- `PUT /api/ventas/{id}/renovar` - Renovar venta
- `GET /api/correos/generar` - Generar credenciales

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 👨‍💻 Autor

**Gaitan19**

---

## 🆘 Soporte

Para preguntas o problemas:
1. Revisa la documentación en `/DEPLOYMENT_INSTRUCTIONS.md`
2. Consulta los archivos de referencia en la raíz del proyecto
3. Abre un issue en GitHub

---

**¡Listo para gestionar tu negocio de streaming! 🎬🚀**