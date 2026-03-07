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
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RolesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Roles
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RolDTO>>> GetRoles([FromQuery] bool includeInactive = false)
        {
            try
            {
                var query = _context.Roles
                    .Include(r => r.Permisos)
                    .AsQueryable();

                if (!includeInactive)
                {
                    query = query.Where(r => r.Activo);
                }

                var roles = await query
                    .OrderBy(r => r.Nombre)
                    .ToListAsync();

                var result = roles.Select(r => new RolDTO
                {
                    RolID = r.RolID,
                    Nombre = r.Nombre,
                    Descripcion = r.Descripcion,
                    Activo = r.Activo,
                    FechaCreacion = r.FechaCreacion,
                    Permisos = r.Permisos.Select(p => new PermisoDTO
                    {
                        Modulo = p.Modulo,
                        PuedeVer = p.PuedeVer,
                        PuedeCrear = p.PuedeCrear,
                        PuedeEditar = p.PuedeEditar,
                        PuedeEliminar = p.PuedeEliminar
                    }).ToList()
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener roles", error = ex.Message });
            }
        }

        // GET: api/Roles/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RolDTO>> GetRol(int id)
        {
            try
            {
                var rol = await _context.Roles
                    .Include(r => r.Permisos)
                    .FirstOrDefaultAsync(r => r.RolID == id);

                if (rol == null)
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }

                var result = new RolDTO
                {
                    RolID = rol.RolID,
                    Nombre = rol.Nombre,
                    Descripcion = rol.Descripcion,
                    Activo = rol.Activo,
                    FechaCreacion = rol.FechaCreacion,
                    Permisos = rol.Permisos.Select(p => new PermisoDTO
                    {
                        Modulo = p.Modulo,
                        PuedeVer = p.PuedeVer,
                        PuedeCrear = p.PuedeCrear,
                        PuedeEditar = p.PuedeEditar,
                        PuedeEliminar = p.PuedeEliminar
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener rol", error = ex.Message });
            }
        }

        // POST: api/Roles
        [HttpPost]
        public async Task<ActionResult<RolDTO>> CreateRol([FromBody] CrearRolDTO crearRolDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check for duplicate name
                var existente = await _context.Roles
                    .FirstOrDefaultAsync(r => r.Nombre == crearRolDto.Nombre);

                if (existente != null)
                {
                    return Conflict(new { message = "Ya existe un rol con ese nombre" });
                }

                var rol = new Rol
                {
                    Nombre = crearRolDto.Nombre,
                    Descripcion = crearRolDto.Descripcion,
                    Activo = true,
                    FechaCreacion = DateTime.Now
                };

                _context.Roles.Add(rol);
                await _context.SaveChangesAsync();

                // Add permissions
                foreach (var permiso in crearRolDto.Permisos)
                {
                    var rolPermiso = new RolPermiso
                    {
                        RolID = rol.RolID,
                        Modulo = permiso.Modulo,
                        PuedeVer = permiso.PuedeVer,
                        PuedeCrear = permiso.PuedeCrear,
                        PuedeEditar = permiso.PuedeEditar,
                        PuedeEliminar = permiso.PuedeEliminar
                    };
                    _context.RolPermisos.Add(rolPermiso);
                }

                await _context.SaveChangesAsync();

                var result = new RolDTO
                {
                    RolID = rol.RolID,
                    Nombre = rol.Nombre,
                    Descripcion = rol.Descripcion,
                    Activo = rol.Activo,
                    FechaCreacion = rol.FechaCreacion,
                    Permisos = crearRolDto.Permisos
                };

                return CreatedAtAction(nameof(GetRol), new { id = rol.RolID }, result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear rol", error = ex.Message });
            }
        }

        // PUT: api/Roles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRol(int id, [FromBody] ActualizarRolDTO actualizarRolDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var rol = await _context.Roles
                    .Include(r => r.Permisos)
                    .FirstOrDefaultAsync(r => r.RolID == id);

                if (rol == null)
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }

                // Check for duplicate name (excluding current)
                var existente = await _context.Roles
                    .FirstOrDefaultAsync(r => r.Nombre == actualizarRolDto.Nombre && r.RolID != id);

                if (existente != null)
                {
                    return Conflict(new { message = "Ya existe un rol con ese nombre" });
                }

                rol.Nombre = actualizarRolDto.Nombre;
                rol.Descripcion = actualizarRolDto.Descripcion;
                rol.Activo = actualizarRolDto.Activo;

                // Replace permissions: remove old, add new
                _context.RolPermisos.RemoveRange(rol.Permisos);

                foreach (var permiso in actualizarRolDto.Permisos)
                {
                    var rolPermiso = new RolPermiso
                    {
                        RolID = rol.RolID,
                        Modulo = permiso.Modulo,
                        PuedeVer = permiso.PuedeVer,
                        PuedeCrear = permiso.PuedeCrear,
                        PuedeEditar = permiso.PuedeEditar,
                        PuedeEliminar = permiso.PuedeEliminar
                    };
                    _context.RolPermisos.Add(rolPermiso);
                }

                _context.Roles.Update(rol);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar rol", error = ex.Message });
            }
        }

        // DELETE: api/Roles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRol(int id)
        {
            try
            {
                var rol = await _context.Roles.FindAsync(id);

                if (rol == null)
                {
                    return NotFound(new { message = "Rol no encontrado" });
                }

                // Check if any users are using this role
                var usuariosConRol = await _context.Usuarios
                    .AnyAsync(u => u.RolID == id && u.Activo);

                if (usuariosConRol)
                {
                    return BadRequest(new { message = "No se puede eliminar el rol porque tiene usuarios asignados" });
                }

                rol.Activo = false;
                _context.Roles.Update(rol);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar rol", error = ex.Message });
            }
        }

        // GET: api/Roles/modulos - List available modules
        [HttpGet("modulos")]
        public IActionResult GetModulos()
        {
            var modulos = new[]
            {
                new { id = "dashboard", nombre = "Dashboard" },
                new { id = "clientes", nombre = "Clientes" },
                new { id = "servicios", nombre = "Servicios" },
                new { id = "combos", nombre = "Combos" },
                new { id = "correos", nombre = "Correos" },
                new { id = "cuentas", nombre = "Cuentas" },
                new { id = "ventas", nombre = "Ventas" },
                new { id = "ingresos", nombre = "Ingresos" },
                new { id = "egresos", nombre = "Egresos" },
                new { id = "medios-pago", nombre = "Medios de Pago" },
                new { id = "usuarios", nombre = "Usuarios" },
                new { id = "roles", nombre = "Roles" }
            };

            return Ok(modulos);
        }
    }
}
