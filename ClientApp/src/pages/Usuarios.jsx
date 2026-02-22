import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCog, Mail, Eye, EyeOff } from 'lucide-react';
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
  const [filter, setFilter] = useState('activos'); // 'activos' | 'inactivos'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    password: ''
  });
  const [errors, setErrors] = useState({});



  useEffect(() => {
    loadUsuarios();
  }, [filter]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const includeInactive = filter === 'inactivos';
      const data = await usuariosService.getAll(includeInactive);
      
      // Filter based on selection
      const filtered = filter === 'activos' 
        ? data.filter(u => u.activo)
        : data.filter(u => !u.activo);
        
      setUsuarios(filtered);
      setFilteredUsuarios(filtered);
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
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.correo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsuarios(filtered);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.correo?.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!validateEmail(formData.correo)) {
      newErrors.correo = 'Correo inválido';
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
        await usuariosService.update(selectedUsuario.usuarioID, payload);
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
      correo: usuario.correo,
      telefono: usuario.telefono || '',
      password: ''
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await usuariosService.delete(selectedUsuario.usuarioID);
      showAlert('success', 'Usuario eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedUsuario(null);
      loadUsuarios();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const handleReactivate = async (usuario) => {
    try {
      await usuariosService.reactivate(usuario.usuarioID);
      showAlert('success', 'Usuario reactivado exitosamente');
      loadUsuarios();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al reactivar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      correo: '',
      telefono: '',
      password: ''
    });
    setErrors({});
    setSelectedUsuario(null);
    setShowPassword(false);
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
          <UserCog size={16} className="text-blue-600" />
          <span className="font-medium">{row.nombre}</span>
        </div>
      )
    },
    { 
      key: 'correo', 
      label: 'Correo Electrónico',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-gray-400" />
          {row.correo}
        </div>
      )
    },
    { 
      key: 'telefono', 
      label: 'Teléfono',
      render: (row) => (
        <span className="text-gray-600">
          {row.telefono || '-'}
        </span>
      )
    },
    { 
      key: 'estado', 
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
          {row.activo ? (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => {
                  setSelectedUsuario(row);
                  setDeleteModalOpen(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleReactivate(row)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Reactivar"
            >
              Reactivar
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
        <div className="mb-4 flex gap-4 items-center">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre o correo..." />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
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
            label="Correo Electrónico"
            type="email"
            name="correo"
            value={formData.correo}
            onChange={handleChange}
            error={errors.correo}
            required
          />

          <Input
            label="Teléfono (opcional)"
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="8888-8888"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedUsuario ? 'Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña'}
              {!selectedUsuario && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="••••••••"
                required={!selectedUsuario}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
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
