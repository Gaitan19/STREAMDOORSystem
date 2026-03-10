import { useEffect, useState, useRef, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Calendar,
  ChevronDown,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Wrench,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

// ── Date helpers (America/Managua, UTC-6) ────────────────────────────────────
const manaTime = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Managua' }));

const toISODate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const fmtDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtTime12 = (d) => {
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
};

const PERIODOS = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'personalizado', label: 'Rango personalizado' },
];

const getDateRange = (periodo) => {
  const hoy = manaTime();
  hoy.setHours(0, 0, 0, 0);

  switch (periodo) {
    case 'hoy':
      return { inicio: toISODate(hoy), fin: toISODate(hoy) };
    case 'ayer': {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      return { inicio: toISODate(ayer), fin: toISODate(ayer) };
    }
    case 'semana': {
      const lunes = new Date(hoy);
      const day = lunes.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      lunes.setDate(lunes.getDate() + diff);
      return { inicio: toISODate(lunes), fin: toISODate(hoy) };
    }
    case 'mes': {
      const primeroDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { inicio: toISODate(primeroDeMes), fin: toISODate(hoy) };
    }
    default:
      return { inicio: toISODate(hoy), fin: toISODate(hoy) };
  }
};

// ── Collapsible section component ────────────────────────────────────────────
const Section = ({ title, icon: Icon, iconColor, total, totalColor, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={iconColor} />
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-bold text-lg ${totalColor}`}>{formatCurrency(total)}</span>
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && <div className="border-t border-gray-100 bg-gray-50 p-4">{children}</div>}
    </div>
  );
};

// ── Sub-group inside a section ─────────────────────────────────────────────
const SubGroup = ({ title, icon: Icon, iconColor, items, total, totalColor, emptyMsg }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3 last:mb-0">
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconColor} />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span className="bg-gray-200 text-gray-600 text-xs rounded-full px-2 py-0.5">{items.length}</span>
      </div>
      <span className={`text-sm font-bold ${totalColor}`}>{formatCurrency(total)}</span>
    </div>
    {items.length === 0 ? (
      <p className="text-center text-gray-400 text-sm py-4">{emptyMsg}</p>
    ) : (
      <div className="divide-y divide-gray-100">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{item.descripcion || item.label || '-'}</p>
              <p className="text-xs text-gray-400">{fmtDate(item.fechaCreacion)} · {item.usuario || ''}</p>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-800 whitespace-nowrap">
              {formatCurrency(item.monto)}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const Cierre = () => {
  const [periodo, setPeriodo] = useState('hoy');
  const [fechaInicio, setFechaInicio] = useState(toISODate(manaTime()));
  const [fechaFin, setFechaFin] = useState(toISODate(manaTime()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const { user } = useAuth();
  const appName = import.meta.env.VITE_APP_NAME || 'STREAMDOOR';
  const printRef = useRef(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const load = useCallback(async (fi, ff) => {
    try {
      setLoading(true);
      setData(null);
      const res = await fetch(
        `/api/cierre?fechaInicio=${fi}&fechaFin=${ff}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Error de servidor');
      const json = await res.json();
      setData(json);
      setGeneratedAt(manaTime());
    } catch {
      showAlert('error', 'Error al cargar el cierre. Verifique su conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    const { inicio, fin } = getDateRange('hoy');
    load(inicio, fin);
  }, [load]);

  const handlePeriodoChange = (newPeriodo) => {
    setPeriodo(newPeriodo);
    if (newPeriodo !== 'personalizado') {
      const { inicio, fin } = getDateRange(newPeriodo);
      setFechaInicio(inicio);
      setFechaFin(fin);
      load(inicio, fin);
    }
  };

  const handleCustomRangeSearch = () => {
    if (!fechaInicio || !fechaFin) {
      showAlert('error', 'Seleccione las fechas de inicio y fin');
      return;
    }
    if (fechaInicio > fechaFin) {
      showAlert('error', 'La fecha de inicio no puede ser mayor a la fecha de fin');
      return;
    }
    load(fechaInicio, fechaFin);
  };

  const handlePrint = () => {
    const ticketEl = printRef.current;
    if (!ticketEl) return;

    // Clone the ticket and inject it as a direct child of <body> so that
    // the @media print rule "body > :not(#ticket-print-root)" correctly hides
    // the React tree while showing only the ticket.
    const clone = ticketEl.cloneNode(true);
    clone.classList.remove('hidden');
    clone.style.display = 'block';

    const container = document.createElement('div');
    container.id = 'ticket-print-root';
    container.style.cssText = 'margin:0;padding:0;width:72mm;';
    container.appendChild(clone);
    document.body.appendChild(container);

    const cleanup = () => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  if (!data && !loading) return null;

  const ing = data?.ingresos;
  const egr = data?.egresos;
  const ganancia = data?.gananciaNeta ?? 0;
  const isPositive = ganancia >= 0;

  const periodLabel = () => {
    const fi = data?.fechaInicio ? fmtDate(data.fechaInicio) : fechaInicio;
    const ff = data?.fechaFin ? fmtDate(data.fechaFin) : fechaFin;
    return fi === ff ? fi : `${fi} — ${ff}`;
  };

  return (
    <>
      {/* ── Screen version ────────────────────────────────────────────────── */}
      <div className="space-y-6 no-print">
        {alert && <Alert type={alert.type} message={alert.message} />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Cierre de Caja</h1>
            <p className="text-gray-500 text-sm mt-1">
              Resumen de ingresos, egresos y ganancia del periodo seleccionado
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => load(fechaInicio, fechaFin)}
              disabled={loading}
            >
              Actualizar
            </Button>
            {data && (
              <Button icon={Printer} onClick={handlePrint} disabled={loading}>
                Imprimir Ticket
              </Button>
            )}
          </div>
        </div>

        {/* Period selector */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodo
              </label>
              <select
                value={periodo}
                onChange={(e) => handlePeriodoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {PERIODOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {periodo === 'personalizado' && (
              <>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    max={fechaFin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    min={fechaInicio}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button icon={Calendar} onClick={handleCustomRangeSearch}>
                  Calcular
                </Button>
              </>
            )}
          </div>

          {data && !loading && (
            <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={12} />
              Periodo: <strong className="text-gray-600">{periodLabel()}</strong>
              {generatedAt && (
                <> · Generado el {fmtDate(generatedAt)} a las {fmtTime12(generatedAt)}</>
              )}
            </p>
          )}
        </Card>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Calculando cierre…</p>
            </div>
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(ing?.total ?? 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUpCircle size={24} className="text-green-600" />
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Egresos</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {formatCurrency(egr?.total ?? 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <ArrowDownCircle size={24} className="text-red-600" />
                  </div>
                </div>
              </Card>

              <Card className={isPositive ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      Ganancia Neta
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(ganancia)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-200' : 'bg-red-200'}`}>
                    <DollarSign size={24} className={isPositive ? 'text-green-700' : 'text-red-700'} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Ingresos */}
            <Section
              title="Ingresos"
              icon={TrendingUp}
              iconColor="text-green-600"
              total={ing?.total ?? 0}
              totalColor="text-green-600"
              defaultOpen
            >
              {/* De Ventas grouped by medio de pago */}
              {(ing?.ventasPorMedioPago ?? []).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <ShoppingCart size={14} className="text-blue-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      De Ventas por Medio de Pago
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">
                      {formatCurrency(ing?.totalVentas ?? 0)}
                    </span>
                  </div>
                  {(ing?.ventasPorMedioPago ?? []).map((grupo, idx) => (
                    <SubGroup
                      key={idx}
                      title={grupo.medioPago}
                      icon={CreditCard}
                      iconColor="text-blue-500"
                      items={grupo.items.map((i) => ({ ...i, label: `Venta #${i.ventaID}` }))}
                      total={grupo.total}
                      totalColor="text-blue-600"
                      emptyMsg="Sin registros"
                    />
                  ))}
                </div>
              )}

              <SubGroup
                title="Ingresos Manuales"
                icon={Wrench}
                iconColor="text-gray-500"
                items={ing?.manuales ?? []}
                total={ing?.totalManuales ?? 0}
                totalColor="text-gray-700"
                emptyMsg="Sin ingresos manuales en el periodo"
              />
            </Section>

            {/* Egresos */}
            <Section
              title="Egresos"
              icon={TrendingDown}
              iconColor="text-red-600"
              total={egr?.total ?? 0}
              totalColor="text-red-600"
              defaultOpen
            >
              <SubGroup
                title="Creación de Cuentas"
                icon={CreditCard}
                iconColor="text-orange-500"
                items={egr?.creacionCuentas ?? []}
                total={egr?.totalCreacion ?? 0}
                totalColor="text-orange-600"
                emptyMsg="Sin egresos por creación de cuentas en el periodo"
              />
              <SubGroup
                title="Renovaciones de Cuentas"
                icon={RotateCcw}
                iconColor="text-purple-500"
                items={egr?.renovacionCuentas ?? []}
                total={egr?.totalRenovacion ?? 0}
                totalColor="text-purple-600"
                emptyMsg="Sin egresos por renovaciones en el periodo"
              />
              <SubGroup
                title="Egresos Manuales"
                icon={Wrench}
                iconColor="text-gray-500"
                items={egr?.manuales ?? []}
                total={egr?.totalManuales ?? 0}
                totalColor="text-gray-700"
                emptyMsg="Sin egresos manuales en el periodo"
              />
            </Section>

            {/* Summary row */}
            <Card className={`border-2 ${isPositive ? 'border-green-400' : 'border-red-400'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                    Resultado del Periodo
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{periodLabel()}</p>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-400">Ingresos</p>
                    <p className="font-bold text-green-600">{formatCurrency(ing?.total ?? 0)}</p>
                  </div>
                  <span className="text-gray-300 text-xl">−</span>
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-400">Egresos</p>
                    <p className="font-bold text-red-600">{formatCurrency(egr?.total ?? 0)}</p>
                  </div>
                  <span className="text-gray-300 text-xl">=</span>
                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-400">Ganancia</p>
                    <p className={`font-bold text-xl ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(ganancia)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ── Print-only ticket (hidden on screen) ─────────────────────────────── */}
      {data && (
        <div ref={printRef} className="ticket-print hidden print:block">
          <TicketContent
            data={data}
            appName={appName}
            user={user}
            generatedAt={generatedAt || manaTime()}
            periodLabel={periodLabel()}
          />
        </div>
      )}
    </>
  );
};

// ── Ticket Component (80mm thermal printer) ────────────────────────────────
const TicketContent = ({ data, appName, user, generatedAt, periodLabel }) => {
  const ing = data.ingresos;
  const egr = data.egresos;
  const ganancia = data.gananciaNeta ?? 0;

  const fmtC = (n) =>
    `C$ ${Number(n ?? 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const userName =
    user?.Nombre || user?.nombre || user?.NombreCompleto || user?.nombreCompleto || 'Usuario';

  return (
    <div className="ticket">
      {/* Header */}
      <div className="ticket-center ticket-bold ticket-lg">{appName}</div>
      <div className="ticket-center ticket-sm">Sistema de Gestión</div>
      <hr className="ticket-rule" />
      <div className="ticket-center ticket-bold">CIERRE DE CAJA</div>
      <hr className="ticket-rule" />

      {/* Meta */}
      <div className="ticket-row">
        <span>Generado por:</span>
        <span className="ticket-bold">{userName}</span>
      </div>
      <div className="ticket-row">
        <span>Fecha:</span>
        <span>{generatedAt.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </div>
      <div className="ticket-row">
        <span>Hora:</span>
        <span>{fmtTime12(generatedAt)}</span>
      </div>
      <div className="ticket-row">
        <span>Periodo:</span>
        <span>{periodLabel}</span>
      </div>

      <hr className="ticket-rule-dashed" />

      {/* INGRESOS */}
      <div className="ticket-section-title">INGRESOS</div>
      <hr className="ticket-rule-dashed" />

      {/* Ventas por medio de pago — grouped with individual items */}
      {(ing.ventasPorMedioPago ?? []).length > 0 && (
        <>
          <div className="ticket-bold ticket-sm">De Ventas:</div>
          {(ing.ventasPorMedioPago ?? []).map((g, idx) => (
            <div key={idx}>
              {/* Payment method header row */}
              <div className="ticket-row ticket-sm ticket-bold">
                <span className="ticket-item-label">  {g.medioPago} ({g.cantidad})</span>
                <span className="ticket-item-amount">{fmtC(g.total)}</span>
              </div>
              {/* Individual items within this payment method */}
              {(g.items ?? []).slice(0, 12).map((item, itemIdx) => (
                <div key={itemIdx} className="ticket-row ticket-sm">
                  <span className="ticket-item-label">    {item.descripcion || `Venta #${item.ventaID || (itemIdx + 1)}`}</span>
                  <span className="ticket-item-amount">{fmtC(item.monto)}</span>
                </div>
              ))}
              {(g.items ?? []).length > 12 && (
                <div className="ticket-sm ticket-right">    ... y {g.items.length - 12} más</div>
              )}
            </div>
          ))}
          <div className="ticket-row ticket-sm">
            <span className="ticket-bold">  Subtotal Ventas</span>
            <span className="ticket-bold">{fmtC(ing.totalVentas)}</span>
          </div>
        </>
      )}

      {/* Manuales */}
      {ing.manuales.length > 0 && (
        <>
          <div className="ticket-bold ticket-sm">Manuales ({ing.manuales.length}):</div>
          {ing.manuales.slice(0, 10).map((item, idx) => (
            <div key={idx} className="ticket-row ticket-sm">
              <span className="ticket-item-label">  {item.descripcion || '-'}</span>
              <span className="ticket-item-amount">{fmtC(item.monto)}</span>
            </div>
          ))}
          {ing.manuales.length > 10 && (
            <div className="ticket-sm ticket-right">  ... y {ing.manuales.length - 10} más</div>
          )}
          <div className="ticket-row ticket-sm">
            <span className="ticket-bold">  Subtotal Manuales</span>
            <span className="ticket-bold">{fmtC(ing.totalManuales)}</span>
          </div>
        </>
      )}

      <hr className="ticket-rule-dashed" />
      <div className="ticket-row ticket-bold">
        <span>TOTAL INGRESOS</span>
        <span>{fmtC(ing.total)}</span>
      </div>

      <hr className="ticket-rule-dashed" />

      {/* EGRESOS */}
      <div className="ticket-section-title">EGRESOS</div>
      <hr className="ticket-rule-dashed" />

      {/* Creación de cuentas */}
      {egr.creacionCuentas.length > 0 && (
        <>
          <div className="ticket-bold ticket-sm">Creación de Cuentas ({egr.creacionCuentas.length}):</div>
          {egr.creacionCuentas.slice(0, 8).map((item, idx) => (
            <div key={idx} className="ticket-row ticket-sm">
              <span className="ticket-item-label">  {item.descripcion || '-'}</span>
              <span className="ticket-item-amount">{fmtC(item.monto)}</span>
            </div>
          ))}
          {egr.creacionCuentas.length > 8 && (
            <div className="ticket-sm ticket-right">  ... y {egr.creacionCuentas.length - 8} más</div>
          )}
          <div className="ticket-row ticket-sm">
            <span className="ticket-bold">  Subtotal Creación</span>
            <span className="ticket-bold">{fmtC(egr.totalCreacion)}</span>
          </div>
        </>
      )}

      {/* Renovaciones */}
      {egr.renovacionCuentas.length > 0 && (
        <>
          <div className="ticket-bold ticket-sm">Renovaciones ({egr.renovacionCuentas.length}):</div>
          {egr.renovacionCuentas.slice(0, 8).map((item, idx) => (
            <div key={idx} className="ticket-row ticket-sm">
              <span className="ticket-item-label">  {item.descripcion || '-'}</span>
              <span className="ticket-item-amount">{fmtC(item.monto)}</span>
            </div>
          ))}
          {egr.renovacionCuentas.length > 8 && (
            <div className="ticket-sm ticket-right">  ... y {egr.renovacionCuentas.length - 8} más</div>
          )}
          <div className="ticket-row ticket-sm">
            <span className="ticket-bold">  Subtotal Renovaciones</span>
            <span className="ticket-bold">{fmtC(egr.totalRenovacion)}</span>
          </div>
        </>
      )}

      {/* Manuales */}
      {egr.manuales.length > 0 && (
        <>
          <div className="ticket-bold ticket-sm">Manuales ({egr.manuales.length}):</div>
          {egr.manuales.slice(0, 8).map((item, idx) => (
            <div key={idx} className="ticket-row ticket-sm">
              <span className="ticket-item-label">  {item.descripcion || '-'}</span>
              <span className="ticket-item-amount">{fmtC(item.monto)}</span>
            </div>
          ))}
          {egr.manuales.length > 8 && (
            <div className="ticket-sm ticket-right">  ... y {egr.manuales.length - 8} más</div>
          )}
          <div className="ticket-row ticket-sm">
            <span className="ticket-bold">  Subtotal Manuales</span>
            <span className="ticket-bold">{fmtC(egr.totalManuales)}</span>
          </div>
        </>
      )}

      <hr className="ticket-rule-dashed" />
      <div className="ticket-row ticket-bold">
        <span>TOTAL EGRESOS</span>
        <span>{fmtC(egr.total)}</span>
      </div>

      <hr className="ticket-rule" />

      {/* Ganancia */}
      <div className="ticket-row ticket-bold ticket-lg">
        <span>GANANCIA NETA</span>
        <span>{fmtC(ganancia)}</span>
      </div>

      <hr className="ticket-rule" />
      <div className="ticket-center ticket-sm">Gracias por usar {appName}</div>
      <div className="ticket-center ticket-sm">
        {generatedAt.toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </div>
      <div className="ticket-spacer" />
    </div>
  );
};

export default Cierre;
