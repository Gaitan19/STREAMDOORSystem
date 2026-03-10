using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STREAMDOORSystem.Data;
using STREAMDOORSystem.Models.DTOs;

namespace STREAMDOORSystem.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class CierreController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CierreController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/cierre?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
        [HttpGet]
        public async Task<ActionResult<CierreDTO>> GetCierre(
            [FromQuery] DateTime? fechaInicio,
            [FromQuery] DateTime? fechaFin)
        {
            var inicio = fechaInicio?.Date ?? DateTime.Now.Date;
            var fin = (fechaFin?.Date ?? DateTime.Now.Date).AddDays(1).AddSeconds(-1);

            // ── Ingresos ────────────────────────────────────────────────────
            var ingresos = await _context.Ingresos
                .Include(i => i.Venta)
                    .ThenInclude(v => v!.MedioPago)
                .Where(i => i.FechaCreacion >= inicio && i.FechaCreacion <= fin)
                .OrderByDescending(i => i.FechaCreacion)
                .ToListAsync();

            var ingresosManuales = ingresos
                .Where(i => i.VentaID == null)
                .Select(i => new CierreIngresoItemDTO
                {
                    IngresoID = i.IngresoID,
                    FechaCreacion = i.FechaCreacion,
                    Monto = i.Monto,
                    Descripcion = i.Descripcion,
                    Usuario = i.Usuario,
                    VentaID = i.VentaID,
                    MedioPago = null
                })
                .ToList();

            var ingresosVentas = ingresos.Where(i => i.VentaID != null).ToList();

            var ventasPorMedioPago = ingresosVentas
                .GroupBy(i => i.Venta?.MedioPago?.Nombre ?? "Sin Medio de Pago")
                .Select(g => new CierreIngresosPorMedioPagoDTO
                {
                    MedioPago = g.Key,
                    Cantidad = g.Count(),
                    Total = g.Sum(i => i.Monto),
                    Items = g.Select(i => new CierreIngresoItemDTO
                    {
                        IngresoID = i.IngresoID,
                        FechaCreacion = i.FechaCreacion,
                        Monto = i.Monto,
                        Descripcion = i.Descripcion,
                        Usuario = i.Usuario,
                        VentaID = i.VentaID,
                        MedioPago = i.Venta?.MedioPago?.Nombre
                    }).OrderByDescending(i => i.FechaCreacion).ToList()
                })
                .OrderByDescending(g => g.Total)
                .ToList();

            var totalManualesIngresos = ingresosManuales.Sum(i => i.Monto);
            var totalVentasIngresos = ingresosVentas.Sum(i => i.Monto);

            var cierreIngresos = new CierreIngresosDTO
            {
                Manuales = ingresosManuales,
                TotalManuales = totalManualesIngresos,
                VentasPorMedioPago = ventasPorMedioPago,
                TotalVentas = totalVentasIngresos,
                Total = totalManualesIngresos + totalVentasIngresos
            };

            // ── Egresos ─────────────────────────────────────────────────────
            var egresos = await _context.Egresos
                .Where(e => e.FechaCreacion >= inicio && e.FechaCreacion <= fin)
                .OrderByDescending(e => e.FechaCreacion)
                .ToListAsync();

            var egresosManuales = egresos
                .Where(e => e.CuentaID == null)
                .Select(e => new CierreEgresoItemDTO
                {
                    EgresoID = e.EgresoID,
                    FechaCreacion = e.FechaCreacion,
                    Monto = e.Monto,
                    Descripcion = e.Descripcion,
                    Usuario = e.Usuario,
                    CuentaID = e.CuentaID
                })
                .ToList();

            var egresosCreacion = egresos
                .Where(e => e.CuentaID != null && (e.Descripcion?.Contains("adquisici", StringComparison.OrdinalIgnoreCase) ?? false))
                .Select(e => new CierreEgresoItemDTO
                {
                    EgresoID = e.EgresoID,
                    FechaCreacion = e.FechaCreacion,
                    Monto = e.Monto,
                    Descripcion = e.Descripcion,
                    Usuario = e.Usuario,
                    CuentaID = e.CuentaID
                })
                .ToList();

            var egresosRenovacion = egresos
                .Where(e => e.CuentaID != null && (e.Descripcion?.Contains("renovaci", StringComparison.OrdinalIgnoreCase) ?? false))
                .Select(e => new CierreEgresoItemDTO
                {
                    EgresoID = e.EgresoID,
                    FechaCreacion = e.FechaCreacion,
                    Monto = e.Monto,
                    Descripcion = e.Descripcion,
                    Usuario = e.Usuario,
                    CuentaID = e.CuentaID
                })
                .ToList();

            // Egresos de cuentas that don't fit the above patterns — include in creation group
            var egresosOtrosCuentas = egresos
                .Where(e => e.CuentaID != null
                    && !(e.Descripcion?.Contains("adquisici", StringComparison.OrdinalIgnoreCase) ?? false)
                    && !(e.Descripcion?.Contains("renovaci", StringComparison.OrdinalIgnoreCase) ?? false))
                .Select(e => new CierreEgresoItemDTO
                {
                    EgresoID = e.EgresoID,
                    FechaCreacion = e.FechaCreacion,
                    Monto = e.Monto,
                    Descripcion = e.Descripcion,
                    Usuario = e.Usuario,
                    CuentaID = e.CuentaID
                })
                .ToList();

            // Merge uncategorized account egresos into the creation group
            egresosCreacion.AddRange(egresosOtrosCuentas);

            var totalManualesEgresos = egresosManuales.Sum(e => e.Monto);
            var totalCreacionEgresos = egresosCreacion.Sum(e => e.Monto);
            var totalRenovacionEgresos = egresosRenovacion.Sum(e => e.Monto);

            var cierreEgresos = new CierreEgresosDTO
            {
                Manuales = egresosManuales,
                TotalManuales = totalManualesEgresos,
                CreacionCuentas = egresosCreacion,
                TotalCreacion = totalCreacionEgresos,
                RenovacionCuentas = egresosRenovacion,
                TotalRenovacion = totalRenovacionEgresos,
                Total = totalManualesEgresos + totalCreacionEgresos + totalRenovacionEgresos
            };

            var cierre = new CierreDTO
            {
                FechaInicio = inicio,
                FechaFin = fin.Date,
                Ingresos = cierreIngresos,
                Egresos = cierreEgresos,
                GananciaNeta = cierreIngresos.Total - cierreEgresos.Total
            };

            return Ok(cierre);
        }
    }
}
