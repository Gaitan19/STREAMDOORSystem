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
import { formatDate, getEstadoColor, copyToClipboard, getRowColorClass, generatePassword } from '../utils/helpers';

const Cuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [perfilesModalOpen, setPerfilesModalOpen] = useState(false);
  const [detallesModalOpen, setDetallesModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [selectedCuentaForPerfiles, setSelectedCuentaForPerfiles] = useState(null);
  const [alert, setAlert] = useState(null);
  const [correos, setCorreos] = useState([]);
  const [correosDisponibles, setCorreosDisponibles] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [formData, setFormData] = useState({
    servicioID: '',
    correoID: '',
    tipoCuenta: 'Propia',
    numeroPerfiles: 1,
    fechaFinalizacion: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

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
      setFilteredCuentas(cuentasData);
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

  const handleSearch = (searchTerm) => {
    const filtered = cuentas.filter(cuenta =>
      cuenta.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.nombreServicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.estado?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCuentas(filtered);
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

  const handleFiltroChange = (filtro) => {
    setFiltroEstado(filtro);
    loadData(filtro);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.servicioID) {
      newErrors.servicioID = 'El servicio es requerido';
    }

    if (formData.tipoCuenta === 'Propia' && !formData.correoID) {
      newErrors.correoID = 'Debe seleccionar un correo para cuentas propias';
    }

    if (formData.tipoCuenta === 'Terceros') {
      if (!formData.email) {
        newErrors.email = 'El email es requerido para cuentas de terceros';
      }
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida para cuentas de terceros';
      }
    }

    if (!formData.numeroPerfiles || formData.numeroPerfiles < 1) {
      newErrors.numeroPerfiles = 'Debe tener al menos 1 perfil';
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
        FechaFinalizacion: formData.fechaFinalizacion || null
      };

      // For Propia accounts, use selected CorreoID
      if (formData.tipoCuenta === 'Propia') {
        payload.CorreoID = formData.correoID ? parseInt(formData.correoID) : null;
      } 
      // For Terceros accounts, send Email and Password for backend to create Correo
      else if (formData.tipoCuenta === 'Terceros') {
        payload.Email = formData.email;
        payload.Password = formData.password;
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
      email: '',
      password: ''
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

  const resetForm = () => {
    setFormData({
      servicioID: '',
      correoID: '',
      tipoCuenta: 'Propia',
      numeroPerfiles: 1,
      fechaFinalizacion: '',
      email: '',
      password: ''
    });
    setErrors({});
    setSelectedCuenta(null);
  };

  const handleVerPerfiles = (cuenta) => {
    setSelectedCuentaForPerfiles(cuenta);
    setPerfilesModalOpen(true);
  };

  const handleVerDetalles = (cuenta) => {
    setSelectedCuenta(cuenta);
    setDetallesModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      key: 'email', 
      label: 'Email',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.email ? (
            <>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{row.email}</code>
              <button
                onClick={() => handleCopyToClipboard(row.email, 'Email')}
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
      )
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(row.estado)}`}>
          {row.estado}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
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
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4 flex gap-4 items-center">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} placeholder="Buscar por email, servicio o estado..." />
          </div>
          <div className="w-64">
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
        </div>
        <Table columns={columns} data={filteredCuentas} loading={loading} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
              <Select
                label="Correo Disponible"
                name="correoID"
                value={formData.correoID}
                onChange={(e) => {
                  handleChange(e);
                  // Find selected correo to show password
                  const selectedCorreo = correosDisponibles.find(c => c.correoID === parseInt(e.target.value));
                  if (selectedCorreo) {
                    setFormData(prev => ({ ...prev, email: selectedCorreo.email, password: selectedCorreo.password }));
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
              />
              
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
            </>
          ) : (
            <>
              <Input
                label="Email (para la cuenta de terceros)"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="correo@ejemplo.com"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
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
            label="Fecha de Finalización (opcional)"
            name="fechaFinalizacion"
            type="date"
            value={formData.fechaFinalizacion}
            onChange={handleChange}
            error={errors.fechaFinalizacion}
          />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium mb-1">ℹ️ Información</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Cuenta Propia:</strong> Usa correos disponibles (no usados por otras cuentas)</li>
              <li><strong>Cuenta de Terceros:</strong> Registra email y contraseña manualmente</li>
              <li>Los perfiles se crean automáticamente. Edítelos luego con "Ver Perfiles"</li>
              <li>La fecha de finalización es opcional (útil para control de vencimientos)</li>
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
        cuentaNombre={selectedCuentaForPerfiles?.nombreServicio || 'Cuenta'}
      />

      {/* Detalles Modal */}
      <Modal
        isOpen={detallesModalOpen}
        onClose={() => {
          setDetallesModalOpen(false);
          setSelectedCuenta(null);
        }}
        title="Detalles de la Cuenta"
        size="lg"
      >
        {selectedCuenta && (
          <div className="space-y-4">
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
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="flex items-center gap-2">
                  <p className="text-base font-mono">{selectedCuenta.email || 'N/A'}</p>
                  {selectedCuenta.email && (
                    <button
                      onClick={() => handleCopyToClipboard(selectedCuenta.email, 'Email')}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
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
                <p className="text-base">{selectedCuenta.perfilesDisponibles} disponibles / {selectedCuenta.numeroPerfiles} total</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                <p className="text-base">{formatDate(selectedCuenta.fechaCreacion)}</p>
              </div>
              {selectedCuenta.fechaFinalizacion && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Fecha de Finalización</label>
                  <p className="text-base">{formatDate(selectedCuenta.fechaFinalizacion)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Cuentas;
