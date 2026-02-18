import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { serviciosService } from '../services/apiService';
import { formatCurrency } from '../utils/helpers';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [filteredServicios, setFilteredServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracionDias: '',
    categoria: ''
  });
  const [errors, setErrors] = useState({});

  const categorias = [
    { value: 'Streaming', label: 'Streaming' },
    { value: 'Música', label: 'Música' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Software', label: 'Software' },
    { value: 'Cloud', label: 'Cloud Storage' },
    { value: 'Otro', label: 'Otro' }
  ];

  useEffect(() => {
    loadServicios();
  }, []);

  const loadServicios = async () => {
    try {
      setLoading(true);
      const data = await serviciosService.getAll();
      setServicios(data);
      setFilteredServicios(data);
    } catch {
      showAlert('error', 'Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (searchTerm) => {
    const filtered = servicios.filter(servicio =>
      servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServicios(filtered);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.precio) {
      newErrors.precio = 'El precio es requerido';
    } else if (isNaN(formData.precio) || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }

    if (!formData.duracionDias) {
      newErrors.duracionDias = 'La duración es requerida';
    } else if (isNaN(formData.duracionDias) || parseInt(formData.duracionDias) <= 0) {
      newErrors.duracionDias = 'La duración debe ser mayor a 0';
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
        precio: parseFloat(formData.precio),
        duracionDias: parseInt(formData.duracionDias)
      };

      if (selectedServicio) {
        await serviciosService.update(selectedServicio.servicioId, payload);
        showAlert('success', 'Servicio actualizado exitosamente');
      } else {
        await serviciosService.create(payload);
        showAlert('success', 'Servicio creado exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadServicios();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al guardar servicio');
    }
  };

  const handleEdit = (servicio) => {
    setSelectedServicio(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      precio: servicio.precio.toString(),
      duracionDias: servicio.duracionDias.toString(),
      categoria: servicio.categoria || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await serviciosService.delete(selectedServicio.servicioId);
      showAlert('success', 'Servicio eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedServicio(null);
      loadServicios();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar servicio');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      duracionDias: '',
      categoria: ''
    });
    setErrors({});
    setSelectedServicio(null);
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
      key: 'nombre', 
      label: 'Nombre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Package size={16} className="text-blue-600" />
          <span className="font-medium">{row.nombre}</span>
        </div>
      )
    },
    { key: 'descripcion', label: 'Descripción', render: (row) => row.descripcion || '-' },
    { key: 'categoria', label: 'Categoría', render: (row) => row.categoria || '-' },
    { 
      key: 'precio', 
      label: 'Precio',
      render: (row) => <span className="font-semibold text-green-600">{formatCurrency(row.precio)}</span>
    },
    { 
      key: 'duracionDias', 
      label: 'Duración',
      render: (row) => `${row.duracionDias} días`
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
              setSelectedServicio(row);
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
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600 mt-2">Gestión de servicios disponibles</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Servicio
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre o categoría..." />
        </div>
        <Table columns={columns} data={filteredServicios} loading={loading} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
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
          <Input
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
          />
          <Select
            label="Categoría"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            options={categorias}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio (€)"
              type="number"
              step="0.01"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              error={errors.precio}
              required
            />
            <Input
              label="Duración (días)"
              type="number"
              name="duracionDias"
              value={formData.duracionDias}
              onChange={handleChange}
              error={errors.duracionDias}
              required
            />
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
              {selectedServicio ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedServicio(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar el servicio{' '}
          <strong>{selectedServicio?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedServicio(null);
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

export default Servicios;
