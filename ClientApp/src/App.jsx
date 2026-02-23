import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Servicios from './pages/Servicios';
import Correos from './pages/Correos';
import Cuentas from './pages/Cuentas';
import Ventas from './pages/Ventas';
import MediosPago from './pages/MediosPago';
import Usuarios from './pages/Usuarios';
import Combos from './pages/Combos';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
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
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/servicios"
            element={
              <ProtectedRoute>
                <Layout>
                  <Servicios />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/correos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Correos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/cuentas"
            element={
              <ProtectedRoute>
                <Layout>
                  <Cuentas />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ventas"
            element={
              <ProtectedRoute>
                <Layout>
                  <Ventas />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/medios-pago"
            element={
              <ProtectedRoute>
                <Layout>
                  <MediosPago />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <Layout>
                  <Usuarios />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/combos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Combos />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
