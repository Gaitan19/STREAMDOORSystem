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
    public class PerfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PerfilesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Perfiles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PerfilDTO>>> GetPerfiles()
        {
            try
            {
                var perfiles = await _context.Perfiles
                    .Where(p => p.Activo)
                    .Select(p => new PerfilDTO
                    {
                        PerfilID = p.PerfilID,
                        CuentaID = p.CuentaID,
                        NumeroPerfil = p.NumeroPerfil,
                        PIN = p.PIN,
                        Estado = p.Estado,
                        Activo = p.Activo
                    })
                    .ToListAsync();

                return Ok(perfiles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener perfiles", error = ex.Message });
            }
        }

        // GET: api/Perfiles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PerfilDTO>> GetPerfil(int id)
        {
            try
            {
                var perfil = await _context.Perfiles.FindAsync(id);

                if (perfil == null || !perfil.Activo)
                {
                    return NotFound(new { message = "Perfil no encontrado" });
                }

                var perfilDto = new PerfilDTO
                {
                    PerfilID = perfil.PerfilID,
                    CuentaID = perfil.CuentaID,
                    NumeroPerfil = perfil.NumeroPerfil,
                    PIN = perfil.PIN,
                    Estado = perfil.Estado,
                    Activo = perfil.Activo
                };

                return Ok(perfilDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener perfil", error = ex.Message });
            }
        }

        // GET: api/Perfiles/por-cuenta/5
        [HttpGet("por-cuenta/{cuentaId}")]
        public async Task<ActionResult<IEnumerable<PerfilDTO>>> GetPerfilesPorCuenta(int cuentaId)
        {
            try
            {
                var cuentaExiste = await _context.Cuentas.AnyAsync(c => c.CuentaID == cuentaId && c.Activo);
                if (!cuentaExiste)
                {
                    return BadRequest(new { message = "La cuenta especificada no existe" });
                }

                var perfiles = await _context.Perfiles
                    .Where(p => p.CuentaID == cuentaId && p.Activo)
                    .Select(p => new PerfilDTO
                    {
                        PerfilID = p.PerfilID,
                        CuentaID = p.CuentaID,
                        NumeroPerfil = p.NumeroPerfil,
                        PIN = p.PIN,
                        Estado = p.Estado,
                        Activo = p.Activo
                    })
                    .ToListAsync();

                return Ok(perfiles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener perfiles de la cuenta", error = ex.Message });
            }
        }

        // POST: api/Perfiles
        [HttpPost]
        public async Task<ActionResult<PerfilDTO>> CreatePerfil([FromBody] CrearPerfilDTO crearPerfilDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que la cuenta exista
                var cuentaExiste = await _context.Cuentas.AnyAsync(c => c.CuentaID == crearPerfilDto.CuentaID && c.Activo);
                if (!cuentaExiste)
                {
                    return BadRequest(new { message = "La cuenta especificada no existe" });
                }

                var perfil = new Perfil
                {
                    CuentaID = crearPerfilDto.CuentaID,
                    NumeroPerfil = crearPerfilDto.NumeroPerfil,
                    PIN = crearPerfilDto.PIN,
                    Estado = "Disponible",
                    Activo = true
                };

                _context.Perfiles.Add(perfil);
                await _context.SaveChangesAsync();

                var perfilDto = new PerfilDTO
                {
                    PerfilID = perfil.PerfilID,
                    CuentaID = perfil.CuentaID,
                    NumeroPerfil = perfil.NumeroPerfil,
                    PIN = perfil.PIN,
                    Estado = perfil.Estado,
                    Activo = perfil.Activo
                };

                return CreatedAtAction(nameof(GetPerfil), new { id = perfil.PerfilID }, perfilDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear perfil", error = ex.Message });
            }
        }

        // PUT: api/Perfiles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePerfil(int id, [FromBody] CrearPerfilDTO crearPerfilDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var perfil = await _context.Perfiles.FindAsync(id);

                if (perfil == null || !perfil.Activo)
                {
                    return NotFound(new { message = "Perfil no encontrado" });
                }

                // Verificar que la cuenta exista
                var cuentaExiste = await _context.Cuentas.AnyAsync(c => c.CuentaID == crearPerfilDto.CuentaID && c.Activo);
                if (!cuentaExiste)
                {
                    return BadRequest(new { message = "La cuenta especificada no existe" });
                }

                perfil.CuentaID = crearPerfilDto.CuentaID;
                perfil.NumeroPerfil = crearPerfilDto.NumeroPerfil;
                perfil.PIN = crearPerfilDto.PIN;

                _context.Perfiles.Update(perfil);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar perfil", error = ex.Message });
            }
        }

        // DELETE: api/Perfiles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePerfil(int id)
        {
            try
            {
                var perfil = await _context.Perfiles.FindAsync(id);

                if (perfil == null || !perfil.Activo)
                {
                    return NotFound(new { message = "Perfil no encontrado" });
                }

                perfil.Activo = false;
                _context.Perfiles.Update(perfil);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar perfil", error = ex.Message });
            }
        }
    }
}
