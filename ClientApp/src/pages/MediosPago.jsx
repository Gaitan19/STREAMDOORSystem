import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { mediosPagoService } from '../services/apiService';

const MediosPago = () => {
  const [mediosPago, setMediosPago] = useState([]);
  const [filteredMediosPago, setFilteredMediosPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMedioPago, setSelectedMedioPago] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMediosPago();
  }, []);

  const loadMediosPago = async () => {
    try {
      setLoading(true);
      const data = await mediosPagoService.getAll();
      setMediosPago(data);
      setFilteredMediosPago(data);
    } catch {
      showAlert('error', 'Error al cargar medios de pago');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (searchTerm) => {
    const filtered = mediosPago.filter(medio =>
      medio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMediosPago(filtered);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (selectedMedioPago) {
        await mediosPagoService.update(selectedMedioPago.medioPagoId, formData);
        showAlert('success', 'Medio de pago actualizado exitosamente');
      } else {
        await mediosPagoService.create(formData);
        showAlert('success', 'Medio de pago creado exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadMediosPago();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al guardar medio de pago');
    }
  };

  const handleEdit = (medioPago) => {
    setSelectedMedioPago(medioPago);
    setFormData({
      nombre: medioPago.nombre,
      descripcion: medioPago.descripcion || '',
      activo: medioPago.activo ?? true
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await mediosPagoService.delete(selectedMedioPago.medioPagoId);
      showAlert('success', 'Medio de pago eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedMedioPago(null);
      loadMediosPago();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar medio de pago');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true
    });
    setErrors({});
    setSelectedMedioPago(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-blue-600" />
          <span className="font-medium">{row.nombre}</span>
        </div>
      )
    },
    { 
      key: 'descripcion', 
      label: 'Descripción',
      render: (row) => row.descripcion || '-'
    },
    { 
      key: 'activo', 
      label: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          row.activo 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
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
              setSelectedMedioPago(row);
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
          <h1 className="text-3xl font-bold text-gray-900">Medios de Pago</h1>
          <p className="text-gray-600 mt-2">Gestión de medios de pago disponibles</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Medio de Pago
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre o descripción..." />
        </div>
        <Table columns={columns} data={filteredMediosPago} loading={loading} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedMedioPago ? 'Editar Medio de Pago' : 'Nuevo Medio de Pago'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={errors.nombre}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
              Activo
            </label>
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
              {selectedMedioPago ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedMedioPago(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar el medio de pago{' '}
          <strong>{selectedMedioPago?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedMedioPago(null);
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

export default MediosPago;
