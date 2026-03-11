# STREAMDOOR System — Guía de Instalación y Configuración

Guía paso a paso para poner en marcha el sistema **STREAMDOOR** en un entorno local.

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 8.0 |
| [Node.js](https://nodejs.org/) | 18 LTS o superior |
| [SQL Server](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) | 2019 o superior (también funciona con SQL Server Express) |

---

## 1. Crear la base de datos

Los scripts SQL se encuentran dentro de la carpeta **`Consultas/`**. Deben ejecutarse **en el siguiente orden** desde SQL Server Management Studio (SSMS) u otro cliente SQL:

| Orden | Archivo | Descripción |
|---|---|---|
| 1 | `Consultas/database.sql` | Crea la base de datos, tablas y relaciones |
| 2 | `Consultas/procedimientos.sql` | Crea los procedimientos almacenados |
| 3 | `Consultas/data.sql` | Inserta los datos iniciales |

> **Nota:** Asegúrate de ejecutar cada script completo antes de pasar al siguiente.

---

## 2. Configurar el backend (`appsettings.json`)

Abre el archivo **`appsettings.json`** ubicado en la raíz del proyecto y ajusta las siguientes secciones:

### 2.1 Cadena de conexión

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

### 2.2 Configuración JWT

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

### 2.3 Configuración de correo electrónico (EmailSettings)

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

### 2.4 Configuración de la aplicación (AppSettings)

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

## 3. Ejecutar el backend

### Opción A — Línea de comandos

Desde la raíz del proyecto:

```bash
dotnet restore
dotnet run
```

### Opción B — Visual Studio

1. Abre el archivo de solución **`STREAMDOORSystem.sln`** con Visual Studio 2022 (o superior).
2. Espera a que Visual Studio restaure los paquetes NuGet automáticamente.
3. Asegúrate de que el proyecto de inicio sea el proyecto principal de la API (sin subrayado de errores en la barra superior).
4. Presiona **F5** (o el botón ▶ *Iniciar*) para compilar y ejecutar en modo depuración.  
   Usa **Ctrl + F5** si quieres ejecutar sin adjuntar el depurador.
5. Visual Studio abrirá automáticamente el navegador con la documentación Swagger.

Por defecto la API estará disponible en `https://localhost:7040` (o el puerto configurado en `Properties/launchSettings.json`).

La documentación Swagger se puede acceder en: `https://localhost:7040/swagger`

---

## 4. Configurar e iniciar el frontend (ClientApp)

### 4.1 Abrir la terminal en la carpeta del frontend

```bash
cd ClientApp
```

### 4.2 Instalar dependencias

```bash
npm install
```

### 4.3 Configurar las variables de entorno

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

### 4.4 Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación frontend estará disponible en `http://localhost:5173` (o el puerto que indique Vite en consola).

---

## 5. Cambiar la zona horaria del frontend

El sistema usa por defecto la zona horaria **`America/Managua` (UTC-6)**. Para adaptarlo a otra región, sigue estos pasos en **Visual Studio Code**:

### 5.1 Buscar y reemplazar en todo el proyecto

1. Abre la carpeta `ClientApp/` en Visual Studio Code.
2. Usa el buscador global: presiona **Ctrl + Shift + H** (Windows/Linux) o **Cmd + Shift + H** (Mac).
3. En el campo **Buscar**, escribe:
   ```
   America/Managua
   ```
4. En el campo **Reemplazar**, escribe el identificador de la zona horaria deseada, por ejemplo:
   ```
   America/Bogota
   ```
5. Haz clic en **Reemplazar todo** (ícono de doble flecha) para aplicar el cambio en todos los archivos.

### 5.2 Zonas horarias comunes

| Región | Identificador |
|---|---|
| Nicaragua / Centro América (UTC-6) | `America/Managua` |
| Colombia / Perú (UTC-5) | `America/Bogota` |
| México Ciudad (UTC-6) | `America/Mexico_City` |
| Argentina / Chile (UTC-3) | `America/Argentina/Buenos_Aires` |
| España (UTC+1 / UTC+2 DST) | `Europe/Madrid` |

> Para ver la lista completa de zonas válidas visita [IANA Time Zone Database](https://www.iana.org/time-zones).

### 5.3 Dónde se usa la zona horaria

Los archivos que contienen referencias a la zona horaria son:

- `ClientApp/src/pages/Cierre.jsx`
- `ClientApp/src/utils/reportGenerator.js`

El patrón utilizado en el código es:

```js
new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Managua' }));
```

Después del reemplazo, el patrón quedará con la nueva zona, por ejemplo:

```js
new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
```

---

## 6. Resumen de pasos

```
1. Ejecutar Consultas/database.sql en SQL Server
2. Ejecutar Consultas/procedimientos.sql en SQL Server
3. Ejecutar Consultas/data.sql en SQL Server
4. Configurar appsettings.json (cadena de conexión, JWT, Email, AppSettings)
5. Ejecutar: dotnet run  (línea de comandos) o F5 en Visual Studio
6. cd ClientApp → npm install
7. Crear/verificar ClientApp/.env
8. Ejecutar: npm run dev  (dentro de ClientApp/)
9. (Opcional) Cambiar zona horaria: Ctrl+Shift+H en VS Code → reemplazar 'America/Managua'
```
