import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const userData = localStorage.getItem('user');

      if (userData) {
        try {
          // Verify the token cookie is still valid before trusting localStorage data
          await authService.verify();
          setUser(JSON.parse(userData));
        } catch {
          // Token is expired or invalid – clear session and force re-login
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Refresh permissions from backend without requiring re-login
  const refreshPermissions = useCallback(async () => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    try {
      const fresh = await authService.getMe();
      const updated = {
        ...JSON.parse(userData),
        Permisos: fresh.Permisos ?? fresh.permisos ?? [],
        RolNombre: fresh.RolNombre ?? fresh.rolNombre,
        RolID: fresh.RolID ?? fresh.rolID,
      };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      // silently ignore — user is still logged in with existing permissions
    }
  }, []);

  // Auto-refresh when the tab regains focus (handles admin updating another user's role)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPermissions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshPermissions]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      // Backend sets the HttpOnly cookie; user data is returned without the token
      const usuario = response;
      
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
    const key = (modulo || '').toLowerCase();
    const permiso = permisos.find(p => (p.Modulo || p.modulo || '').toLowerCase() === key);
    return permiso ? (permiso.PuedeVer || permiso.puedeVer) : false;
  };

  const canCreate = (modulo) => {
    if (!user) return false;
    const permisos = user.Permisos || user.permisos || [];
    const key = (modulo || '').toLowerCase();
    const permiso = permisos.find(p => (p.Modulo || p.modulo || '').toLowerCase() === key);
    return permiso ? (permiso.PuedeCrear || permiso.puedeCrear) : false;
  };

  const canEdit = (modulo) => {
    if (!user) return false;
    const permisos = user.Permisos || user.permisos || [];
    const key = (modulo || '').toLowerCase();
    const permiso = permisos.find(p => (p.Modulo || p.modulo || '').toLowerCase() === key);
    return permiso ? (permiso.PuedeEditar || permiso.puedeEditar) : false;
  };

  const canDelete = (modulo) => {
    if (!user) return false;
    const permisos = user.Permisos || user.permisos || [];
    const key = (modulo || '').toLowerCase();
    const permiso = permisos.find(p => (p.Modulo || p.modulo || '').toLowerCase() === key);
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
    canDelete,
    refreshPermissions,
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
