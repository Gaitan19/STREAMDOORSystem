import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CreditCard, Copy, Eye, Users, Key } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import PerfilesModal from '../components/PerfilesModal';
import { cuentasService, serviciosService } from '../services/apiService';
import { formatDate, getEstadoColor, copyToClipboard, getRowColorClass, generatePassword, generateCodigoCuenta } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || 'C$';
const CURRENCY_NAME = import.meta.env.VITE_CURRENCY_NAME || 'Cordobas';

const Cuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [perfilesModalOpen, setPerfilesModalOpen] = useState(false);
  const [detallesModalOpen, setDetallesModalOpen] = useState(false);
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [nuevaFechaFin, setNuevaFechaFin] = useState('');
  const [renovarLoading, setRenovarLoading] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [selectedCuentaForPerfiles, setSelectedCuentaForPerfiles] = useState(null);
  const [perfilesDetalles, setPerfilesDetalles] = useState([]); // NEW: For detalles modal
  const [alert, setAlert] = useState(null);
  const [correos, setCorreos] = useState([]);
  const [correosDisponibles, setCorreosDisponibles] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroServicio, setFiltroServicio] = useState('todos'); // NEW: Filter by service
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    servicioID: '',
    correoID: '',
    tipoCuenta: 'Propia',
    numeroPerfiles: 1,
    fechaFinalizacion: '',
    email: '',
    password: '',
    correoTerceros: '',
    codigoCuenta: '',
    moneda: CURRENCY_SYMBOL,
    costo: ''
  });
  const [errors, setErrors] = useState({});

  const { canCreate, canEdit, canDelete } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const applyCuentasFilters = (data, servicioID, term) => {
    let result = data;
    if (servicioID !== 'todos') {
      result = result.filter(cuenta => cuenta.servicioID?.toString() === servicioID);
    }
    if (term) {
      const lower = term.toLowerCase();
      result = result.filter(cuenta =>
        cuenta.email?.toLowerCase().includes(lower) ||
        cuenta.codigoCuenta?.toLowerCase().includes(lower) ||
        cuenta.nombreServicio?.toLowerCase().includes(lower) ||
        cuenta.estado?.toLowerCase().includes(lower) ||
        cuenta.disponibilidad?.toLowerCase().includes(lower) ||
        cuenta.estadoSuscripcion?.toLowerCase().includes(lower)
      );
    }
    return result;
  };

  const loadData = async (filtro = 'todas') => {
    try {
      setLoading(true);
      const [serviciosData, correosData, correosDispData] = await Promise.all([
        serviciosService.getAll(),
        fetch('/api/correos', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/cuentas/correos/disponibles', { credentials: 'include' }).then(r => r.json())
      ]);
      
      // Load cuentas based on filter
      let cuentasData;
      if (filtro === 'todas') {
        cuentasData = await cuentasService.getAll();
      } else {
        cuentasData = await fetch(`/api/cuentas/filtro/${filtro}`, { 
          credentials: 'include' 
        }).then(r => r.json());
      }
      
      setCuentas(cuentasData);

      // Re-apply active service filter and search term after reload
      setFilteredCuentas(applyCuentasFilters(cuentasData, filtroServicio, searchTerm));
      setServicios(serviciosData);
      setCorreos(correosData);
      setCorreosDisponibles(correosDispData);
    } catch {
      showAlert('error', 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setFilteredCuentas(applyCuentasFilters(cuentas, filtroServicio, term));
  };
  
  const handleFiltroServicioChange = (servicioID) => {
    setFiltroServicio(servicioID);
    setFilteredCuentas(applyCuentasFilters(cuentas, servicioID, searchTerm));
  };

  const handleCopyToClipboard = async (text, field) => {
    try {
      const message = await copyToClipboard(text, field);
      showAlert('success', message);
    } catch (error) {
      showAlert('error', error.message);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(16);
    setFormData(prev => ({ ...prev, password: newPassword }));
    showAlert('success', 'Contraseña generada');
  };

  const handleGenerateCodigoCuenta = async () => {
    try {
      // Get selected servicio name
      const selectedServicio = servicios.find(s => s.servicioID === parseInt(formData.servicioID));
      if (!selectedServicio) {
        showAlert('error', 'Debe seleccionar un servicio primero');
        return;
      }

      // Generate code
      const codigo = generateCodigoCuenta(selectedServicio.nombre);
      
      // Validate uniqueness
      const response = await cuentasService.validarCodigo(codigo);
      if (response.existe) {
        // Code already exists, generate again
        showAlert('warning', 'Código ya existe. Generando otro...');
        handleGenerateCodigoCuenta(); // Recursive call
        return;
      }

      setFormData(prev => ({ ...prev, codigoCuenta: codigo }));
      showAlert('success', `Código generado: ${codigo}`);
    } catch (error) {
      console.error('Error generating code:', error);
      showAlert('error', 'Error al generar código');
    }
  };

  const handleFiltroChange = (filtro) => {
    setFiltroEstado(filtro);
    loadData(filtro);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.servicioID) {
      newErrors.servicioID = 'El servicio es requerido';
    }

    if (!formData.codigoCuenta) {
      newErrors.codigoCuenta = 'El código de cuenta es requerido. Use el botón para generar uno.';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (formData.tipoCuenta === 'Propia' && !formData.correoID) {
      newErrors.correoID = 'Debe seleccionar un correo para cuentas propias';
    }

    if (formData.tipoCuenta === 'Terceros') {
      if (!formData.correoTerceros) {
        newErrors.correoTerceros = 'El correo de terceros es requerido';
      }
    }

    if (!formData.numeroPerfiles || formData.numeroPerfiles < 1) {
      newErrors.numeroPerfiles = 'Debe tener al menos 1 perfil';
    }

    if (!formData.fechaFinalizacion) {
      newErrors.fechaFinalizacion = 'La fecha de finalización es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        ServicioID: parseInt(formData.servicioID),
        TipoCuenta: formData.tipoCuenta,
        NumeroPerfiles: parseInt(formData.numeroPerfiles),
        FechaFinalizacion: formData.fechaFinalizacion || null,
        Password: formData.password,
        CodigoCuenta: formData.codigoCuenta,
        Costo: formData.costo ? parseFloat(formData.costo) : null,
        Moneda: formData.moneda || CURRENCY_SYMBOL
      };

      // For Propia accounts, use selected CorreoID
      if (formData.tipoCuenta === 'Propia') {
        payload.CorreoID = formData.correoID ? parseInt(formData.correoID) : null;
      } 
      // For Terceros accounts, send CorreoTerceros
      else if (formData.tipoCuenta === 'Terceros') {
        payload.CorreoTerceros = formData.correoTerceros;
        payload.CorreoID = null;
      }

      if (selectedCuenta) {
        await cuentasService.update(selectedCuenta.cuentaID, payload);
        showAlert('success', 'Cuenta actualizada exitosamente');
      } else {
        await cuentasService.create(payload);
        showAlert('success', 'Cuenta creada exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadData(filtroEstado);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al guardar cuenta';
      showAlert('error', errorMsg);
      if (errorMsg.includes('correo')) {
        setErrors({ email: errorMsg });
      }
    }
  };

  const handleEdit = (cuenta) => {
    setSelectedCuenta(cuenta);
    setFormData({
      servicioID: cuenta.servicioID?.toString() || '',
      correoID: cuenta.correoID?.toString() || '',
      tipoCuenta: cuenta.tipoCuenta || 'Propia',
      numeroPerfiles: cuenta.numeroPerfiles || 1,
      fechaFinalizacion: cuenta.fechaFinalizacion ? cuenta.fechaFinalizacion.split('T')[0] : '',
      email: cuenta.email || '',
      password: cuenta.password || '',
      correoTerceros: cuenta.correoTerceros || '',
      codigoCuenta: cuenta.codigoCuenta || '',
      costo: cuenta.costo || '',
      moneda: cuenta.moneda || CURRENCY_SYMBOL
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await cuentasService.delete(selectedCuenta.cuentaID);
      showAlert('success', 'Cuenta eliminada exitosamente');
      setDeleteModalOpen(false);
      setSelectedCuenta(null);
      loadData(filtroEstado);
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar cuenta');
    }
  };

  const handleVerificarEstados = async () => {
    try {
      setLoading(true);
      const response = await cuentasService.verificarEstados();
      showAlert('success', response.message);
      loadData(filtroEstado); // Reload data to show updated estados
    } catch (error) {
      showAlert('error', 'Error al verificar estados de cuentas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      servicioID: '',
      correoID: '',
      tipoCuenta: 'Propia',
      numeroPerfiles: 1,
      fechaFinalizacion: '',
      email: '',
      password: '',
      correoTerceros: '',
      codigoCuenta: '',
      costo: '',
      moneda: CURRENCY_SYMBOL
    });
    setErrors({});
    setSelectedCuenta(null);
  };

  const handleVerPerfiles = (cuenta) => {
    setSelectedCuentaForPerfiles(cuenta);
    setPerfilesModalOpen(true);
  };

  const handleVerDetalles = async (cuenta) => {
    try {
      // Load profiles for this cuenta
      const response = await fetch(`/api/perfiles/por-cuenta/${cuenta.cuentaID}`, {
        credentials: 'include'
      });
      const perfiles = await response.json();
      setPerfilesDetalles(perfiles);
      setSelectedCuenta(cuenta);
      setDetallesModalOpen(true);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setPerfilesDetalles([]);
      setSelectedCuenta(cuenta);
      setDetallesModalOpen(true);
    }
  };

  const handleRenovar = () => {
    setNuevaFechaFin('');
    setRenovarModalOpen(true);
  };

  const handleConfirmarRenovacion = async () => {
    if (!nuevaFechaFin) return;
    setRenovarLoading(true);
    try {
      await cuentasService.renovar(selectedCuenta.cuentaID, { nuevaFechaFinalizacion: nuevaFechaFin });
      showAlert('success', `Cuenta ${selectedCuenta.codigoCuenta} renovada correctamente hasta el ${new Date(nuevaFechaFin).toLocaleDateString('es-NI')}.`);
      setRenovarModalOpen(false);
      setDetallesModalOpen(false);
      setSelectedCuenta(null);
      setPerfilesDetalles([]);
      loadData(filtroEstado);
    } catch {
      showAlert('error', 'Error al renovar la cuenta. Intente nuevamente.');
    } finally {
      setRenovarLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // When service changes, reload available emails for that service
    if (name === 'servicioID' && value && formData.tipoCuenta === 'Propia') {
      try {
        const response = await fetch(`/api/cuentas/correos/disponibles-por-servicio/${value}`, {
          credentials: 'include'
        });
        const correosData = await response.json();
        setCorreosDisponibles(correosData);
        // Reset correo selection when service changes
        setFormData(prev => ({ ...prev, correoID: '', email: '', password: '' }));
      } catch (error) {
        console.error('Error loading correos for service:', error);
        showAlert('error', 'Error al cargar correos disponibles');
      }
    }

    // When tipo cuenta changes, reload emails if switching to Propia and service is selected
    if (name === 'tipoCuenta' && value === 'Propia' && formData.servicioID) {
      try {
        const response = await fetch(`/api/cuentas/correos/disponibles-por-servicio/${formData.servicioID}`, {
          credentials: 'include'
        });
        const correosData = await response.json();
        setCorreosDisponibles(correosData);
      } catch (error) {
        console.error('Error loading correos for service:', error);
      }
    }
  };

  const columns = [
    { 
      key: 'nombreServicio', 
      label: 'Servicio',
      render: (row) => (
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-blue-600" />
          <span className="font-medium">{row.nombreServicio || 'N/A'}</span>
        </div>
      )
    },
    { 
      key: 'codigoCuenta', 
      label: 'Código',
      render: (row) => (
        <code className="bg-blue-50 px-2 py-1 rounded text-sm font-mono font-semibold text-blue-700">
          {row.codigoCuenta || 'N/A'}
        </code>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (row) => {
        const email = row.tipoCuenta === 'Terceros' ? row.correoTerceros : row.email;
        return (
          <div className="flex items-center gap-2">
            {email ? (
              <>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{email}</code>
                <button
                  onClick={() => handleCopyToClipboard(email, 'Email')}
                  className="p-1 text-gray-600 hover:text-blue-600"
                  title="Copiar email"
                >
                  <Copy size={16} />
                </button>
              </>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'tipoCuenta', 
      label: 'Tipo',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.tipoCuenta === 'Propia' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.tipoCuenta}
        </span>
      )
    },
    { 
      key: 'numeroPerfiles', 
      label: 'Perfiles (Disp/Total)',
      render: (row) => (
        <div className="text-center">
          <span className="text-sm font-medium">{row.perfilesDisponibles || 0}</span>
          <span className="text-gray-400 text-xs"> / {row.numeroPerfiles || 0}</span>
        </div>
      )
    },
    { 
      key: 'fechaFinalizacion', 
      label: 'Vencimiento',
      render: (row) => (
        <div className="text-sm">
          {row.fechaFinalizacion ? formatDate(row.fechaFinalizacion) : <span className="text-gray-400">Sin fecha</span>}
        </div>
      )
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(row.disponibilidad || row.estado)}`}>
            {row.disponibilidad || row.estado}
          </span>
          {row.estadoSuscripcion && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.estadoSuscripcion === 'Vencida' ? 'bg-red-100 text-red-800' :
              row.estadoSuscripcion === 'Próxima a Vencer' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              {row.estadoSuscripcion}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-1">
          {canEdit('cuentas') && (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit size={18} />
            </button>
          )}
          <button
            onClick={() => handleVerPerfiles(row)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Ver Perfiles"
          >
            <Users size={18} />
          </button>
          <button
            onClick={() => handleVerDetalles(row)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Ver Detalles"
          >
            <Eye size={18} />
          </button>
          {canDelete('cuentas') && (
            <button
              onClick={() => {
                setSelectedCuenta(row);
                setDeleteModalOpen(true);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuentas</h1>
          <p className="text-gray-600 mt-2">Gestión de cuentas de servicios</p>
        </div>
        {canCreate('cuentas') && (
          <Button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Cuenta
          </Button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4 space-y-4">
          {/* Search Bar - Full width on mobile, stays on top */}
          <div className="w-full">
            <SearchBar onSearch={handleSearch} placeholder="Buscar por email, servicio o estado..." />
          </div>
          
          {/* Filters and Button - Stack on mobile, row on larger screens */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 sm:w-auto">
              <select
                value={filtroServicio}
                onChange={(e) => handleFiltroServicioChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">📋 Todos los servicios</option>
                {servicios.map(servicio => (
                  <option key={servicio.servicioID} value={servicio.servicioID.toString()}>
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 sm:w-auto">
              <select
                value={filtroEstado}
                onChange={(e) => handleFiltroChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas las cuentas</option>
                <option value="disponibles">✅ Disponibles</option>
                <option value="no-disponibles">⛔ No Disponibles</option>
                <option value="vencidas">🔴 Vencidas</option>
                <option value="proximas-a-vencer">🟠 Próximas a Vencer (5 días)</option>
              </select>
            </div>
            <Button
              onClick={handleVerificarEstados}
              variant="secondary"
              className="flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Verificar Estados
            </Button>
          </div>
        </div>
        <Table columns={columns} data={filteredCuentas} loading={loading} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedCuenta ? 
          `Editar Cuenta - ${selectedCuenta.nombreServicio} - ${selectedCuenta.codigoCuenta}` 
          : 'Nueva Cuenta'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Servicio"
            name="servicioID"
            value={formData.servicioID}
            onChange={handleChange}
            error={errors.servicioID}
            options={servicios
              .filter(s => s.servicioID != null)
              .map(s => ({
                value: s.servicioID.toString(),
                label: s.nombre || 'Sin nombre'
              }))}
            required
          />

          {/* Código de Cuenta - Required for all */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Cuenta
            </label>
            <div className="flex gap-2">
              <Input
                name="codigoCuenta"
                type="text"
                value={formData.codigoCuenta}
                readOnly
                placeholder="Ej: NE192599"
                error={errors.codigoCuenta}
                required
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateCodigoCuenta}
                title="Generar Código"
              >
                <Key size={16} />
              </Button>
            </div>
            {errors.codigoCuenta && <p className="text-red-500 text-xs mt-1">{errors.codigoCuenta}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Código único para identificar la cuenta (2 letras del servicio + 6 números)
            </p>
          </div>

          <Select
            label="Tipo de Cuenta"
            name="tipoCuenta"
            value={formData.tipoCuenta}
            onChange={handleChange}
            options={[
              { value: 'Propia', label: '🏢 Propia (Cuenta del negocio)' },
              { value: 'Terceros', label: '👤 Terceros (Cuenta externa)' }
            ]}
            required
          />

          {/* Dynamic fields based on TipoCuenta */}
          {formData.tipoCuenta === 'Propia' ? (
            <>
              <div>
                <Select
                  label="Correo Disponible"
                  name="correoID"
                  value={formData.correoID}
                  onChange={(e) => {
                    handleChange(e);
                    // Find selected correo to show password
                    const selectedCorreo = correosDisponibles.find(c => c.correoID === parseInt(e.target.value));
                    if (selectedCorreo) {
                      setFormData(prev => ({ ...prev, email: selectedCorreo.email, password: generatePassword(16) }));
                    }
                  }}
                  error={errors.correoID}
                  options={correosDisponibles
                    .filter(c => c.correoID != null)
                    .map(c => ({
                      value: c.correoID.toString(),
                      label: c.email || 'Sin email'
                    }))}
                  required
                  disabled={!formData.servicioID}
                />
                {!formData.servicioID && (
                  <p className="text-amber-600 text-xs mt-1">
                    ⚠️ Seleccione un servicio primero para ver los correos disponibles
                  </p>
                )}
                {formData.servicioID && correosDisponibles.length === 0 && (
                  <p className="text-red-600 text-xs mt-1">
                    ❌ No hay correos disponibles para este servicio. El mismo correo no puede usarse dos veces para el mismo servicio.
                  </p>
                )}
                {formData.servicioID && correosDisponibles.length > 0 && (
                  <p className="text-gray-500 text-xs mt-1">
                    ℹ️ Un correo puede usarse para diferentes servicios, pero no dos veces para el mismo servicio
                  </p>
                )}
              </div>
              
              {formData.correoID && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Credenciales del Correo Seleccionado:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-800 font-mono">{formData.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(formData.email, 'Email')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-blue-800 font-mono">{formData.password}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard(formData.password, 'Contraseña')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Password for Propia accounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña de la Cuenta
                </label>
                <div className="flex gap-2">
                  <Input
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="StreamDoorNic!2Gv7@p"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGeneratePassword}
                    title="Generar contraseña segura"
                  >
                    <Key size={16} />
                  </Button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Contraseña para acceder a la cuenta del servicio
                </p>
              </div>
            </>
          ) : (
            <>
              <Input
                label="Correo de la Cuenta de Terceros"
                name="correoTerceros"
                type="email"
                value={formData.correoTerceros}
                onChange={handleChange}
                error={errors.correoTerceros}
                placeholder="correo@ejemplo.com"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña de la Cuenta
                </label>
                <div className="flex gap-2">
                  <Input
                    name="password"
                    type="text"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Contraseña de la cuenta"
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleGeneratePassword}
                  >
                    <Key size={16} />
                  </Button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </>
          )}

          <Input
            label="Número de Perfiles"
            name="numeroPerfiles"
            type="number"
            min="1"
            value={formData.numeroPerfiles}
            onChange={handleChange}
            error={errors.numeroPerfiles}
            required
          />

          <Input
            label="Fecha de Finalización *"
            name="fechaFinalizacion"
            type="date"
            value={formData.fechaFinalizacion}
            onChange={handleChange}
            error={errors.fechaFinalizacion}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda *
            </label>
            <select
              name="moneda"
              value={formData.moneda}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={CURRENCY_SYMBOL}>{CURRENCY_SYMBOL} — {CURRENCY_NAME}</option>
              <option value="$">$ — Dólares</option>
            </select>
          </div>

          <Input
            label={`Costo de la Cuenta (${formData.moneda || CURRENCY_SYMBOL})`}
            name="costo"
            type="number"
            step="0.01"
            min="0"
            value={formData.costo}
            onChange={handleChange}
            error={errors.costo}
            placeholder="Ej: 150.00"
          />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium mb-1">ℹ️ Información</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Cuenta Propia:</strong> Usa correos disponibles (no usados por otras cuentas)</li>
              <li><strong>Cuenta de Terceros:</strong> Registra email y contraseña manualmente</li>
              <li>Los perfiles se crean automáticamente. Edítelos luego con "Ver Perfiles"</li>
              <li>La fecha de finalización es opcional (útil para control de vencimientos)</li>
              <li><strong>Costo:</strong> Ingrese el costo de compra/creación de la cuenta</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {selectedCuenta ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCuenta(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar esta cuenta?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedCuenta(null);
            }}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Perfiles Modal */}
      <PerfilesModal
        isOpen={perfilesModalOpen}
        onClose={() => {
          setPerfilesModalOpen(false);
          setSelectedCuentaForPerfiles(null);
          loadData(filtroEstado); // Reload to update disponibles count
        }}
        cuentaId={selectedCuentaForPerfiles?.cuentaID}
        cuentaNombre={`Perfiles - ${selectedCuentaForPerfiles?.nombreServicio || ''} - ${selectedCuentaForPerfiles?.codigoCuenta || ''}`}
      />

      {/* Detalles Modal */}
      <Modal
        isOpen={detallesModalOpen}
        onClose={() => {
          setDetallesModalOpen(false);
          setSelectedCuenta(null);
          setPerfilesDetalles([]);
        }}
        title={selectedCuenta ? `Detalles de la Cuenta - ${selectedCuenta.nombreServicio} - ${selectedCuenta.codigoCuenta}` : "Detalles de la Cuenta"}
        size="lg"
      >
        {selectedCuenta && (
          <div className="space-y-6">
            {/* Código de Cuenta - Destacado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="text-xs font-medium text-blue-700 uppercase">Código de Cuenta</label>
              <p className="text-2xl font-mono font-bold text-blue-900 mt-1">{selectedCuenta.codigoCuenta || 'N/A'}</p>
            </div>

            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Información Básica</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Servicio</label>
                  <p className="text-base font-semibold">{selectedCuenta.nombreServicio}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Cuenta</label>
                  <p className="text-base">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCuenta.tipoCuenta === 'Propia' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedCuenta.tipoCuenta}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <p className="text-base">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(selectedCuenta.estado)}`}>
                      {selectedCuenta.estado}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Perfiles</label>
                  <p className="text-base">
                    {perfilesDetalles.filter(p => p.estado === 'Disponible').length} disponibles / {perfilesDetalles.length} total
                  </p>
                </div>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Credenciales</h3>
              <div className="grid grid-cols-1 gap-3">
                {selectedCuenta.tipoCuenta === 'Propia' && selectedCuenta.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email (Correo del Negocio)</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <p className="text-base font-mono flex-1">{selectedCuenta.email}</p>
                      <button
                        onClick={() => handleCopyToClipboard(selectedCuenta.email, 'Email')}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Copiar email"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {selectedCuenta.tipoCuenta === 'Terceros' && selectedCuenta.correoTerceros && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email de Terceros</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <p className="text-base font-mono flex-1">{selectedCuenta.correoTerceros}</p>
                      <button
                        onClick={() => handleCopyToClipboard(selectedCuenta.correoTerceros, 'Email')}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Copiar email"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {selectedCuenta.password && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Contraseña de la Cuenta</label>
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <p className="text-base font-mono flex-1">{selectedCuenta.password}</p>
                      <button
                        onClick={() => handleCopyToClipboard(selectedCuenta.password, 'Contraseña')}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Copiar contraseña"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Cost Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Fechas y Costo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                  <p className="text-base">{formatDate(selectedCuenta.fechaCreacion)}</p>
                </div>
                {selectedCuenta.fechaFinalizacion && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Fecha de Finalización</label>
                    <p className="text-base">{formatDate(selectedCuenta.fechaFinalizacion)}</p>
                  </div>
                )}
                {selectedCuenta.costo != null && selectedCuenta.costo > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Costo de la Cuenta</label>
                    <p className="text-base font-semibold text-green-700">{selectedCuenta.moneda || CURRENCY_SYMBOL} {Number(selectedCuenta.costo).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
              </div>
              {/* Renewal button for expired accounts */}
              {selectedCuenta.estadoSuscripcion === 'Vencida' && canEdit('Cuentas') && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Cuenta Vencida</p>
                      <p className="text-xs text-orange-600">Selecciona una nueva fecha de vencimiento para renovar esta cuenta.</p>
                    </div>
                  </div>
                  <Button
                    variant="warning"
                    onClick={handleRenovar}
                    className="w-full"
                  >
                    Renovar Cuenta
                  </Button>
                </div>
              )}
            </div>

            {/* Profiles Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Perfiles de la Cuenta</h3>
              {perfilesDetalles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Número</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">PIN</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfilesDetalles.map((perfil) => (
                        <tr key={perfil.perfilID} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{perfil.numeroPerfil}</td>
                          <td className="py-2 px-3 font-mono text-gray-600">{perfil.pin || 'Sin PIN'}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              perfil.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                              perfil.estado === 'Ocupado' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {perfil.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No hay perfiles registrados para esta cuenta.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Renovar Cuenta Modal */}
      <Modal
        isOpen={renovarModalOpen}
        onClose={() => setRenovarModalOpen(false)}
        title={`Renovar Cuenta — ${selectedCuenta?.codigoCuenta || ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona la nueva fecha de vencimiento para la cuenta <strong>{selectedCuenta?.codigoCuenta}</strong> ({selectedCuenta?.nombreServicio}).
            {selectedCuenta?.costo > 0 && (
              <span> Se generará automáticamente un egreso por <strong>{selectedCuenta?.moneda || CURRENCY_SYMBOL} {Number(selectedCuenta?.costo).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</strong>.</span>
            )}
          </p>
          <Input
            label="Nueva Fecha de Vencimiento"
            type="date"
            value={nuevaFechaFin}
            onChange={e => setNuevaFechaFin(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setRenovarModalOpen(false)}
              className="flex-1"
              disabled={renovarLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmarRenovacion}
              className="flex-1"
              disabled={!nuevaFechaFin || renovarLoading}
            >
              {renovarLoading ? 'Renovando...' : 'Confirmar Renovación'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Cuentas;
