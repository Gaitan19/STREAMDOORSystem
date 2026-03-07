# 🚀 Guía de Despliegue - STREAMDOORSystem

Esta guía proporciona instrucciones paso a paso para desplegar el sistema en diferentes entornos.

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Despliegue Local](#despliegue-local)
3. [Despliegue en Producción](#despliegue-en-producción)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Variables de Entorno](#variables-de-entorno)
6. [Verificación](#verificación)
7. [Troubleshooting](#troubleshooting)

---

## Requisitos

### Software Necesario
- **.NET 10.0 SDK** o superior
- **Node.js 18+** y npm
- **SQL Server 2022** (puede ser LocalDB, Express, o Standard/Enterprise)
- **Git** (para clonar el repositorio)

### Puertos Requeridos
- **5000/5001**: Aplicación web (HTTP/HTTPS)
- **1433**: SQL Server (por defecto)
- **5173**: Vite dev server (solo desarrollo)

---

## Despliegue Local

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Gaitan19/STREAMDOORSystem.git
cd STREAMDOORSystem
```

### 2. Configurar la Base de Datos

#### Opción A: SQL Server Express/LocalDB (Recomendado para desarrollo)

```bash
# Crear la base de datos
sqlcmd -S localhost -E -i Consultas/database.sql

# Crear procedimientos almacenados
sqlcmd -S localhost -E -i Consultas/procedimientos.sql

# Insertar datos iniciales
sqlcmd -S localhost -E -i Consultas/data.sql
```

#### Opción B: SQL Server Management Studio (SSMS)

1. Abrir SSMS
2. Conectarse a su instancia de SQL Server
3. Abrir y ejecutar `Consultas/database.sql`
4. Abrir y ejecutar `Consultas/procedimientos.sql`
5. Abrir y ejecutar `Consultas/data.sql`

### 3. Configurar la Cadena de Conexión

Editar `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Para SQL Server Express:**
```
Server=localhost\\SQLEXPRESS;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True;
```

**Para LocalDB:**
```
Server=(localdb)\\mssqllocaldb;Database=DBStreamDoor;Trusted_Connection=True;TrustServerCertificate=True;
```

### 4. Instalar Dependencias del Frontend

```bash
cd ClientApp
npm install
cd ..
```

### 5. Crear el Primer Usuario Administrador

Antes de iniciar la aplicación, prepare una petición para crear el usuario admin:

```bash
# Después de iniciar la aplicación, ejecutar:
curl -X POST http://localhost:5000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Administrador",
    "correo": "admin@streamdoor.com",
    "password": "Admin123!"
  }'
```

### 6. Ejecutar la Aplicación

#### Opción A: Modo Desarrollo (Backend + Frontend separados)

**Terminal 1 - Backend:**
```bash
dotnet run
```
El API estará disponible en: `https://localhost:5001`

**Terminal 2 - Frontend:**
```bash
cd ClientApp
npm run dev
```
La interfaz estará disponible en: `http://localhost:5173`

#### Opción B: Modo Integrado

```bash
# Compilar el frontend
cd ClientApp
npm run build
cd ..

# Ejecutar la aplicación completa
dotnet run
```
Todo estará disponible en: `https://localhost:5001`

### 7. Acceder a la Aplicación

1. Abrir navegador en `http://localhost:5173` (modo dev) o `https://localhost:5001` (modo integrado)
2. Iniciar sesión con las credenciales del admin creado

---

## Despliegue en Producción

### Opción 1: Azure App Service (Recomendado)

#### 1. Preparar la Aplicación

```bash
# Compilar el frontend
cd ClientApp
npm run build
cd ..

# Publicar el backend
dotnet publish -c Release -o ./publish
```

#### 2. Crear Recursos en Azure

```bash
# Login a Azure
az login

# Crear grupo de recursos
az group create --name StreamDoorRG --location eastus

# Crear SQL Server
az sql server create \
  --name streamdoor-sql \
  --resource-group StreamDoorRG \
  --location eastus \
  --admin-user sqladmin \
  --admin-password YourSecurePassword123!

# Crear base de datos
az sql db create \
  --name DBStreamDoor \
  --resource-group StreamDoorRG \
  --server streamdoor-sql \
  --service-objective S0

# Crear App Service Plan
az appservice plan create \
  --name StreamDoorPlan \
  --resource-group StreamDoorRG \
  --sku B1

# Crear Web App
az webapp create \
  --name streamdoor-app \
  --resource-group StreamDoorRG \
  --plan StreamDoorPlan \
  --runtime "DOTNET|10.0"
```

#### 3. Configurar Variables de Entorno en Azure

```bash
# Configurar connection string
az webapp config connection-string set \
  --name streamdoor-app \
  --resource-group StreamDoorRG \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="Server=tcp:streamdoor-sql.database.windows.net,1433;Database=DBStreamDoor;User ID=sqladmin;Password=YourSecurePassword123!;Encrypt=True;"

# Configurar JWT settings
az webapp config appsettings set \
  --name streamdoor-app \
  --resource-group StreamDoorRG \
  --settings Jwt__Key="YourSecureRandomKey32CharactersLong" \
             Jwt__Issuer="StreamDoorIssuer" \
             Jwt__Audience="StreamDoorAudience"
```

#### 4. Configurar la Base de Datos en Azure

1. Conectarse a Azure SQL usando Azure Data Studio o SSMS:
   ```
   Server: streamdoor-sql.database.windows.net
   Database: DBStreamDoor
   Authentication: SQL Login
   Username: sqladmin
   Password: YourSecurePassword123!
   ```

2. Ejecutar scripts SQL:
   - `Consultas/database.sql`
   - `Consultas/procedimientos.sql`
   - `Consultas/data.sql`

#### 5. Desplegar la Aplicación

```bash
# Desde la carpeta raíz
az webapp deployment source config-zip \
  --name streamdoor-app \
  --resource-group StreamDoorRG \
  --src ./publish.zip
```

O usar GitHub Actions para CI/CD (ver `.github/workflows/azure-deploy.yml`)

### Opción 2: Servidor Windows/Linux con IIS o Nginx

#### Para IIS (Windows Server)

1. **Instalar requisitos:**
   - .NET 10.0 Runtime
   - .NET Hosting Bundle
   - SQL Server

2. **Publicar la aplicación:**
   ```bash
   dotnet publish -c Release -o C:\inetpub\wwwroot\streamdoor
   ```

3. **Configurar IIS:**
   - Crear nuevo sitio web
   - Apuntar a `C:\inetpub\wwwroot\streamdoor`
   - Configurar pool de aplicaciones para .NET CLR: Sin código administrado
   - Configurar bindings (HTTP/HTTPS)

4. **Configurar variables de entorno:**
   - Editar `appsettings.Production.json`
   - O usar variables de entorno del sistema

#### Para Nginx (Linux)

1. **Instalar dependencias:**
   ```bash
   # Instalar .NET Runtime
   wget https://dot.net/v1/dotnet-install.sh
   chmod +x dotnet-install.sh
   ./dotnet-install.sh -c Current

   # Instalar Nginx
   sudo apt install nginx
   ```

2. **Publicar la aplicación:**
   ```bash
   dotnet publish -c Release -o /var/www/streamdoor
   ```

3. **Configurar servicio systemd:**
   ```bash
   sudo nano /etc/systemd/system/streamdoor.service
   ```

   ```ini
   [Unit]
   Description=StreamDoor Application

   [Service]
   WorkingDirectory=/var/www/streamdoor
   ExecStart=/usr/bin/dotnet /var/www/streamdoor/STREAMDOORSystem.dll
   Restart=always
   RestartSec=10
   KillSignal=SIGINT
   SyslogIdentifier=streamdoor
   User=www-data
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

   [Install]
   WantedBy=multi-user.target
   ```

4. **Configurar Nginx como proxy reverso:**
   ```bash
   sudo nano /etc/nginx/sites-available/streamdoor
   ```

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection keep-alive;
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

5. **Habilitar y iniciar:**
   ```bash
   sudo systemctl enable streamdoor
   sudo systemctl start streamdoor
   sudo ln -s /etc/nginx/sites-available/streamdoor /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

---

## Configuración de Base de Datos

### Backup y Restore

#### Crear Backup
```sql
BACKUP DATABASE DBStreamDoor 
TO DISK = 'C:\Backups\DBStreamDoor.bak'
WITH FORMAT;
```

#### Restaurar Backup
```sql
RESTORE DATABASE DBStreamDoor
FROM DISK = 'C:\Backups\DBStreamDoor.bak'
WITH REPLACE;
```

### Mantenimiento Regular

```sql
-- Actualizar estadísticas
EXEC sp_updatestats;

-- Reconstruir índices
ALTER INDEX ALL ON Ventas REBUILD;
ALTER INDEX ALL ON Clientes REBUILD;

-- Actualizar estados de ventas (ejecutar diariamente)
EXEC sp_ActualizarEstadosVentas;
```

---

## Variables de Entorno

### Desarrollo (appsettings.json)
Ya configurado en el archivo.

### Producción

**Windows (CMD):**
```cmd
setx ConnectionStrings__DefaultConnection "Server=..."
setx Jwt__Key "YourSecureKey"
```

**Windows (PowerShell):**
```powershell
$env:ConnectionStrings__DefaultConnection = "Server=..."
$env:Jwt__Key = "YourSecureKey"
```

**Linux/Mac:**
```bash
export ConnectionStrings__DefaultConnection="Server=..."
export Jwt__Key="YourSecureKey"
```

---

## Verificación

### Checklist de Despliegue

- [ ] Base de datos creada y accesible
- [ ] Procedimientos almacenados ejecutados
- [ ] Datos iniciales insertados
- [ ] Cadena de conexión configurada correctamente
- [ ] JWT Key configurado (producción)
- [ ] Usuario administrador creado
- [ ] Aplicación accesible vía navegador
- [ ] Login funciona correctamente
- [ ] HTTPS habilitado (producción)
- [ ] CORS configurado correctamente
- [ ] Backups configurados

### Endpoints de Prueba

```bash
# Health check
curl https://your-domain.com/api/servicios

# Login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@streamdoor.com","password":"Admin123!"}'
```

---

## Troubleshooting

### Error: No se puede conectar a la base de datos

**Solución:**
1. Verificar que SQL Server esté ejecutándose
2. Verificar la cadena de conexión
3. Verificar el firewall (puerto 1433)
4. Verificar credenciales

```bash
# Probar conexión
sqlcmd -S localhost -U sa -P YourPassword -Q "SELECT @@VERSION"
```

### Error: 401 Unauthorized

**Solución:**
1. Verificar que el JWT Key sea el mismo en backend y configuración
2. Verificar que las cookies estén habilitadas
3. Verificar que CORS esté configurado correctamente

### Error: Frontend no carga

**Solución:**
1. Verificar que el frontend esté compilado: `cd ClientApp && npm run build`
2. Verificar que exista la carpeta `wwwroot`
3. Verificar configuración de Vite en producción

### Error: CORS

**Solución:**
Actualizar `Program.cs` con el dominio correcto:

```csharp
policy.WithOrigins("https://your-production-domain.com")
```

---

## 📞 Soporte

Para más ayuda:
- Revisar logs: `logs/` folder o Azure Application Insights
- Revisar SECURITY.md para configuración de seguridad
- Abrir un issue en GitHub

---

**¡Despliegue exitoso! 🎉**
