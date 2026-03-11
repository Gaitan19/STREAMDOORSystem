# STREAMDOOR System — Guía de Instalación y Configuración

Guía paso a paso para poner en marcha el sistema **STREAMDOOR** en un entorno local.

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0 |
| [Node.js](https://nodejs.org/) | 18 LTS o superior |
| [SQL Server](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) | 2019 o superior (también funciona con SQL Server Express) |
| [Git](https://git-scm.com/) | cualquier versión reciente |

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/Gaitan19/STREAMDOORSystem.git
cd STREAMDOORSystem
```

---

## 2. Crear la base de datos

Los scripts SQL se encuentran dentro de la carpeta **`Consultas/`**. Deben ejecutarse **en el siguiente orden** desde SQL Server Management Studio (SSMS) u otro cliente SQL:

| Orden | Archivo | Descripción |
|---|---|---|
| 1 | `Consultas/database.sql` | Crea la base de datos, tablas y relaciones |
| 2 | `Consultas/procedimientos.sql` | Crea los procedimientos almacenados |
| 3 | `Consultas/data.sql` | Inserta los datos iniciales |

> **Nota:** Asegúrate de ejecutar cada script completo antes de pasar al siguiente.

---

## 3. Configurar el backend (`appsettings.json`)

Abre el archivo **`appsettings.json`** ubicado en la raíz del proyecto y ajusta las siguientes secciones:

### 3.1 Cadena de conexión

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=DBStreamDoor;User Id=tu_usuario;Password=tu_contraseña;TrustServerCertificate=True"
}
```

Reemplaza `localhost`, `tu_usuario` y `tu_contraseña` por los datos de tu instancia SQL Server local.

**Ejemplo con instancia nombrada:**
```json
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True"
```

---

### 3.2 Configuración JWT

```json
"Jwt": {
  "Key": "StreamDoorSecretKey2024!MinLength32Chars",
  "Issuer": "StreamDoorIssuer",
  "Audience": "StreamDoorAudience"
}
```

| Campo | Descripción |
|---|---|
| `Key` | Clave secreta usada para firmar y verificar los tokens JWT. Debe tener **al menos 32 caracteres**. Cambia este valor en producción por una cadena aleatoria segura. |
| `Issuer` | Identificador del emisor del token (quién lo genera). Puede dejarse como está o personalizar con el nombre de tu organización. |
| `Audience` | Identificador de la audiencia del token (quién lo consume). Puede dejarse como está o personalizar según tu dominio. |

> **En producción** usa siempre una `Key` larga y aleatoria, por ejemplo: `openssl rand -base64 48`.

---

### 3.3 Configuración de correo electrónico (EmailSettings)

```json
"EmailSettings": {
  "FromEmail": "tu_correo@gmail.com",
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": "587",
  "SmtpUsername": "tu_correo@gmail.com",
  "SmtpPassword": "xxxx xxxx xxxx xxxx"
}
```

| Campo | Descripción |
|---|---|
| `FromEmail` | Dirección de correo desde la que se enviarán los emails del sistema (recuperación de contraseña, notificaciones). |
| `SmtpHost` | Servidor SMTP del proveedor de correo. Para Gmail usa `smtp.gmail.com`. |
| `SmtpPort` | Puerto SMTP. Gmail usa `587` (TLS/STARTTLS). |
| `SmtpUsername` | Nombre de usuario de la cuenta de correo (normalmente la misma dirección). |
| `SmtpPassword` | **Contraseña de aplicación** generada por Gmail (ver instrucciones abajo). |

#### ¿Cómo obtener la contraseña de aplicación de Gmail?

1. Inicia sesión en tu cuenta de Google y ve a **[Gestionar tu cuenta de Google](https://myaccount.google.com/)**.
2. Asegúrate de tener la **verificación en dos pasos** habilitada (es obligatoria). Ve a *Seguridad → Verificación en dos pasos* y actívala si no lo está.
3. Ve a *Seguridad → Contraseñas de aplicaciones* (o busca "Contraseñas de aplicaciones" en el buscador de la cuenta).
4. En el campo *"Selecciona la aplicación"* escribe un nombre descriptivo, por ejemplo `STREAMDOOR`.
5. Haz clic en **Crear**. Google generará una contraseña de 16 caracteres con espacios (p. ej. `bcui zkxt domd kwjh`).
6. Copia esa contraseña y pégala en el campo `SmtpPassword`.

> **Importante:** Esta contraseña solo se muestra una vez. Guárdala en un lugar seguro.

---

### 3.4 Configuración de la aplicación (AppSettings)

```json
"AppSettings": {
  "AppName": "STREAMDOOR"
}
```

| Campo | Descripción |
|---|---|
| `AppName` | Nombre de la aplicación. Se usa en correos electrónicos y encabezados internos del sistema. Puedes cambiarlo si deseas personalizar el nombre. |

---

### Archivo `appsettings.json` completo de ejemplo

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "AppSettings": {
    "AppName": "STREAMDOOR"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DBStreamDoor;User Id=sa;Password=MiPassword123;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "StreamDoorSecretKey2024!MinLength32Chars",
    "Issuer": "StreamDoorIssuer",
    "Audience": "StreamDoorAudience"
  },
  "EmailSettings": {
    "FromEmail": "mi_correo@gmail.com",
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "SmtpUsername": "mi_correo@gmail.com",
    "SmtpPassword": "xxxx xxxx xxxx xxxx"
  }
}
```

---

## 4. Ejecutar el backend

Desde la raíz del proyecto:

```bash
dotnet restore
dotnet run
```

Por defecto la API estará disponible en `https://localhost:7040` (o el puerto configurado en `Properties/launchSettings.json`).

La documentación Swagger se puede acceder en: `https://localhost:7040/swagger`

---

## 5. Configurar e iniciar el frontend (ClientApp)

### 5.1 Abrir la terminal en la carpeta del frontend

```bash
cd ClientApp
```

### 5.2 Instalar dependencias

```bash
npm install
```

### 5.3 Configurar las variables de entorno

Crea un archivo **`.env`** dentro de la carpeta `ClientApp/` con el siguiente contenido:

```env
VITE_APP_NAME=STREAMDOOR
VITE_PASSWORD_PREFIX=StreamDoorNic
```

| Variable | Descripción |
|---|---|
| `VITE_APP_NAME` | Nombre de la aplicación que se muestra en el frontend. |
| `VITE_PASSWORD_PREFIX` | Prefijo que se antepone al generar contraseñas de usuarios en el sistema. |

> El archivo `.env` ya existe en el repositorio con los valores por defecto. Solo necesitas verificar que esté presente.

### 5.4 Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación frontend estará disponible en `http://localhost:5173` (o el puerto que indique Vite en consola).

---

## 6. Resumen de pasos

```
1. Clonar el repositorio
2. Ejecutar Consultas/database.sql en SQL Server
3. Ejecutar Consultas/procedimientos.sql en SQL Server
4. Ejecutar Consultas/data.sql en SQL Server
5. Configurar appsettings.json (cadena de conexión, JWT, Email, AppSettings)
6. Ejecutar: dotnet run  (en la raíz del proyecto)
7. cd ClientApp → npm install
8. Crear/verificar ClientApp/.env
9. Ejecutar: npm run dev  (dentro de ClientApp/)
```
