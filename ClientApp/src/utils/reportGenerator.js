/**
 * reportGenerator.js
 * Generates professional PDF and Excel reports from Dashboard data.
 * Timezone: America/Managua (UTC-6, no DST)
 */

import jsPDF from 'jspdf';
import writeXlsxFile from 'write-excel-file/browser';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a Date object adjusted to America/Managua local time */
function manaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Managua' }));
}

/** Format: 07/03/2026 */
function fmtDate(d) {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format: 01:05:30 PM */
function fmtTime12(d) {
  let h = d.getHours();
  const min  = String(d.getMinutes()).padStart(2, '0');
  const sec  = String(d.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min}:${sec} ${ampm}`;
}

/** Build a safe filename: reporte_YYYYMMDD_HHmmss */
function buildFileName(d) {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  const ss   = String(d.getSeconds()).padStart(2, '0');
  return `reporte_${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

/** Format number as currency – symbol driven by the active filter */
function fmt(n, symbol) {
  const s = symbol || 'C$';
  return `${s} ${Number(n ?? 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Null-safe date string — always includes day/month/year.
 * Uses explicit options so the locale can't drop the year.
 */
function safeDate(v) {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('es-NI', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
}

/**
 * jsPDF's built-in Helvetica font cannot render emoji characters or many
 * extended-Latin glyphs — they appear as hollow rectangles ("weird symbols").
 * This helper strips emoji (Unicode ranges) and transliterates the most common
 * accented characters to their ASCII equivalents for PDF output only.
 * Excel does NOT need this — write-excel-file handles full Unicode.
 */
function pdfSafe(str) {
  if (!str && str !== 0) return '-';
  return String(str)
    // Remove emoji (broad Unicode ranges that Helvetica can't render)
    .replace(/[\u{1F300}-\u{1FFFF}|\u{2600}-\u{27FF}|\u{2B00}-\u{2BFF}|\u{FE00}-\u{FEFF}]/gu, '')
    // Transliterate common accented chars
    .replace(/[áàâä]/gi, (c) => (c === c.toUpperCase() ? 'A' : 'a'))
    .replace(/[éèêë]/gi, (c) => (c === c.toUpperCase() ? 'E' : 'e'))
    .replace(/[íìîï]/gi, (c) => (c === c.toUpperCase() ? 'I' : 'i'))
    .replace(/[óòôö]/gi, (c) => (c === c.toUpperCase() ? 'O' : 'o'))
    .replace(/[úùûü]/gi, (c) => (c === c.toUpperCase() ? 'U' : 'u'))
    .replace(/[ñ]/g, 'n')
    .replace(/[Ñ]/g, 'N')
    // Trim leftover whitespace that might be left after emoji removal
    .trim();
}

/**
 * Apply pdfSafe to every cell in a table body row array.
 */
function safePdfRows(rows) {
  return rows.map(row => row.map(cell => pdfSafe(cell)));
}

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BRAND   = [37, 99, 235];  // blue-600
const DARK    = [17, 24, 39];   // gray-900
const GRAY    = [107, 114, 128];
const WHITE   = [255, 255, 255];
const LIGHT   = [243, 244, 246];
const RED_C   = [220, 38, 38];
const ORANGE  = [234, 88, 12];

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function generatePDF(data, userName, periodoLabel, currencyFilter) {
  const now    = manaTime();
  const name   = buildFileName(now);
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW     = doc.internal.pageSize.getWidth();  // 210
  const MW     = PW - 28;  // usable table width (margin 14 each side)
  let   y      = 0;
  const symbol = currencyFilter || 'C$';

  // Resolve per-currency KPIs for the chosen filter
  const filtIngresos = (data.ingresosPerMoneda ?? []).find(m => m.moneda === symbol)?.total ?? 0;
  const filtEgresos  = (data.egresosPerMoneda  ?? []).find(m => m.moneda === symbol)?.total ?? 0;
  const filtGanancia = filtIngresos - filtEgresos;
  const filtVentas   = (data.ventasPerMoneda   ?? []).find(m => m.moneda === symbol);
  const filtVentasCnt = filtVentas?.cantidad ?? 0;
  const filtVentasMnt = filtVentas?.monto    ?? 0;

  // Resolve currency-specific chart data
  const filtChart = symbol === '$'
    ? (data.ingresosEgresosChartUsd ?? [])
    : (data.ingresosEgresosChartCs  ?? []);

  // Safe versions of meta strings for Helvetica encoding
  const safeUser   = pdfSafe(userName);
  const safePeriod = pdfSafe(periodoLabel);

  // ── Branded header ─────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PW, 28, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('STREAMDOOR', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestion de Cuentas de Streaming', 14, 19);

  doc.setFontSize(8);
  doc.text(`Generado el ${fmtDate(now)} a las ${fmtTime12(now)}  |  Usuario: ${safeUser}`, 14, 25.5);

  // Right side: period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(safePeriod, PW - 14, 19, { align: 'right' });

  y = 36;

  // ── Section helper ──────────────────────────────────────────────────────────
  const section = (title, fillColor = BRAND) => {
    if (y > 260) { doc.addPage(); y = 14; }
    doc.setFillColor(...fillColor);
    doc.roundedRect(14, y, MW, 7, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(pdfSafe(title), 17, y + 4.8);
    doc.setTextColor(...DARK);
    y += 10;
  };

  /**
   * Draws a table using raw jsPDF primitives so header and body columns share
   * the exact same x positions — no third-party layout engine, no alignment drift.
   *
   * @param {string[]} head    - Column headers
   * @param {any[][]}  body    - Row data (will be pdfSafe'd automatically)
   * @param {object}   haligns - { colIndex: 'left'|'center'|'right' }
   * @param {number[]} ratios  - Relative widths per column (default: equal).
   */
  const table = (head, body, haligns = {}, ratios = null) => {
    const n   = head.length;
    const r   = ratios || new Array(n).fill(1);
    const tR  = r.reduce((a, b) => a + b, 0);
    const LX  = 14;             // left page margin (mm)

    // Integer widths that sum exactly to MW
    const widths = r.map(v => Math.floor(MW * v / tR));
    widths[n - 1] = MW - widths.slice(0, n - 1).reduce((a, b) => a + b, 0);

    // Left-edge x for each column — computed ONCE, shared by header AND body
    const xs = [];
    let cx = LX;
    for (let i = 0; i < n; i++) { xs.push(cx); cx += widths[i]; }

    const ROW_H = 7.5;   // row height in mm
    const BASE  = 5.2;   // text baseline from top of row  (8 pt ≈ 2.8 mm, visually centred)
    const HP    = 2.5;   // horizontal padding inside each cell

    // Truncate + ellipsis so text never overflows its cell
    const clip = (txt, w) => {
      doc.setFontSize(8);
      const s   = String(txt ?? '-');
      const max = w - HP * 2;
      if (doc.getTextWidth(s) <= max) return s;
      let t = s;
      while (t.length > 1 && doc.getTextWidth(t + '..') > max) t = t.slice(0, -1);
      return t + '..';
    };

    // Draw one row at the current y; handles page-break automatically
    const drawRow = (cells, bold, fill) => {
      if (y + ROW_H > 283) { doc.addPage(); y = 14; }
      if (fill) { doc.setFillColor(...fill); doc.rect(LX, y, MW, ROW_H, 'F'); }
      doc.setFontSize(8);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...DARK);
      for (let i = 0; i < n; i++) {
        const al = haligns[i] || 'left';
        const tx = clip(cells[i], widths[i]);
        if      (al === 'right')  doc.text(tx, xs[i] + widths[i] - HP, y + BASE, { align: 'right' });
        else if (al === 'center') doc.text(tx, xs[i] + widths[i] / 2,  y + BASE, { align: 'center' });
        else                      doc.text(tx, xs[i] + HP,              y + BASE);
      }
      // Bottom border
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(LX, y + ROW_H, LX + MW, y + ROW_H);
      y += ROW_H;
    };

    // Top border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(LX, y, LX + MW, y);

    // Header row
    drawRow(head.map(h => pdfSafe(h)), true, LIGHT);

    // Body rows
    safePdfRows(body).forEach((rowCells, ri) =>
      drawRow(rowCells, false, ri % 2 === 1 ? [249, 250, 251] : null)
    );

    y += 6;
  };

  // ── 1. Financial KPIs ───────────────────────────────────────────────────────
  section('Indicadores Financieros del Periodo');
  table(
    ['Concepto', 'Monto'],
    [
      [`Ingresos (${symbol})`,                          fmt(filtIngresos, symbol)],
      [`Egresos (${symbol})`,                           fmt(filtEgresos,  symbol)],
      [`Ganancia Neta (${symbol})`,                     fmt(filtGanancia, symbol)],
      [`Ventas (${filtVentasCnt} operaciones) (${symbol})`, fmt(filtVentasMnt, symbol)],
    ],
    { 1: 'right' },
    [3, 1]
  );

  // ── 2. Global KPIs ──────────────────────────────────────────────────────────
  section('Indicadores Globales');
  table(
    ['Categoria', 'Total'],
    [
      ['Clientes Activos',         data.totalClientes],
      ['Cuentas Activas',          data.totalCuentas],
      ['Correos Registrados',      data.totalCorreos],
      ['Servicios',                data.totalServicios],
      ['Medios de Pago',           data.totalMediosPago],
      ['Renovaciones Pendientes',  data.renovacionesPendientes],
    ],
    { 1: 'right' },
    [3, 1]
  );

  // ── 3. Account status ───────────────────────────────────────────────────────
  section('Estado de Cuentas');
  table(
    ['Estado', 'Cantidad'],
    (data.cuentasPorEstado || []).map(c => [c.estado, c.cantidad]),
    { 1: 'right' },
    [3, 1]
  );

  // ── 4. Ingresos vs Egresos ──────────────────────────────────────────────────
  if (filtChart?.length) {
    section(`Ingresos vs Egresos vs Ganancia por Periodo (${symbol})`);
    table(
      ['Periodo', `Ingresos (${symbol})`, `Egresos (${symbol})`, `Ganancia (${symbol})`],
      filtChart.map(r => [
        r.periodo, fmt(r.ingresos, symbol), fmt(r.egresos, symbol), fmt(r.ganancia, symbol)
      ]),
      { 1: 'right', 2: 'right', 3: 'right' },
      [1, 1, 1, 1]
    );
  }

  // ── 5. Top services ─────────────────────────────────────────────────────────
  if (data.ventasPorServicio?.length) {
    section('Top Servicios por Ventas (Periodo)');
    table(
      ['Servicio', 'Ventas', 'Monto Total'],
      data.ventasPorServicio.map(s => [s.servicio, s.ventas, fmt(s.monto, symbol)]),
      { 1: 'right', 2: 'right' },
      [2, 1, 1]
    );
  }

  // ── 6. Top clients ──────────────────────────────────────────────────────────
  if (data.topClientes?.length) {
    section('Top 5 Clientes');
    table(
      ['Cliente', 'No. Ventas', 'Monto Total'],
      data.topClientes.map(c => [c.nombre, c.totalVentas, fmt(c.totalMonto, symbol)]),
      { 1: 'right', 2: 'right' },
      [2, 1, 1]
    );
  }

  // ── 7. Upcoming expiry ──────────────────────────────────────────────────────
  if (data.cuentasProximasVencerList?.length) {
    section('Cuentas Proximas a Vencer', ORANGE);
    table(
      ['Codigo', 'Servicio', 'Vencimiento', 'Dias Restantes'],
      data.cuentasProximasVencerList.map(c => [
        c.codigoCuenta, c.servicio, safeDate(c.fechaFinalizacion), c.diasRestantes ?? '-'
      ]),
      { 2: 'center', 3: 'right' },
      [1, 2, 1, 0.5]
    );
  }

  // ── 8. Expired accounts ─────────────────────────────────────────────────────
  if (data.cuentasVencidasList?.length) {
    section('Cuentas Vencidas', RED_C);
    table(
      ['Codigo', 'Servicio', 'Vencio', 'Costo'],
      data.cuentasVencidasList.map(c => [
        c.codigoCuenta, c.servicio, safeDate(c.fechaFinalizacion), fmt(c.costo, symbol)
      ]),
      { 2: 'center', 3: 'right' },
      [1, 2, 1, 0.5]
    );
  }

  // ── 9. Sales expiring this week ─────────────────────────────────────────────
  if (data.ventasProximasVencer?.length) {
    section('Ventas que Vencen Esta Semana', [202, 138, 4]);
    table(
      ['Cliente', 'Servicio', 'Vencimiento', 'Dias'],
      data.ventasProximasVencer.map(v => [
        v.cliente, v.servicio, safeDate(v.fechaFin), v.diasRestantes
      ]),
      { 2: 'center', 3: 'right' },
      [1.5, 1.5, 1, 0.5]
    );
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFillColor(...LIGHT);
    doc.rect(0, 285, PW, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('STREAMDOOR - Sistema de Gestion de Cuentas de Streaming', 14, 291);
    doc.text(`Pagina ${p} de ${total}`, PW - 14, 291, { align: 'right' });
  }

  doc.save(`${name}.pdf`);
}

// ─── Excel ────────────────────────────────────────────────────────────────────

const HEADER_STYLE = {
  backgroundColor: '#2563EB',
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: 10,
  align: 'center',
  borderStyle: 'thin',
  borderColor: '#1D4ED8',
};

const LABEL_STYLE = {
  fontWeight: 'bold',
  fontSize: 10,
  color: '#111827',
};

const VALUE_STYLE = {
  fontSize: 10,
  align: 'right',
};

const TITLE_STYLE = {
  fontWeight: 'bold',
  fontSize: 13,
  color: '#1D4ED8',
};

const META_STYLE = {
  fontSize: 9,
  color: '#6B7280',
  italic: true,
};

/** Build shared meta rows for every sheet */
function metaRows(userName, now, periodoLabel) {
  return [
    [{ value: 'STREAMDOOR — Sistema de Gestión de Cuentas de Streaming', ...TITLE_STYLE, span: 4 }],
    [{ value: `Período: ${periodoLabel}`, ...META_STYLE, span: 4 }],
    [{ value: `Generado: ${fmtDate(now)} ${fmtTime12(now)} (Managua, Nicaragua)  |  Usuario: ${userName}`, ...META_STYLE, span: 4 }],
    [],
  ];
}

export async function generateExcel(data, userName, periodoLabel, currencyFilter) {
  const now    = manaTime();
  const name   = buildFileName(now);
  const meta   = metaRows(userName, now, periodoLabel);
  const symbol = currencyFilter || 'C$';

  // Resolve per-currency KPIs
  const filtIngresos  = (data.ingresosPerMoneda ?? []).find(m => m.moneda === symbol)?.total ?? 0;
  const filtEgresos   = (data.egresosPerMoneda  ?? []).find(m => m.moneda === symbol)?.total ?? 0;
  const filtGanancia  = filtIngresos - filtEgresos;
  const filtVentas    = (data.ventasPerMoneda   ?? []).find(m => m.moneda === symbol);
  const filtVentasCnt = filtVentas?.cantidad ?? 0;
  const filtVentasMnt = filtVentas?.monto    ?? 0;

  // Resolve currency-specific chart
  const filtChart = symbol === '$'
    ? (data.ingresosEgresosChartUsd ?? [])
    : (data.ingresosEgresosChartCs  ?? []);

  // Sanitize symbol to safe characters only (prevent unexpected Excel format injection)
  const safeSymbol = /^[A-Za-z$€£¥₡]+$/.test(symbol) ? symbol : 'C$';
  // Build Excel number format string for the chosen currency symbol
  const moneyFmt = `"${safeSymbol}"#,##0.00`;

  // ── Sheet 1: Resumen ────────────────────────────────────────────────────────
  const resumen = [
    ...meta,
    [{ value: `Indicadores Financieros del Período (${symbol})`, ...LABEL_STYLE, span: 2 }],
    [
      { value: 'Concepto', ...HEADER_STYLE },
      { value: 'Monto', ...HEADER_STYLE },
    ],
    [{ value: `Ingresos (${symbol})`, ...LABEL_STYLE }, { value: filtIngresos, format: moneyFmt, ...VALUE_STYLE }],
    [{ value: `Egresos (${symbol})`,  ...LABEL_STYLE }, { value: filtEgresos,  format: moneyFmt, ...VALUE_STYLE }],
    [{ value: `Ganancia Neta (${symbol})`, ...LABEL_STYLE }, { value: filtGanancia, format: moneyFmt, ...VALUE_STYLE }],
    [{ value: `Ventas (${filtVentasCnt} operaciones) (${symbol})`, ...LABEL_STYLE }, { value: filtVentasMnt, format: moneyFmt, ...VALUE_STYLE }],
    [],
    [{ value: 'Indicadores Globales', ...LABEL_STYLE, span: 2 }],
    [{ value: 'Categoría', ...HEADER_STYLE }, { value: 'Total', ...HEADER_STYLE }],
    [{ value: 'Clientes Activos',        ...LABEL_STYLE }, { value: data.totalClientes         ?? 0, ...VALUE_STYLE }],
    [{ value: 'Cuentas Activas',         ...LABEL_STYLE }, { value: data.totalCuentas          ?? 0, ...VALUE_STYLE }],
    [{ value: 'Correos Registrados',     ...LABEL_STYLE }, { value: data.totalCorreos          ?? 0, ...VALUE_STYLE }],
    [{ value: 'Servicios',               ...LABEL_STYLE }, { value: data.totalServicios        ?? 0, ...VALUE_STYLE }],
    [{ value: 'Medios de Pago',          ...LABEL_STYLE }, { value: data.totalMediosPago       ?? 0, ...VALUE_STYLE }],
    [{ value: 'Renovaciones Pendientes', ...LABEL_STYLE }, { value: data.renovacionesPendientes ?? 0, ...VALUE_STYLE }],
    [],
    [{ value: 'Estado de Cuentas', ...LABEL_STYLE, span: 2 }],
    [{ value: 'Estado', ...HEADER_STYLE }, { value: 'Cantidad', ...HEADER_STYLE }],
    ...(data.cuentasPorEstado || []).map(c => [
      { value: c.estado,    ...LABEL_STYLE },
      { value: c.cantidad ?? 0, ...VALUE_STYLE },
    ]),
  ];

  // ── Sheet 2: Ingresos vs Egresos ────────────────────────────────────────────
  const chart = [
    ...meta,
    [
      { value: 'Período',                    ...HEADER_STYLE },
      { value: `Ingresos (${symbol})`,       ...HEADER_STYLE },
      { value: `Egresos (${symbol})`,        ...HEADER_STYLE },
      { value: `Ganancia (${symbol})`,       ...HEADER_STYLE },
    ],
    ...filtChart.map(r => [
      { value: r.periodo,       ...LABEL_STYLE },
      { value: r.ingresos ?? 0, format: moneyFmt, ...VALUE_STYLE },
      { value: r.egresos  ?? 0, format: moneyFmt, ...VALUE_STYLE },
      { value: r.ganancia ?? 0, format: moneyFmt, ...VALUE_STYLE },
    ]),
  ];

  // ── Sheet 3: Servicios ──────────────────────────────────────────────────────
  const servicios = [
    ...meta,
    [
      { value: 'Servicio',    ...HEADER_STYLE },
      { value: 'N° Ventas',   ...HEADER_STYLE },
      { value: 'Monto Total', ...HEADER_STYLE },
    ],
    ...(data.ventasPorServicio || []).map(s => [
      { value: s.servicio,     ...LABEL_STYLE },
      { value: s.ventas  ?? 0, ...VALUE_STYLE },
      { value: s.monto   ?? 0, format: moneyFmt, ...VALUE_STYLE },
    ]),
  ];

  // ── Sheet 4: Top Clientes ───────────────────────────────────────────────────
  const clientes = [
    ...meta,
    [
      { value: 'Cliente',     ...HEADER_STYLE },
      { value: 'N° Ventas',   ...HEADER_STYLE },
      { value: 'Monto Total', ...HEADER_STYLE },
    ],
    ...(data.topClientes || []).map(c => [
      { value: c.nombre,        ...LABEL_STYLE },
      { value: c.totalVentas ?? 0, ...VALUE_STYLE },
      { value: c.totalMonto  ?? 0, format: moneyFmt, ...VALUE_STYLE },
    ]),
  ];

  // ── Sheet 5: Alertas ────────────────────────────────────────────────────────
  const alertas = [
    ...meta,
    [{ value: 'Cuentas Próximas a Vencer', ...LABEL_STYLE, span: 4 }],
    [
      { value: 'Código',          ...HEADER_STYLE },
      { value: 'Servicio',        ...HEADER_STYLE },
      { value: 'Vencimiento',     ...HEADER_STYLE },
      { value: 'Días Restantes',  ...HEADER_STYLE },
    ],
    ...(data.cuentasProximasVencerList || []).map(c => [
      { value: c.codigoCuenta,                               ...LABEL_STYLE },
      { value: c.servicio,                                   ...LABEL_STYLE },
      { value: safeDate(c.fechaFinalizacion), ...LABEL_STYLE },
      { value: c.diasRestantes ?? 0,         ...VALUE_STYLE },
    ]),
    [],
    [{ value: 'Cuentas Vencidas', ...LABEL_STYLE, span: 4 }],
    [
      { value: 'Código',    ...HEADER_STYLE },
      { value: 'Servicio',  ...HEADER_STYLE },
      { value: 'Venció',    ...HEADER_STYLE },
      { value: 'Costo',     ...HEADER_STYLE },
    ],
    ...(data.cuentasVencidasList || []).map(c => [
      { value: c.codigoCuenta,                        ...LABEL_STYLE },
      { value: c.servicio,                            ...LABEL_STYLE },
      { value: safeDate(c.fechaFinalizacion),         ...LABEL_STYLE },
      { value: c.costo ?? 0, format: moneyFmt, ...VALUE_STYLE },
    ]),
    [],
    [{ value: 'Ventas que Vencen Esta Semana', ...LABEL_STYLE, span: 4 }],
    [
      { value: 'Cliente',     ...HEADER_STYLE },
      { value: 'Servicio',    ...HEADER_STYLE },
      { value: 'Vencimiento', ...HEADER_STYLE },
      { value: 'Días',        ...HEADER_STYLE },
    ],
    ...(data.ventasProximasVencer || []).map(v => [
      { value: v.cliente,              ...LABEL_STYLE },
      { value: v.servicio,             ...LABEL_STYLE },
      { value: safeDate(v.fechaFin),   ...LABEL_STYLE },
      { value: v.diasRestantes ?? 0,   ...VALUE_STYLE },
    ]),
  ];

  await writeXlsxFile(
    [resumen, chart, servicios, clientes, alertas],
    {
      sheets: ['Resumen', 'Ingresos vs Egresos', 'Servicios', 'Top Clientes', 'Alertas'],
      fileName: `${name}.xlsx`,
      columns: [
        // Sheet 1 – Resumen: 2 columns
        [{ width: 42 }, { width: 22 }],
        // Sheet 2 – Ingresos vs Egresos: 4 columns
        [{ width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }],
        // Sheet 3 – Servicios: 3 columns
        [{ width: 35 }, { width: 15 }, { width: 22 }],
        // Sheet 4 – Top Clientes: 3 columns
        [{ width: 35 }, { width: 15 }, { width: 22 }],
        // Sheet 5 – Alertas: 4 columns
        [{ width: 16 }, { width: 35 }, { width: 22 }, { width: 18 }],
      ],
    }
  );
}
