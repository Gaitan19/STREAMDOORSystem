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
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Servicio)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil)
                    .Select(v => new VentaDTO
                    {
                        VentaID = v.VentaID,
                        ClienteID = v.ClienteID,
                        NombreCliente = v.Cliente!.Nombre + " " + v.Cliente.Apellido,
                        FechaInicio = v.FechaInicio,
                        FechaFin = v.FechaFin,
                        Duracion = v.Duracion,
                        Monto = v.Monto,
                        Moneda = v.Moneda,
                        Estado = v.Estado,
                        DiasRestantes = (int)(v.FechaFin - DateTime.Now).TotalDays,
                        Detalles = v.Detalles.Select(d => new VentaDetalleDTO
                        {
                            VentaDetalleID = d.VentaDetalleID,
                            VentaID = d.VentaID,
                            CuentaID = d.CuentaID,
                            CodigoCuenta = d.Cuenta!.CodigoCuenta ?? "",
                            PerfilID = d.PerfilID,
                            NumeroPerfil = d.Perfil!.NumeroPerfil,
                            ServicioID = d.ServicioID,
                            NombreServicio = d.Cuenta.Servicio!.Nombre,
                            PrecioUnitario = d.PrecioUnitario,
                            FechaAsignacion = d.FechaAsignacion
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "";
                return StatusCode(500, new { 
                    message = "Error al obtener ventas", 
                    error = ex.Message,
                    innerError = innerMessage,
                    stackTrace = ex.StackTrace 
                });
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
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Servicio)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil)
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
                    FechaInicio = venta.FechaInicio,
                    FechaFin = venta.FechaFin,
                    Duracion = venta.Duracion,
                    Monto = venta.Monto,
                    Moneda = venta.Moneda,
                    Estado = venta.Estado,
                    DiasRestantes = (int)(venta.FechaFin - DateTime.Now).TotalDays,
                    Detalles = venta.Detalles.Select(d => new VentaDetalleDTO
                    {
                        VentaDetalleID = d.VentaDetalleID,
                        VentaID = d.VentaID,
                        CuentaID = d.CuentaID,
                        CodigoCuenta = d.Cuenta!.CodigoCuenta ?? "",
                        PerfilID = d.PerfilID,
                        NumeroPerfil = d.Perfil!.NumeroPerfil,
                        ServicioID = d.ServicioID,
                        NombreServicio = d.Cuenta.Servicio!.Nombre,
                        PrecioUnitario = d.PrecioUnitario,
                        FechaAsignacion = d.FechaAsignacion
                    }).ToList()
                };

                return Ok(ventaDto);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "";
                return StatusCode(500, new { 
                    message = "Error al obtener venta", 
                    error = ex.Message,
                    innerError = innerMessage,
                    stackTrace = ex.StackTrace 
                });
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
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Servicio)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil)
                    .Select(v => new VentaDTO
                    {
                        VentaID = v.VentaID,
                        ClienteID = v.ClienteID,
                        NombreCliente = v.Cliente!.Nombre + " " + v.Cliente.Apellido,
                        FechaInicio = v.FechaInicio,
                        FechaFin = v.FechaFin,
                        Duracion = v.Duracion,
                        Monto = v.Monto,
                        Moneda = v.Moneda,
                        Estado = v.Estado,
                        DiasRestantes = (int)(v.FechaFin - DateTime.Now).TotalDays,
                        Detalles = v.Detalles.Select(d => new VentaDetalleDTO
                        {
                            VentaDetalleID = d.VentaDetalleID,
                            VentaID = d.VentaID,
                            CuentaID = d.CuentaID,
                            CodigoCuenta = d.Cuenta!.CodigoCuenta ?? "",
                            PerfilID = d.PerfilID,
                            NumeroPerfil = d.Perfil!.NumeroPerfil,
                            ServicioID = d.ServicioID,
                            NombreServicio = d.Cuenta.Servicio!.Nombre,
                            PrecioUnitario = d.PrecioUnitario,
                            FechaAsignacion = d.FechaAsignacion
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "";
                return StatusCode(500, new { 
                    message = "Error al obtener ventas del cliente", 
                    error = ex.Message,
                    innerError = innerMessage,
                    stackTrace = ex.StackTrace 
                });
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

                // Validar que hay al menos un servicio
                if (crearVentaDto.Detalles == null || crearVentaDto.Detalles.Count == 0)
                {
                    return BadRequest(new { message = "Debe seleccionar al menos un servicio" });
                }

                // Verificar que el cliente exista
                var clienteExiste = await _context.Clientes.AnyAsync(c => c.ClienteID == crearVentaDto.ClienteID && c.Activo);
                if (!clienteExiste)
                {
                    return BadRequest(new { message = "El cliente especificado no existe" });
                }

                // Validar que FechaFin sea mayor que FechaInicio
                var fechaInicio = DateTime.Now;
                if (crearVentaDto.FechaFin <= fechaInicio)
                {
                    return BadRequest(new { message = "La fecha de finalización debe ser mayor que la fecha actual" });
                }

                // Validar que todos los perfiles estén disponibles
                foreach (var detalle in crearVentaDto.Detalles)
                {
                    var perfil = await _context.Perfiles
                        .Include(p => p.Cuenta)
                        .FirstOrDefaultAsync(p => p.PerfilID == detalle.PerfilID && p.Activo);

                    if (perfil == null)
                    {
                        return BadRequest(new { message = $"El perfil {detalle.PerfilID} no existe" });
                    }

                    if (perfil.Estado != "Disponible")
                    {
                        return BadRequest(new { message = $"El perfil {perfil.NumeroPerfil} no está disponible" });
                    }

                    // Verificar que la cuenta existe y está disponible
                    if (perfil.CuentaID != detalle.CuentaID)
                    {
                        return BadRequest(new { message = $"El perfil {perfil.NumeroPerfil} no pertenece a la cuenta seleccionada" });
                    }
                }

                // Calcular el monto total basado en los precios de los servicios
                decimal montoTotal = 0;
                var detallesLista = new List<VentaDetalle>();

                foreach (var detalleDto in crearVentaDto.Detalles)
                {
                    var servicio = await _context.Servicios.FindAsync(detalleDto.ServicioID);
                    if (servicio == null || !servicio.Activo)
                    {
                        return BadRequest(new { message = $"El servicio {detalleDto.ServicioID} no existe o no está activo" });
                    }

                    // Use provided price (for combos) or service price
                    var precioUnitario = detalleDto.PrecioUnitario ?? servicio.Precio ?? 0;
                    montoTotal += precioUnitario;

                    detallesLista.Add(new VentaDetalle
                    {
                        CuentaID = detalleDto.CuentaID,
                        PerfilID = detalleDto.PerfilID,
                        ServicioID = detalleDto.ServicioID,
                        ComboID = detalleDto.ComboID,
                        PrecioUnitario = precioUnitario,
                        FechaAsignacion = DateTime.Now
                    });
                }

                // Crear la venta
                var venta = new Venta
                {
                    ClienteID = crearVentaDto.ClienteID,
                    FechaInicio = fechaInicio,
                    FechaFin = crearVentaDto.FechaFin,
                    Duracion = (int)(crearVentaDto.FechaFin - fechaInicio).TotalDays,
                    Monto = montoTotal,
                    Moneda = crearVentaDto.Moneda,
                    MedioPagoID = crearVentaDto.MedioPagoID,
                    Estado = "Activo",
                    FechaCreacion = DateTime.Now,
                    Detalles = detallesLista
                };

                _context.Ventas.Add(venta);

                // Marcar todos los perfiles como "Ocupado"
                foreach (var detalleDto in crearVentaDto.Detalles)
                {
                    var perfil = await _context.Perfiles.FindAsync(detalleDto.PerfilID);
                    if (perfil != null)
                    {
                        perfil.Estado = "Ocupado";
                        _context.Perfiles.Update(perfil);
                    }
                }

                await _context.SaveChangesAsync();

                // Registrar el pago si se proporciona medio de pago
                if (crearVentaDto.MedioPagoID.HasValue)
                {
                    var pago = new Pago
                    {
                        VentaID = venta.VentaID,
                        MedioPagoID = crearVentaDto.MedioPagoID.Value,
                        Monto = montoTotal,
                        Moneda = crearVentaDto.Moneda,
                        FechaPago = fechaInicio,
                        Referencia = $"Venta #{venta.VentaID}",
                        Notas = crearVentaDto.Notas,
                        FechaCreacion = DateTime.Now
                    };
                    _context.Pagos.Add(pago);
                    await _context.SaveChangesAsync();
                }

                // Recargar la venta con todas las relaciones para el DTO de respuesta
                var ventaCreada = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Servicio)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil)
                    .FirstOrDefaultAsync(v => v.VentaID == venta.VentaID);

                var ventaDto = new VentaDTO
                {
                    VentaID = ventaCreada!.VentaID,
                    ClienteID = ventaCreada.ClienteID,
                    NombreCliente = ventaCreada.Cliente!.Nombre + " " + ventaCreada.Cliente.Apellido,
                    FechaInicio = ventaCreada.FechaInicio,
                    FechaFin = ventaCreada.FechaFin,
                    Duracion = ventaCreada.Duracion,
                    Monto = ventaCreada.Monto,
                    Moneda = ventaCreada.Moneda,
                    Estado = ventaCreada.Estado,
                    DiasRestantes = (int)(ventaCreada.FechaFin - DateTime.Now).TotalDays,
                    Detalles = ventaCreada.Detalles.Select(d => new VentaDetalleDTO
                    {
                        VentaDetalleID = d.VentaDetalleID,
                        VentaID = d.VentaID,
                        CuentaID = d.CuentaID,
                        CodigoCuenta = d.Cuenta!.CodigoCuenta ?? "",
                        PerfilID = d.PerfilID,
                        NumeroPerfil = d.Perfil!.NumeroPerfil,
                        ServicioID = d.ServicioID,
                        NombreServicio = d.Cuenta.Servicio!.Nombre,
                        PrecioUnitario = d.PrecioUnitario,
                        FechaAsignacion = d.FechaAsignacion
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetVenta), new { id = venta.VentaID }, ventaDto);
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "";
                var innerInnerMessage = ex.InnerException?.InnerException?.Message ?? "";
                return StatusCode(500, new { 
                    message = "Error al crear venta", 
                    error = ex.Message,
                    innerError = innerMessage,
                    innerInnerError = innerInnerMessage,
                    stackTrace = ex.StackTrace 
                });
            }
        }

        // DELETE: api/Ventas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVenta(int id)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.Detalles)
                    .FirstOrDefaultAsync(v => v.VentaID == id);

                if (venta == null)
                {
                    return NotFound(new { message = "Venta no encontrada" });
                }

                // Eliminar los pagos relacionados primero
                await _context.Pagos
                    .Where(p => p.VentaID == id)
                    .ExecuteDeleteAsync();

                // Marcar la venta como cancelada
                venta.Estado = "Cancelado";
                _context.Ventas.Update(venta);

                // Liberar los perfiles (marcarlos como Disponible nuevamente)
                foreach (var detalle in venta.Detalles)
                {
                    var perfil = await _context.Perfiles.FindAsync(detalle.PerfilID);
                    if (perfil != null && perfil.Estado == "Ocupado")
                    {
                        perfil.Estado = "Disponible";
                        _context.Perfiles.Update(perfil);
                    }
                }

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException?.Message ?? "";
                var innerInnerMessage = ex.InnerException?.InnerException?.Message ?? "";
                return StatusCode(500, new { 
                    message = "Error al eliminar venta", 
                    error = ex.Message,
                    innerError = innerMessage,
                    innerInnerError = innerInnerMessage,
                    stackTrace = ex.StackTrace 
                });
            }
        }
    }
}
