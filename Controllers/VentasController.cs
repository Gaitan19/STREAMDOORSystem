using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models;
using STREAMDOORSystem.Models.DTOs;
using System.Security.Claims;

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
                        TelefonoCliente = v.Cliente.Telefono,
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
                    TelefonoCliente = venta.Cliente.Telefono,
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
                        TelefonoCliente = v.Cliente.Telefono,
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
                
                // Set FechaFin to 8:00 PM (20:00) on the selected date
                // Note: Assumes server timezone is Managua, Nicaragua (UTC-6)
                // DateTime values are stored in server's local time
                var fechaFinDate = crearVentaDto.FechaFin.Date;
                var fechaFin = new DateTime(fechaFinDate.Year, fechaFinDate.Month, fechaFinDate.Day, 20, 0, 0);
                
                if (fechaFin <= fechaInicio)
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
                // Get current user info from JWT token
                var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int? usuarioId = null;
                if (int.TryParse(usuarioIdClaim, out int parsedId))
                {
                    usuarioId = parsedId;
                }

                var venta = new Venta
                {
                    ClienteID = crearVentaDto.ClienteID,
                    FechaInicio = fechaInicio,
                    FechaFin = fechaFin, // Use the calculated 8:00 PM time
                    Duracion = (int)(fechaFin - fechaInicio).TotalDays,
                    Monto = montoTotal,
                    Moneda = crearVentaDto.Moneda,
                    MedioPagoID = crearVentaDto.MedioPagoID,
                    UsuarioID = usuarioId,
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
                        Notas = crearVentaDto.Notas
                    };
                    _context.Pagos.Add(pago);
                    await _context.SaveChangesAsync();
                }

                // Crear ingreso automáticamente por la venta
                var usuarioNombreClaim = User.FindFirst(ClaimTypes.Name)?.Value;
                var ingreso = new Ingreso
                {
                    Monto = montoTotal,
                    Descripcion = $"Ingreso por venta #{venta.VentaID}",
                    VentaID = venta.VentaID,
                    UsuarioID = usuarioId,
                    Usuario = usuarioNombreClaim ?? "Sistema",
                    FechaCreacion = DateTime.Now
                };
                _context.Ingresos.Add(ingreso);
                await _context.SaveChangesAsync();

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
                    TelefonoCliente = ventaCreada.Cliente.Telefono,
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

        // GET: api/Ventas/5/Completa (with credentials)
        [HttpGet("{id}/Completa")]
        public async Task<ActionResult<VentaCompletaDTO>> GetVentaCompleta(int id)
        {
            try
            {
                var venta = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.Usuario)
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Correo)
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

                var ventaDto = new VentaCompletaDTO
                {
                    VentaID = venta.VentaID,
                    ClienteID = venta.ClienteID,
                    NombreCliente = venta.Cliente!.Nombre + " " + venta.Cliente.Apellido,
                    TelefonoCliente = venta.Cliente.Telefono,
                    FechaInicio = venta.FechaInicio,
                    FechaFin = venta.FechaFin,
                    Duracion = venta.Duracion,
                    Monto = venta.Monto,
                    Moneda = venta.Moneda,
                    Estado = venta.Estado,
                    Notas = null,
                    MedioPagoID = venta.MedioPagoID,
                    NombreMedioPago = venta.MedioPago?.Nombre,
                    UsuarioID = venta.UsuarioID,
                    NombreUsuario = venta.Usuario?.Nombre,
                    Detalles = venta.Detalles.Select(d => new VentaDetalleCompletaDTO
                    {
                        VentaDetalleID = d.VentaDetalleID,
                        ServicioID = d.Cuenta!.ServicioID,  // Add for filtering in edit modal
                        CuentaID = d.CuentaID,               // Add for edit modal
                        PerfilID = d.PerfilID,               // Add for edit modal
                        NombreServicio = d.Cuenta!.Servicio!.Nombre,
                        CodigoCuenta = d.Cuenta.CodigoCuenta ?? "",
                        EmailCuenta = d.Cuenta.Correo?.Email ?? "",
                        PasswordCuenta = d.Cuenta.Correo?.Password ?? "",
                        NumeroPerfil = d.Perfil!.NumeroPerfil,
                        PinPerfil = d.Perfil.PIN,
                        PrecioUnitario = d.PrecioUnitario,
                        ComboID = d.ComboID
                    }).ToList()
                };

                return Ok(ventaDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error al obtener detalles completos de venta", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message ?? ""
                });
            }
        }

        // PUT: api/Ventas/5/Actualizar
        [HttpPut("{id}/Actualizar")]
        public async Task<ActionResult> ActualizarVenta(int id, ActualizarVentaDTO dto)
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

                if (venta.Estado == "Cancelado")
                {
                    return BadRequest(new { message = "No se puede modificar una venta cancelada" });
                }

                // Update each detail
                foreach (var detalleDto in dto.Detalles)
                {
                    var detalle = venta.Detalles.FirstOrDefault(d => d.VentaDetalleID == detalleDto.VentaDetalleID);
                    
                    if (detalle == null)
                    {
                        return BadRequest(new { message = $"Detalle {detalleDto.VentaDetalleID} no encontrado" });
                    }

                    // If changing account
                    if (detalleDto.NuevaCuentaID.HasValue && detalleDto.NuevaCuentaID.Value != detalle.CuentaID)
                    {
                        // Free old profile
                        var oldPerfil = await _context.Perfiles.FindAsync(detalle.PerfilID);
                        if (oldPerfil != null)
                        {
                            oldPerfil.Estado = "Disponible";
                            _context.Perfiles.Update(oldPerfil);
                        }

                        // Validate new account
                        var nuevaCuenta = await _context.Cuentas
                            .Include(c => c.Perfiles)
                            .FirstOrDefaultAsync(c => c.CuentaID == detalleDto.NuevaCuentaID.Value);

                        if (nuevaCuenta == null || nuevaCuenta.Estado != "Disponible")
                        {
                            return BadRequest(new { message = $"Cuenta {detalleDto.NuevaCuentaID} no disponible" });
                        }

                        detalle.CuentaID = detalleDto.NuevaCuentaID.Value;

                        // If new profile is specified
                        if (detalleDto.NuevoPerfilID.HasValue)
                        {
                            var nuevoPerfil = nuevaCuenta.Perfiles.FirstOrDefault(p => p.PerfilID == detalleDto.NuevoPerfilID.Value);
                            
                            if (nuevoPerfil == null || nuevoPerfil.Estado != "Disponible")
                            {
                                return BadRequest(new { message = $"Perfil {detalleDto.NuevoPerfilID} no disponible" });
                            }

                            detalle.PerfilID = detalleDto.NuevoPerfilID.Value;
                            nuevoPerfil.Estado = "Ocupado";
                            _context.Perfiles.Update(nuevoPerfil);
                        }
                    }
                    // If only changing profile within same account
                    else if (detalleDto.NuevoPerfilID.HasValue && detalleDto.NuevoPerfilID.Value != detalle.PerfilID)
                    {
                        // Free old profile
                        var oldPerfil = await _context.Perfiles.FindAsync(detalle.PerfilID);
                        if (oldPerfil != null)
                        {
                            oldPerfil.Estado = "Disponible";
                            _context.Perfiles.Update(oldPerfil);
                        }

                        // Assign new profile
                        var nuevoPerfil = await _context.Perfiles.FindAsync(detalleDto.NuevoPerfilID.Value);
                        
                        if (nuevoPerfil == null || nuevoPerfil.Estado != "Disponible")
                        {
                            return BadRequest(new { message = $"Perfil {detalleDto.NuevoPerfilID} no disponible" });
                        }

                        detalle.PerfilID = detalleDto.NuevoPerfilID.Value;
                        nuevoPerfil.Estado = "Ocupado";
                        _context.Perfiles.Update(nuevoPerfil);
                    }

                    _context.VentasDetalles.Update(detalle);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "Venta actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Error al actualizar venta", 
                    error = ex.Message,
                    innerError = ex.InnerException?.Message ?? ""
                });
            }
        }

        // POST: api/ventas/verificar-estados
        [HttpPost("verificar-estados")]
        public async Task<ActionResult> VerificarEstados()
        {
            try
            {
                // Get all active sales
                var ventas = await _context.Ventas
                    .Where(v => v.Estado == "Activo" || v.Estado == "ProximoVencer")
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil)
                    .ToListAsync();

                int ventasActualizadas = 0;
                int perfilesLiberados = 0;
                var ahora = DateTime.Now;

                foreach (var venta in ventas)
                {
                    // Compare with current time, not just date
                    // Sales expire at 8:00 PM (20:00) on the expiration date
                    var estadoAnterior = venta.Estado;
                    string nuevoEstado;

                    if (venta.FechaFin <= ahora)
                    {
                        // Venta vencida - liberar cuentas y perfiles
                        nuevoEstado = "Vencido";
                        
                        foreach (var detalle in venta.Detalles)
                        {
                            if (detalle.Cuenta != null)
                            {
                                // Free the profile
                                if (detalle.Perfil != null && detalle.Perfil.Estado == "Ocupado")
                                {
                                    detalle.Perfil.Estado = "Disponible";
                                    _context.Perfiles.Update(detalle.Perfil);
                                    perfilesLiberados++;
                                }

                                // Check if all profiles in the account are now available
                                var perfilesOcupados = await _context.Perfiles
                                    .Where(p => p.CuentaID == detalle.Cuenta.CuentaID && p.Estado == "Ocupado" && p.Activo)
                                    .CountAsync();

                                if (perfilesOcupados == 0)
                                {
                                    // All profiles are available, mark account as Disponible
                                    detalle.Cuenta.Estado = "Disponible";
                                    _context.Cuentas.Update(detalle.Cuenta);
                                }
                            }
                        }
                    }
                    else
                    {
                        // Calculate days remaining based on full datetime comparison
                        var tiempoRestante = venta.FechaFin - ahora;
                        // Use ceiling to avoid truncation issues (5.8 days should count as 6 days)
                        var diasRestantes = (int)Math.Ceiling(tiempoRestante.TotalDays);
                        
                        if (diasRestantes <= 5)
                        {
                            // About to expire (5 days or less)
                            nuevoEstado = "ProximoVencer";
                        }
                        else
                        {
                            // Still active
                            nuevoEstado = "Activo";
                        }
                    }

                    if (nuevoEstado != estadoAnterior)
                    {
                        venta.Estado = nuevoEstado;
                        _context.Ventas.Update(venta);
                        ventasActualizadas++;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"{ventasActualizadas} venta(s) actualizada(s), {perfilesLiberados} perfil(es) liberado(s)",
                    ventasActualizadas,
                    perfilesLiberados
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al verificar estados", error = ex.Message });
            }
        }

        // GET: api/ventas/filtro/{estado}
        [HttpGet("filtro/{estado}")]
        public async Task<ActionResult<IEnumerable<VentaDTO>>> GetVentasByEstado(string estado)
        {
            try
            {
                IQueryable<Venta> query = _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Servicio)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil);

                var hoy = DateTime.Now.Date;

                switch (estado.ToLower())
                {
                    case "activas":
                        query = query.Where(v => v.Estado == "Activo");
                        break;
                    case "proximas-a-vencer":
                        query = query.Where(v => v.Estado == "ProximoVencer");
                        break;
                    case "vencidas":
                        query = query.Where(v => v.Estado == "Vencido");
                        break;
                    case "canceladas":
                        query = query.Where(v => v.Estado == "Cancelado");
                        break;
                    case "todas":
                    default:
                        // No filter, return all
                        break;
                }

                var ventas = await query
                    .Select(v => new VentaDTO
                    {
                        VentaID = v.VentaID,
                        ClienteID = v.ClienteID,
                        NombreCliente = v.Cliente!.Nombre + " " + v.Cliente.Apellido,
                        TelefonoCliente = v.Cliente.Telefono,
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
                return StatusCode(500, new
                {
                    message = "Error al obtener ventas filtradas",
                    error = ex.Message
                });
            }
        }
    }
}
