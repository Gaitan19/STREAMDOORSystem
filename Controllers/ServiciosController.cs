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
    public class ServiciosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ServiciosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Servicios
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<ServicioDTO>>> GetServicios()
        {
            try
            {
                var servicios = await _context.Servicios
                    .Where(s => s.Activo)
                    .Select(s => new ServicioDTO
                    {
                        ServicioID = s.ServicioID,
                        Nombre = s.Nombre,
                        Descripcion = s.Descripcion,
                        Activo = s.Activo
                    })
                    .ToListAsync();

                return Ok(servicios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener servicios", error = ex.Message });
            }
        }

        // GET: api/Servicios/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ServicioDTO>> GetServicio(int id)
        {
            try
            {
                var servicio = await _context.Servicios.FindAsync(id);

                if (servicio == null || !servicio.Activo)
                {
                    return NotFound(new { message = "Servicio no encontrado" });
                }

                var servicioDto = new ServicioDTO
                {
                    ServicioID = servicio.ServicioID,
                    Nombre = servicio.Nombre,
                    Descripcion = servicio.Descripcion,
                    Activo = servicio.Activo
                };

                return Ok(servicioDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener servicio", error = ex.Message });
            }
        }

        // POST: api/Servicios
        [HttpPost]
        public async Task<ActionResult<ServicioDTO>> CreateServicio([FromBody] CrearServicioDTO crearServicioDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var servicio = new Servicio
                {
                    Nombre = crearServicioDto.Nombre,
                    Descripcion = crearServicioDto.Descripcion,
                    Activo = true
                };

                _context.Servicios.Add(servicio);
                await _context.SaveChangesAsync();

                var servicioDto = new ServicioDTO
                {
                    ServicioID = servicio.ServicioID,
                    Nombre = servicio.Nombre,
                    Descripcion = servicio.Descripcion,
                    Activo = servicio.Activo
                };

                return CreatedAtAction(nameof(GetServicio), new { id = servicio.ServicioID }, servicioDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear servicio", error = ex.Message });
            }
        }

        // PUT: api/Servicios/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateServicio(int id, [FromBody] CrearServicioDTO crearServicioDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var servicio = await _context.Servicios.FindAsync(id);

                if (servicio == null || !servicio.Activo)
                {
                    return NotFound(new { message = "Servicio no encontrado" });
                }

                servicio.Nombre = crearServicioDto.Nombre;
                servicio.Descripcion = crearServicioDto.Descripcion;

                _context.Servicios.Update(servicio);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar servicio", error = ex.Message });
            }
        }

        // DELETE: api/Servicios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteServicio(int id)
        {
            try
            {
                var servicio = await _context.Servicios.FindAsync(id);

                if (servicio == null || !servicio.Activo)
                {
                    return NotFound(new { message = "Servicio no encontrado" });
                }

                servicio.Activo = false;
                _context.Servicios.Update(servicio);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar servicio", error = ex.Message });
            }
        }
    }
}
