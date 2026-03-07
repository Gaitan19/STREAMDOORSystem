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
    public class CorreosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly Random _random = new Random();

        public CorreosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Correos?includeInactive=false
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CorreoDTO>>> GetCorreos([FromQuery] bool includeInactive = false)
        {
            try
            {
                var query = _context.Correos.AsQueryable();
                
                if (!includeInactive)
                {
                    query = query.Where(c => c.Activo);
                }

                var correos = await query
                    .Select(c => new CorreoDTO
                    {
                        CorreoID = c.CorreoID,
                        Email = c.Email,
                        Password = c.Password,
                        FechaCreacion = c.FechaCreacion,
                        Notas = c.Notas,
                        Activo = c.Activo,
                        ServiciosAsociados = string.Join(", ", 
                            _context.CorreosServicios
                                .Where(cs => cs.CorreoID == c.CorreoID)
                                .Select(cs => cs.Servicio!.Nombre)
                                .ToList())
                    })
                    .ToListAsync();

                return Ok(correos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener correos", error = ex.Message });
            }
        }

        // GET: api/Correos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CorreoDTO>> GetCorreo(int id)
        {
            try
            {
                var correo = await _context.Correos.FindAsync(id);

                if (correo == null || !correo.Activo)
                {
                    return NotFound(new { message = "Correo no encontrado" });
                }

                var serviciosAsociados = await _context.CorreosServicios
                    .Where(cs => cs.CorreoID == id)
                    .Include(cs => cs.Servicio)
                    .Select(cs => cs.Servicio!.Nombre)
                    .ToListAsync();

                var correoDto = new CorreoDTO
                {
                    CorreoID = correo.CorreoID,
                    Email = correo.Email,
                    Password = correo.Password,
                    FechaCreacion = correo.FechaCreacion,
                    Notas = correo.Notas,
                    Activo = correo.Activo,
                    ServiciosAsociados = string.Join(", ", serviciosAsociados)
                };

                return Ok(correoDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener correo", error = ex.Message });
            }
        }

        // POST: api/Correos
        [HttpPost]
        public async Task<ActionResult<CorreoDTO>> CreateCorreo([FromBody] CrearCorreoDTO crearCorreoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar si el email ya existe
                var emailExiste = await _context.Correos.AnyAsync(c => c.Email == crearCorreoDto.Email && c.Activo);
                if (emailExiste)
                {
                    return BadRequest(new { message = $"El correo '{crearCorreoDto.Email}' ya está registrado en el sistema" });
                }

                var correo = new Correo
                {
                    Email = crearCorreoDto.Email,
                    Password = crearCorreoDto.Password,
                    FechaCreacion = DateTime.Now,
                    Notas = crearCorreoDto.Notas,
                    Activo = true
                };

                _context.Correos.Add(correo);
                await _context.SaveChangesAsync();

                // Asociar servicios si se proporcionan
                if (crearCorreoDto.ServiciosIDs != null && crearCorreoDto.ServiciosIDs.Count > 0)
                {
                    foreach (var servicioId in crearCorreoDto.ServiciosIDs)
                    {
                        var servicioExiste = await _context.Servicios.AnyAsync(s => s.ServicioID == servicioId);
                        if (servicioExiste)
                        {
                            var correoServicio = new CorreoServicio
                            {
                                CorreoID = correo.CorreoID,
                                ServicioID = servicioId,
                                FechaAsociacion = DateTime.Now
                            };
                            _context.CorreosServicios.Add(correoServicio);
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                var serviciosAsociados = await _context.CorreosServicios
                    .Where(cs => cs.CorreoID == correo.CorreoID)
                    .Include(cs => cs.Servicio)
                    .Select(cs => cs.Servicio!.Nombre)
                    .ToListAsync();

                var correoDto = new CorreoDTO
                {
                    CorreoID = correo.CorreoID,
                    Email = correo.Email,
                    Password = correo.Password,
                    FechaCreacion = correo.FechaCreacion,
                    Notas = correo.Notas,
                    Activo = correo.Activo,
                    ServiciosAsociados = string.Join(", ", serviciosAsociados)
                };

                return CreatedAtAction(nameof(GetCorreo), new { id = correo.CorreoID }, correoDto);
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true || 
                                               ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return BadRequest(new { message = $"El correo '{crearCorreoDto.Email}' ya está registrado en el sistema" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear correo", error = ex.Message });
            }
        }

        // PUT: api/Correos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCorreo(int id, [FromBody] CrearCorreoDTO crearCorreoDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var correo = await _context.Correos.FindAsync(id);

                if (correo == null || !correo.Activo)
                {
                    return NotFound(new { message = "Correo no encontrado" });
                }

                // Verificar si el email ya existe (excluyendo el correo actual)
                var emailExiste = await _context.Correos.AnyAsync(c => 
                    c.Email == crearCorreoDto.Email && 
                    c.CorreoID != id && 
                    c.Activo);
                
                if (emailExiste)
                {
                    return BadRequest(new { message = $"El correo '{crearCorreoDto.Email}' ya está registrado en el sistema" });
                }

                correo.Email = crearCorreoDto.Email;
                correo.Password = crearCorreoDto.Password;
                correo.Notas = crearCorreoDto.Notas;

                _context.Correos.Update(correo);
                await _context.SaveChangesAsync();

                // Actualizar servicios asociados si se proporcionan
                if (crearCorreoDto.ServiciosIDs != null)
                {
                    var serviciosExistentes = await _context.CorreosServicios
                        .Where(cs => cs.CorreoID == id)
                        .ToListAsync();

                    _context.CorreosServicios.RemoveRange(serviciosExistentes);

                    foreach (var servicioId in crearCorreoDto.ServiciosIDs)
                    {
                        var servicioExiste = await _context.Servicios.AnyAsync(s => s.ServicioID == servicioId);
                        if (servicioExiste)
                        {
                            var correoServicio = new CorreoServicio
                            {
                                CorreoID = id,
                                ServicioID = servicioId,
                                FechaAsociacion = DateTime.Now
                            };
                            _context.CorreosServicios.Add(correoServicio);
                        }
                    }

                    await _context.SaveChangesAsync();
                }

                return NoContent();
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true || 
                                               ex.InnerException?.Message.Contains("duplicate") == true)
            {
                return BadRequest(new { message = $"El correo '{crearCorreoDto.Email}' ya está registrado en el sistema" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar correo", error = ex.Message });
            }
        }

        // DELETE: api/Correos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCorreo(int id)
        {
            try
            {
                var correo = await _context.Correos.FindAsync(id);

                if (correo == null || !correo.Activo)
                {
                    return NotFound(new { message = "Correo no encontrado" });
                }

                correo.Activo = false;
                _context.Correos.Update(correo);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar correo", error = ex.Message });
            }
        }

        // POST: api/Correos/5/reactivar
        [HttpPost("{id}/reactivar")]
        public async Task<IActionResult> ReactivarCorreo(int id)
        {
            try
            {
                var correo = await _context.Correos.FindAsync(id);

                if (correo == null)
                {
                    return NotFound(new { message = "Correo no encontrado" });
                }

                if (correo.Activo)
                {
                    return BadRequest(new { message = "El correo ya está activo" });
                }

                correo.Activo = true;
                _context.Correos.Update(correo);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al reactivar correo", error = ex.Message });
            }
        }

        // POST: api/Correos/generar-credenciales
        [HttpPost("generar-credenciales")]
        public ActionResult<GenerarCredencialesDTO> GenerarCredenciales()
        {
            try
            {
                var email = GenerarEmailAleatorio();
                var password = GenerarContraseñaAleatoria();

                return Ok(new GenerarCredencialesDTO
                {
                    Email = email,
                    Password = password
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al generar credenciales", error = ex.Message });
            }
        }

        // Método auxiliar para generar email aleatorio
        private string GenerarEmailAleatorio()
        {
            const string caracteres = "abcdefghijklmnopqrstuvwxyz0123456789";
            var nombreAleatorio = new string(Enumerable.Range(0, 10)
                .Select(_ => caracteres[_random.Next(caracteres.Length)])
                .ToArray());

            return $"{nombreAleatorio}@streamdoor.com";
        }

        // Método auxiliar para generar contraseña aleatoria
        private string GenerarContraseñaAleatoria()
        {
            const string minusculas = "abcdefghijklmnopqrstuvwxyz";
            const string mayusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string numeros = "0123456789";
            const string caracteresespeciales = "!@#$%^&*";

            var contraseña = new List<char>();

            // Agregar al menos un carácter de cada tipo
            contraseña.Add(minusculas[_random.Next(minusculas.Length)]);
            contraseña.Add(mayusculas[_random.Next(mayusculas.Length)]);
            contraseña.Add(numeros[_random.Next(numeros.Length)]);
            contraseña.Add(caracteresespeciales[_random.Next(caracteresespeciales.Length)]);

            // Completar hasta 12 caracteres
            const string todosCaracteres = minusculas + mayusculas + numeros + caracteresespeciales;
            for (int i = contraseña.Count; i < 12; i++)
            {
                contraseña.Add(todosCaracteres[_random.Next(todosCaracteres.Length)]);
            }

            // Mezclar los caracteres
            return new string(contraseña.OrderBy(_ => _random.Next()).ToArray());
        }
    }
}
