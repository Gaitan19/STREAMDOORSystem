import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import RecuperarContrasena from './pages/RecuperarContrasena';
import Perfil from './pages/Perfil';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Servicios from './pages/Servicios';
import Correos from './pages/Correos';
import Cuentas from './pages/Cuentas';
import Ventas from './pages/Ventas';
import MediosPago from './pages/MediosPago';
import Usuarios from './pages/Usuarios';
import Combos from './pages/Combos';
import Ingresos from './pages/Ingresos';
import Egresos from './pages/Egresos';
import Roles from './pages/Roles';
import Cierre from './pages/Cierre';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/clientes"
            element={
              <ProtectedRoute modulo="clientes">
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/servicios"
            element={
              <ProtectedRoute modulo="servicios">
                <Layout>
                  <Servicios />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/correos"
            element={
              <ProtectedRoute modulo="correos">
                <Layout>
                  <Correos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/cuentas"
            element={
              <ProtectedRoute modulo="cuentas">
                <Layout>
                  <Cuentas />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ventas"
            element={
              <ProtectedRoute modulo="ventas">
                <Layout>
                  <Ventas />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/medios-pago"
            element={
              <ProtectedRoute modulo="medios-pago">
                <Layout>
                  <MediosPago />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute modulo="usuarios">
                <Layout>
                  <Usuarios />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/combos"
            element={
              <ProtectedRoute modulo="combos">
                <Layout>
                  <Combos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ingresos"
            element={
              <ProtectedRoute modulo="ingresos">
                <Layout>
                  <Ingresos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/egresos"
            element={
              <ProtectedRoute modulo="egresos">
                <Layout>
                  <Egresos />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute modulo="roles">
                <Layout>
                  <Roles />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cierre"
            element={
              <ProtectedRoute modulo="cierre">
                <Layout>
                  <Cierre />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
