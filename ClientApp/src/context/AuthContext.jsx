import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      // Check localStorage for user data (HttpOnly cookie cannot be read by JS)
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
      // Backend returns: { UsuarioID, Nombre, Correo, Token }
      // Note: Token is set as HttpOnly cookie by backend, we only store user data
      const { Token, ...usuario } = response;
      
      // Store user data in localStorage (HttpOnly cookie is handled by backend)
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
      // Call backend to clear HttpOnly cookie
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
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
