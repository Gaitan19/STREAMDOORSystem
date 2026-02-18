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
                        FechaCreacion = c.FechaCreacion
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
                    FechaCreacion = cuenta.FechaCreacion
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
                    Activo = true
                };

                _context.Cuentas.Add(cuenta);
                await _context.SaveChangesAsync();

                // Crear perfiles si se proporcionan
                if (crearCuentaDto.Perfiles != null && crearCuentaDto.Perfiles.Count > 0)
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
                var cuentaDto = new CuentaDTO
                {
                    CuentaID = cuenta.CuentaID,
                    ServicioID = cuenta.ServicioID,
                    NombreServicio = servicio!.Nombre,
                    CorreoID = cuenta.CorreoID,
                    TipoCuenta = cuenta.TipoCuenta,
                    NumeroPerfiles = cuenta.NumeroPerfiles,
                    PerfilesDisponibles = cuenta.PerfilesDisponibles,
                    Estado = cuenta.Estado,
                    FechaCreacion = cuenta.FechaCreacion
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
    }
}
