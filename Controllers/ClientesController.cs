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
    }
}
