using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models;
using STREAMDOORSystem.Models.DTOs;
using System.Security.Claims;

namespace STREAMDOORSystem.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EgresosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EgresosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/egresos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EgresoDTO>>> GetEgresos([FromQuery] string? busqueda)
        {
            var query = _context.Egresos.AsQueryable();

            // Apply search filter if provided
            if (!string.IsNullOrEmpty(busqueda))
            {
                query = query.Where(e =>
                    (e.Descripcion != null && e.Descripcion.Contains(busqueda)) ||
                    (e.Usuario != null && e.Usuario.Contains(busqueda))
                );
            }

            var egresos = await query
                .OrderByDescending(e => e.FechaCreacion)
                .Select(e => new EgresoDTO
                {
                    EgresoID = e.EgresoID,
                    FechaCreacion = e.FechaCreacion,
                    Monto = e.Monto,
                    UsuarioID = e.UsuarioID,
                    Usuario = e.Usuario,
                    Descripcion = e.Descripcion,
                    CuentaID = e.CuentaID
                })
                .ToListAsync();

            return Ok(egresos);
        }

        // GET: api/egresos/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<EgresoDTO>> GetEgreso(int id)
        {
            var egreso = await _context.Egresos
                .Where(e => e.EgresoID == id)
                .Select(e => new EgresoDTO
                {
                    EgresoID = e.EgresoID,
                    FechaCreacion = e.FechaCreacion,
                    Monto = e.Monto,
                    UsuarioID = e.UsuarioID,
                    Usuario = e.Usuario,
                    Descripcion = e.Descripcion,
                    CuentaID = e.CuentaID
                })
                .FirstOrDefaultAsync();

            if (egreso == null)
            {
                return NotFound(new { message = "Egreso no encontrado" });
            }

            return Ok(egreso);
        }

        // POST: api/egresos
        [HttpPost]
        public async Task<ActionResult<EgresoDTO>> CreateEgreso(CrearEgresoDTO dto)
        {
            // Get current user info from JWT token
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var usuarioNombreClaim = User.FindFirst(ClaimTypes.Name)?.Value;

            int? usuarioId = null;
            if (int.TryParse(usuarioIdClaim, out int parsedId))
            {
                usuarioId = parsedId;
            }

            var egreso = new Egreso
            {
                Monto = dto.Monto,
                Descripcion = dto.Descripcion,
                CuentaID = dto.CuentaID,
                UsuarioID = usuarioId,
                Usuario = usuarioNombreClaim ?? "Sistema",
                FechaCreacion = DateTime.Now
            };

            _context.Egresos.Add(egreso);
            await _context.SaveChangesAsync();

            var egresoDTO = new EgresoDTO
            {
                EgresoID = egreso.EgresoID,
                FechaCreacion = egreso.FechaCreacion,
                Monto = egreso.Monto,
                UsuarioID = egreso.UsuarioID,
                Usuario = egreso.Usuario,
                Descripcion = egreso.Descripcion,
                CuentaID = egreso.CuentaID
            };

            return CreatedAtAction(nameof(GetEgreso), new { id = egreso.EgresoID }, egresoDTO);
        }

        // PUT: api/egresos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEgreso(int id, ActualizarEgresoDTO dto)
        {
            var egreso = await _context.Egresos.FindAsync(id);

            if (egreso == null)
            {
                return NotFound(new { message = "Egreso no encontrado" });
            }

            // Update only provided fields
            if (dto.Monto.HasValue)
                egreso.Monto = dto.Monto.Value;

            if (dto.Descripcion != null)
                egreso.Descripcion = dto.Descripcion;

            if (dto.CuentaID.HasValue)
                egreso.CuentaID = dto.CuentaID;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EgresoExists(id))
                {
                    return NotFound(new { message = "Egreso no encontrado" });
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/egresos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEgreso(int id)
        {
            var egreso = await _context.Egresos.FindAsync(id);

            if (egreso == null)
            {
                return NotFound(new { message = "Egreso no encontrado" });
            }

            _context.Egresos.Remove(egreso);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool EgresoExists(int id)
        {
            return _context.Egresos.Any(e => e.EgresoID == id);
        }
    }
}
