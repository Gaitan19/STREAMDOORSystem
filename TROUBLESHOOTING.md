# 🔧 Solución de Problemas - SPA Proxy

## Problema: "Launching the SPA proxy..." se queda cargando

### Causa
El SpaProxy de Visual Studio estaba intentando usar el mismo puerto (44447) que el backend, causando un conflicto.

### Solución Implementada
Se han separado los puertos:
- **Backend API:** https://localhost:44447
- **Frontend Vite:** http://localhost:44448
- **SpaProxy:** Redirecciona automáticamente de 44447 a 44448

## Cómo Ejecutar Correctamente

### Método 1: Visual Studio (Recomendado)
1. Abrir `STREAMDOORSystem.sln` en Visual Studio 2022
2. Presionar F5
3. Esperar a que:
   - Backend inicie en https://localhost:44447
   - Frontend (Vite) inicie en http://localhost:44448
4. El navegador se abrirá automáticamente en https://localhost:44447
5. El SpaProxy redirigirá al frontend en http://localhost:44448

### Método 2: Ejecución Manual (Si hay problemas)

**Terminal 1 - Backend:**
```bash
cd /ruta/al/proyecto/STREAMDOORSystem
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd /ruta/al/proyecto/STREAMDOORSystem/ClientApp
npm run dev
```

Luego abrir el navegador en: http://localhost:44448

## Verificación de Puertos

### Verificar que los puertos estén libres:
```bash
# Windows
netstat -ano | findstr :44447
netstat -ano | findstr :44448

# Si hay procesos usando los puertos, matarlos:
taskkill /PID <número_de_proceso> /F
```

## Credenciales de Acceso

**Usuario Admin (ACTUALIZADO):**
- **Correo:** admin@streamdoor.com
- **Contraseña:** 1234567890

## Archivos Modificados

### 1. STREAMDOORSystem.csproj
```xml
<SpaProxyServerUrl>http://localhost:44448</SpaProxyServerUrl>
<SpaProxyLaunchCommand>npm run dev</SpaProxyLaunchCommand>
```

### 2. ClientApp/vite.config.js
```javascript
server: {
  port: 44448,
  strictPort: true,  // Forzar el puerto, no buscar alternativas
  https: false,
  proxy: {
    '/api': {
      target: 'https://localhost:44447',
      changeOrigin: true,
      secure: false
    }
  }
}
```

### 3. ClientApp/.env.development
```
PORT=44448
```

### 4. Program.cs - CORS
```csharp
policy.WithOrigins(
    "http://localhost:44447", 
    "https://localhost:44447", 
    "http://localhost:44448",  // <- Puerto del frontend
    "https://localhost:44448"
)
```

### 5. Consultas/data.sql
```sql
-- Contraseña actualizada a: 1234567890
INSERT INTO Usuarios (Nombre, Correo, Telefono, PasswordHash) VALUES
('Administrador', 'admin@streamdoor.com', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
```

## Flujo de Ejecución

```
┌─────────────────────────────────────────┐
│  Visual Studio presiona F5              │
└───────────────┬─────────────────────────┘
                │
                ├─► Backend inicia en https://localhost:44447
                │   (API, Swagger, autenticación)
                │
                ├─► SpaProxy detecta <SpaProxyServerUrl>
                │   Busca servidor Vite en http://localhost:44448
                │
                └─► npm run dev inicia Vite
                    └─► Frontend corre en http://localhost:44448
                        └─► Proxy /api → https://localhost:44447

┌─────────────────────────────────────────┐
│  Navegador abre https://localhost:44447  │
└───────────────┬─────────────────────────┘
                │
                └─► SpaProxy redirige a http://localhost:44448
                    └─► Login page se muestra
```

## Posibles Errores y Soluciones

### Error: "Unable to connect to the SPA development server"
**Causa:** El frontend no inició correctamente.

**Solución:**
1. Abrir una terminal en `ClientApp/`
2. Ejecutar: `npm install`
3. Ejecutar: `npm run dev`
4. Verificar que Vite inicie en puerto 44448
5. Refrescar Visual Studio (Ctrl+F5)

### Error: "Port 44448 is already in use"
**Causa:** Otro proceso está usando el puerto.

**Solución:**
```bash
# Windows - Encontrar y matar el proceso
netstat -ano | findstr :44448
taskkill /PID <número> /F
```

### Error: "CORS policy error"
**Causa:** El origen no está permitido en CORS.

**Solución:** Verificar que Program.cs incluya ambos puertos:
```csharp
policy.WithOrigins(
    "http://localhost:44447", "https://localhost:44447",
    "http://localhost:44448", "https://localhost:44448"
)
```

### Error: "Cannot find module" en frontend
**Causa:** Dependencias no instaladas.

**Solución:**
```bash
cd ClientApp
rm -rf node_modules package-lock.json
npm install
```

## Debugging

### Ver logs del backend:
Los logs aparecen en la consola de Visual Studio.

### Ver logs del frontend:
```bash
cd ClientApp
npm run dev
```
Los logs de Vite aparecen en esta terminal.

### Verificar conexión API:
1. Abrir https://localhost:44447/swagger
2. Verificar que la API responda
3. Probar endpoint: GET /api/servicios

## Notas Importantes

1. **Primera ejecución:** Puede tardar más tiempo mientras npm instala dependencias.
2. **Certificado SSL:** Si el navegador muestra advertencia de certificado, aceptar y continuar.
3. **Hot Reload:** Los cambios en el frontend se reflejan automáticamente sin reiniciar.
4. **Cambios en backend:** Requieren detener y reiniciar (Shift+F5, luego F5).

## Contacto

Si los problemas persisten después de seguir esta guía:
1. Revisar la documentación en `VISUAL_STUDIO_GUIDE.md`
2. Verificar que todos los scripts SQL se ejecutaron correctamente
3. Comprobar que .NET 8 SDK esté instalado: `dotnet --version`
4. Comprobar que Node.js esté instalado: `node --version`

---

**Estado:** Problemas resueltos ✅
**Última actualización:** Commit 0a1f014
