import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const userData = localStorage.getItem('user');
      
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Failed to parse user data:', error);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      // Backend returns: { UsuarioID, Nombre, Correo, Token, RolID, RolNombre, Permisos }
      const { Token, ...usuario } = response;
      
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al iniciar sesión' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  // Check if current user can access a module
  const canAccess = (modulo) => {
    if (!user) return false;
    // If user has no role, deny access (except admin check)
    if (!user.permisos && !user.Permisos) return false;
    
    const permisos = user.Permisos || user.permisos || [];
    const permiso = permisos.find(p => (p.Modulo || p.modulo) === modulo);
    return permiso ? (permiso.PuedeVer || permiso.puedeVer) : false;
  };

  const canCreate = (modulo) => {
    if (!user) return false;
    const permisos = user.Permisos || user.permisos || [];
    const permiso = permisos.find(p => (p.Modulo || p.modulo) === modulo);
    return permiso ? (permiso.PuedeCrear || permiso.puedeCrear) : false;
  };

  const canEdit = (modulo) => {
    if (!user) return false;
    const permisos = user.Permisos || user.permisos || [];
    const permiso = permisos.find(p => (p.Modulo || p.modulo) === modulo);
    return permiso ? (permiso.PuedeEditar || permiso.puedeEditar) : false;
  };

  const canDelete = (modulo) => {
    if (!user) return false;
    const permisos = user.Permisos || user.permisos || [];
    const permiso = permisos.find(p => (p.Modulo || p.modulo) === modulo);
    return permiso ? (permiso.PuedeEliminar || permiso.puedeEliminar) : false;
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    canAccess,
    canCreate,
    canEdit,
    canDelete
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
