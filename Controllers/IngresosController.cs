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
    public class IngresosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IngresosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/ingresos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IngresoDTO>>> GetIngresos([FromQuery] string? busqueda)
        {
            var query = _context.Ingresos.AsQueryable();

            // Apply search filter if provided
            if (!string.IsNullOrEmpty(busqueda))
            {
                query = query.Where(i =>
                    (i.Descripcion != null && i.Descripcion.Contains(busqueda)) ||
                    (i.Usuario != null && i.Usuario.Contains(busqueda)) ||
                    i.Moneda.Contains(busqueda)
                );
            }

            var ingresos = await query
                .OrderByDescending(i => i.FechaCreacion)
                .Select(i => new IngresoDTO
                {
                    IngresoID = i.IngresoID,
                    FechaCreacion = i.FechaCreacion,
                    Monto = i.Monto,
                    Moneda = i.Moneda,
                    UsuarioID = i.UsuarioID,
                    Usuario = i.Usuario,
                    Descripcion = i.Descripcion,
                    VentaID = i.VentaID
                })
                .ToListAsync();

            return Ok(ingresos);
        }

        // GET: api/ingresos/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<IngresoDTO>> GetIngreso(int id)
        {
            var ingreso = await _context.Ingresos
                .Where(i => i.IngresoID == id)
                .Select(i => new IngresoDTO
                {
                    IngresoID = i.IngresoID,
                    FechaCreacion = i.FechaCreacion,
                    Monto = i.Monto,
                    Moneda = i.Moneda,
                    UsuarioID = i.UsuarioID,
                    Usuario = i.Usuario,
                    Descripcion = i.Descripcion,
                    VentaID = i.VentaID
                })
                .FirstOrDefaultAsync();

            if (ingreso == null)
            {
                return NotFound(new { message = "Ingreso no encontrado" });
            }

            return Ok(ingreso);
        }

        // POST: api/ingresos
        [HttpPost]
        public async Task<ActionResult<IngresoDTO>> CreateIngreso(CrearIngresoDTO dto)
        {
            // Get current user info from JWT token
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var usuarioNombreClaim = User.FindFirst(ClaimTypes.Name)?.Value;

            int? usuarioId = null;
            if (int.TryParse(usuarioIdClaim, out int parsedId))
            {
                usuarioId = parsedId;
            }

            var ingreso = new Ingreso
            {
                Monto = dto.Monto,
                Moneda = string.IsNullOrEmpty(dto.Moneda) ? "C$" : dto.Moneda,
                Descripcion = dto.Descripcion,
                VentaID = dto.VentaID,
                UsuarioID = usuarioId,
                Usuario = usuarioNombreClaim ?? "Sistema",
                FechaCreacion = DateTime.Now
            };

            _context.Ingresos.Add(ingreso);
            await _context.SaveChangesAsync();

            var ingresoDTO = new IngresoDTO
            {
                IngresoID = ingreso.IngresoID,
                FechaCreacion = ingreso.FechaCreacion,
                Monto = ingreso.Monto,
                Moneda = ingreso.Moneda,
                UsuarioID = ingreso.UsuarioID,
                Usuario = ingreso.Usuario,
                Descripcion = ingreso.Descripcion,
                VentaID = ingreso.VentaID
            };

            return CreatedAtAction(nameof(GetIngreso), new { id = ingreso.IngresoID }, ingresoDTO);
        }

        // PUT: api/ingresos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIngreso(int id, ActualizarIngresoDTO dto)
        {
            var ingreso = await _context.Ingresos.FindAsync(id);

            if (ingreso == null)
            {
                return NotFound(new { message = "Ingreso no encontrado" });
            }

            // Update only provided fields
            if (dto.Monto.HasValue)
                ingreso.Monto = dto.Monto.Value;

            if (dto.Moneda != null)
                ingreso.Moneda = dto.Moneda;

            if (dto.Descripcion != null)
                ingreso.Descripcion = dto.Descripcion;

            if (dto.VentaID.HasValue)
                ingreso.VentaID = dto.VentaID;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!IngresoExists(id))
                {
                    return NotFound(new { message = "Ingreso no encontrado" });
                }
                throw;
            }

            return NoContent();
        }

        // DELETE: api/ingresos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIngreso(int id)
        {
            var ingreso = await _context.Ingresos.FindAsync(id);

            if (ingreso == null)
            {
                return NotFound(new { message = "Ingreso no encontrado" });
            }

            _context.Ingresos.Remove(ingreso);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool IngresoExists(int id)
        {
            return _context.Ingresos.Any(e => e.IngresoID == id);
        }
    }
}
