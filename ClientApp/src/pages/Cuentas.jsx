import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, CreditCard, Copy } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { cuentasService, serviciosService } from '../services/apiService';

const Cuentas = () => {
  const [cuentas, setCuentas] = useState([]);
  const [filteredCuentas, setFilteredCuentas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [alert, setAlert] = useState(null);
  const [correos, setCorreos] = useState([]);
  const [formData, setFormData] = useState({
    servicioID: '',
    correoID: '',
    tipoCuenta: 'Propia',
    numeroPerfiles: 1,
    perfiles: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cuentasData, serviciosData, correosData] = await Promise.all([
        cuentasService.getAll(),
        serviciosService.getAll(),
        fetch('/api/correos', { credentials: 'include' }).then(r => r.json())
      ]);
      setCuentas(cuentasData);
      setFilteredCuentas(cuentasData);
      setServicios(serviciosData);
      setCorreos(correosData);
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

  const handleGeneratePassword = () => {
    // This function is no longer needed - passwords are in Correos table
    showAlert('info', 'Las contraseñas se gestionan en el módulo de Correos');
  };

  const handleCopyToClipboard = (text, field) => {
    if (!text) {
      showAlert('error', `No hay ${field.toLowerCase()} para copiar`);
      return;
    }
    navigator.clipboard.writeText(text);
    showAlert('success', `${field} copiado al portapapeles`);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.servicioID) {
      newErrors.servicioID = 'El servicio es requerido';
    }

    if (formData.tipoCuenta === 'Terceros' && !formData.correoID) {
      newErrors.correoID = 'El correo es requerido para cuentas de terceros';
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
        CorreoID: formData.correoID ? parseInt(formData.correoID) : null,
        TipoCuenta: formData.tipoCuenta,
        NumeroPerfiles: parseInt(formData.numeroPerfiles),
        Perfiles: formData.perfiles.length > 0 ? formData.perfiles.map(p => ({
          NumeroPerfil: p.numeroPerfil,
          PIN: p.pin
        })) : null
      };

      if (selectedCuenta) {
        await cuentasService.update(selectedCuenta.cuentaID, payload);
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
      servicioID: cuenta.servicioID?.toString() || '',
      correoID: cuenta.correoID?.toString() || '',
      tipoCuenta: cuenta.tipoCuenta || 'Propia',
      numeroPerfiles: cuenta.numeroPerfiles || 1,
      perfiles: []
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await cuentasService.delete(selectedCuenta.cuentaID);
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
      servicioID: '',
      correoID: '',
      tipoCuenta: 'Propia',
      numeroPerfiles: 1,
      perfiles: []
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
            <span className="text-gray-400 text-sm">Cuenta propia</span>
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
      label: 'Perfiles',
      render: (row) => (
        <div className="text-center">
          <span className="text-sm font-medium">{row.perfilesDisponibles || 0}</span>
          <span className="text-gray-400 text-xs"> / {row.numeroPerfiles || 0}</span>
        </div>
      )
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (row) => {
        const colors = {
          'Disponible': 'bg-green-100 text-green-800',
          'Ocupada': 'bg-yellow-100 text-yellow-800',
          'Vencida': 'bg-red-100 text-red-800',
          'Inactiva': 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[row.estado] || 'bg-gray-100 text-gray-800'}`}>
            {row.estado}
          </span>
        );
      }
    },
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
          <SearchBar onSearch={handleSearch} placeholder="Buscar por email, servicio o estado..." />
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
              { value: 'Propia', label: 'Propia' },
              { value: 'Terceros', label: 'Terceros' }
            ]}
            required
          />

          {formData.tipoCuenta === 'Terceros' && (
            <Select
              label="Correo (Email + Contraseña)"
              name="correoID"
              value={formData.correoID}
              onChange={handleChange}
              error={errors.correoID}
              options={correos
                .filter(c => c.correoID != null)
                .map(c => ({
                  value: c.correoID.toString(),
                  label: c.email || 'Sin email'
                }))}
              required={formData.tipoCuenta === 'Terceros'}
            />
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">ℹ️ Información</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Cuenta Propia:</strong> Cuenta creada por el negocio</li>
              <li><strong>Cuenta de Terceros:</strong> Usa credenciales de la tabla Correos</li>
              <li>Los perfiles específicos (PIN, número) se asignan al vender</li>
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
    </div>
  );
};

export default Cuentas;
