import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Mail, RefreshCw, Copy, Key, Eye, EyeOff } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { correosService } from '../services/apiService';
import { generatePassword, validateEmail } from '../utils/helpers';

const Correos = () => {
  const [correos, setCorreos] = useState([]);
  const [filteredCorreos, setFilteredCorreos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCorreo, setSelectedCorreo] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('activos'); // 'activos' | 'inactivos'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCorreos();
  }, [filter]);

  const loadCorreos = async () => {
    try {
      setLoading(true);
      const includeInactive = filter === 'inactivos';
      const data = await correosService.getAll(includeInactive);
      
      // Filter based on selection
      const filtered = filter === 'activos' 
        ? data.filter(c => c.activo)
        : data.filter(c => !c.activo);
        
      setCorreos(filtered);
      setFilteredCorreos(filtered);
    } catch {
      showAlert('error', 'Error al cargar correos');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (searchTerm) => {
    const filtered = correos.filter(correo =>
      correo.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCorreos(filtered);
  };

  const handleGeneratePassword = () => {
    const password = generatePassword(16); // 16 caracteres por defecto
    setFormData(prev => ({ ...prev, password }));
    showAlert('success', 'Contraseña generada automáticamente');
  };

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    showAlert('success', `${field} copiado al portapapeles`);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password?.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 10) {
      newErrors.password = 'La contraseña debe tener al menos 10 caracteres';
    } else if (formData.password.length > 60) {
      newErrors.password = 'La contraseña no puede exceder 60 caracteres';
    } else {
      // Validar requisitos de seguridad
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumber = /\d/.test(formData.password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
        newErrors.password = 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (selectedCorreo) {
        await correosService.update(selectedCorreo.correoID, formData);
        showAlert('success', 'Correo actualizado exitosamente');
      } else {
        await correosService.create(formData);
        showAlert('success', 'Correo creado exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadCorreos();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al guardar correo';
      // Mostrar error en el formulario
      setErrors({ email: errorMessage });
      showAlert('error', errorMessage);
    }
  };

  const handleEdit = (correo) => {
    setSelectedCorreo(correo);
    setFormData({
      email: correo.email,
      password: correo.password
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await correosService.delete(selectedCorreo.correoID);
      showAlert('success', 'Correo eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedCorreo(null);
      loadCorreos();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar correo');
    }
  };

  const handleReactivate = async (correo) => {
    try {
      await correosService.reactivate(correo.correoID);
      showAlert('success', 'Correo reactivado exitosamente');
      loadCorreos();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al reactivar correo');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: ''
    });
    setErrors({});
    setSelectedCorreo(null);
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
      key: 'email', 
      label: 'Email',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-blue-600" />
          <span className="font-medium">{row.email}</span>
          <button
            onClick={() => handleCopyToClipboard(row.email, 'Email')}
            className="p-1 text-gray-600 hover:text-blue-600"
            title="Copiar email"
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
                  setSelectedCorreo(row);
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
          <h1 className="text-3xl font-bold text-gray-900">Correos</h1>
          <p className="text-gray-600 mt-2">Gestión de correos electrónicos</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Correo
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4 flex gap-4 items-center">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} placeholder="Buscar por email..." />
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
        <Table columns={columns} data={filteredCorreos} loading={loading} />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedCorreo ? 'Editar Correo' : 'Nuevo Correo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message display */}
          {errors.email && errors.email.includes('ya está registrado') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Error al registrar correo</p>
                <p className="text-sm text-red-700 mt-1">{errors.email}</p>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Generar Contraseña Segura</p>
                <p className="text-xs text-blue-700 mt-1">
                  Genera automáticamente una contraseña que cumple con los requisitos de seguridad
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="flex items-center gap-2"
              >
                <Key size={16} />
                Generar
              </Button>
            </div>
            <div className="mt-3 text-xs text-blue-700">
              <p className="font-medium mb-1">Requisitos:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>10-60 caracteres</li>
                <li>Incluye mayúsculas, minúsculas, números y símbolos</li>
                <li>No incluye el símbolo ~</li>
              </ul>
            </div>
          </div>

          <div>
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email && !errors.email.includes('ya está registrado') ? errors.email : ''}
              placeholder="usuario@ejemplo.com"
              required
            />
            {formData.email && (
              <button
                type="button"
                onClick={() => handleCopyToClipboard(formData.email, 'Email')}
                className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
              >
                <Copy size={12} />
                Copiar email
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña <span className="text-red-500">*</span>
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
                placeholder="Mínimo 10 caracteres"
                required
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
              {selectedCorreo ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCorreo(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar el correo{' '}
          <strong>{selectedCorreo?.email}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedCorreo(null);
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

export default Correos;
