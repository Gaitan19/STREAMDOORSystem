# 🔐 Security Configuration Guide

## Important Security Considerations

### 1. JWT Secret Key

**Development (appsettings.json)**
- Contains a default JWT secret key for development purposes
- **DO NOT use this key in production**

**Production (appsettings.Production.json)**
- Generate a strong, random key (at least 32 characters)
- Store in environment variables or Azure Key Vault
- Never commit production keys to source control

**Recommended approach for production:**

```bash
# Set environment variable
export Jwt__Key="YOUR_SECURE_RANDOM_KEY_HERE"
```

Or use Azure Key Vault:
```bash
# In Azure App Service, configure the Jwt:Key setting
```

### 2. Database Connection String

**Development**
- Uses Trusted_Connection for local development

**Production**
- Use secure connection strings with proper credentials
- Store in environment variables or Azure Key Vault
- Enable SSL/TLS for database connections

### 3. CORS Configuration

Update Program.cs to restrict CORS to your production domain:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("https://your-production-domain.com")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});
```

### 4. HTTPS

Always use HTTPS in production. Configure in Program.cs:

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();
```

### 5. Cookie Security

Cookies are configured as HttpOnly, Secure, and SameSite=Strict in AuthController.
In production, ensure:
- Cookies are only sent over HTTPS
- Domain is properly configured

### 6. Admin User Creation

The first admin user must be created via the API after deployment:

```bash
POST /api/usuarios
Content-Type: application/json

{
  "nombre": "Administrador",
  "correo": "admin@yourdomain.com",
  "password": "YourSecurePassword123!"
}
```

The password will be automatically hashed using BCrypt before storage.

### 7. Additional Recommendations

- Enable rate limiting for API endpoints
- Implement proper logging and monitoring
- Regular security updates for dependencies
- Use Azure App Service or similar with managed identity
- Enable Application Insights for monitoring
- Configure proper firewall rules
- Regular backups of the database

### 8. Environment Variables

Set these in production:

```bash
ConnectionStrings__DefaultConnection="Server=...;Database=DBStreamDoor;..."
Jwt__Key="your-secure-key-here"
Jwt__Issuer="YourIssuer"
Jwt__Audience="YourAudience"
```

### 9. Dependency Security

Regularly update NuGet and npm packages:

```bash
# Check for updates
dotnet list package --outdated
npm outdated

# Update packages
dotnet add package [PackageName]
npm update
```

### 10. Code Scanning

Use GitHub Advanced Security or similar tools to scan for vulnerabilities.

---

**Remember: Security is an ongoing process. Review and update these settings regularly.**
