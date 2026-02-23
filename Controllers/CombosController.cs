using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models;
using STREAMDOORSystem.Models.DTOs;

namespace STREAMDOORSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CombosController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CombosController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/combos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ComboDTO>>> GetCombos()
        {
            var combos = await _context.Combos
                .Include(c => c.ComboServicios)
                .ThenInclude(cs => cs.Servicio)
                .Where(c => c.Activo)
                .ToListAsync();

            var combosDTO = combos.Select(c => new ComboDTO
            {
                ComboID = c.ComboID,
                Nombre = c.Nombre,
                Descripcion = c.Descripcion,
                Precio = c.Precio,
                Activo = c.Activo,
                FechaCreacion = c.FechaCreacion,
                Servicios = c.ComboServicios.Select(cs => new ServicioDTO
                {
                    ServicioID = cs.Servicio!.ServicioID,
                    Nombre = cs.Servicio.Nombre,
                    Descripcion = cs.Servicio.Descripcion,
                    Precio = cs.Servicio.Precio,
                    Activo = cs.Servicio.Activo
                }).ToList()
            }).ToList();

            return Ok(combosDTO);
        }

        // GET: api/combos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ComboDTO>> GetCombo(int id)
        {
            var combo = await _context.Combos
                .Include(c => c.ComboServicios)
                .ThenInclude(cs => cs.Servicio)
                .FirstOrDefaultAsync(c => c.ComboID == id);

            if (combo == null)
            {
                return NotFound(new { message = "Combo no encontrado" });
            }

            var comboDTO = new ComboDTO
            {
                ComboID = combo.ComboID,
                Nombre = combo.Nombre,
                Descripcion = combo.Descripcion,
                Precio = combo.Precio,
                Activo = combo.Activo,
                FechaCreacion = combo.FechaCreacion,
                Servicios = combo.ComboServicios.Select(cs => new ServicioDTO
                {
                    ServicioID = cs.Servicio!.ServicioID,
                    Nombre = cs.Servicio.Nombre,
                    Descripcion = cs.Servicio.Descripcion,
                    Precio = cs.Servicio.Precio,
                    Activo = cs.Servicio.Activo
                }).ToList()
            };

            return Ok(comboDTO);
        }

        // POST: api/combos
        [HttpPost]
        public async Task<ActionResult<ComboDTO>> CreateCombo(CrearComboDTO crearComboDTO)
        {
            // Validar que los servicios existan
            var servicios = await _context.Servicios
                .Where(s => crearComboDTO.ServiciosIDs.Contains(s.ServicioID))
                .ToListAsync();

            if (servicios.Count != crearComboDTO.ServiciosIDs.Count)
            {
                return BadRequest(new { message = "Uno o más servicios no existen" });
            }

            // Verificar que haya al menos 2 servicios
            if (crearComboDTO.ServiciosIDs.Count < 2)
            {
                return BadRequest(new { message = "Un combo debe contener al menos 2 servicios" });
            }

            // Crear el combo
            var combo = new Combo
            {
                Nombre = crearComboDTO.Nombre,
                Descripcion = crearComboDTO.Descripcion,
                Precio = crearComboDTO.Precio,
                Activo = true,
                FechaCreacion = DateTime.Now
            };

            _context.Combos.Add(combo);
            await _context.SaveChangesAsync();

            // Asociar servicios al combo
            foreach (var servicioID in crearComboDTO.ServiciosIDs)
            {
                var comboServicio = new ComboServicio
                {
                    ComboID = combo.ComboID,
                    ServicioID = servicioID
                };
                _context.ComboServicios.Add(comboServicio);
            }

            await _context.SaveChangesAsync();

            // Recargar el combo con sus servicios
            var comboCreado = await _context.Combos
                .Include(c => c.ComboServicios)
                .ThenInclude(cs => cs.Servicio)
                .FirstOrDefaultAsync(c => c.ComboID == combo.ComboID);

            var comboDTO = new ComboDTO
            {
                ComboID = comboCreado!.ComboID,
                Nombre = comboCreado.Nombre,
                Descripcion = comboCreado.Descripcion,
                Precio = comboCreado.Precio,
                Activo = comboCreado.Activo,
                FechaCreacion = comboCreado.FechaCreacion,
                Servicios = comboCreado.ComboServicios.Select(cs => new ServicioDTO
                {
                    ServicioID = cs.Servicio!.ServicioID,
                    Nombre = cs.Servicio.Nombre,
                    Descripcion = cs.Servicio.Descripcion,
                    Precio = cs.Servicio.Precio,
                    Activo = cs.Servicio.Activo
                }).ToList()
            };

            return CreatedAtAction(nameof(GetCombo), new { id = combo.ComboID }, comboDTO);
        }

        // PUT: api/combos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCombo(int id, ActualizarComboDTO actualizarComboDTO)
        {
            var combo = await _context.Combos
                .Include(c => c.ComboServicios)
                .FirstOrDefaultAsync(c => c.ComboID == id);

            if (combo == null)
            {
                return NotFound(new { message = "Combo no encontrado" });
            }

            // Actualizar campos si se proporcionan
            if (actualizarComboDTO.Nombre != null)
                combo.Nombre = actualizarComboDTO.Nombre;

            if (actualizarComboDTO.Descripcion != null)
                combo.Descripcion = actualizarComboDTO.Descripcion;

            if (actualizarComboDTO.Precio.HasValue)
                combo.Precio = actualizarComboDTO.Precio.Value;

            if (actualizarComboDTO.Activo.HasValue)
                combo.Activo = actualizarComboDTO.Activo.Value;

            // Actualizar servicios del combo si se proporcionan
            if (actualizarComboDTO.ServiciosIDs != null)
            {
                // Validar que los servicios existan
                var servicios = await _context.Servicios
                    .Where(s => actualizarComboDTO.ServiciosIDs.Contains(s.ServicioID))
                    .ToListAsync();

                if (servicios.Count != actualizarComboDTO.ServiciosIDs.Count)
                {
                    return BadRequest(new { message = "Uno o más servicios no existen" });
                }

                // Verificar que haya al menos 2 servicios
                if (actualizarComboDTO.ServiciosIDs.Count < 2)
                {
                    return BadRequest(new { message = "Un combo debe contener al menos 2 servicios" });
                }

                // Eliminar asociaciones existentes
                _context.ComboServicios.RemoveRange(combo.ComboServicios);

                // Agregar nuevas asociaciones
                foreach (var servicioID in actualizarComboDTO.ServiciosIDs)
                {
                    var comboServicio = new ComboServicio
                    {
                        ComboID = combo.ComboID,
                        ServicioID = servicioID
                    };
                    _context.ComboServicios.Add(comboServicio);
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/combos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCombo(int id)
        {
            var combo = await _context.Combos.FindAsync(id);

            if (combo == null)
            {
                return NotFound(new { message = "Combo no encontrado" });
            }

            // Soft delete - solo marcar como inactivo
            combo.Activo = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
