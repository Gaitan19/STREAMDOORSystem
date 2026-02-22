using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models.DTOs;

namespace STREAMDOORSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Dashboard/metricas
        [HttpGet("metricas")]
        public async Task<ActionResult<DashboardMetricasDTO>> GetMetricas()
        {
            try
            {
                var hoy = DateTime.Now.Date;
                
                // Total de ventas activas
                var totalVentas = await _context.Ventas
                    .Where(v => v.Estado == "Activo")
                    .CountAsync();

                // Total de ingresos
                var totalIngresos = await _context.Ventas
                    .Where(v => v.Estado == "Activo")
                    .SumAsync(v => v.Monto);

                // Renovaciones pendientes (ventas que vencen en los próximos 7 días)
                var renovacionesPendientes = await _context.Ventas
                    .Where(v => v.Estado == "Activo" && v.FechaFin >= hoy && v.FechaFin <= hoy.AddDays(7))
                    .CountAsync();

                // Servicios más vendidos
                var serviciosMasVendidos = await _context.VentasDetalles
                    .Include(vd => vd.Servicio)
                    .GroupBy(vd => vd.Servicio!.Nombre)
                    .Select(g => new ServicioMasVendidoDTO
                    {
                        Nombre = g.Key!,
                        Cantidad = g.Count()
                    })
                    .OrderByDescending(s => s.Cantidad)
                    .Take(10)
                    .ToListAsync();

                // Alertas de vencimiento (próximos 30 días)
                var alertasVencimiento = await _context.Ventas
                    .Where(v => v.Estado == "Activo" && v.FechaFin > hoy && v.FechaFin <= hoy.AddDays(30))
                    .Include(v => v.Cliente)
                    .Include(v => v.Detalles)
                    .ThenInclude(d => d.Servicio)
                    .Select(v => new AlertaVencimientoDTO
                    {
                        VentaID = v.VentaID,
                        Cliente = v.Cliente!.Nombre + " " + v.Cliente.Apellido,
                        Servicio = string.Join(", ", v.Detalles.Select(d => d.Servicio!.Nombre)),
                        FechaFin = v.FechaFin,
                        DiasRestantes = (int)(v.FechaFin - hoy).TotalDays
                    })
                    .OrderBy(a => a.DiasRestantes)
                    .ToListAsync();

                var metricas = new DashboardMetricasDTO
                {
                    TotalVentas = totalVentas,
                    TotalIngresos = totalIngresos,
                    RenovacionesPendientes = renovacionesPendientes,
                    ServiciosMasVendidos = serviciosMasVendidos,
                    AlertasVencimiento = alertasVencimiento
                };

                return Ok(metricas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener métricas del dashboard", error = ex.Message });
            }
        }

        // GET: api/Dashboard/resumen
        [HttpGet("resumen")]
        public async Task<ActionResult<dynamic>> GetResumen()
        {
            try
            {
                var totalClientes = await _context.Clientes
                    .Where(c => c.Activo)
                    .CountAsync();

                var totalCuentas = await _context.Cuentas
                    .Where(c => c.Activo)
                    .CountAsync();

                var totalServicios = await _context.Servicios
                    .Where(s => s.Activo)
                    .CountAsync();

                var totalUsuarios = await _context.Usuarios
                    .Where(u => u.Activo)
                    .CountAsync();

                var resumen = new
                {
                    TotalClientes = totalClientes,
                    TotalCuentas = totalCuentas,
                    TotalServicios = totalServicios,
                    TotalUsuarios = totalUsuarios
                };

                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener resumen del dashboard", error = ex.Message });
            }
        }

        // GET: api/Dashboard/ingresos-mensuales
        [HttpGet("ingresos-mensuales")]
        public async Task<ActionResult<IEnumerable<dynamic>>> GetIngresosMensuales()
        {
            try
            {
                var ingresosMensuales = await _context.Ventas
                    .Where(v => v.Estado == "Activo")
                    .GroupBy(v => new { v.FechaCreacion.Year, v.FechaCreacion.Month })
                    .Select(g => new
                    {
                        Mes = new DateTime(g.Key.Year, g.Key.Month, 1),
                        Total = g.Sum(v => v.Monto),
                        Cantidad = g.Count()
                    })
                    .OrderByDescending(x => x.Mes)
                    .Take(12)
                    .ToListAsync();

                return Ok(ingresosMensuales);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener ingresos mensuales", error = ex.Message });
            }
        }

        // GET: api/Dashboard/cuentas-disponibles
        [HttpGet("cuentas-disponibles")]
        public async Task<ActionResult<dynamic>> GetCuentasDisponibles()
        {
            try
            {
                var cuentasDisponibles = await _context.Cuentas
                    .Where(c => c.Activo && c.Estado == "Disponible")
                    .Include(c => c.Servicio)
                    .GroupBy(c => c.Servicio!.Nombre)
                    .Select(g => new
                    {
                        Servicio = g.Key,
                        Cantidad = g.Count()
                    })
                    .ToListAsync();

                return Ok(cuentasDisponibles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener cuentas disponibles", error = ex.Message });
            }
        }
    }
}
