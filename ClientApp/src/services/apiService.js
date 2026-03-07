import axios from 'axios';
import Cookies from 'js-cookie';

// Use relative path for API calls so Vite proxy can handle them
// In development: Vite proxy will forward /api to https://localhost:44447
// In production: /api will go to the same origin as the frontend
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('authToken');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (correo, password) => 
    apiClient.post('/auth/login', { correo, password }),
  logout: () => apiClient.post('/auth/logout'),
  verify: () => apiClient.get('/auth/verify'),
  getMe: () => apiClient.get('/auth/me'),
};

export const clientesService = {
  getAll: () => apiClient.get('/clientes'),
  getById: (id) => apiClient.get(`/clientes/${id}`),
  search: (query) => apiClient.get(`/clientes/search?q=${encodeURIComponent(query)}`),
  getHistorialCompras: (id) => apiClient.get(`/clientes/${id}/historial-compras`),
  create: (data) => apiClient.post('/clientes', data),
  update: (id, data) => apiClient.put(`/clientes/${id}`, data),
  delete: (id) => apiClient.delete(`/clientes/${id}`),
};

export const serviciosService = {
  getAll: () => apiClient.get('/servicios'),
  getById: (id) => apiClient.get(`/servicios/${id}`),
  create: (data) => apiClient.post('/servicios', data),
  update: (id, data) => apiClient.put(`/servicios/${id}`, data),
  delete: (id) => apiClient.delete(`/servicios/${id}`),
};

export const correosService = {
  getAll: (includeInactive = false) => apiClient.get(`/correos?includeInactive=${includeInactive}`),
  getById: (id) => apiClient.get(`/correos/${id}`),
  create: (data) => apiClient.post('/correos', data),
  update: (id, data) => apiClient.put(`/correos/${id}`, data),
  delete: (id) => apiClient.delete(`/correos/${id}`),
  generateCredentials: () => apiClient.post('/correos/generar-credenciales'),
  reactivate: (id) => apiClient.post(`/correos/${id}/reactivar`),
};

export const cuentasService = {
  getAll: () => apiClient.get('/cuentas'),
  getById: (id) => apiClient.get(`/cuentas/${id}`),
  getByCliente: (clienteId) => apiClient.get(`/cuentas/cliente/${clienteId}`),
  getCorreosDisponibles: () => apiClient.get('/cuentas/correos/disponibles'),
  getDisponibles: () => apiClient.get('/cuentas/disponibles'),
  getPerfilesDisponibles: (id) => apiClient.get(`/cuentas/${id}/perfiles-disponibles`),
  getByFiltro: (filtro) => apiClient.get(`/cuentas/filtro/${filtro}`),
  validarCodigo: (codigo) => apiClient.get(`/cuentas/validar-codigo/${codigo}`),
  verificarEstados: () => apiClient.post('/cuentas/verificar-estados'),
  create: (data) => apiClient.post('/cuentas', data),
  update: (id, data) => apiClient.put(`/cuentas/${id}`, data),
  delete: (id) => apiClient.delete(`/cuentas/${id}`),
  renovar: (id, data) => apiClient.post(`/cuentas/${id}/renovar`, data),
  generateCredentials: () => apiClient.post('/cuentas/generar-credenciales'),
};

export const ventasService = {
  getAll: () => apiClient.get('/ventas'),
  getById: (id) => apiClient.get(`/ventas/${id}`),
  getCompleta: (id) => apiClient.get(`/ventas/${id}/Completa`),
  getByCliente: (clienteId) => apiClient.get(`/ventas/cliente/${clienteId}`),
  getByFiltro: (filtro) => apiClient.get(`/ventas/filtro/${filtro}`),
  create: (data) => apiClient.post('/ventas', data),
  update: (id, data) => apiClient.put(`/ventas/${id}`, data),
  actualizar: (id, data) => apiClient.put(`/ventas/${id}/Actualizar`, data),
  delete: (id) => apiClient.delete(`/ventas/${id}`),
  renovar: (id, data) => apiClient.post(`/ventas/${id}/renovar`, data),
  verificarEstados: () => apiClient.post('/ventas/verificar-estados'),
  getProximasVencer: () => apiClient.get('/ventas/proximas-vencer'),
  getVencidas: () => apiClient.get('/ventas/vencidas'),
};

export const mediosPagoService = {
  getAll: () => apiClient.get('/mediospago'),
  getById: (id) => apiClient.get(`/mediospago/${id}`),
  create: (data) => apiClient.post('/mediospago', data),
  update: (id, data) => apiClient.put(`/mediospago/${id}`, data),
  delete: (id) => apiClient.delete(`/mediospago/${id}`),
};

export const usuariosService = {
  getAll: (includeInactive = false) => apiClient.get(`/usuarios?includeInactive=${includeInactive}`),
  getById: (id) => apiClient.get(`/usuarios/${id}`),
  create: (data) => apiClient.post('/usuarios', data),
  update: (id, data) => apiClient.put(`/usuarios/${id}`, data),
  delete: (id) => apiClient.delete(`/usuarios/${id}`),
  reactivate: (id) => apiClient.post(`/usuarios/${id}/reactivar`),
};

export const dashboardService = {
  getCompleto: (fechaInicio, fechaFin) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    return apiClient.get(`/dashboard/completo?${params.toString()}`);
  },
  getStats: () => apiClient.get('/dashboard/resumen'),
  getRecentActivity: () => apiClient.get('/dashboard/resumen'),
};

export const combosService = {
  getAll: () => apiClient.get('/combos'),
  getById: (id) => apiClient.get(`/combos/${id}`),
  create: (data) => apiClient.post('/combos', data),
  update: (id, data) => apiClient.put(`/combos/${id}`, data),
  delete: (id) => apiClient.delete(`/combos/${id}`),
};

export const rolesService = {
  getAll: (includeInactive = false) => apiClient.get(`/roles?includeInactive=${includeInactive}`),
  getById: (id) => apiClient.get(`/roles/${id}`),
  getModulos: () => apiClient.get('/roles/modulos'),
  create: (data) => apiClient.post('/roles', data),
  update: (id, data) => apiClient.put(`/roles/${id}`, data),
  delete: (id) => apiClient.delete(`/roles/${id}`),
};

export default apiClient;
