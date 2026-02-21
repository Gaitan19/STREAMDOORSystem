import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CreditCard, RefreshCw, Copy, User } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { cuentasService, clientesService, serviciosService } from '../services/apiService';
import { generatePassword } from '../utils/helpers';

const Cuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    servicioId: '',
    usuario: '',
    password: '',
    perfilNombre: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cuentasData, clientesData, serviciosData] = await Promise.all([
        cuentasService.getAll(),
        clientesService.getAll(),
        serviciosService.getAll()
      ]);
      setCuentas(cuentasData);
      setFilteredCuentas(cuentasData);
      setClientes(clientesData);
      setServicios(serviciosData);
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
      cuenta.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cuenta.servicioNombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCuentas(filtered);
  };

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setFormData(prev => ({ ...prev, password }));
    showAlert('success', 'Contraseña generada automáticamente');
  };

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    showAlert('success', `${field} copiado al portapapeles`);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.clienteId) {
      newErrors.clienteId = 'El cliente es requerido';
    }

    if (!formData.servicioId) {
      newErrors.servicioId = 'El servicio es requerido';
    }

    if (!formData.usuario?.trim()) {
      newErrors.usuario = 'El usuario es requerido';
    }

    if (!formData.password?.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        ...formData,
        clienteId: parseInt(formData.clienteId),
        servicioId: parseInt(formData.servicioId)
      };

      if (selectedCuenta) {
        await cuentasService.update(selectedCuenta.cuentaId, payload);
        showAlert('success', 'Cuenta actualizada exitosamente');
      } else {
        await cuentasService.create(payload);
        showAlert('success', 'Cuenta creada exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al guardar cuenta');
    }
  };

  const handleEdit = (cuenta) => {
    setSelectedCuenta(cuenta);
    setFormData({
      clienteId: cuenta.clienteId?.toString() || '',
      servicioId: cuenta.servicioId?.toString() || '',
      usuario: cuenta.usuario || '',
      password: cuenta.password || '',
      perfilNombre: cuenta.perfilNombre || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await cuentasService.delete(selectedCuenta.cuentaId);
      showAlert('success', 'Cuenta eliminada exitosamente');
      setDeleteModalOpen(false);
      setSelectedCuenta(null);
      loadData();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar cuenta');
    }
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      servicioId: '',
      usuario: '',
      password: '',
      perfilNombre: ''
    });
    setErrors({});
    setSelectedCuenta(null);
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
      key: 'clienteNombre', 
      label: 'Cliente',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-600" />
          <span>{row.clienteNombre || 'N/A'}</span>
        </div>
      )
    },
    { key: 'servicioNombre', label: 'Servicio' },
    { 
      key: 'usuario', 
      label: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{row.usuario}</code>
          <button
            onClick={() => handleCopyToClipboard(row.usuario, 'Usuario')}
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Copiar usuario"
          >
            <Copy size={16} />
          </button>
        </div>
      )
    },
    { 
      key: 'password', 
      label: 'Contraseña',
      render: (row) => (
        <div className="flex items-center gap-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">••••••••</code>
          <button
            onClick={() => handleCopyToClipboard(row.password, 'Contraseña')}
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Copiar contraseña"
          >
            <Copy size={16} />
          </button>
        </div>
      )
    },
    { key: 'perfilNombre', label: 'Perfil', render: (row) => row.perfilNombre || '-' },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => {
              setSelectedCuenta(row);
              setDeleteModalOpen(true);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por usuario, cliente o servicio..." />
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
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Cliente"
            name="clienteId"
            value={formData.clienteId}
            onChange={handleChange}
            error={errors.clienteId}
            options={clientes.map(c => ({
              value: c.clienteId?.toString() || '',
              label: `${c.nombre || ''} ${c.apellido || ''}`
            }))}
            required
          />

          <Select
            label="Servicio"
            name="servicioId"
            value={formData.servicioId}
            onChange={handleChange}
            error={errors.servicioId}
            options={servicios.map(s => ({
              value: s.servicioId?.toString() || '',
              label: s.nombre || 'Sin nombre'
            }))}
            required
          />

          <Input
            label="Usuario"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            error={errors.usuario}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Generar
              </Button>
            </div>
            <Input
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            {formData.password && (
              <button
                type="button"
                onClick={() => handleCopyToClipboard(formData.password, 'Contraseña')}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
              >
                <Copy size={12} />
                Copiar contraseña
              </button>
            )}
          </div>

          <Input
            label="Nombre del Perfil"
            name="perfilNombre"
            value={formData.perfilNombre}
            onChange={handleChange}
          />

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
    </div>
  );
};

export default Cuentas;
