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
                var inicio = sinFiltro ? new DateTime(1900, 1, 1) : (fechaInicio?.Date ?? hoy);
                var fin    = sinFiltro ? new DateTime(9999, 12, 31, 23, 59, 59) : ((fechaFin?.Date ?? hoy).AddDays(1).AddSeconds(-1));

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
                var cuentasOcupadas         = cuentasActivas.Count(c => c.Disponibilidad == "No Disponible");
                var cuentasVencidasCount    = cuentasActivas.Count(c => c.EstadoSuscripcion == "Vencida");
                var cuentasProximasCount    = cuentasActivas.Count(c => c.EstadoSuscripcion == "Próxima a Vencer");
                var renovacionesPendientes  = cuentasVencidasCount;

                // ── Gráfico ingresos vs egresos ──────────────────────────────
                var rangeDays = (fin.Date - inicio).TotalDays + 1;
                List<IngresoEgresoChartDTO> chartData;

                // Fetch full lists once — reused for combined chart, per-currency chart, and KPI totals
                var ingListAll = await _context.Ingresos
                    .Where(i => i.FechaCreacion >= inicio && i.FechaCreacion <= fin)
                    .ToListAsync();
                var egrListAll = await _context.Egresos
                    .Where(e => e.FechaCreacion >= inicio && e.FechaCreacion <= fin)
                    .ToListAsync();

                if (rangeDays <= MAX_DAYS_FOR_DAILY_GROUPING)
                {
                    // Agrupar por día
                    chartData = Enumerable.Range(0, (int)rangeDays)
                        .Select(d =>
                        {
                            var dia = inicio.AddDays(d).Date;
                            var ing = ingListAll.Where(i => i.FechaCreacion.Date == dia).Sum(i => i.Monto);
                            var egr = egrListAll.Where(e => e.FechaCreacion.Date == dia).Sum(e => e.Monto);
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
                    var months = ingListAll.Select(i => new { i.FechaCreacion.Year, i.FechaCreacion.Month })
                        .Union(egrListAll.Select(e => new { e.FechaCreacion.Year, e.FechaCreacion.Month }))
                        .Distinct()
                        .OrderBy(m => m.Year).ThenBy(m => m.Month)
                        .ToList();

                    // Fill in any months between the first and last months that have actual data.
                    // Using data-range boundaries avoids iterating millions of empty months when
                    // sinFiltro=true (which would set inicio=1900 and fin=9999).
                    var monthSet = new HashSet<(int Year, int Month)>(
                        months.Select(m => (m.Year, m.Month)));
                    if (months.Count > 0)
                    {
                        // months is already sorted — first/last give us the data boundaries
                        var firstMonth = months.First();
                        var lastMonth  = months.Last();
                        var cur  = new DateTime(firstMonth.Year, firstMonth.Month, 1);
                        var last = new DateTime(lastMonth.Year,  lastMonth.Month,  1);
                        while (cur <= last)
                        {
                            if (monthSet.Add((cur.Year, cur.Month)))
                                months.Add(new { cur.Year, cur.Month });
                            cur = cur.AddMonths(1);
                        }
                        months = months.OrderBy(m => m.Year).ThenBy(m => m.Month).ToList();
                    }

                    chartData = months.Select(m =>
                    {
                        var ing = ingListAll.Where(i => i.FechaCreacion.Year == m.Year && i.FechaCreacion.Month == m.Month).Sum(i => i.Monto);
                        var egr = egrListAll.Where(e => e.FechaCreacion.Year == m.Year && e.FechaCreacion.Month == m.Month).Sum(e => e.Monto);
                        return new IngresoEgresoChartDTO
                        {
                            Periodo  = new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"),
                            Ingresos = ing,
                            Egresos  = egr,
                            Ganancia = ing - egr
                        };
                    }).ToList();
                }

                // ── Per-currency KPI totals ───────────────────────────────────
                var ingresosPerMoneda = ingListAll
                    .GroupBy(i => i.Moneda)
                    .Select(g => new CierrePorMonedaDTO { Moneda = g.Key, Total = g.Sum(i => i.Monto) })
                    .OrderBy(g => g.Moneda)
                    .ToList();

                var egresosPerMoneda = egrListAll
                    .GroupBy(e => e.Moneda)
                    .Select(g => new CierrePorMonedaDTO { Moneda = g.Key, Total = g.Sum(e => e.Monto) })
                    .OrderBy(g => g.Moneda)
                    .ToList();

                // ── Per-currency chart data ───────────────────────────────────
                List<IngresoEgresoChartDTO> BuildChartForMoneda(string moneda)
                {
                    if (rangeDays <= MAX_DAYS_FOR_DAILY_GROUPING)
                    {
                        return Enumerable.Range(0, (int)rangeDays)
                            .Select(d =>
                            {
                                var dia = inicio.AddDays(d).Date;
                                var ing = ingListAll.Where(i => i.FechaCreacion.Date == dia && i.Moneda == moneda).Sum(i => i.Monto);
                                var egr = egrListAll.Where(e => e.FechaCreacion.Date == dia && e.Moneda == moneda).Sum(e => e.Monto);
                                return new IngresoEgresoChartDTO { Periodo = dia.ToString("dd/MM"), Ingresos = ing, Egresos = egr, Ganancia = ing - egr };
                            })
                            .ToList();
                    }
                    else
                    {
                        var months2 = ingListAll.Where(i => i.Moneda == moneda).Select(i => new { i.FechaCreacion.Year, i.FechaCreacion.Month })
                            .Union(egrListAll.Where(e => e.Moneda == moneda).Select(e => new { e.FechaCreacion.Year, e.FechaCreacion.Month }))
                            .Distinct().OrderBy(m => m.Year).ThenBy(m => m.Month).ToList();
                        var monthSet2 = new HashSet<(int Year, int Month)>(months2.Select(m => (m.Year, m.Month)));
                        if (months2.Count > 0)
                        {
                            var first2 = months2.First(); var last2 = months2.Last();
                            var cur2 = new DateTime(first2.Year, first2.Month, 1);
                            var end2 = new DateTime(last2.Year, last2.Month, 1);
                            while (cur2 <= end2)
                            {
                                if (monthSet2.Add((cur2.Year, cur2.Month))) months2.Add(new { cur2.Year, cur2.Month });
                                cur2 = cur2.AddMonths(1);
                            }
                            months2 = months2.OrderBy(m => m.Year).ThenBy(m => m.Month).ToList();
                        }
                        return months2.Select(m =>
                        {
                            var ing = ingListAll.Where(i => i.Moneda == moneda && i.FechaCreacion.Year == m.Year && i.FechaCreacion.Month == m.Month).Sum(i => i.Monto);
                            var egr = egrListAll.Where(e => e.Moneda == moneda && e.FechaCreacion.Year == m.Year && e.FechaCreacion.Month == m.Month).Sum(e => e.Monto);
                            return new IngresoEgresoChartDTO { Periodo = new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"), Ingresos = ing, Egresos = egr, Ganancia = ing - egr };
                        }).ToList();
                    }
                }

                var chartDataCs  = BuildChartForMoneda("C$");
                var chartDataUsd = BuildChartForMoneda("$");

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
                    DiasRestantes = (int)Math.Ceiling((v.FechaFin - hoy).TotalDays)
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
                    IngresosPerMoneda        = ingresosPerMoneda,
                    EgresosPerMoneda         = egresosPerMoneda,
                    IngresosEgresosChart     = chartData,
                    IngresosEgresosChartCs   = chartDataCs,
                    IngresosEgresosChartUsd  = chartDataUsd,
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
