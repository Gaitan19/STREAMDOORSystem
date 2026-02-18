# STREAMDOOR System - Deployment Instructions

## Complete System Overview

The STREAMDOOR system consists of:
- **Backend API**: ASP.NET Core (.NET 10) with Entity Framework Core
- **Frontend SPA**: React 19 with Vite, TailwindCSS, and React Router
- **Database**: SQL Server with stored procedures

## Prerequisites

### Backend
- .NET 10 SDK
- SQL Server 2019+ or SQL Server Express
- Visual Studio 2022 / VS Code / Rider (optional)

### Frontend
- Node.js 18+
- npm or yarn

## Backend Setup

### 1. Database Setup

```bash
# Connect to SQL Server and run the database scripts
sqlcmd -S localhost -U sa -P YourPassword

# Or use SQL Server Management Studio (SSMS)
```

Run the scripts in order:
1. `Consultas/database.sql` - Creates database and tables
2. `Consultas/procedimientos.sql` - Creates stored procedures
3. `Consultas/data.sql` - Inserts sample data

### 2. Configure Connection String

Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=STREAMDOORSystem;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyHere-ChangeInProduction",
    "Issuer": "STREAMDOORSystem",
    "Audience": "STREAMDOORSystemUsers",
    "ExpirationMinutes": 60
  }
}
```

**Important**: Change the JWT SecretKey in production!

### 3. Install Dependencies

```bash
# Restore NuGet packages
dotnet restore

# Or if using Visual Studio, it will restore automatically
```

### 4. Run Database Migrations

```bash
# Apply migrations (if any)
dotnet ef database update

# Or create initial migration if needed
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Run the Backend

```bash
# Development mode
dotnet run

# Or with hot reload
dotnet watch run

# The API will be available at http://localhost:5000
```

## Frontend Setup

### 1. Navigate to ClientApp

```bash
cd ClientApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env to match your backend URL
# VITE_API_URL=http://localhost:5000/api
```

### 4. Run Development Server

```bash
npm run dev

# The app will be available at http://localhost:5173
```

## Production Deployment

### Backend Deployment

#### Option 1: Deploy to IIS

1. **Publish the application:**
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. **Create IIS Application:**
   - Create a new Application Pool (.NET CLR Version: No Managed Code)
   - Create a new website pointing to the publish folder
   - Ensure the Application Pool identity has access to SQL Server

3. **Update appsettings.Production.json:**
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Your-Production-Connection-String"
     },
     "JwtSettings": {
       "SecretKey": "Strong-Production-Secret-Key-At-Least-32-Characters",
       "Issuer": "STREAMDOORSystem",
       "Audience": "STREAMDOORSystemUsers",
       "ExpirationMinutes": 60
     }
   }
   ```

#### Option 2: Deploy to Azure App Service

1. **Create Azure App Service**
2. **Create Azure SQL Database**
3. **Configure Connection Strings in Azure Portal**
4. **Deploy using:**
   - Visual Studio Publish
   - Azure DevOps Pipeline
   - GitHub Actions
   - Azure CLI

#### Option 3: Deploy to Docker

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["STREAMDOORSystem.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "STREAMDOORSystem.dll"]
```

```bash
# Build and run
docker build -t streamdoor-api .
docker run -p 5000:80 streamdoor-api
```

### Frontend Deployment

#### Option 1: Deploy with Backend (Recommended)

1. **Build the React app:**
   ```bash
   cd ClientApp
   npm run build
   ```

2. The build output is already configured to go to `wwwroot/`
3. The ASP.NET Core backend will serve the static files
4. Deploy as a single application

#### Option 2: Deploy to Vercel

```bash
cd ClientApp

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or link to your project and deploy
vercel --prod
```

#### Option 3: Deploy to Netlify

```bash
cd ClientApp

# Build
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=../wwwroot
```

#### Option 4: Deploy to Azure Static Web Apps

1. Create Azure Static Web App
2. Configure build:
   - App location: `/ClientApp`
   - Output location: `../wwwroot`
   - Build command: `npm run build`

## Environment Configuration

### Development
- **Backend**: `appsettings.Development.json`
- **Frontend**: `.env`

### Production
- **Backend**: `appsettings.Production.json`
- **Frontend**: Environment variables in hosting platform

## Security Checklist

- [ ] Change JWT SecretKey to a strong, random value
- [ ] Use HTTPS in production
- [ ] Update CORS policy for production domains
- [ ] Secure connection strings (use Azure Key Vault or similar)
- [ ] Enable authentication on all protected endpoints
- [ ] Update default admin password
- [ ] Configure rate limiting
- [ ] Enable logging and monitoring
- [ ] Set up backup strategy for database
- [ ] Configure firewall rules for SQL Server

## Default Login Credentials

After running the data.sql script:

**Admin User:**
- Email: admin@streamdoor.com
- Password: Admin123!

**⚠️ IMPORTANT:** Change this password immediately in production!

## API Endpoints

All endpoints are available at `/api`:

- `/api/usuarios/login` - Authentication
- `/api/clientes` - Client management
- `/api/servicios` - Service management
- `/api/correos` - Email management
- `/api/cuentas` - Account management
- `/api/ventas` - Sales management
- `/api/mediospago` - Payment methods
- `/api/usuarios` - User management
- `/api/dashboard/stats` - Dashboard statistics

## Testing the Deployment

### Backend Health Check

```bash
curl http://localhost:5000/api/usuarios/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@streamdoor.com","password":"Admin123!"}'
```

### Frontend Access

1. Navigate to `http://localhost:5173` (development)
2. Login with admin credentials
3. Verify all modules load correctly
4. Test CRUD operations

## Troubleshooting

### Backend Issues

**Connection String Error:**
- Verify SQL Server is running
- Check server name and credentials
- Ensure TrustServerCertificate=True for local development

**CORS Error:**
- Check CORS policy in Program.cs
- Verify frontend URL is allowed

**401 Unauthorized:**
- Check JWT configuration
- Verify token is being sent in requests

### Frontend Issues

**Cannot connect to API:**
- Verify VITE_API_URL in .env
- Check backend is running
- Check network tab in browser dev tools

**Build errors:**
- Run `npm install` again
- Clear node_modules and reinstall
- Check Node.js version (18+)

**Routing issues:**
- Verify React Router configuration
- Check browser console for errors

## Monitoring & Logging

### Backend Logging

The application uses built-in .NET logging. Configure in `appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### Production Monitoring

Recommended tools:
- Application Insights (Azure)
- Serilog for structured logging
- ELK Stack (Elasticsearch, Logstash, Kibana)
- New Relic / Datadog

## Backup Strategy

### Database Backups

```sql
-- Full backup
BACKUP DATABASE STREAMDOORSystem
TO DISK = 'C:\Backups\STREAMDOORSystem.bak'
WITH INIT, COMPRESSION;

-- Scheduled backups (configure SQL Server Agent)
```

### File Backups

- Backend configuration files
- Frontend build artifacts
- SSL certificates
- Environment variables

## Performance Optimization

### Backend
- Enable response caching
- Use async/await consistently
- Implement database indexing
- Configure connection pooling

### Frontend
- Enable lazy loading for routes
- Implement code splitting
- Optimize images
- Enable service workers for PWA

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple backend instances
- Use load balancer (Azure Load Balancer, AWS ALB)
- Configure session state for distributed systems
- Use Redis for distributed caching

### Database Scaling
- Implement read replicas
- Configure connection pooling
- Use caching strategies
- Consider Azure SQL Database elastic pools

## Support & Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security vulnerabilities
- [ ] Monitor application logs
- [ ] Test backup restoration
- [ ] Review and optimize database queries
- [ ] Update documentation

### Updates
- Backend: `dotnet add package <PackageName>`
- Frontend: `npm update`

## Additional Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Entity Framework Core Documentation](https://docs.microsoft.com/ef/core)

---

**Last Updated:** February 2024
**Version:** 1.0.0
