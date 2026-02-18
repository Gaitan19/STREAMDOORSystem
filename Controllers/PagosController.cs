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
    public class PagosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PagosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Pagos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PagoDTO>>> GetPagos()
        {
            try
            {
                var pagos = await _context.Pagos
                    .Include(p => p.MedioPago)
                    .Select(p => new PagoDTO
                    {
                        PagoID = p.PagoID,
                        VentaID = p.VentaID,
                        MedioPagoID = p.MedioPagoID,
                        NombreMedioPago = p.MedioPago!.Nombre,
                        Monto = p.Monto,
                        Moneda = p.Moneda,
                        FechaPago = p.FechaPago,
                        Referencia = p.Referencia,
                        Notas = p.Notas
                    })
                    .ToListAsync();

                return Ok(pagos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener pagos", error = ex.Message });
            }
        }

        // GET: api/Pagos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PagoDTO>> GetPago(int id)
        {
            try
            {
                var pago = await _context.Pagos
                    .Include(p => p.MedioPago)
                    .FirstOrDefaultAsync(p => p.PagoID == id);

                if (pago == null)
                {
                    return NotFound(new { message = "Pago no encontrado" });
                }

                var pagoDto = new PagoDTO
                {
                    PagoID = pago.PagoID,
                    VentaID = pago.VentaID,
                    MedioPagoID = pago.MedioPagoID,
                    NombreMedioPago = pago.MedioPago!.Nombre,
                    Monto = pago.Monto,
                    Moneda = pago.Moneda,
                    FechaPago = pago.FechaPago,
                    Referencia = pago.Referencia,
                    Notas = pago.Notas
                };

                return Ok(pagoDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener pago", error = ex.Message });
            }
        }

        // GET: api/Pagos/por-venta/5
        [HttpGet("por-venta/{ventaId}")]
        public async Task<ActionResult<IEnumerable<PagoDTO>>> GetPagosPorVenta(int ventaId)
        {
            try
            {
                var ventaExiste = await _context.Ventas.AnyAsync(v => v.VentaID == ventaId);
                if (!ventaExiste)
                {
                    return BadRequest(new { message = "La venta especificada no existe" });
                }

                var pagos = await _context.Pagos
                    .Where(p => p.VentaID == ventaId)
                    .Include(p => p.MedioPago)
                    .Select(p => new PagoDTO
                    {
                        PagoID = p.PagoID,
                        VentaID = p.VentaID,
                        MedioPagoID = p.MedioPagoID,
                        NombreMedioPago = p.MedioPago!.Nombre,
                        Monto = p.Monto,
                        Moneda = p.Moneda,
                        FechaPago = p.FechaPago,
                        Referencia = p.Referencia,
                        Notas = p.Notas
                    })
                    .ToListAsync();

                return Ok(pagos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener pagos de la venta", error = ex.Message });
            }
        }

        // POST: api/Pagos
        [HttpPost]
        public async Task<ActionResult<PagoDTO>> CreatePago([FromBody] CrearPagoDTO crearPagoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que la venta exista
                var ventaExiste = await _context.Ventas.AnyAsync(v => v.VentaID == crearPagoDto.VentaID);
                if (!ventaExiste)
                {
                    return BadRequest(new { message = "La venta especificada no existe" });
                }

                // Verificar que el medio de pago exista
                var medioPagoExiste = await _context.MediosPago.AnyAsync(m => m.MedioPagoID == crearPagoDto.MedioPagoID && m.Activo);
                if (!medioPagoExiste)
                {
                    return BadRequest(new { message = "El medio de pago especificado no existe" });
                }

                var pago = new Pago
                {
                    VentaID = crearPagoDto.VentaID,
                    MedioPagoID = crearPagoDto.MedioPagoID,
                    Monto = crearPagoDto.Monto,
                    Moneda = crearPagoDto.Moneda,
                    FechaPago = DateTime.Now,
                    Referencia = crearPagoDto.Referencia,
                    Notas = crearPagoDto.Notas
                };

                _context.Pagos.Add(pago);
                await _context.SaveChangesAsync();

                var medioPago = await _context.MediosPago.FindAsync(crearPagoDto.MedioPagoID);

                var pagoDto = new PagoDTO
                {
                    PagoID = pago.PagoID,
                    VentaID = pago.VentaID,
                    MedioPagoID = pago.MedioPagoID,
                    NombreMedioPago = medioPago!.Nombre,
                    Monto = pago.Monto,
                    Moneda = pago.Moneda,
                    FechaPago = pago.FechaPago,
                    Referencia = pago.Referencia,
                    Notas = pago.Notas
                };

                return CreatedAtAction(nameof(GetPago), new { id = pago.PagoID }, pagoDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear pago", error = ex.Message });
            }
        }

        // PUT: api/Pagos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePago(int id, [FromBody] CrearPagoDTO crearPagoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var pago = await _context.Pagos.FindAsync(id);

                if (pago == null)
                {
                    return NotFound(new { message = "Pago no encontrado" });
                }

                // Verificar que la venta exista
                var ventaExiste = await _context.Ventas.AnyAsync(v => v.VentaID == crearPagoDto.VentaID);
                if (!ventaExiste)
                {
                    return BadRequest(new { message = "La venta especificada no existe" });
                }

                // Verificar que el medio de pago exista
                var medioPagoExiste = await _context.MediosPago.AnyAsync(m => m.MedioPagoID == crearPagoDto.MedioPagoID && m.Activo);
                if (!medioPagoExiste)
                {
                    return BadRequest(new { message = "El medio de pago especificado no existe" });
                }

                pago.VentaID = crearPagoDto.VentaID;
                pago.MedioPagoID = crearPagoDto.MedioPagoID;
                pago.Monto = crearPagoDto.Monto;
                pago.Moneda = crearPagoDto.Moneda;
                pago.Referencia = crearPagoDto.Referencia;
                pago.Notas = crearPagoDto.Notas;

                _context.Pagos.Update(pago);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar pago", error = ex.Message });
            }
        }

        // DELETE: api/Pagos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePago(int id)
        {
            try
            {
                var pago = await _context.Pagos.FindAsync(id);

                if (pago == null)
                {
                    return NotFound(new { message = "Pago no encontrado" });
                }

                _context.Pagos.Remove(pago);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar pago", error = ex.Message });
            }
        }
    }
}
