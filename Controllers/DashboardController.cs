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

        // GET: api/Dashboard/completo?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
        [HttpGet("completo")]
        public async Task<ActionResult<DashboardCompletoDTO>> GetCompleto(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin,
            [FromQuery] bool sinFiltro = false)
        {
            // Threshold for daily vs. monthly chart grouping
            const int MAX_DAYS_FOR_DAILY_GROUPING = 31;
            try
            {
                var hoy = DateTime.Now.Date;
                // When sinFiltro=true show all records regardless of date
                var inicio = sinFiltro ? DateTime.MinValue : (fechaInicio?.Date ?? hoy);
                var fin    = sinFiltro ? DateTime.MaxValue : ((fechaFin?.Date ?? hoy).AddDays(1).AddSeconds(-1));

                // ── KPIs financieros del periodo ─────────────────────────────
                var totalIngresos = await _context.Ingresos
                    .Where(i => i.FechaCreacion >= inicio && i.FechaCreacion <= fin)
                    .SumAsync(i => (decimal?)i.Monto) ?? 0m;

                var totalEgresos = await _context.Egresos
                    .Where(e => e.FechaCreacion >= inicio && e.FechaCreacion <= fin)
                    .SumAsync(e => (decimal?)e.Monto) ?? 0m;

                var gananciaNeta = totalIngresos - totalEgresos;

                // ── KPIs de ventas del periodo ───────────────────────────────
                var ventasPeriodo = await _context.Ventas
                    .Where(v => v.FechaCreacion >= inicio && v.FechaCreacion <= fin)
                    .ToListAsync();

                var totalVentasPeriodo = ventasPeriodo.Count;
                var montoVentasPeriodo = ventasPeriodo.Sum(v => v.Monto);

                // ── KPIs globales ────────────────────────────────────────────
                var totalClientes    = await _context.Clientes.CountAsync(c => c.Activo);
                var totalCuentas     = await _context.Cuentas.CountAsync(c => c.Activo);
                var totalCorreos     = await _context.Correos.CountAsync(c => c.Activo);
                var totalServicios   = await _context.Servicios.CountAsync(s => s.Activo);
                var totalMediosPago  = await _context.MediosPago.CountAsync(m => m.Activo);

                // ── Estado de cuentas ────────────────────────────────────────
                var cuentasActivas = await _context.Cuentas.Where(c => c.Activo).ToListAsync();
                var cuentasDisponibles      = cuentasActivas.Count(c => c.Disponibilidad == "Disponible");
                var cuentasOcupadas         = cuentasActivas.Count(c => c.Disponibilidad == "Ocupada");
                var cuentasVencidasCount    = cuentasActivas.Count(c => c.EstadoSuscripcion == "Vencida");
                var cuentasProximasCount    = cuentasActivas.Count(c => c.EstadoSuscripcion == "Próxima a Vencer");
                var renovacionesPendientes  = cuentasVencidasCount;

                // ── Gráfico ingresos vs egresos ──────────────────────────────
                var rangeDays = (fin.Date - inicio).TotalDays + 1;
                List<IngresoEgresoChartDTO> chartData;

                if (rangeDays <= MAX_DAYS_FOR_DAILY_GROUPING)
                {
                    // Agrupar por día
                    var ingList = await _context.Ingresos
                        .Where(i => i.FechaCreacion >= inicio && i.FechaCreacion <= fin)
                        .ToListAsync();
                    var egrList = await _context.Egresos
                        .Where(e => e.FechaCreacion >= inicio && e.FechaCreacion <= fin)
                        .ToListAsync();

                    chartData = Enumerable.Range(0, (int)rangeDays)
                        .Select(d =>
                        {
                            var dia = inicio.AddDays(d).Date;
                            var ing = ingList.Where(i => i.FechaCreacion.Date == dia).Sum(i => i.Monto);
                            var egr = egrList.Where(e => e.FechaCreacion.Date == dia).Sum(e => e.Monto);
                            return new IngresoEgresoChartDTO
                            {
                                Periodo  = dia.ToString("dd/MM"),
                                Ingresos = ing,
                                Egresos  = egr,
                                Ganancia = ing - egr
                            };
                        })
                        .ToList();
                }
                else
                {
                    // Agrupar por mes
                    var ingList = await _context.Ingresos
                        .Where(i => i.FechaCreacion >= inicio && i.FechaCreacion <= fin)
                        .ToListAsync();
                    var egrList = await _context.Egresos
                        .Where(e => e.FechaCreacion >= inicio && e.FechaCreacion <= fin)
                        .ToListAsync();

                    var months = ingList.Select(i => new { i.FechaCreacion.Year, i.FechaCreacion.Month })
                        .Union(egrList.Select(e => new { e.FechaCreacion.Year, e.FechaCreacion.Month }))
                        .Distinct()
                        .OrderBy(m => m.Year).ThenBy(m => m.Month)
                        .ToList();

                    // Fill in any months in range that have no data — use HashSet for O(1) lookup
                    var monthSet = new HashSet<(int Year, int Month)>(
                        months.Select(m => (m.Year, m.Month)));
                    var cur = new DateTime(inicio.Year, inicio.Month, 1);
                    var last = new DateTime(fin.Year, fin.Month, 1);
                    while (cur <= last)
                    {
                        if (monthSet.Add((cur.Year, cur.Month)))
                            months.Add(new { cur.Year, cur.Month });
                        cur = cur.AddMonths(1);
                    }
                    months = months.OrderBy(m => m.Year).ThenBy(m => m.Month).ToList();

                    chartData = months.Select(m =>
                    {
                        var ing = ingList.Where(i => i.FechaCreacion.Year == m.Year && i.FechaCreacion.Month == m.Month).Sum(i => i.Monto);
                        var egr = egrList.Where(e => e.FechaCreacion.Year == m.Year && e.FechaCreacion.Month == m.Month).Sum(e => e.Monto);
                        return new IngresoEgresoChartDTO
                        {
                            Periodo  = new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"),
                            Ingresos = ing,
                            Egresos  = egr,
                            Ganancia = ing - egr
                        };
                    }).ToList();
                }

                // ── Ventas por servicio (top 10, periodo) ────────────────────
                var ventasPorServicio = await _context.VentasDetalles
                    .Where(vd => vd.Venta!.FechaCreacion >= inicio && vd.Venta.FechaCreacion <= fin)
                    .Join(_context.Servicios,
                          vd => vd.ServicioID,
                          s  => s.ServicioID,
                          (vd, s) => new { s.Nombre, vd.PrecioUnitario })
                    .GroupBy(x => x.Nombre)
                    .Select(g => new ServicioVentasChartDTO
                    {
                        Servicio = g.Key ?? "Sin servicio",
                        Ventas   = g.Count(),
                        Monto    = g.Sum(x => x.PrecioUnitario)
                    })
                    .OrderByDescending(s => s.Ventas)
                    .Take(10)
                    .ToListAsync();

                // ── Cuentas por estado ────────────────────────────────────────
                var cuentasPorEstado = new List<CuentaEstadoChartDTO>
                {
                    new() { Estado = "Disponible",       Cantidad = cuentasDisponibles },
                    new() { Estado = "Ocupada",           Cantidad = cuentasOcupadas },
                    new() { Estado = "Vencida",           Cantidad = cuentasVencidasCount },
                    new() { Estado = "Próxima a Vencer", Cantidad = cuentasProximasCount }
                };

                // ── Alertas: cuentas próximas a vencer ──────────────────────
                var cuentasProximasVencerList = await _context.Cuentas
                    .Include(c => c.Servicio)
                    .Where(c => c.Activo && c.EstadoSuscripcion == "Próxima a Vencer")
                    .OrderBy(c => c.FechaFinalizacion)
                    .Take(10)
                    .Select(c => new CuentaAlertaDTO
                    {
                        CuentaID         = c.CuentaID,
                        CodigoCuenta     = c.CodigoCuenta ?? $"SD-{c.CuentaID:D3}",
                        Servicio         = c.Servicio != null ? c.Servicio.Nombre : "N/A",
                        EstadoSuscripcion = c.EstadoSuscripcion,
                        FechaFinalizacion = c.FechaFinalizacion,
                        DiasRestantes    = c.FechaFinalizacion.HasValue
                            ? (int)(c.FechaFinalizacion.Value.Date - hoy).TotalDays
                            : (int?)null,
                        Costo            = c.Costo
                    })
                    .ToListAsync();

                // ── Alertas: cuentas vencidas ────────────────────────────────
                var cuentasVencidasList = await _context.Cuentas
                    .Include(c => c.Servicio)
                    .Where(c => c.Activo && c.EstadoSuscripcion == "Vencida")
                    .OrderByDescending(c => c.FechaFinalizacion)
                    .Take(10)
                    .Select(c => new CuentaAlertaDTO
                    {
                        CuentaID         = c.CuentaID,
                        CodigoCuenta     = c.CodigoCuenta ?? $"SD-{c.CuentaID:D3}",
                        Servicio         = c.Servicio != null ? c.Servicio.Nombre : "N/A",
                        EstadoSuscripcion = c.EstadoSuscripcion,
                        FechaFinalizacion = c.FechaFinalizacion,
                        DiasRestantes    = c.FechaFinalizacion.HasValue
                            ? (int)(c.FechaFinalizacion.Value.Date - hoy).TotalDays
                            : (int?)null,
                        Costo            = c.Costo
                    })
                    .ToListAsync();

                // ── Alertas: ventas próximas a vencer ────────────────────────
                var ventasProximasVencer = await _context.Ventas
                    .Include(v => v.Cliente)
                    .Include(v => v.Detalles).ThenInclude(d => d.Servicio)
                    .Where(v => v.Estado == "Activo" && v.FechaFin > hoy && v.FechaFin <= hoy.AddDays(7))
                    .OrderBy(v => v.FechaFin)
                    .Take(10)
                    .ToListAsync();

                var ventasProximasVencerDTO = ventasProximasVencer.Select(v => new AlertaVencimientoDTO
                {
                    VentaID       = v.VentaID,
                    Cliente       = v.Cliente != null ? $"{v.Cliente.Nombre} {v.Cliente.Apellido}" : "N/A",
                    Servicio      = string.Join(", ", v.Detalles.Select(d => d.Servicio?.Nombre ?? "N/A")),
                    FechaFin      = v.FechaFin,
                    DiasRestantes = (int)(v.FechaFin - hoy).TotalDays
                }).ToList();

                // ── Top clientes (por monto total de ventas, global) ─────────
                var topClientes = await _context.Ventas
                    .GroupBy(v => v.ClienteID)
                    .Select(g => new
                    {
                        ClienteID   = g.Key,
                        TotalVentas = g.Count(),
                        TotalMonto  = g.Sum(v => v.Monto)
                    })
                    .OrderByDescending(t => t.TotalMonto)
                    .Take(5)
                    .Join(_context.Clientes,
                          t => t.ClienteID,
                          c => c.ClienteID,
                          (t, c) => new TopClienteDTO
                          {
                              ClienteID   = t.ClienteID,
                              Nombre      = c.Nombre + " " + c.Apellido,
                              TotalVentas = t.TotalVentas,
                              TotalMonto  = t.TotalMonto
                          })
                    .ToListAsync();

                // ── Ensamble ─────────────────────────────────────────────────
                var resultado = new DashboardCompletoDTO
                {
                    TotalIngresos            = totalIngresos,
                    TotalEgresos             = totalEgresos,
                    GananciaNeta             = gananciaNeta,
                    TotalVentasPeriodo       = totalVentasPeriodo,
                    MontoVentasPeriodo       = montoVentasPeriodo,
                    TotalClientes            = totalClientes,
                    TotalCuentas             = totalCuentas,
                    TotalCorreos             = totalCorreos,
                    TotalServicios           = totalServicios,
                    TotalMediosPago          = totalMediosPago,
                    CuentasDisponibles       = cuentasDisponibles,
                    CuentasOcupadas          = cuentasOcupadas,
                    CuentasVencidas          = cuentasVencidasCount,
                    CuentasProximasVencer    = cuentasProximasCount,
                    RenovacionesPendientes   = renovacionesPendientes,
                    IngresosEgresosChart     = chartData,
                    VentasPorServicio        = ventasPorServicio,
                    CuentasPorEstado         = cuentasPorEstado,
                    CuentasProximasVencerList = cuentasProximasVencerList,
                    CuentasVencidasList      = cuentasVencidasList,
                    VentasProximasVencer     = ventasProximasVencerDTO,
                    TopClientes              = topClientes
                };

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener datos del dashboard", error = ex.Message });
            }
        }

        // Legacy endpoints kept for backwards compatibility
        [HttpGet("metricas")]
        public async Task<ActionResult<DashboardCompletoDTO>> GetMetricas()
        {
            return await GetCompleto(null, null);
        }

        [HttpGet("resumen")]
        public async Task<ActionResult<dynamic>> GetResumen()
        {
            try
            {
                var resumen = new
                {
                    TotalClientes  = await _context.Clientes.CountAsync(c => c.Activo),
                    TotalCuentas   = await _context.Cuentas.CountAsync(c => c.Activo),
                    TotalServicios = await _context.Servicios.CountAsync(s => s.Activo),
                    TotalUsuarios  = await _context.Usuarios.CountAsync(u => u.Activo)
                };
                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener resumen", error = ex.Message });
            }
        }
    }
}
