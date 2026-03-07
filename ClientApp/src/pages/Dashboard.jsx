import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users, ShoppingCart, AlertTriangle, TrendingUp, TrendingDown,
  Package, Mail, CreditCard, DollarSign, RefreshCw, Calendar,
  Activity, BarChart2, CheckCircle, XCircle, Download, FileText,
  FileSpreadsheet, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Card from '../components/Card';
import Alert from '../components/Alert';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { generatePDF, generateExcel } from '../utils/reportGenerator';

// ─── Date helpers ────────────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split('T')[0];

const getDateRange = (preset) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  switch (preset) {
    case 'hoy':
      return { inicio: toISO(hoy), fin: toISO(hoy) };
    case 'ayer': {
      const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
      return { inicio: toISO(ayer), fin: toISO(ayer) };
    }
    case 'semana': {
      const lunes = new Date(hoy);
      // (day+6)%7 maps Sun=0..Sat=6 → Mon=0..Sun=6, giving days since Monday
      lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
      return { inicio: toISO(lunes), fin: toISO(hoy) };
    }
    case 'mes': {
      const primeroDeMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { inicio: toISO(primeroDeMes), fin: toISO(hoy) };
    }
    default:
      return { inicio: toISO(hoy), fin: toISO(hoy) };
  }
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, sub, color, iconBg }) => (
  <Card>
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide break-words">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {sub && <p className={`text-xs mt-1 ${color || 'text-gray-500'}`}>{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${iconBg}`}>
        <Icon className="text-white" size={20} />
      </div>
    </div>
  </Card>
);

// ─── Main ────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [data, setData]             = useState(null);
  const [preset, setPreset]         = useState('mes');
  const [customInicio, setCustomInicio] = useState('');
  const [customFin, setCustomFin]       = useState('');
  const [exporting, setExporting]       = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  const derivedRange = useCallback(() => {
    if (preset === 'custom') {
      const hoy = toISO(new Date());
      return { inicio: customInicio || hoy, fin: customFin || hoy };
    }
    return getDateRange(preset);
  }, [preset, customInicio, customFin]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (preset === 'todo') {
        res = await dashboardService.getCompleto(null, null, true);
      } else {
        const { inicio, fin } = derivedRange();
        res = await dashboardService.getCompleto(inicio, fin);
      }
      setData(res);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información del dashboard.');
    } finally {
      setLoading(false);
    }
  }, [derivedRange]);

  useEffect(() => { load(); }, [load]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const userName = user?.Nombre || user?.nombre || user?.Correo || user?.correo || 'Usuario';

  const handleExport = async (format) => {
    if (!data) return;
    setShowExportMenu(false);
    setExporting(true);
    const label = buildPeriodoLabel();
    try {
      if (format === 'pdf') {
        generatePDF(data, userName, label);
      } else {
        await generateExcel(data, userName, label);
      }
    } catch (err) {
      console.error('Error al generar reporte:', err);
      alert('No se pudo generar el reporte. Intente nuevamente.');
    } finally {
      setExporting(false);
    }
  };

  const buildPeriodoLabel = () => {
    if (preset === 'custom') {
      return `${customInicio || '—'} al ${customFin || '—'}`;
    }
    const labels = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Esta semana', mes: 'Este mes', todo: 'Todo' };
    return labels[preset] || preset;
  };

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-gray-500 text-sm">Cargando datos…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert type="error" message={error || 'Error desconocido'} />
      </div>
    );
  }

  const labelPreset = {
    hoy: 'Hoy',
    ayer: 'Ayer',
    semana: 'Esta semana',
    mes: 'Este mes',
    todo: 'Todo',
    custom: 'Rango personalizado',
  };

  return (
    <div className="space-y-6">

      {/* ── Header + filtros ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen del negocio — <span className="font-medium text-gray-700">{labelPreset[preset]}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset selector */}
          <select
            value={preset}
            onChange={e => setPreset(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="todo">Todo</option>
            <option value="custom">Rango personalizado</option>
          </select>

          {/* Custom range pickers */}
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customInicio}
                onChange={e => setCustomInicio(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 text-sm">—</span>
              <input
                type="date"
                value={customFin}
                onChange={e => setCustomFin(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}

          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(p => !p)}
              disabled={exporting}
              className="flex items-center gap-1.5 text-sm bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {exporting ? (
                <><RefreshCw size={14} className="animate-spin" /> Generando…</>
              ) : (
                <><Download size={14} /> Exportar <ChevronDown size={12} /></>
              )}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <FileText size={15} className="text-red-500" />
                  Exportar PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <FileSpreadsheet size={15} className="text-green-600" />
                  Exportar Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Alertas ───────────────────────────────────────────────────────── */}
      {data.cuentasVencidas > 0 && (
        <Alert type="error" message={`${data.cuentasVencidas} cuenta(s) vencida(s) requieren renovación`} />
      )}
      {data.cuentasProximasVencer > 0 && (
        <Alert type="warning" message={`${data.cuentasProximasVencer} cuenta(s) próximas a vencer`} />
      )}
      {data.ventasProximasVencer?.length > 0 && (
        <Alert type="warning" message={`${data.ventasProximasVencer.length} venta(s) vencen en los próximos 7 días`} />
      )}

      {/* ── KPIs financieros del periodo ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          📅 Período seleccionado
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={TrendingUp}
            label="Ingresos"
            value={formatCurrency(data.totalIngresos)}
            iconBg="bg-green-500"
          />
          <KPICard
            icon={TrendingDown}
            label="Egresos"
            value={formatCurrency(data.totalEgresos)}
            iconBg="bg-red-500"
          />
          <KPICard
            icon={DollarSign}
            label="Ganancia Neta"
            value={formatCurrency(data.gananciaNeta)}
            color={data.gananciaNeta >= 0 ? 'text-green-600' : 'text-red-600'}
            sub={data.gananciaNeta >= 0 ? '▲ Positivo' : '▼ Negativo'}
            iconBg={data.gananciaNeta >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
          />
          <KPICard
            icon={ShoppingCart}
            label="Ventas del periodo"
            value={data.totalVentasPeriodo}
            sub={formatCurrency(data.montoVentasPeriodo)}
            iconBg="bg-blue-500"
          />
        </div>
      </div>

      {/* ── KPIs globales ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          🌐 Estado global del negocio
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard icon={Users}     label="Clientes"       value={data.totalClientes}   iconBg="bg-indigo-500" />
          <KPICard icon={CreditCard} label="Cuentas"        value={data.totalCuentas}    iconBg="bg-sky-500" />
          <KPICard icon={Mail}      label="Correos"         value={data.totalCorreos}    iconBg="bg-teal-500" />
          <KPICard icon={Package}   label="Servicios"       value={data.totalServicios}  iconBg="bg-violet-500" />
          <KPICard icon={Activity}  label="Medios de Pago"  value={data.totalMediosPago} iconBg="bg-pink-500" />
          <KPICard
            icon={AlertTriangle}
            label="Renovaciones Pend."
            value={data.renovacionesPendientes}
            color={data.renovacionesPendientes > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}
            iconBg={data.renovacionesPendientes > 0 ? 'bg-red-500' : 'bg-gray-400'}
          />
        </div>
      </div>

      {/* ── Estado de cuentas (mini stats) ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Disponibles',      val: data.cuentasDisponibles,    bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle,   color: 'text-green-500' },
          { label: 'Ocupadas',          val: data.cuentasOcupadas,       bg: 'bg-blue-50',   text: 'text-blue-700',   icon: Users,          color: 'text-blue-500' },
          { label: 'Próximas a Vencer', val: data.cuentasProximasVencer, bg: 'bg-orange-50', text: 'text-orange-700', icon: AlertTriangle,  color: 'text-orange-500' },
          { label: 'Vencidas',          val: data.cuentasVencidas,       bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle,        color: 'text-red-500' },
        ].map(({ label, val, bg, text, icon: Ic, color }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex items-center gap-3`}>
            <Ic className={color} size={24} />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${text}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráficos ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Ingresos vs Egresos */}
        <Card title="Ingresos vs Egresos">
          {data.ingresosEgresosChart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.ingresosEgresosChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} width={80} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="egresos"  name="Egresos"  stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">Sin movimientos en el periodo</p>
          )}
        </Card>

        {/* Ventas por servicio */}
        <Card title="Top Servicios Vendidos">
          {data.ventasPorServicio?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.ventasPorServicio} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="servicio" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v, n) => n === 'monto' ? formatCurrency(v) : v} />
                <Legend />
                <Bar dataKey="ventas" name="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">Sin ventas en el periodo</p>
          )}
        </Card>

        {/* Distribución de cuentas */}
        <Card title="Distribución de Cuentas">
          {data.cuentasPorEstado?.some(c => c.cantidad > 0) ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={240}>
                <PieChart>
                  <Pie
                    data={data.cuentasPorEstado.filter(c => c.cantidad > 0)}
                    dataKey="cantidad"
                    nameKey="estado"
                    cx="50%" cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.cuentasPorEstado.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [`${v} cuentas`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.cuentasPorEstado.map((item, i) => (
                  <div key={item.estado} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-600 flex-1">{item.estado}</span>
                    <span className="text-xs font-semibold text-gray-900">{item.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16 text-sm">Sin cuentas registradas</p>
          )}
        </Card>

        {/* Top clientes */}
        <Card
          title="Top 5 Clientes"
          action={<Link to="/clientes" className="text-xs text-blue-600 hover:text-blue-700">Ver todos</Link>}
        >
          {data.topClientes?.length > 0 ? (
            <div className="space-y-2">
              {data.topClientes.map((c, i) => (
                <div key={c.clienteID} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 break-words">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.totalVentas} venta(s)</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                    {formatCurrency(c.totalMonto)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-10 text-sm">Sin ventas registradas</p>
          )}
        </Card>
      </div>

      {/* ── Alertas de vencimiento ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cuentas próximas a vencer */}
        <Card
          title="⚠️ Cuentas Próximas a Vencer"
          action={<Link to="/cuentas" className="text-xs text-blue-600 hover:text-blue-700">Ver todas</Link>}
        >
          {data.cuentasProximasVencerList?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto" tabIndex={0}>
              {data.cuentasProximasVencerList.map(c => (
                <div key={c.cuentaID} className="flex items-center justify-between p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{c.codigoCuenta}</p>
                    <p className="text-xs text-gray-500">{c.servicio}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs font-semibold text-orange-700">
                      {c.diasRestantes !== null ? `${c.diasRestantes}d` : 'N/A'}
                    </p>
                    {c.fechaFinalizacion && (
                      <p className="text-xs text-gray-400">{formatDate(c.fechaFinalizacion)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">No hay cuentas próximas a vencer</p>
          )}
        </Card>

        {/* Cuentas vencidas */}
        <Card
          title="🔴 Cuentas Vencidas"
          action={<Link to="/cuentas" className="text-xs text-blue-600 hover:text-blue-700">Ver todas</Link>}
        >
          {data.cuentasVencidasList?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto" tabIndex={0}>
              {data.cuentasVencidasList.map(c => (
                <div key={c.cuentaID} className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{c.codigoCuenta}</p>
                    <p className="text-xs text-gray-500">{c.servicio}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    {c.costo && <p className="text-xs font-semibold text-red-700">{formatCurrency(c.costo)}</p>}
                    {c.fechaFinalizacion && (
                      <p className="text-xs text-gray-400">{formatDate(c.fechaFinalizacion)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8 text-sm">No hay cuentas vencidas</p>
          )}
        </Card>
      </div>

      {/* Ventas próximas a vencer */}
      {data.ventasProximasVencer?.length > 0 && (
        <Card
          title="🛒 Ventas que Vencen Esta Semana"
          action={<Link to="/ventas" className="text-xs text-blue-600 hover:text-blue-700">Ver todas</Link>}
        >
          <div className="space-y-2 max-h-52 overflow-y-auto" tabIndex={0}>
            {data.ventasProximasVencer.map(v => (
              <div key={v.ventaID} className="flex items-center justify-between p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{v.cliente}</p>
                  <p className="text-xs text-gray-500">{v.servicio}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-semibold text-yellow-700">{v.diasRestantes}d restante(s)</p>
                  <p className="text-xs text-gray-400">{formatDate(v.fechaFin)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Gráfico ingresos (barras) por servicio complementario */}
      {data.ventasPorServicio?.length > 0 && (
        <Card title="Ingresos por Servicio (Periodo)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.ventasPorServicio} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="servicio" tick={{ fontSize: 10, angle: -35, textAnchor: 'end' }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} width={80} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="monto" name="Monto vendido" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
