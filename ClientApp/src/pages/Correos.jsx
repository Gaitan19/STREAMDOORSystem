import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Mail, RefreshCw, Copy, Key } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCorreos();
  }, []);

  const loadCorreos = async () => {
    try {
      setLoading(true);
      const data = await correosService.getAll();
      setCorreos(data);
      setFilteredCorreos(data);
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

  const resetForm = () => {
    setFormData({
      email: '',
      password: ''
    });
    setErrors({});
    setSelectedCorreo(null);
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
              setSelectedCorreo(row);
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
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por email..." />
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
              error={errors.email}
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
            <Input
              label="Contraseña"
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Mínimo 10 caracteres"
              required
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
