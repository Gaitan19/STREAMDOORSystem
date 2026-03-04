using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models;
using STREAMDOORSystem.Models.DTOs;
using STREAMDOORSystem.Services;

namespace STREAMDOORSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuthService _authService;

        public UsuariosController(ApplicationDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        // GET: api/Usuarios?includeInactive=false
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioDTO>>> GetUsuarios([FromQuery] bool includeInactive = false)
        {
            try
            {
                var query = _context.Usuarios.Include(u => u.Rol).AsQueryable();
                
                if (!includeInactive)
                {
                    query = query.Where(u => u.Activo);
                }

                var usuarios = await query
                    .Select(u => new UsuarioDTO
                    {
                        UsuarioID = u.UsuarioID,
                        Nombre = u.Nombre,
                        Correo = u.Correo,
                        Telefono = u.Telefono,
                        FechaCreacion = u.FechaCreacion,
                        Activo = u.Activo,
                        RolID = u.RolID,
                        RolNombre = u.Rol != null ? u.Rol.Nombre : null
                    })
                    .ToListAsync();

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener usuarios", error = ex.Message });
            }
        }

        // GET: api/Usuarios/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UsuarioDTO>> GetUsuario(int id)
        {
            try
            {
                var usuario = await _context.Usuarios
                    .Include(u => u.Rol)
                    .FirstOrDefaultAsync(u => u.UsuarioID == id);

                if (usuario == null || !usuario.Activo)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                var usuarioDto = new UsuarioDTO
                {
                    UsuarioID = usuario.UsuarioID,
                    Nombre = usuario.Nombre,
                    Correo = usuario.Correo,
                    Telefono = usuario.Telefono,
                    FechaCreacion = usuario.FechaCreacion,
                    Activo = usuario.Activo,
                    RolID = usuario.RolID,
                    RolNombre = usuario.Rol?.Nombre
                };

                return Ok(usuarioDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener usuario", error = ex.Message });
            }
        }

        // POST: api/Usuarios
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<UsuarioDTO>> CreateUsuario([FromBody] CrearUsuarioDTO crearUsuarioDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar que la contraseña está presente para creación
                if (string.IsNullOrEmpty(crearUsuarioDto.Password))
                {
                    return BadRequest(new { message = "La contraseña es requerida" });
                }

                // Verificar si el usuario ya existe
                var usuarioExistente = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Correo == crearUsuarioDto.Correo);

                if (usuarioExistente != null)
                {
                    return Conflict(new { message = "El correo ya está registrado" });
                }

                var usuario = new Usuario
                {
                    Nombre = crearUsuarioDto.Nombre,
                    Correo = crearUsuarioDto.Correo,
                    Telefono = crearUsuarioDto.Telefono,
                    PasswordHash = _authService.HashPassword(crearUsuarioDto.Password),
                    FechaCreacion = DateTime.Now,
                    Activo = true,
                    RolID = crearUsuarioDto.RolID
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                var rolNombre = crearUsuarioDto.RolID.HasValue
                    ? (await _context.Roles.FindAsync(crearUsuarioDto.RolID.Value))?.Nombre
                    : null;

                var usuarioDto = new UsuarioDTO
                {
                    UsuarioID = usuario.UsuarioID,
                    Nombre = usuario.Nombre,
                    Correo = usuario.Correo,
                    Telefono = usuario.Telefono,
                    FechaCreacion = usuario.FechaCreacion,
                    Activo = usuario.Activo,
                    RolID = usuario.RolID,
                    RolNombre = rolNombre
                };

                return CreatedAtAction(nameof(GetUsuario), new { id = usuario.UsuarioID }, usuarioDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear usuario", error = ex.Message });
            }
        }

        // PUT: api/Usuarios/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUsuario(int id, [FromBody] CrearUsuarioDTO crearUsuarioDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var usuario = await _context.Usuarios.FindAsync(id);

                if (usuario == null || !usuario.Activo)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                // Verificar si el nuevo correo está disponible
                if (usuario.Correo != crearUsuarioDto.Correo)
                {
                    var usuarioExistente = await _context.Usuarios
                        .FirstOrDefaultAsync(u => u.Correo == crearUsuarioDto.Correo);

                    if (usuarioExistente != null)
                    {
                        return Conflict(new { message = "El correo ya está registrado" });
                    }
                }

                usuario.Nombre = crearUsuarioDto.Nombre;
                usuario.Correo = crearUsuarioDto.Correo;
                usuario.Telefono = crearUsuarioDto.Telefono;
                usuario.RolID = crearUsuarioDto.RolID;
                
                if (!string.IsNullOrEmpty(crearUsuarioDto.Password))
                {
                    usuario.PasswordHash = _authService.HashPassword(crearUsuarioDto.Password);
                }

                _context.Usuarios.Update(usuario);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar usuario", error = ex.Message });
            }
        }

        // DELETE: api/Usuarios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            try
            {
                var usuario = await _context.Usuarios.FindAsync(id);

                if (usuario == null || !usuario.Activo)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                usuario.Activo = false;
                _context.Usuarios.Update(usuario);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar usuario", error = ex.Message });
            }
        }

        // POST: api/Usuarios/5/reactivar
        [HttpPost("{id}/reactivar")]
        public async Task<IActionResult> ReactivarUsuario(int id)
        {
            try
            {
                var usuario = await _context.Usuarios.FindAsync(id);

                if (usuario == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                if (usuario.Activo)
                {
                    return BadRequest(new { message = "El usuario ya está activo" });
                }

                usuario.Activo = true;
                _context.Usuarios.Update(usuario);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al reactivar usuario", error = ex.Message });
            }
        }
    }
}
