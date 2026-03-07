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
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Format: 01:05:30 PM */
function fmtTime12(d) {
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
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

/** Null-safe date string */
function safeDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-NI');
}

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BRAND   = [37, 99, 235];  // blue-600
const DARK    = [17, 24, 39];   // gray-900
const GRAY    = [107, 114, 128];
const WHITE   = [255, 255, 255];
const LIGHT   = [243, 244, 246];
const GREEN   = [5, 150, 105];
const RED_C   = [220, 38, 38];
const ORANGE  = [234, 88, 12];

// ─── PDF ──────────────────────────────────────────────────────────────────────

export function generatePDF(data, userName, periodoLabel) {
  const now  = manaTime();
  const name = buildFileName(now);
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW   = doc.internal.pageSize.getWidth();  // 210
  let   y    = 0;

  // ── Branded header ─────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PW, 28, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('STREAMDOOR', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión de Cuentas de Streaming', 14, 19);

  doc.setFontSize(8);
  doc.text(`Generado el ${fmtDate(now)} a las ${fmtTime12(now)}  |  Usuario: ${userName}`, 14, 25.5);

  // Right side: period
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(periodoLabel, PW - 14, 19, { align: 'right' });

  y = 36;

  // ── Section helper ──────────────────────────────────────────────────────────
  const section = (title, fillColor = BRAND) => {
    if (y > 260) { doc.addPage(); y = 14; }
    doc.setFillColor(...fillColor);
    doc.roundedRect(14, y, PW - 28, 7, 1, 1, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, 17, y + 4.8);
    doc.setTextColor(...DARK);
    y += 10;
  };

  const table = (head, body, colWidths) => {
    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      styles: { fontSize: 8, cellPadding: 2.5, textColor: DARK },
      headStyles: { fillColor: LIGHT, textColor: DARK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
      columnStyles: colWidths || {},
      tableLineColor: [229, 231, 235],
      tableLineWidth: 0.3,
    });
    y = (doc.lastAutoTable.finalY || y) + 6;
  };

  // ── 1. Financial KPIs ───────────────────────────────────────────────────────
  section('📊 Indicadores Financieros del Período');
  table(
    ['Concepto', 'Monto'],
    [
      ['Ingresos Totales',  fmt(data.totalIngresos)],
      ['Egresos Totales',   fmt(data.totalEgresos)],
      ['Ganancia Neta',     fmt(data.gananciaNeta)],
      [`Ventas (${data.totalVentasPeriodo} operaciones)`, fmt(data.montoVentasPeriodo)],
    ],
    { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' } }
  );

  // ── 2. Global KPIs ──────────────────────────────────────────────────────────
  section('🌐 Indicadores Globales');
  table(
    ['Categoría', 'Total'],
    [
      ['Clientes Activos',   data.totalClientes],
      ['Cuentas Activas',    data.totalCuentas],
      ['Correos Registrados', data.totalCorreos],
      ['Servicios',          data.totalServicios],
      ['Medios de Pago',     data.totalMediosPago],
      ['Renovaciones Pendientes', data.renovacionesPendientes],
    ],
    { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' } }
  );

  // ── 3. Account status ───────────────────────────────────────────────────────
  section('🗂️ Estado de Cuentas');
  table(
    ['Estado', 'Cantidad'],
    (data.cuentasPorEstado || []).map(c => [c.estado, c.cantidad]),
    { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' } }
  );

  // ── 4. Ingresos vs Egresos ──────────────────────────────────────────────────
  if (data.ingresosEgresosChart?.length) {
    section('📈 Ingresos vs Egresos vs Ganancia por Período');
    table(
      ['Período', 'Ingresos', 'Egresos', 'Ganancia'],
      data.ingresosEgresosChart.map(r => [
        r.periodo, fmt(r.ingresos), fmt(r.egresos), fmt(r.ganancia)
      ]),
      { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    );
  }

  // ── 5. Top services ─────────────────────────────────────────────────────────
  if (data.ventasPorServicio?.length) {
    section('🏆 Top Servicios por Ventas (Período)');
    table(
      ['Servicio', 'Ventas', 'Monto Total'],
      data.ventasPorServicio.map(s => [s.servicio, s.ventas, fmt(s.monto)]),
      { 1: { halign: 'right' }, 2: { halign: 'right' } }
    );
  }

  // ── 6. Top clients ──────────────────────────────────────────────────────────
  if (data.topClientes?.length) {
    section('👥 Top 5 Clientes');
    table(
      ['Cliente', 'N° Ventas', 'Monto Total'],
      data.topClientes.map(c => [c.nombre, c.totalVentas, fmt(c.totalMonto)]),
      { 1: { halign: 'right' }, 2: { halign: 'right' } }
    );
  }

  // ── 7. Upcoming expiry ──────────────────────────────────────────────────────
  if (data.cuentasProximasVencerList?.length) {
    section('⚠️ Cuentas Próximas a Vencer', ORANGE);
    table(
      ['Código', 'Servicio', 'Vencimiento', 'Días Restantes'],
      data.cuentasProximasVencerList.map(c => [
        c.codigoCuenta, c.servicio, safeDate(c.fechaFinalizacion), c.diasRestantes ?? '—'
      ]),
      { 2: { halign: 'center' }, 3: { halign: 'right' } }
    );
  }

  // ── 8. Expired accounts ─────────────────────────────────────────────────────
  if (data.cuentasVencidasList?.length) {
    section('🔴 Cuentas Vencidas', RED_C);
    table(
      ['Código', 'Servicio', 'Venció', 'Costo'],
      data.cuentasVencidasList.map(c => [
        c.codigoCuenta, c.servicio, safeDate(c.fechaFinalizacion), fmt(c.costo)
      ]),
      { 2: { halign: 'center' }, 3: { halign: 'right' } }
    );
  }

  // ── 9. Sales expiring this week ─────────────────────────────────────────────
  if (data.ventasProximasVencer?.length) {
    section('🛒 Ventas que Vencen Esta Semana', [202, 138, 4]);
    table(
      ['Cliente', 'Servicio', 'Vencimiento', 'Días'],
      data.ventasProximasVencer.map(v => [
        v.cliente, v.servicio, safeDate(v.fechaFin), v.diasRestantes
      ]),
      { 2: { halign: 'center' }, 3: { halign: 'right' } }
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
    doc.text('STREAMDOOR — Sistema de Gestión de Cuentas de Streaming', 14, 291);
    doc.text(`Página ${p} de ${total}`, PW - 14, 291, { align: 'right' });
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
      { value: c.fechaFinalizacion ? new Date(c.fechaFinalizacion).toLocaleDateString('es-NI') : '—', ...LABEL_STYLE },
      { value: c.diasRestantes ?? 0,                         ...VALUE_STYLE },
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
      { value: c.codigoCuenta,                                              ...LABEL_STYLE },
      { value: c.servicio,                                                  ...LABEL_STYLE },
      { value: c.fechaFinalizacion ? new Date(c.fechaFinalizacion).toLocaleDateString('es-NI') : '—', ...LABEL_STYLE },
      { value: c.costo ?? 0, format: '"C$"#,##0.00',                       ...VALUE_STYLE },
    ]),
    [],
    [{ value: 'Ventas que Vencen Esta Semana', ...LABEL_STYLE, span: 4 }],
    [
      { value: 'Cliente',   ...HEADER_STYLE },
      { value: 'Servicio',  ...HEADER_STYLE },
      { value: 'Vencimiento', ...HEADER_STYLE },
      { value: 'Días',      ...HEADER_STYLE },
    ],
    ...(data.ventasProximasVencer || []).map(v => [
      { value: v.cliente,    ...LABEL_STYLE },
      { value: v.servicio,   ...LABEL_STYLE },
      { value: v.fechaFin ? new Date(v.fechaFin).toLocaleDateString('es-NI') : '—', ...LABEL_STYLE },
      { value: v.diasRestantes ?? 0, ...VALUE_STYLE },
    ]),
  ];

  await writeXlsxFile(
    [resumen, chart, servicios, clientes, alertas],
    {
      sheets: ['Resumen', 'Ingresos vs Egresos', 'Servicios', 'Top Clientes', 'Alertas'],
      fileName: `${name}.xlsx`,
    }
  );
}
