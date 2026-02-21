using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models;
using STREAMDOORSystem.Models.DTOs;

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
                    .Select(c => new CuentaDTO
                    {
                        CuentaID = c.CuentaID,
                        ServicioID = c.ServicioID,
                        NombreServicio = c.Servicio!.Nombre,
                        CorreoID = c.CorreoID,
                        Email = c.Correo != null ? c.Correo.Email : null,
                        TipoCuenta = c.TipoCuenta,
                        NumeroPerfiles = c.NumeroPerfiles,
                        PerfilesDisponibles = c.PerfilesDisponibles,
                        Estado = c.Estado,
                        FechaCreacion = c.FechaCreacion,
                        FechaFinalizacion = c.FechaFinalizacion
                    })
                    .ToListAsync();

                return Ok(cuentas);
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
                    NumeroPerfiles = cuenta.NumeroPerfiles,
                    PerfilesDisponibles = cuenta.PerfilesDisponibles,
                    Estado = cuenta.Estado,
                    FechaCreacion = cuenta.FechaCreacion,
                    FechaFinalizacion = cuenta.FechaFinalizacion
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
                    Estado = "Disponible",
                    FechaCreacion = DateTime.Now,
                    FechaFinalizacion = crearCuentaDto.FechaFinalizacion,
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

                var servicio = await _context.Servicios.FindAsync(crearCuentaDto.ServicioID);
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
                    FechaFinalizacion = cuenta.FechaFinalizacion
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

                _context.Cuentas.Update(cuenta);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar cuenta", error = ex.Message });
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

                var cuentasDto = cuentasFiltradas.Select(c => new CuentaDTO
                {
                    CuentaID = c.CuentaID,
                    ServicioID = c.ServicioID,
                    NombreServicio = c.Servicio!.Nombre,
                    CorreoID = c.CorreoID,
                    Email = c.Correo != null ? c.Correo.Email : null,
                    TipoCuenta = c.TipoCuenta,
                    NumeroPerfiles = c.NumeroPerfiles,
                    PerfilesDisponibles = c.PerfilesDisponibles,
                    Estado = c.Estado,
                    FechaCreacion = c.FechaCreacion,
                    FechaFinalizacion = c.FechaFinalizacion
                }).ToList();

                return Ok(cuentasDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al filtrar cuentas", error = ex.Message });
            }
        }

        // Helper method to calculate Estado
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
    }
}
