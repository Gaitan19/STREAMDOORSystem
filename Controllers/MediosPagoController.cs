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
    public class MediosPagoController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MediosPagoController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/MediosPago
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedioPagoDTO>>> GetMediosPago()
        {
            try
            {
                var mediosPago = await _context.MediosPago
                    .Where(m => m.Activo)
                    .Select(m => new MedioPagoDTO
                    {
                        MedioPagoID = m.MedioPagoID,
                        Tipo = m.Tipo,
                        Nombre = m.Nombre,
                        NumeroCuenta = m.NumeroCuenta,
                        Beneficiario = m.Beneficiario,
                        Moneda = m.Moneda,
                        Activo = m.Activo,
                        FechaCreacion = m.FechaCreacion
                    })
                    .ToListAsync();

                return Ok(mediosPago);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener medios de pago", error = ex.Message });
            }
        }

        // GET: api/MediosPago/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MedioPagoDTO>> GetMedioPago(int id)
        {
            try
            {
                var medioPago = await _context.MediosPago.FindAsync(id);

                if (medioPago == null || !medioPago.Activo)
                {
                    return NotFound(new { message = "Medio de pago no encontrado" });
                }

                var medioPagoDto = new MedioPagoDTO
                {
                    MedioPagoID = medioPago.MedioPagoID,
                    Tipo = medioPago.Tipo,
                    Nombre = medioPago.Nombre,
                    NumeroCuenta = medioPago.NumeroCuenta,
                    Beneficiario = medioPago.Beneficiario,
                    Moneda = medioPago.Moneda,
                    Activo = medioPago.Activo,
                    FechaCreacion = medioPago.FechaCreacion
                };

                return Ok(medioPagoDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener medio de pago", error = ex.Message });
            }
        }

        // POST: api/MediosPago
        [HttpPost]
        public async Task<ActionResult<MedioPagoDTO>> CreateMedioPago([FromBody] CrearMedioPagoDTO crearMedioPagoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var medioPago = new MedioPago
                {
                    Tipo = crearMedioPagoDto.Tipo,
                    Nombre = crearMedioPagoDto.Nombre,
                    NumeroCuenta = crearMedioPagoDto.NumeroCuenta,
                    Beneficiario = crearMedioPagoDto.Beneficiario,
                    Moneda = crearMedioPagoDto.Moneda,
                    Activo = true,
                    FechaCreacion = DateTime.Now
                };

                _context.MediosPago.Add(medioPago);
                await _context.SaveChangesAsync();

                var medioPagoDto = new MedioPagoDTO
                {
                    MedioPagoID = medioPago.MedioPagoID,
                    Tipo = medioPago.Tipo,
                    Nombre = medioPago.Nombre,
                    NumeroCuenta = medioPago.NumeroCuenta,
                    Beneficiario = medioPago.Beneficiario,
                    Moneda = medioPago.Moneda,
                    Activo = medioPago.Activo,
                    FechaCreacion = medioPago.FechaCreacion
                };

                return CreatedAtAction(nameof(GetMedioPago), new { id = medioPago.MedioPagoID }, medioPagoDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear medio de pago", error = ex.Message });
            }
        }

        // PUT: api/MediosPago/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedioPago(int id, [FromBody] CrearMedioPagoDTO crearMedioPagoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var medioPago = await _context.MediosPago.FindAsync(id);

                if (medioPago == null || !medioPago.Activo)
                {
                    return NotFound(new { message = "Medio de pago no encontrado" });
                }

                medioPago.Tipo = crearMedioPagoDto.Tipo;
                medioPago.Nombre = crearMedioPagoDto.Nombre;
                medioPago.NumeroCuenta = crearMedioPagoDto.NumeroCuenta;
                medioPago.Beneficiario = crearMedioPagoDto.Beneficiario;
                medioPago.Moneda = crearMedioPagoDto.Moneda;

                _context.MediosPago.Update(medioPago);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar medio de pago", error = ex.Message });
            }
        }

        // DELETE: api/MediosPago/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedioPago(int id)
        {
            try
            {
                var medioPago = await _context.MediosPago.FindAsync(id);

                if (medioPago == null || !medioPago.Activo)
                {
                    return NotFound(new { message = "Medio de pago no encontrado" });
                }

                medioPago.Activo = false;
                _context.MediosPago.Update(medioPago);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar medio de pago", error = ex.Message });
            }
        }
    }
}
