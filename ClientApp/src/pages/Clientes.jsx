import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Phone, Mail } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { clientesService } from '../services/apiService';
import { validateEmail, validatePhone } from '../utils/helpers';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesService.getAll();
      setClientes(data);
      setFilteredClientes(data);
    } catch {
      showAlert('error', 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (searchTerm) => {
    const filtered = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClientes(filtered);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellido?.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefono && !validatePhone(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (selectedCliente) {
        await clientesService.update(selectedCliente.clienteId, formData);
        showAlert('success', 'Cliente actualizado exitosamente');
      } else {
        await clientesService.create(formData);
        showAlert('success', 'Cliente creado exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadClientes();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al guardar cliente');
    }
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await clientesService.delete(selectedCliente.clienteId);
      showAlert('success', 'Cliente eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedCliente(null);
      loadClientes();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: ''
    });
    setErrors({});
    setSelectedCliente(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { 
      key: 'email', 
      label: 'Email',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-gray-400" />
          {row.email}
        </div>
      )
    },
    { 
      key: 'telefono', 
      label: 'Teléfono',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-gray-400" />
          {row.telefono || '-'}
        </div>
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
              setSelectedCliente(row);
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
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-2">Gestión de clientes del sistema</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Cliente
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre, apellido o email..." />
        </div>
        <Table columns={columns} data={filteredClientes} loading={loading} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={errors.nombre}
              required
            />
            <Input
              label="Apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              error={errors.apellido}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            error={errors.telefono}
          />
          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
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
              {selectedCliente ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCliente(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar al cliente{' '}
          <strong>{selectedCliente?.nombre} {selectedCliente?.apellido}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedCliente(null);
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

export default Clientes;
