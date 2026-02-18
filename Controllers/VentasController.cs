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
    public class VentasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public VentasController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Ventas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VentaDTO>>> GetVentas()
        {
            try
            {
                var ventas = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.Cuenta)
                    .ThenInclude(c => c!.Servicio)
                    .Select(v => new VentaDTO
                    {
                        VentaID = v.VentaID,
                        ClienteID = v.ClienteID,
                        NombreCliente = v.Cliente!.Nombre + " " + v.Cliente.Apellido,
                        CuentaID = v.CuentaID,
                        NombreServicio = v.Cuenta!.Servicio!.Nombre,
                        PerfilID = v.PerfilID,
                        FechaInicio = v.FechaInicio,
                        FechaFin = v.FechaFin,
                        Duracion = v.Duracion,
                        Monto = v.Monto,
                        Moneda = v.Moneda,
                        Estado = v.Estado,
                        DiasRestantes = (int)(v.FechaFin - DateTime.Now).TotalDays
                    })
                    .ToListAsync();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener ventas", error = ex.Message });
            }
        }

        // GET: api/Ventas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<VentaDTO>> GetVenta(int id)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.Cuenta)
                    .ThenInclude(c => c!.Servicio)
                    .FirstOrDefaultAsync(v => v.VentaID == id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                var ventaDto = new VentaDTO
                {
                    VentaID = venta.VentaID,
                    ClienteID = venta.ClienteID,
                    NombreCliente = venta.Cliente!.Nombre + " " + venta.Cliente.Apellido,
                    CuentaID = venta.CuentaID,
                    NombreServicio = venta.Cuenta!.Servicio!.Nombre,
                    PerfilID = venta.PerfilID,
                    FechaInicio = venta.FechaInicio,
                    FechaFin = venta.FechaFin,
                    Duracion = venta.Duracion,
                    Monto = venta.Monto,
                    Moneda = venta.Moneda,
                    Estado = venta.Estado,
                    DiasRestantes = (int)(venta.FechaFin - DateTime.Now).TotalDays
                };

                return Ok(ventaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener venta", error = ex.Message });
            }
        }

        // GET: api/Ventas/por-cliente/5
        [HttpGet("por-cliente/{clienteId}")]
        public async Task<ActionResult<IEnumerable<VentaDTO>>> GetVentasPorCliente(int clienteId)
        {
            try
            {
                var clienteExiste = await _context.Clientes.AnyAsync(c => c.ClienteID == clienteId && c.Activo);
                if (!clienteExiste)
                {
                    return BadRequest(new { message = "El cliente especificado no existe" });
                }

                var ventas = await _context.Ventas
                    .Where(v => v.ClienteID == clienteId)
                    .Include(v => v.Cliente)
                    .Include(v => v.Cuenta)
                    .ThenInclude(c => c!.Servicio)
                    .Select(v => new VentaDTO
                    {
                        VentaID = v.VentaID,
                        ClienteID = v.ClienteID,
                        NombreCliente = v.Cliente!.Nombre + " " + v.Cliente.Apellido,
                        CuentaID = v.CuentaID,
                        NombreServicio = v.Cuenta!.Servicio!.Nombre,
                        PerfilID = v.PerfilID,
                        FechaInicio = v.FechaInicio,
                        FechaFin = v.FechaFin,
                        Duracion = v.Duracion,
                        Monto = v.Monto,
                        Moneda = v.Moneda,
                        Estado = v.Estado,
                        DiasRestantes = (int)(v.FechaFin - DateTime.Now).TotalDays
                    })
                    .ToListAsync();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener ventas del cliente", error = ex.Message });
            }
        }

        // POST: api/Ventas
        [HttpPost]
        public async Task<ActionResult<VentaDTO>> CreateVenta([FromBody] CrearVentaDTO crearVentaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que el cliente exista
                var clienteExiste = await _context.Clientes.AnyAsync(c => c.ClienteID == crearVentaDto.ClienteID && c.Activo);
                if (!clienteExiste)
                {
                    return BadRequest(new { message = "El cliente especificado no existe" });
                }

                // Verificar que la cuenta exista
                var cuentaExiste = await _context.Cuentas.AnyAsync(c => c.CuentaID == crearVentaDto.CuentaID && c.Activo);
                if (!cuentaExiste)
                {
                    return BadRequest(new { message = "La cuenta especificada no existe" });
                }

                // Verificar que el perfil exista si se proporciona
                if (crearVentaDto.PerfilID.HasValue)
                {
                    var perfilExiste = await _context.Perfiles.AnyAsync(p => p.PerfilID == crearVentaDto.PerfilID && p.Activo);
                    if (!perfilExiste)
                    {
                        return BadRequest(new { message = "El perfil especificado no existe" });
                    }
                }

                var fechaFin = crearVentaDto.FechaInicio.AddDays(crearVentaDto.Duracion);

                var venta = new Venta
                {
                    ClienteID = crearVentaDto.ClienteID,
                    CuentaID = crearVentaDto.CuentaID,
                    PerfilID = crearVentaDto.PerfilID,
                    FechaInicio = crearVentaDto.FechaInicio,
                    FechaFin = fechaFin,
                    Duracion = crearVentaDto.Duracion,
                    Monto = crearVentaDto.Monto,
                    Moneda = crearVentaDto.Moneda,
                    Estado = "Activo",
                    FechaCreacion = DateTime.Now
                };

                _context.Ventas.Add(venta);
                await _context.SaveChangesAsync();

                var cliente = await _context.Clientes.FindAsync(crearVentaDto.ClienteID);
                var cuenta = await _context.Cuentas.Include(c => c.Servicio).FirstOrDefaultAsync(c => c.CuentaID == crearVentaDto.CuentaID);

                var ventaDto = new VentaDTO
                {
                    VentaID = venta.VentaID,
                    ClienteID = venta.ClienteID,
                    NombreCliente = cliente!.Nombre + " " + cliente.Apellido,
                    CuentaID = venta.CuentaID,
                    NombreServicio = cuenta!.Servicio!.Nombre,
                    PerfilID = venta.PerfilID,
                    FechaInicio = venta.FechaInicio,
                    FechaFin = venta.FechaFin,
                    Duracion = venta.Duracion,
                    Monto = venta.Monto,
                    Moneda = venta.Moneda,
                    Estado = venta.Estado,
                    DiasRestantes = crearVentaDto.Duracion
                };

                return CreatedAtAction(nameof(GetVenta), new { id = venta.VentaID }, ventaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear venta", error = ex.Message });
            }
        }

        // PUT: api/Ventas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVenta(int id, [FromBody] CrearVentaDTO crearVentaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var venta = await _context.Ventas.FindAsync(id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                // Verificar que el cliente exista
                var clienteExiste = await _context.Clientes.AnyAsync(c => c.ClienteID == crearVentaDto.ClienteID && c.Activo);
                if (!clienteExiste)
                {
                    return BadRequest(new { message = "El cliente especificado no existe" });
                }

                // Verificar que la cuenta exista
                var cuentaExiste = await _context.Cuentas.AnyAsync(c => c.CuentaID == crearVentaDto.CuentaID && c.Activo);
                if (!cuentaExiste)
                {
                    return BadRequest(new { message = "La cuenta especificada no existe" });
                }

                var fechaFin = crearVentaDto.FechaInicio.AddDays(crearVentaDto.Duracion);

                venta.ClienteID = crearVentaDto.ClienteID;
                venta.CuentaID = crearVentaDto.CuentaID;
                venta.PerfilID = crearVentaDto.PerfilID;
                venta.FechaInicio = crearVentaDto.FechaInicio;
                venta.FechaFin = fechaFin;
                venta.Duracion = crearVentaDto.Duracion;
                venta.Monto = crearVentaDto.Monto;
                venta.Moneda = crearVentaDto.Moneda;

                _context.Ventas.Update(venta);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar venta", error = ex.Message });
            }
        }

        // DELETE: api/Ventas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVenta(int id)
        {
            try
            {
                var venta = await _context.Ventas.FindAsync(id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                venta.Estado = "Cancelada";
                _context.Ventas.Update(venta);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar venta", error = ex.Message });
            }
        }

        // POST: api/Ventas/renovar
        [HttpPost("renovar")]
        public async Task<ActionResult<VentaDTO>> RenovarVenta([FromBody] RenovarVentaDTO renovarVentaDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var ventaOriginal = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.Cuenta)
                    .ThenInclude(c => c!.Servicio)
                    .FirstOrDefaultAsync(v => v.VentaID == renovarVentaDto.VentaID);

                if (ventaOriginal == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                // Crear nueva venta con fecha inicio en la fecha fin de la anterior
                var nuevaFechaInicio = ventaOriginal.FechaFin;
                var nuevaFechaFin = nuevaFechaInicio.AddDays(renovarVentaDto.Duracion);

                var ventaNueva = new Venta
                {
                    ClienteID = ventaOriginal.ClienteID,
                    CuentaID = ventaOriginal.CuentaID,
                    PerfilID = ventaOriginal.PerfilID,
                    FechaInicio = nuevaFechaInicio,
                    FechaFin = nuevaFechaFin,
                    Duracion = renovarVentaDto.Duracion,
                    Monto = ventaOriginal.Monto,
                    Moneda = ventaOriginal.Moneda,
                    Estado = "Activo",
                    FechaCreacion = DateTime.Now
                };

                _context.Ventas.Add(ventaNueva);
                await _context.SaveChangesAsync();

                var ventaDto = new VentaDTO
                {
                    VentaID = ventaNueva.VentaID,
                    ClienteID = ventaNueva.ClienteID,
                    NombreCliente = ventaOriginal.Cliente!.Nombre + " " + ventaOriginal.Cliente.Apellido,
                    CuentaID = ventaNueva.CuentaID,
                    NombreServicio = ventaOriginal.Cuenta!.Servicio!.Nombre,
                    PerfilID = ventaNueva.PerfilID,
                    FechaInicio = ventaNueva.FechaInicio,
                    FechaFin = ventaNueva.FechaFin,
                    Duracion = ventaNueva.Duracion,
                    Monto = ventaNueva.Monto,
                    Moneda = ventaNueva.Moneda,
                    Estado = ventaNueva.Estado,
                    DiasRestantes = renovarVentaDto.Duracion
                };

                return Ok(ventaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al renovar venta", error = ex.Message });
            }
        }
    }
}
