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
};

export const clientesService = {
  getAll: () => apiClient.get('/clientes'),
  getById: (id) => apiClient.get(`/clientes/${id}`),
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
  getAll: () => apiClient.get('/correos'),
  getById: (id) => apiClient.get(`/correos/${id}`),
  create: (data) => apiClient.post('/correos', data),
  update: (id, data) => apiClient.put(`/correos/${id}`, data),
  delete: (id) => apiClient.delete(`/correos/${id}`),
  generateCredentials: () => apiClient.post('/correos/generar-credenciales'),
};

export const cuentasService = {
  getAll: () => apiClient.get('/cuentas'),
  getById: (id) => apiClient.get(`/cuentas/${id}`),
  getByCliente: (clienteId) => apiClient.get(`/cuentas/cliente/${clienteId}`),
  getCorreosDisponibles: () => apiClient.get('/cuentas/correos/disponibles'),
  getByFiltro: (filtro) => apiClient.get(`/cuentas/filtro/${filtro}`),
  validarCodigo: (codigo) => apiClient.get(`/cuentas/validar-codigo/${codigo}`),
  verificarEstados: () => apiClient.post('/cuentas/verificar-estados'),
  create: (data) => apiClient.post('/cuentas', data),
  update: (id, data) => apiClient.put(`/cuentas/${id}`, data),
  delete: (id) => apiClient.delete(`/cuentas/${id}`),
  generateCredentials: () => apiClient.post('/cuentas/generar-credenciales'),
};

export const ventasService = {
  getAll: () => apiClient.get('/ventas'),
  getById: (id) => apiClient.get(`/ventas/${id}`),
  getByCliente: (clienteId) => apiClient.get(`/ventas/cliente/${clienteId}`),
  create: (data) => apiClient.post('/ventas', data),
  update: (id, data) => apiClient.put(`/ventas/${id}`, data),
  delete: (id) => apiClient.delete(`/ventas/${id}`),
  renovar: (id, data) => apiClient.post(`/ventas/${id}/renovar`, data),
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
  getAll: () => apiClient.get('/usuarios'),
  getById: (id) => apiClient.get(`/usuarios/${id}`),
  create: (data) => apiClient.post('/usuarios', data),
  update: (id, data) => apiClient.put(`/usuarios/${id}`, data),
  delete: (id) => apiClient.delete(`/usuarios/${id}`),
};

export const dashboardService = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getRecentActivity: () => apiClient.get('/dashboard/recent-activity'),
};

export default apiClient;
