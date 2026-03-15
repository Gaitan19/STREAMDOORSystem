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
    public class PlantillasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PlantillasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Plantillas
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<PlantillaMensajeDTO>>> GetPlantillas()
        {
            try
            {
                var plantillas = await _context.PlantillasMensajes
                    .OrderBy(p => p.PlantillaID)
                    .Select(p => new PlantillaMensajeDTO
                    {
                        PlantillaID = p.PlantillaID,
                        Clave = p.Clave,
                        Nombre = p.Nombre,
                        Descripcion = p.Descripcion,
                        Contenido = p.Contenido,
                        FechaActualizacion = p.FechaActualizacion
                    })
                    .ToListAsync();

                return Ok(plantillas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener plantillas", error = ex.Message });
            }
        }

        // GET: api/Plantillas/{clave}
        [HttpGet("{clave}")]
        [AllowAnonymous]
        public async Task<ActionResult<PlantillaMensajeDTO>> GetPlantilla(string clave)
        {
            try
            {
                var plantilla = await _context.PlantillasMensajes
                    .FirstOrDefaultAsync(p => p.Clave == clave);

                if (plantilla == null)
                {
                    return NotFound(new { message = "Plantilla no encontrada" });
                }

                return Ok(new PlantillaMensajeDTO
                {
                    PlantillaID = plantilla.PlantillaID,
                    Clave = plantilla.Clave,
                    Nombre = plantilla.Nombre,
                    Descripcion = plantilla.Descripcion,
                    Contenido = plantilla.Contenido,
                    FechaActualizacion = plantilla.FechaActualizacion
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener plantilla", error = ex.Message });
            }
        }

        // PUT: api/Plantillas/{clave}
        [HttpPut("{clave}")]
        public async Task<IActionResult> UpdatePlantilla(string clave, [FromBody] ActualizarPlantillaDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var plantilla = await _context.PlantillasMensajes
                    .FirstOrDefaultAsync(p => p.Clave == clave);

                if (plantilla == null)
                {
                    return NotFound(new { message = "Plantilla no encontrada" });
                }

                plantilla.Contenido = dto.Contenido;
                plantilla.FechaActualizacion = DateTime.Now;

                _context.PlantillasMensajes.Update(plantilla);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar plantilla", error = ex.Message });
            }
        }
    }
}
