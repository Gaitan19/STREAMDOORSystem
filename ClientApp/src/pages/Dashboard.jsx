import { useEffect, useState } from 'react';
import { 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Package,
  Mail,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';
import Alert from '../components/Alert';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalVentas: 0,
    ventasActivas: 0,
    ventasProximasVencer: 0,
    ventasVencidas: 0,
    ingresosMes: 0
  });
  const [proximasVencer, setProximasVencer] = useState([]);
  const [vencidas, setVencidas] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API calls
      const mockStats = {
        totalClientes: 45,
        totalVentas: 128,
        ventasActivas: 98,
        ventasProximasVencer: 12,
        ventasVencidas: 5,
        ingresosMes: 15420.50
      };

      const mockProximasVencer = [
        { id: 1, clienteNombre: 'Juan Pérez', servicioNombre: 'Netflix Premium', fechaVencimiento: '2024-02-15', monto: 15.99 },
        { id: 2, clienteNombre: 'María García', servicioNombre: 'Spotify Family', fechaVencimiento: '2024-02-18', monto: 14.99 },
        { id: 3, clienteNombre: 'Carlos López', servicioNombre: 'Disney+', fechaVencimiento: '2024-02-20', monto: 8.99 },
      ];

      const mockVencidas = [
        { id: 4, clienteNombre: 'Ana Martínez', servicioNombre: 'HBO Max', fechaVencimiento: '2024-01-28', monto: 9.99 },
        { id: 5, clienteNombre: 'Pedro Sánchez', servicioNombre: 'Amazon Prime', fechaVencimiento: '2024-01-25', monto: 12.99 },
      ];

      const mockChartData = [
        { mes: 'Ago', ventas: 45, ingresos: 890 },
        { mes: 'Sep', ventas: 52, ingresos: 1020 },
        { mes: 'Oct', ventas: 48, ingresos: 950 },
        { mes: 'Nov', ventas: 61, ingresos: 1180 },
        { mes: 'Dic', ventas: 55, ingresos: 1090 },
        { mes: 'Ene', ventas: 67, ingresos: 1340 },
      ];

      setStats(mockStats);
      setProximasVencer(mockProximasVencer);
      setVencidas(mockVencidas);
      setChartData(mockChartData);

      // Uncomment when API is ready
      // const [statsData, proximasData, vencidasData] = await Promise.all([
      //   dashboardService.getStats(),
      //   ventasService.getProximasVencer(),
      //   ventasService.getVencidas()
      // ]);
      // setStats(statsData);
      // setProximasVencer(proximasData);
      // setVencidas(vencidasData);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={16} />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen general del sistema</p>
      </div>

      {/* Alerts */}
      {vencidas.length > 0 && (
        <Alert 
          type="error" 
          message={`Hay ${vencidas.length} venta(s) vencida(s) que requieren atención`}
        />
      )}
      {proximasVencer.length > 0 && (
        <Alert 
          type="warning" 
          message={`${proximasVencer.length} venta(s) próximas a vencer en los próximos días`}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Clientes"
          value={stats.totalClientes}
          color="bg-blue-500"
          trend="+12% este mes"
        />
        <StatCard
          icon={ShoppingCart}
          label="Ventas Activas"
          value={stats.ventasActivas}
          color="bg-green-500"
          trend="+8% este mes"
        />
        <StatCard
          icon={AlertTriangle}
          label="Próximas a Vencer"
          value={stats.ventasProximasVencer}
          color="bg-orange-500"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos del Mes"
          value={formatCurrency(stats.ingresosMes)}
          color="bg-purple-500"
          trend="+15% vs mes anterior"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Tendencia de Ventas">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Ingresos Mensuales">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas a Vencer */}
        <Card 
          title="Ventas Próximas a Vencer" 
          action={
            <Link to="/ventas" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todas
            </Link>
          }
        >
          {proximasVencer.length > 0 ? (
            <div className="space-y-3">
              {proximasVencer.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{venta.clienteNombre}</p>
                    <p className="text-sm text-gray-600">{venta.servicioNombre}</p>
                    <p className="text-xs text-orange-600 mt-1">Vence: {formatDate(venta.fechaVencimiento)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(venta.monto)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay ventas próximas a vencer</p>
          )}
        </Card>

        {/* Vencidas */}
        <Card 
          title="Ventas Vencidas" 
          action={
            <Link to="/ventas" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todas
            </Link>
          }
        >
          {vencidas.length > 0 ? (
            <div className="space-y-3">
              {vencidas.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{venta.clienteNombre}</p>
                    <p className="text-sm text-gray-600">{venta.servicioNombre}</p>
                    <p className="text-xs text-red-600 mt-1">Venció: {formatDate(venta.fechaVencimiento)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(venta.monto)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No hay ventas vencidas</p>
          )}
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <Package className="mx-auto mb-2 text-blue-600" size={24} />
          <p className="text-sm text-gray-600">Servicios</p>
          <p className="text-xl font-bold text-gray-900">24</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <Mail className="mx-auto mb-2 text-green-600" size={24} />
          <p className="text-sm text-gray-600">Correos</p>
          <p className="text-xl font-bold text-gray-900">156</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <CreditCard className="mx-auto mb-2 text-purple-600" size={24} />
          <p className="text-sm text-gray-600">Cuentas</p>
          <p className="text-xl font-bold text-gray-900">89</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <ShoppingCart className="mx-auto mb-2 text-orange-600" size={24} />
          <p className="text-sm text-gray-600">Total Ventas</p>
          <p className="text-xl font-bold text-gray-900">{stats.totalVentas}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
