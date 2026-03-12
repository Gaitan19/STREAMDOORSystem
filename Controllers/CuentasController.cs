using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models;
using STREAMDOORSystem.Models.DTOs;
using System.Security.Claims;

namespace STREAMDOORSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CuentasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CuentasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Cuentas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CuentaDTO>>> GetCuentas()
        {
            try
            {
                var cuentas = await _context.Cuentas
                    .Where(c => c.Activo)
                    .Include(c => c.Servicio)
                    .Include(c => c.Correo)
                    .Include(c => c.Perfiles) // Include profiles to calculate counts
                    .ToListAsync();

                var cuentasDto = cuentas.Select(c => new CuentaDTO
                {
                    CuentaID = c.CuentaID,
                    ServicioID = c.ServicioID,
                    NombreServicio = c.Servicio!.Nombre,
                    CorreoID = c.CorreoID,
                    Email = c.Correo != null ? c.Correo.Email : null,
                    TipoCuenta = c.TipoCuenta,
                    // Calculate NumeroPerfiles from actual profile count
                    NumeroPerfiles = c.Perfiles.Count(p => p.Activo),
                    // Calculate PerfilesDisponibles from actual available profiles
                    PerfilesDisponibles = c.Perfiles.Count(p => p.Activo && p.Estado == "Disponible"),
                    Estado = c.Estado,
                    Disponibilidad = c.Disponibilidad,
                    EstadoSuscripcion = c.EstadoSuscripcion,
                    FechaCreacion = c.FechaCreacion,
                    FechaFinalizacion = c.FechaFinalizacion,
                    Password = c.Password,
                    CorreoTerceros = c.CorreoTerceros,
                    CodigoCuenta = c.CodigoCuenta,
                    Costo = c.Costo,
                    Activo = c.Activo,
                    Perfiles = c.Perfiles.Where(p => p.Activo).Select(p => new PerfilDTO
                    {
                        PerfilID = p.PerfilID,
                        CuentaID = p.CuentaID,
                        NumeroPerfil = p.NumeroPerfil,
                        PIN = p.PIN,
                        Estado = p.Estado,
                        Activo = p.Activo
                    }).ToList()
                }).ToList();

                return Ok(cuentasDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener cuentas", error = ex.Message });
            }
        }

        // GET: api/Cuentas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CuentaDTO>> GetCuenta(int id)
        {
            try
            {
                var cuenta = await _context.Cuentas
                    .Include(c => c.Servicio)
                    .Include(c => c.Correo)
                    .Include(c => c.Perfiles) // Include profiles to calculate counts
                    .FirstOrDefaultAsync(c => c.CuentaID == id && c.Activo);

                if (cuenta == null)
                {
                    return NotFound(new { message = "Cuenta no encontrada" });
                }

                var cuentaDto = new CuentaDTO
                {
                    CuentaID = cuenta.CuentaID,
                    ServicioID = cuenta.ServicioID,
                    NombreServicio = cuenta.Servicio!.Nombre,
                    CorreoID = cuenta.CorreoID,
                    Email = cuenta.Correo != null ? cuenta.Correo.Email : null,
                    TipoCuenta = cuenta.TipoCuenta,
                    // Calculate NumeroPerfiles from actual profile count
                    NumeroPerfiles = cuenta.Perfiles.Count(p => p.Activo),
                    // Calculate PerfilesDisponibles from actual available profiles
                    PerfilesDisponibles = cuenta.Perfiles.Count(p => p.Activo && p.Estado == "Disponible"),
                    Estado = cuenta.Estado,
                    FechaCreacion = cuenta.FechaCreacion,
                    FechaFinalizacion = cuenta.FechaFinalizacion,
                    Password = cuenta.Password,
                    CorreoTerceros = cuenta.CorreoTerceros,
                    CodigoCuenta = cuenta.CodigoCuenta,
                    Activo = cuenta.Activo,
                    Perfiles = cuenta.Perfiles.Where(p => p.Activo).Select(p => new PerfilDTO
                    {
                        PerfilID = p.PerfilID,
                        CuentaID = p.CuentaID,
                        NumeroPerfil = p.NumeroPerfil,
                        PIN = p.PIN,
                        Estado = p.Estado,
                        Activo = p.Activo
                    }).ToList()
                };

                return Ok(cuentaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener cuenta", error = ex.Message });
            }
        }

        // POST: api/Cuentas
        [HttpPost]
        public async Task<ActionResult<CuentaDTO>> CreateCuenta([FromBody] CrearCuentaDTO crearCuentaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que el servicio exista
                var servicioExiste = await _context.Servicios.AnyAsync(s => s.ServicioID == crearCuentaDto.ServicioID && s.Activo);
                if (!servicioExiste)
                {
                    return BadRequest(new { message = "El servicio especificado no existe" });
                }

                // Verificar que el correo exista si se proporciona
                if (crearCuentaDto.CorreoID.HasValue)
                {
                    var correoExiste = await _context.Correos.AnyAsync(c => c.CorreoID == crearCuentaDto.CorreoID && c.Activo);
                    if (!correoExiste)
                    {
                        return BadRequest(new { message = "El correo especificado no existe" });
                    }
                }

                var cuenta = new Cuenta
                {
                    ServicioID = crearCuentaDto.ServicioID,
                    CorreoID = crearCuentaDto.CorreoID,
                    TipoCuenta = crearCuentaDto.TipoCuenta,
                    NumeroPerfiles = crearCuentaDto.NumeroPerfiles,
                    PerfilesDisponibles = crearCuentaDto.NumeroPerfiles,
                    Estado = "Disponible",  // Backward compatibility
                    Disponibilidad = "Disponible",  // New field - always available on creation
                    // Calculate EstadoSuscripcion based on FechaFinalizacion
                    EstadoSuscripcion = crearCuentaDto.FechaFinalizacion.HasValue
                        ? (crearCuentaDto.FechaFinalizacion.Value < DateTime.Now
                            ? "Vencida"  // Already expired
                            : (crearCuentaDto.FechaFinalizacion.Value <= DateTime.Now.AddDays(5) && crearCuentaDto.FechaFinalizacion.Value >= DateTime.Now
                                ? "Próxima a Vencer"  // Expires within 5 days
                                : "Activo"))  // Active and not near expiration
                        : "Activo",  // No expiration date - considered active
                    FechaCreacion = DateTime.Now,
                    FechaFinalizacion = crearCuentaDto.FechaFinalizacion,
                    Password = crearCuentaDto.Password,
                    CorreoTerceros = crearCuentaDto.CorreoTerceros,
                    CodigoCuenta = crearCuentaDto.CodigoCuenta,
                    Costo = crearCuentaDto.Costo,
                    Activo = true
                };

                _context.Cuentas.Add(cuenta);
                await _context.SaveChangesAsync();

                // Auto-crear perfiles basados en NumeroPerfiles si no se proporcionan
                if (crearCuentaDto.Perfiles == null || crearCuentaDto.Perfiles.Count == 0)
                {
                    for (int i = 1; i <= crearCuentaDto.NumeroPerfiles; i++)
                    {
                        var perfil = new Perfil
                        {
                            CuentaID = cuenta.CuentaID,
                            NumeroPerfil = i,
                            PIN = null,
                            Estado = "Disponible",
                            Activo = true
                        };
                        _context.Perfiles.Add(perfil);
                    }
                    await _context.SaveChangesAsync();
                }
                // Crear perfiles si se proporcionan
                else if (crearCuentaDto.Perfiles != null && crearCuentaDto.Perfiles.Count > 0)
                {
                    foreach (var perfilDto in crearCuentaDto.Perfiles)
                    {
                        var perfil = new Perfil
                        {
                            CuentaID = cuenta.CuentaID,
                            NumeroPerfil = perfilDto.NumeroPerfil,
                            PIN = perfilDto.PIN,
                            Estado = "Disponible",
                            Activo = true
                        };
                        _context.Perfiles.Add(perfil);
                    }
                    await _context.SaveChangesAsync();
                }

                // Get servicio for egreso description
                var servicio = await _context.Servicios.FindAsync(crearCuentaDto.ServicioID);

                // Crear egreso automáticamente si la cuenta tiene costo
                if (crearCuentaDto.Costo.HasValue && crearCuentaDto.Costo.Value > 0)
                {
                    var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var usuarioNombreClaim = User.FindFirst(ClaimTypes.Name)?.Value;
                    
                    int? usuarioId = null;
                    if (int.TryParse(usuarioIdClaim, out int parsedId))
                    {
                        usuarioId = parsedId;
                    }

                    var egreso = new Egreso
                    {
                        Monto = crearCuentaDto.Costo.Value,
                        Descripcion = $"Egreso por adquisición de cuenta {cuenta.CodigoCuenta} ({servicio!.Nombre}) — registrada el {DateTime.Now:dd/MM/yyyy}.",
                        CuentaID = cuenta.CuentaID,
                        UsuarioID = usuarioId,
                        Usuario = usuarioNombreClaim ?? "Sistema",
                        FechaCreacion = DateTime.Now
                    };
                    _context.Egresos.Add(egreso);
                    await _context.SaveChangesAsync();
                }

                var correo = crearCuentaDto.CorreoID.HasValue ? await _context.Correos.FindAsync(crearCuentaDto.CorreoID) : null;
                
                var cuentaDto = new CuentaDTO
                {
                    CuentaID = cuenta.CuentaID,
                    ServicioID = cuenta.ServicioID,
                    NombreServicio = servicio!.Nombre,
                    CorreoID = cuenta.CorreoID,
                    Email = correo?.Email,
                    TipoCuenta = cuenta.TipoCuenta,
                    NumeroPerfiles = cuenta.NumeroPerfiles,
                    PerfilesDisponibles = cuenta.PerfilesDisponibles,
                    Estado = cuenta.Estado,
                    FechaCreacion = cuenta.FechaCreacion,
                    FechaFinalizacion = cuenta.FechaFinalizacion,
                    Costo = cuenta.Costo
                };

                return CreatedAtAction(nameof(GetCuenta), new { id = cuenta.CuentaID }, cuentaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear cuenta", error = ex.Message });
            }
        }

        // PUT: api/Cuentas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCuenta(int id, [FromBody] CrearCuentaDTO crearCuentaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var cuenta = await _context.Cuentas.FindAsync(id);

                if (cuenta == null || !cuenta.Activo)
                {
                    return NotFound(new { message = "Cuenta no encontrada" });
                }

                // Verificar que el servicio exista
                var servicioExiste = await _context.Servicios.AnyAsync(s => s.ServicioID == crearCuentaDto.ServicioID && s.Activo);
                if (!servicioExiste)
                {
                    return BadRequest(new { message = "El servicio especificado no existe" });
                }

                // Verificar que el correo exista si se proporciona
                if (crearCuentaDto.CorreoID.HasValue)
                {
                    var correoExiste = await _context.Correos.AnyAsync(c => c.CorreoID == crearCuentaDto.CorreoID && c.Activo);
                    if (!correoExiste)
                    {
                        return BadRequest(new { message = "El correo especificado no existe" });
                    }
                }

                cuenta.ServicioID = crearCuentaDto.ServicioID;
                cuenta.CorreoID = crearCuentaDto.CorreoID;
                cuenta.TipoCuenta = crearCuentaDto.TipoCuenta;
                cuenta.NumeroPerfiles = crearCuentaDto.NumeroPerfiles;
                cuenta.FechaFinalizacion = crearCuentaDto.FechaFinalizacion;
                cuenta.Password = crearCuentaDto.Password;
                cuenta.CorreoTerceros = crearCuentaDto.CorreoTerceros;
                cuenta.CodigoCuenta = crearCuentaDto.CodigoCuenta;
                cuenta.Costo = crearCuentaDto.Costo;

                _context.Cuentas.Update(cuenta);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar cuenta", error = ex.Message });
            }
        }

        // POST: api/Cuentas/5/renovar
        [HttpPost("{id}/renovar")]
        public async Task<IActionResult> RenovarCuenta(int id, [FromBody] RenovarCuentaDTO dto)
        {
            try
            {
                var cuenta = await _context.Cuentas
                    .Include(c => c.Servicio)
                    .FirstOrDefaultAsync(c => c.CuentaID == id && c.Activo);

                if (cuenta == null)
                    return NotFound(new { message = "Cuenta no encontrada" });

                // Update expiration date
                cuenta.FechaFinalizacion = dto.NuevaFechaFinalizacion;

                // Recalculate subscription status (values must match CK_Cuentas_EstadoSuscripcion constraint)
                if (dto.NuevaFechaFinalizacion < DateTime.Now)
                    cuenta.EstadoSuscripcion = "Vencida";
                else if (dto.NuevaFechaFinalizacion <= DateTime.Now.AddDays(5))
                    cuenta.EstadoSuscripcion = "Próxima a Vencer";
                else
                    cuenta.EstadoSuscripcion = "Activo";

                _context.Cuentas.Update(cuenta);
                await _context.SaveChangesAsync();

                // Create automatic Egreso if account has a cost
                if (cuenta.Costo.HasValue && cuenta.Costo.Value > 0)
                {
                    var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var usuarioNombreClaim = User.FindFirst(ClaimTypes.Name)?.Value;

                    int? usuarioId = null;
                    if (int.TryParse(usuarioIdClaim, out int parsedId))
                        usuarioId = parsedId;

                    var egreso = new Egreso
                    {
                        Monto = cuenta.Costo.Value,
                        Descripcion = $"Renovación de cuenta {cuenta.CodigoCuenta} ({cuenta.Servicio?.Nombre ?? "Sin servicio"}) — nueva vigencia hasta el {dto.NuevaFechaFinalizacion:dd/MM/yyyy}.",
                        CuentaID = cuenta.CuentaID,
                        UsuarioID = usuarioId,
                        Usuario = usuarioNombreClaim ?? "Sistema",
                        FechaCreacion = DateTime.Now
                    };
                    _context.Egresos.Add(egreso);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Cuenta renovada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al renovar cuenta", error = ex.Message });
            }
        }

        // DELETE: api/Cuentas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCuenta(int id)
        {
            try
            {
                var cuenta = await _context.Cuentas.FindAsync(id);

                if (cuenta == null || !cuenta.Activo)
                {
                    return NotFound(new { message = "Cuenta no encontrada" });
                }

                cuenta.Activo = false;
                _context.Cuentas.Update(cuenta);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar cuenta", error = ex.Message });
            }
        }

        // GET: api/Cuentas/correos/disponibles
        [HttpGet("correos/disponibles")]
        public async Task<ActionResult<IEnumerable<CorreoDTO>>> GetCorreosDisponibles()
        {
            try
            {
                // Get all CorreoIDs that are used by active accounts
                var correosUsados = await _context.Cuentas
                    .Where(c => c.Activo && c.CorreoID.HasValue)
                    .Select(c => c.CorreoID!.Value)
                    .Distinct()
                    .ToListAsync();

                // Get correos not in the used list
                var correosDisponibles = await _context.Correos
                    .Where(c => c.Activo && !correosUsados.Contains(c.CorreoID))
                    .Select(c => new CorreoDTO
                    {
                        CorreoID = c.CorreoID,
                        Email = c.Email,
                        Password = c.Password,
                        FechaCreacion = c.FechaCreacion,
                        Notas = c.Notas,
                        Activo = c.Activo
                    })
                    .ToListAsync();

                return Ok(correosDisponibles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener correos disponibles", error = ex.Message });
            }
        }

        // GET: api/Cuentas/correos/disponibles-por-servicio/{servicioID}
        [HttpGet("correos/disponibles-por-servicio/{servicioID}")]
        public async Task<ActionResult<IEnumerable<CorreoDTO>>> GetCorreosDisponiblesPorServicio(int servicioID)
        {
            try
            {
                // Get all CorreoIDs that are already used for THIS specific service
                var correosUsadosParaEsteServicio = await _context.Cuentas
                    .Where(c => c.Activo && c.CorreoID.HasValue && c.ServicioID == servicioID)
                    .Select(c => c.CorreoID!.Value)
                    .Distinct()
                    .ToListAsync();

                // Get all active correos EXCEPT those already used for this service
                // This allows the same email to be used for different services
                var correosDisponibles = await _context.Correos
                    .Where(c => c.Activo && !correosUsadosParaEsteServicio.Contains(c.CorreoID))
                    .Select(c => new CorreoDTO
                    {
                        CorreoID = c.CorreoID,
                        Email = c.Email,
                        Password = c.Password,
                        FechaCreacion = c.FechaCreacion,
                        Notas = c.Notas,
                        Activo = c.Activo
                    })
                    .ToListAsync();

                return Ok(correosDisponibles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener correos disponibles por servicio", error = ex.Message });
            }
        }

        // GET: api/Cuentas/filtro/{filtro}
        [HttpGet("filtro/{filtro}")]
        public async Task<ActionResult<IEnumerable<CuentaDTO>>> GetCuentasPorFiltro(string filtro)
        {
            try
            {
                var cuentas = await _context.Cuentas
                    .Where(c => c.Activo)
                    .Include(c => c.Servicio)
                    .Include(c => c.Correo)
                    .ToListAsync();

                var perfilesDict = await _context.Perfiles
                    .Where(p => p.Activo)
                    .GroupBy(p => p.CuentaID)
                    .ToDictionaryAsync(
                        g => g.Key,
                        g => g.ToList()
                    );

                // Calculate Estado for each account
                foreach (var cuenta in cuentas)
                {
                    var perfiles = perfilesDict.ContainsKey(cuenta.CuentaID) 
                        ? perfilesDict[cuenta.CuentaID] 
                        : new List<Perfil>();
                    cuenta.Estado = CalcularEstado(cuenta, perfiles);
                }

                // Filter based on filtro parameter
                var cuentasFiltradas = filtro.ToLower() switch
                {
                    "disponibles" => cuentas.Where(c => c.Estado == "Disponible"),
                    "no-disponibles" => cuentas.Where(c => c.Estado == "No Disponible"),
                    "vencidas" => cuentas.Where(c => c.Estado == "Vencida"),
                    "proximas-a-vencer" => cuentas.Where(c => c.Estado == "Próxima a Vencer"),
                    _ => cuentas
                };

                var cuentasDto = cuentasFiltradas.Select(c =>
                {
                    var perfiles = perfilesDict.ContainsKey(c.CuentaID) 
                        ? perfilesDict[c.CuentaID] 
                        : new List<Perfil>();
                    
                    return new CuentaDTO
                    {
                        CuentaID = c.CuentaID,
                        ServicioID = c.ServicioID,
                        NombreServicio = c.Servicio!.Nombre,
                        CorreoID = c.CorreoID,
                        Email = c.Correo != null ? c.Correo.Email : null,
                        TipoCuenta = c.TipoCuenta,
                        // Calculate NumeroPerfiles from actual profile count
                        NumeroPerfiles = perfiles.Count,
                        // Calculate PerfilesDisponibles from actual available profiles
                        PerfilesDisponibles = perfiles.Count(p => p.Estado == "Disponible"),
                        Estado = c.Estado,
                        FechaCreacion = c.FechaCreacion,
                        FechaFinalizacion = c.FechaFinalizacion,
                        Password = c.Password,
                        CorreoTerceros = c.CorreoTerceros,
                        CodigoCuenta = c.CodigoCuenta
                    };
                }).ToList();

                return Ok(cuentasDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al filtrar cuentas", error = ex.Message });
            }
        }

        // Helper methods to calculate Disponibilidad and EstadoSuscripcion
        private (string disponibilidad, string estadoSuscripcion) CalcularEstados(Cuenta cuenta, List<Perfil> perfiles)
        {
            // Calculate EstadoSuscripcion (subscription status)
            string estadoSuscripcion;
            bool estaVencida = cuenta.FechaFinalizacion.HasValue && cuenta.FechaFinalizacion.Value < DateTime.Now;
            
            if (estaVencida)
            {
                estadoSuscripcion = "Vencida";
            }
            else if (cuenta.FechaFinalizacion.HasValue && 
                cuenta.FechaFinalizacion.Value <= DateTime.Now.AddDays(5) &&
                cuenta.FechaFinalizacion.Value >= DateTime.Now)
            {
                estadoSuscripcion = "Próxima a Vencer";
            }
            else
            {
                estadoSuscripcion = "Activo";
            }

            // Calculate Disponibilidad (profile availability)
            // If account is expired, it should always be "No Disponible"
            string disponibilidad;
            if (estaVencida)
            {
                disponibilidad = "No Disponible";
            }
            else if (perfiles.Any(p => p.Activo) && perfiles.Where(p => p.Activo).All(p => p.Estado == "Ocupado"))
            {
                disponibilidad = "No Disponible";
            }
            else
            {
                disponibilidad = "Disponible";
            }

            return (disponibilidad, estadoSuscripcion);
        }
        
        // Legacy method - kept for backward compatibility, combines both statuses
        private string CalcularEstado(Cuenta cuenta, List<Perfil> perfiles)
        {
            // 1. Check if expired
            if (cuenta.FechaFinalizacion.HasValue && cuenta.FechaFinalizacion.Value < DateTime.Now)
            {
                return "Vencida";
            }

            // 2. Check if close to expiration (5 days)
            if (cuenta.FechaFinalizacion.HasValue && 
                cuenta.FechaFinalizacion.Value <= DateTime.Now.AddDays(5) &&
                cuenta.FechaFinalizacion.Value >= DateTime.Now)
            {
                return "Próxima a Vencer";
            }

            // 3. Check if all profiles are occupied
            if (perfiles.Any() && perfiles.All(p => p.Estado == "Ocupado"))
            {
                return "No Disponible";
            }

            // 4. Otherwise available
            return "Disponible";
        }

        // GET: api/cuentas/validar-codigo/{codigo}
        [HttpGet("validar-codigo/{codigo}")]
        public async Task<ActionResult<bool>> ValidarCodigoCuenta(string codigo)
        {
            try
            {
                var existe = await _context.Cuentas
                    .AnyAsync(c => c.CodigoCuenta == codigo && c.Activo);
                
                return Ok(new { existe, disponible = !existe });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al validar código", error = ex.Message });
            }
        }

        // POST: api/cuentas/actualizar-disponibilidad
        // Lightweight check used by Ventas after create/cancel/edit-assignment.
        // Only updates the Disponibilidad field (no expiry check).
        [HttpPost("actualizar-disponibilidad")]
        public async Task<ActionResult> ActualizarDisponibilidad()
        {
            try
            {
                var cuentas = await _context.Cuentas
                    .Where(c => c.Activo)
                    .Include(c => c.Perfiles.Where(p => p.Activo))
                    .ToListAsync();

                int actualizadas = 0;
                foreach (var cuenta in cuentas)
                {
                    var perfiles = cuenta.Perfiles.ToList();
                    // "Disponible" when there is at least one available profile
                    // "No Disponible" when all profiles are occupied or none exist
                    var nuevaDisponibilidad = perfiles.Any(p => p.Estado == "Disponible")
                        ? "Disponible"
                        : "No Disponible";

                    if (nuevaDisponibilidad != cuenta.Disponibilidad)
                    {
                        cuenta.Disponibilidad = nuevaDisponibilidad;
                        _context.Entry(cuenta).Property(c => c.Disponibilidad).IsModified = true;
                        actualizadas++;
                    }
                }

                if (actualizadas > 0)
                    await _context.SaveChangesAsync();

                return Ok(new { message = $"{actualizadas} cuenta(s) actualizada(s)", actualizadas });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar disponibilidad", error = ex.Message });
            }
        }

        // POST: api/cuentas/verificar-estados
        [HttpPost("verificar-estados")]
        public async Task<ActionResult> VerificarEstados()
        {
            try
            {
                // Get ALL active accounts, not just "Disponible" ones
                var cuentas = await _context.Cuentas
                    .Where(c => c.Activo)
                    .Include(c => c.Perfiles.Where(p => p.Activo))
                    .ToListAsync();

                int actualizadas = 0;
                foreach (var cuenta in cuentas)
                {
                    var perfiles = cuenta.Perfiles.ToList();
                    var (disponibilidad, estadoSuscripcion) = CalcularEstados(cuenta, perfiles);
                    var nuevoEstado = CalcularEstado(cuenta, perfiles); // For backward compatibility
                    
                    bool cambio = false;
                    if (disponibilidad != cuenta.Disponibilidad)
                    {
                        cuenta.Disponibilidad = disponibilidad;
                        _context.Entry(cuenta).Property(c => c.Disponibilidad).IsModified = true;
                        cambio = true;
                    }
                    
                    if (estadoSuscripcion != cuenta.EstadoSuscripcion)
                    {
                        cuenta.EstadoSuscripcion = estadoSuscripcion;
                        _context.Entry(cuenta).Property(c => c.EstadoSuscripcion).IsModified = true;
                        cambio = true;
                    }
                    
                    if (nuevoEstado != cuenta.Estado)
                    {
                        cuenta.Estado = nuevoEstado;
                        _context.Entry(cuenta).Property(c => c.Estado).IsModified = true;
                        cambio = true;
                    }
                    
                    if (cambio)
                    {
                        actualizadas++;
                    }
                }

                if (actualizadas > 0)
                {
                    await _context.SaveChangesAsync();
                }
                
                return Ok(new { 
                    message = $"{actualizadas} cuenta(s) actualizada(s)", 
                    actualizadas 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al verificar estados", error = ex.Message });
            }
        }

        // GET: api/Cuentas/disponibles
        [HttpGet("disponibles")]
        public async Task<ActionResult<IEnumerable<CuentaDTO>>> GetCuentasDisponibles()
        {
            try
            {
                var cuentas = await _context.Cuentas
                    .Where(c => c.Activo && c.Disponibilidad == "Disponible")  // Changed from Estado to Disponibilidad
                    .Include(c => c.Servicio)
                    .Include(c => c.Correo)
                    .Include(c => c.Perfiles.Where(p => p.Activo))
                    .Select(c => new CuentaDTO
                    {
                        CuentaID = c.CuentaID,
                        ServicioID = c.ServicioID,
                        NombreServicio = c.Servicio!.Nombre,
                        CodigoCuenta = c.CodigoCuenta,
                        TipoCuenta = c.TipoCuenta,
                        NumeroPerfiles = c.Perfiles.Count(p => p.Activo),
                        PerfilesDisponibles = c.Perfiles.Count(p => p.Activo && p.Estado == "Disponible"),
                        Estado = c.Estado,
                        Disponibilidad = c.Disponibilidad,
                        EstadoSuscripcion = c.EstadoSuscripcion,
                        FechaCreacion = c.FechaCreacion,
                        FechaFinalizacion = c.FechaFinalizacion
                    })
                    .OrderBy(c => c.NombreServicio)
                    .ThenBy(c => c.CodigoCuenta)
                    .ToListAsync();

                return Ok(cuentas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener cuentas disponibles", error = ex.Message });
            }
        }

        // GET: api/Cuentas/5/perfiles-disponibles
        [HttpGet("{id}/perfiles-disponibles")]
        public async Task<ActionResult<IEnumerable<PerfilDTO>>> GetPerfilesDisponibles(int id)
        {
            try
            {
                var cuenta = await _context.Cuentas
                    .Include(c => c.Perfiles.Where(p => p.Activo && p.Estado == "Disponible"))
                    .FirstOrDefaultAsync(c => c.CuentaID == id && c.Activo);

                if (cuenta == null)
                {
                    return NotFound(new { message = "Cuenta no encontrada" });
                }

                var perfiles = cuenta.Perfiles
                    .Select(p => new PerfilDTO
                    {
                        PerfilID = p.PerfilID,
                        CuentaID = p.CuentaID,
                        NumeroPerfil = p.NumeroPerfil,
                        PIN = p.PIN,
                        Estado = p.Estado,
                        Activo = p.Activo
                    })
                    .OrderBy(p => p.NumeroPerfil)
                    .ToList();

                return Ok(perfiles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener perfiles disponibles", error = ex.Message });
            }
        }
    }
}
