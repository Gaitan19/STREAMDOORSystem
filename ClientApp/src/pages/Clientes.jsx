import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Phone, ShoppingBag, Eye, Calendar, DollarSign } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { clientesService, ventasService } from '../services/apiService';
import { validatePhone } from '../utils/helpers';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [historialModalOpen, setHistorialModalOpen] = useState(false);
  const [detallesModalOpen, setDetallesModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [historialCompras, setHistorialCompras] = useState([]);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    segundoNombre: '',
    apellido: '',
    segundoApellido: '',
    telefono: ''
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
      (cliente.segundoNombre && cliente.segundoNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cliente.segundoApellido && cliente.segundoApellido.toLowerCase().includes(searchTerm.toLowerCase())) ||
      cliente.telefono.toLowerCase().includes(searchTerm.toLowerCase())
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

    if (!formData.telefono?.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!validatePhone(formData.telefono)) {
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
        await clientesService.update(selectedCliente.clienteID, formData);
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
      segundoNombre: cliente.segundoNombre || '',
      apellido: cliente.apellido,
      segundoApellido: cliente.segundoApellido || '',
      telefono: cliente.telefono
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await clientesService.delete(selectedCliente.clienteID);
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
      segundoNombre: '',
      apellido: '',
      segundoApellido: '',
      telefono: ''
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

  const handleViewHistorial = async (cliente) => {
    try {
      setSelectedCliente(cliente);
      setLoading(true);
      const data = await clientesService.getHistorialCompras(cliente.clienteID);
      setHistorialCompras(data);
      setHistorialModalOpen(true);
    } catch (error) {
      showAlert('error', 'Error al cargar historial de compras');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetalles = async (ventaId) => {
    try {
      setLoading(true);
      const data = await ventasService.getCompleta(ventaId);
      setSelectedVenta(data);
      setDetallesModalOpen(true);
    } catch (error) {
      showAlert('error', 'Error al cargar detalles de la venta');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const estadoMap = {
      'Activo': { color: 'green', icon: '✓', text: 'Activo' },
      'ProximoVencer': { color: 'yellow', icon: '⚠', text: 'Próximo a Vencer' },
      'Vencido': { color: 'red', icon: '✕', text: 'Vencido' },
      'Cancelado': { color: 'gray', icon: '⊗', text: 'Cancelado' }
    };
    
    const config = estadoMap[estado] || estadoMap['Activo'];
    return (
      <Badge color={config.color}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </Badge>
    );
  };

  const columns = [
    { 
      key: 'nombre', 
      label: 'Nombre Completo',
      render: (row) => {
        const nombreCompleto = [
          row.nombre,
          row.segundoNombre,
          row.apellido,
          row.segundoApellido
        ].filter(Boolean).join(' ');
        return nombreCompleto;
      }
    },
    { 
      key: 'telefono', 
      label: 'Teléfono',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-gray-400" />
          {row.telefono}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewHistorial(row)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Ver Historial de Compras"
          >
            <ShoppingBag size={18} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => {
              setSelectedCliente(row);
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
          <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre, apellido o teléfono..." />
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
              label="Primer Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={errors.nombre}
              required
            />
            <Input
              label="Segundo Nombre"
              name="segundoNombre"
              value={formData.segundoNombre}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Primer Apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              error={errors.apellido}
              required
            />
            <Input
              label="Segundo Apellido"
              name="segundoApellido"
              value={formData.segundoApellido}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            error={errors.telefono}
            required
            placeholder="Ej: 88888888"
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

      {/* Historial de Compras Modal */}
      <Modal
        isOpen={historialModalOpen}
        onClose={() => {
          setHistorialModalOpen(false);
          setSelectedCliente(null);
          setHistorialCompras([]);
        }}
        title={`Historial de Compras - ${selectedCliente?.nombre} ${selectedCliente?.apellido}`}
        size="xl"
      >
        <div className="space-y-4">
          {historialCompras.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Este cliente no tiene compras registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historialCompras.map((venta) => (
                <div key={venta.ventaID} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Venta #{venta.ventaID}
                        </h4>
                        {getEstadoBadge(venta.estado)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>
                            {new Date(venta.fechaInicio).toLocaleDateString('es-NI')} - {new Date(venta.fechaFin).toLocaleDateString('es-NI')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {venta.moneda} {venta.monto?.toFixed(2) || (venta.detalles || []).reduce((sum, d) => sum + (d.precioUnitario || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Servicios:</strong> {(venta.detalles || []).map(d => d.nombreServicio).join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDetalles(venta.ventaID)}
                      className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Detalles de Venta Modal */}
      <Modal
        isOpen={detallesModalOpen}
        onClose={() => {
          setDetallesModalOpen(false);
          setSelectedVenta(null);
        }}
        title={`Detalles de Venta #${selectedVenta?.ventaID}`}
        size="lg"
      >
        {selectedVenta && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                {getEstadoBadge(selectedVenta.estado)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
                <p className="text-gray-900">{selectedVenta.duracion} días</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <p className="text-gray-900">{new Date(selectedVenta.fechaInicio).toLocaleDateString('es-NI')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <p className="text-gray-900">{new Date(selectedVenta.fechaFin).toLocaleDateString('es-NI')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <p className="text-gray-900 font-semibold text-lg">
                  {selectedVenta.moneda} {selectedVenta.monto?.toFixed(2) || (selectedVenta.detalles || []).reduce((sum, d) => sum + (d.precioUnitario || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Servicios Contratados</h4>
              <div className="space-y-3">
                {(selectedVenta.detalles || []).map((detalle, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900">{detalle.nombreServicio}</h5>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p><strong>Correo/Código:</strong> {detalle.correoCuenta || detalle.codigoCuenta}</p>
                          <p><strong>Perfil:</strong> Perfil {detalle.numeroPerfil}</p>
                          <p><strong>Contraseña:</strong> {detalle.passwordCuenta}</p>
                          {detalle.pinPerfil && <p><strong>PIN:</strong> {detalle.pinPerfil}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {selectedVenta.moneda} {detalle.precioUnitario?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Clientes;
