/**
 * reportGenerator.js
 * Generates professional PDF and Excel reports from Dashboard data.
 * Timezone: America/Managua (UTC-6, no DST)
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

/** Format number as currency C$ */
function fmt(n) {
  return `C$ ${Number(n ?? 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export function generatePDF(data, userName, periodoLabel) {
  const now  = manaTime();
  const name = buildFileName(now);
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW   = doc.internal.pageSize.getWidth();  // 210
  const MW   = PW - 28;  // usable table width (margin 14 each side)
  let   y    = 0;

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
   * @param {string[]} head    - Column headers
   * @param {any[][]}  body    - Row data (will be pdfSafe'd)
   * @param {object}   haligns - Map of column index → halign string, e.g. { 1: 'right', 2: 'center' }
   *
   * Width strategy: set tableWidth = MW so autoTable auto-distributes the total
   * width using the SAME algorithm for both header and body cells.  This is the
   * only way to guarantee column headers are always perfectly aligned with their
   * body cells.  Per-column cellWidth in columnStyles was removed because it
   * causes autoTable to apply different widths to header vs body rows.
   */
  const table = (head, body, haligns = {}) => {
    const colStyles = {};
    Object.entries(haligns).forEach(([k, v]) => { colStyles[k] = { halign: v }; });

    autoTable(doc, {
      startY: y,
      head:   [head.map(h => pdfSafe(h))],
      body:   safePdfRows(body),
      styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK, overflow: 'linebreak' },
      headStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin:      { left: 14, right: 14 },
      tableWidth:  MW,
      columnStyles: colStyles,
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.3,
    });
    y = (doc.lastAutoTable.finalY || y) + 6;
  };

  // ── 1. Financial KPIs ───────────────────────────────────────────────────────
  section('Indicadores Financieros del Periodo');
  table(
    ['Concepto', 'Monto'],
    [
      ['Ingresos Totales',  fmt(data.totalIngresos)],
      ['Egresos Totales',   fmt(data.totalEgresos)],
      ['Ganancia Neta',     fmt(data.gananciaNeta)],
      [`Ventas (${data.totalVentasPeriodo} operaciones)`, fmt(data.montoVentasPeriodo)],
    ],
    { 1: 'right' }
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
    { 1: 'right' }
  );

  // ── 3. Account status ───────────────────────────────────────────────────────
  section('Estado de Cuentas');
  table(
    ['Estado', 'Cantidad'],
    (data.cuentasPorEstado || []).map(c => [c.estado, c.cantidad]),
    { 1: 'right' }
  );

  // ── 4. Ingresos vs Egresos ──────────────────────────────────────────────────
  if (data.ingresosEgresosChart?.length) {
    section('Ingresos vs Egresos vs Ganancia por Periodo');
    table(
      ['Periodo', 'Ingresos', 'Egresos', 'Ganancia'],
      data.ingresosEgresosChart.map(r => [
        r.periodo, fmt(r.ingresos), fmt(r.egresos), fmt(r.ganancia)
      ]),
      { 1: 'right', 2: 'right', 3: 'right' }
    );
  }

  // ── 5. Top services ─────────────────────────────────────────────────────────
  if (data.ventasPorServicio?.length) {
    section('Top Servicios por Ventas (Periodo)');
    table(
      ['Servicio', 'Ventas', 'Monto Total'],
      data.ventasPorServicio.map(s => [s.servicio, s.ventas, fmt(s.monto)]),
      { 1: 'right', 2: 'right' }
    );
  }

  // ── 6. Top clients ──────────────────────────────────────────────────────────
  if (data.topClientes?.length) {
    section('Top 5 Clientes');
    table(
      ['Cliente', 'No. Ventas', 'Monto Total'],
      data.topClientes.map(c => [c.nombre, c.totalVentas, fmt(c.totalMonto)]),
      { 1: 'right', 2: 'right' }
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
      { 2: 'center', 3: 'right' }
    );
  }

  // ── 8. Expired accounts ─────────────────────────────────────────────────────
  if (data.cuentasVencidasList?.length) {
    section('Cuentas Vencidas', RED_C);
    table(
      ['Codigo', 'Servicio', 'Vencio', 'Costo'],
      data.cuentasVencidasList.map(c => [
        c.codigoCuenta, c.servicio, safeDate(c.fechaFinalizacion), fmt(c.costo)
      ]),
      { 2: 'center', 3: 'right' }
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
      { 2: 'center', 3: 'right' }
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

export async function generateExcel(data, userName, periodoLabel) {
  const now  = manaTime();
  const name = buildFileName(now);
  const meta = metaRows(userName, now, periodoLabel);

  // ── Sheet 1: Resumen ────────────────────────────────────────────────────────
  const resumen = [
    ...meta,
    [{ value: 'Indicadores Financieros del Período', ...LABEL_STYLE, span: 2 }],
    [
      { value: 'Concepto', ...HEADER_STYLE },
      { value: 'Monto', ...HEADER_STYLE },
    ],
    [{ value: 'Ingresos Totales', ...LABEL_STYLE }, { value: data.totalIngresos ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE }],
    [{ value: 'Egresos Totales',  ...LABEL_STYLE }, { value: data.totalEgresos  ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE }],
    [{ value: 'Ganancia Neta',    ...LABEL_STYLE }, { value: data.gananciaNeta  ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE }],
    [{ value: `Ventas (${data.totalVentasPeriodo} operaciones)`, ...LABEL_STYLE }, { value: data.montoVentasPeriodo ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE }],
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
      { value: 'Período',   ...HEADER_STYLE },
      { value: 'Ingresos',  ...HEADER_STYLE },
      { value: 'Egresos',   ...HEADER_STYLE },
      { value: 'Ganancia',  ...HEADER_STYLE },
    ],
    ...(data.ingresosEgresosChart || []).map(r => [
      { value: r.periodo,       ...LABEL_STYLE },
      { value: r.ingresos ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE },
      { value: r.egresos  ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE },
      { value: r.ganancia ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE },
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
      { value: s.monto   ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE },
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
      { value: c.totalMonto  ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE },
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
      { value: c.costo ?? 0, format: '"C$"#,##0.00', ...VALUE_STYLE },
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
