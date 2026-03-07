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
    public class ClientesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClientesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Clientes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClienteDTO>>> GetClientes()
        {
            try
            {
                var clientes = await _context.Clientes
                    .Where(c => c.Activo)
                    .Select(c => new ClienteDTO
                    {
                        ClienteID = c.ClienteID,
                        Nombre = c.Nombre,
                        SegundoNombre = c.SegundoNombre,
                        Apellido = c.Apellido,
                        SegundoApellido = c.SegundoApellido,
                        Telefono = c.Telefono,
                        FechaRegistro = c.FechaRegistro,
                        Activo = c.Activo
                    })
                    .ToListAsync();

                return Ok(clientes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener clientes", error = ex.Message });
            }
        }

        // GET: api/Clientes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ClienteDTO>> GetCliente(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);

                if (cliente == null || !cliente.Activo)
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }

                var clienteDto = new ClienteDTO
                {
                    ClienteID = cliente.ClienteID,
                    Nombre = cliente.Nombre,
                    SegundoNombre = cliente.SegundoNombre,
                    Apellido = cliente.Apellido,
                    SegundoApellido = cliente.SegundoApellido,
                    Telefono = cliente.Telefono,
                    FechaRegistro = cliente.FechaRegistro,
                    Activo = cliente.Activo
                };

                return Ok(clienteDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener cliente", error = ex.Message });
            }
        }

        // POST: api/Clientes
        [HttpPost]
        public async Task<ActionResult<ClienteDTO>> CreateCliente([FromBody] CrearClienteDTO crearClienteDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var cliente = new Cliente
                {
                    Nombre = crearClienteDto.Nombre,
                    SegundoNombre = crearClienteDto.SegundoNombre,
                    Apellido = crearClienteDto.Apellido,
                    SegundoApellido = crearClienteDto.SegundoApellido,
                    Telefono = crearClienteDto.Telefono,
                    FechaRegistro = DateTime.Now,
                    Activo = true
                };

                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();

                var clienteDto = new ClienteDTO
                {
                    ClienteID = cliente.ClienteID,
                    Nombre = cliente.Nombre,
                    SegundoNombre = cliente.SegundoNombre,
                    Apellido = cliente.Apellido,
                    SegundoApellido = cliente.SegundoApellido,
                    Telefono = cliente.Telefono,
                    FechaRegistro = cliente.FechaRegistro,
                    Activo = cliente.Activo
                };

                return CreatedAtAction(nameof(GetCliente), new { id = cliente.ClienteID }, clienteDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear cliente", error = ex.Message });
            }
        }

        // PUT: api/Clientes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCliente(int id, [FromBody] CrearClienteDTO crearClienteDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var cliente = await _context.Clientes.FindAsync(id);

                if (cliente == null || !cliente.Activo)
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }

                cliente.Nombre = crearClienteDto.Nombre;
                cliente.SegundoNombre = crearClienteDto.SegundoNombre;
                cliente.Apellido = crearClienteDto.Apellido;
                cliente.SegundoApellido = crearClienteDto.SegundoApellido;
                cliente.Telefono = crearClienteDto.Telefono;

                _context.Clientes.Update(cliente);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar cliente", error = ex.Message });
            }
        }

        // DELETE: api/Clientes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);

                if (cliente == null || !cliente.Activo)
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }

                cliente.Activo = false;
                _context.Clientes.Update(cliente);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar cliente", error = ex.Message });
            }
        }

        // GET: api/Clientes/search?q=searchterm
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ClienteDTO>>> SearchClientes([FromQuery] string q)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q))
                {
                    return BadRequest(new { message = "El término de búsqueda no puede estar vacío" });
                }

                var searchTerm = q.ToLower().Trim();

                var clientes = await _context.Clientes
                    .Where(c => c.Activo && (
                        c.Nombre.ToLower().Contains(searchTerm) ||
                        (c.SegundoNombre != null && c.SegundoNombre.ToLower().Contains(searchTerm)) ||
                        c.Apellido.ToLower().Contains(searchTerm) ||
                        (c.SegundoApellido != null && c.SegundoApellido.ToLower().Contains(searchTerm)) ||
                        c.Telefono.Contains(searchTerm)
                    ))
                    .Select(c => new ClienteDTO
                    {
                        ClienteID = c.ClienteID,
                        Nombre = c.Nombre,
                        SegundoNombre = c.SegundoNombre,
                        Apellido = c.Apellido,
                        SegundoApellido = c.SegundoApellido,
                        Telefono = c.Telefono,
                        FechaRegistro = c.FechaRegistro,
                        Activo = c.Activo
                    })
                    .Take(10)  // Limit to 10 results for autocomplete
                    .ToListAsync();

                return Ok(clientes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al buscar clientes", error = ex.Message });
            }
        }

        // GET: api/Clientes/5/historial-compras
        [HttpGet("{id}/historial-compras")]
        public async Task<ActionResult<IEnumerable<VentaDTO>>> GetHistorialCompras(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);

                if (cliente == null || !cliente.Activo)
                {
                    return NotFound(new { message = "Cliente no encontrado" });
                }

                var ventas = await _context.Ventas
                    .Where(v => v.ClienteID == id)
                    .Include(v => v.Cliente)
                    .Include(v => v.MedioPago)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Cuenta)
                            .ThenInclude(c => c!.Servicio)
                    .Include(v => v.Detalles)
                        .ThenInclude(d => d.Perfil)
                    .OrderByDescending(v => v.FechaInicio)
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
                return StatusCode(500, new { message = "Error al obtener historial de compras", error = ex.Message });
            }
        }
    }
}
