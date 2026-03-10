import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Mail, 
  CreditCard, 
  ShoppingCart, 
  Wallet,
  UserCog,
  LogOut,
  Menu,
  X,
  PackagePlus,
  TrendingUp,
  TrendingDown,
  User,
  Shield,
  ClipboardList
} from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canAccess } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', modulo: 'dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes', modulo: 'clientes' },
    { path: '/servicios', icon: Package, label: 'Servicios', modulo: 'servicios' },
    { path: '/combos', icon: PackagePlus, label: 'Combos', modulo: 'combos' },
    { path: '/correos', icon: Mail, label: 'Correos', modulo: 'correos' },
    { path: '/cuentas', icon: CreditCard, label: 'Cuentas', modulo: 'cuentas' },
    { path: '/ventas', icon: ShoppingCart, label: 'Ventas', modulo: 'ventas' },
    { path: '/ingresos', icon: TrendingUp, label: 'Ingresos', modulo: 'ingresos' },
    { path: '/egresos', icon: TrendingDown, label: 'Egresos', modulo: 'egresos' },
    { path: '/cierre', icon: ClipboardList, label: 'Cierre de Caja', modulo: 'cierre' },
    { path: '/medios-pago', icon: Wallet, label: 'Medios de Pago', modulo: 'medios-pago' },
    { path: '/usuarios', icon: UserCog, label: 'Usuarios', modulo: 'usuarios' },
    { path: '/roles', icon: Shield, label: 'Roles', modulo: 'roles' },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => canAccess(item.modulo));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-20 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">{import.meta.env.VITE_APP_NAME || 'STREAMDOOR'}</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out z-30 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-6 border-b pb-1 flex-shrink-0">
          <h1 className="text-2xl font-bold text-blue-600">{import.meta.env.VITE_APP_NAME || 'STREAMDOOR'}</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de Gestión</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 p-4 border-t bg-white">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {user?.Nombre?.charAt(0).toUpperCase() || user?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 break-words">
                {user?.Nombre || user?.nombre}
              </p>
              {user?.RolNombre && (
                <p className="text-xs text-blue-500 break-words">{user.RolNombre}</p>
              )}
            </div>
          </div>
          <Link
            to="/perfil"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-1"
          >
            <User size={20} />
            <span>Mi Perfil</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
