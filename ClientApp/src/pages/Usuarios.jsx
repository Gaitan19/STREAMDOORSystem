import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCog, Mail } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { usuariosService } from '../services/apiService';
import { validateEmail } from '../utils/helpers';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Usuario'
  });
  const [errors, setErrors] = useState({});

  const roles = [
    { value: 'Administrador', label: 'Administrador' },
    { value: 'Usuario', label: 'Usuario' },
    { value: 'Vendedor', label: 'Vendedor' }
  ];

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.getAll();
      setUsuarios(data);
      setFilteredUsuarios(data);
    } catch {
      showAlert('error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (searchTerm) => {
    const filtered = usuarios.filter(usuario =>
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsuarios(filtered);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!selectedUsuario && !formData.password?.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const payload = { ...formData };
      
      // Si es edición y no se proporciona contraseña, no la enviamos
      if (selectedUsuario && !formData.password) {
        delete payload.password;
      }

      if (selectedUsuario) {
        await usuariosService.update(selectedUsuario.usuarioId, payload);
        showAlert('success', 'Usuario actualizado exitosamente');
      } else {
        await usuariosService.create(payload);
        showAlert('success', 'Usuario creado exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadUsuarios();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setSelectedUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol || 'Usuario'
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await usuariosService.delete(selectedUsuario.usuarioId);
      showAlert('success', 'Usuario eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedUsuario(null);
      loadUsuarios();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'Usuario'
    });
    setErrors({});
    setSelectedUsuario(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'Administrador':
        return 'bg-purple-100 text-purple-800';
      case 'Vendedor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <UserCog size={16} className="text-blue-600" />
          <span className="font-medium">{row.nombre}</span>
        </div>
      )
    },
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
      key: 'rol', 
      label: 'Rol',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRolColor(row.rol)}`}>
          {row.rol || 'Usuario'}
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
              setSelectedUsuario(row);
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
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-2">Gestión de usuarios del sistema</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Usuario
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre, email o rol..." />
        </div>
        <Table columns={columns} data={filteredUsuarios} loading={loading} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
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
            label={selectedUsuario ? 'Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña'}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required={!selectedUsuario}
          />

          <Select
            label="Rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            options={roles}
            required
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
              {selectedUsuario ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUsuario(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar al usuario{' '}
          <strong>{selectedUsuario?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedUsuario(null);
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

export default Usuarios;
