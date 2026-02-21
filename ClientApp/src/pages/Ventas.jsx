import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ShoppingCart, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { ventasService, clientesService, serviciosService, mediosPagoService } from '../services/apiService';
import { formatDate, formatCurrency, getEstadoColor, getEstadoBadge, calculateDaysUntil } from '../utils/helpers';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filterEstado, setFilterEstado] = useState('all');
  const [formData, setFormData] = useState({
    clienteId: '',
    servicioId: '',
    medioPagoId: '',
    fechaInicio: '',
    duracion: '30',  // Duración por defecto: 30 días
    monto: '',
    notas: ''
  });
  const [renovarData, setRenovarData] = useState({
    nuevaFechaInicio: '',
    nuevoMonto: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ventasData, clientesData, serviciosData, mediosPagoData] = await Promise.all([
        ventasService.getAll(),
        clientesService.getAll(),
        serviciosService.getAll(),
        mediosPagoService.getAll()
      ]);
      console.log('Clientes cargados:', clientesData);
      console.log('Servicios cargados:', serviciosData);
      console.log('Medios de Pago cargados:', mediosPagoData);
      setVentas(ventasData);
      setFilteredVentas(ventasData);
      setClientes(clientesData);
      setServicios(serviciosData);
      setMediosPago(mediosPagoData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
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
    let filtered = ventas.filter(venta =>
      venta.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.servicioNombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterEstado !== 'all') {
      filtered = filtered.filter(v => v.estado === filterEstado);
    }

    setFilteredVentas(filtered);
  };

  const handleFilterEstado = (estado) => {
    setFilterEstado(estado);
    let filtered = ventas;

    if (estado !== 'all') {
      filtered = filtered.filter(v => v.estado === estado);
    }

    setFilteredVentas(filtered);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.clienteId) {
      newErrors.clienteId = 'El cliente es requerido';
    }

    if (!formData.servicioId) {
      newErrors.servicioId = 'El servicio es requerido';
    }

    if (!formData.medioPagoId) {
      newErrors.medioPagoId = 'El medio de pago es requerido';
    }

    if (!formData.fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es requerida';
    }

    if (!formData.duracion) {
      newErrors.duracion = 'La duración es requerida';
    } else if (isNaN(formData.duracion) || parseInt(formData.duracion) <= 0) {
      newErrors.duracion = 'La duración debe ser mayor a 0';
    }

    if (!formData.monto) {
      newErrors.monto = 'El monto es requerido';
    } else if (isNaN(formData.monto) || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const payload = {
        clienteID: parseInt(formData.clienteId),
        servicioID: parseInt(formData.servicioId),
        medioPagoID: parseInt(formData.medioPagoId),
        fechaInicio: formData.fechaInicio,
        duracion: parseInt(formData.duracion),
        monto: parseFloat(formData.monto),
        notas: formData.notas || null
      };

      if (selectedVenta) {
        await ventasService.update(selectedVenta.ventaId, payload);
        showAlert('success', 'Venta actualizada exitosamente');
      } else {
        await ventasService.create(payload);
        showAlert('success', 'Venta creada exitosamente');
      }
      
      setModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al guardar venta');
    }
  };

  const handleRenovar = async () => {
    try {
      await ventasService.renovar(selectedVenta.ventaId, {
        nuevaFechaInicio: renovarData.nuevaFechaInicio,
        nuevoMonto: parseFloat(renovarData.nuevoMonto)
      });
      showAlert('success', 'Venta renovada exitosamente');
      setRenovarModalOpen(false);
      setSelectedVenta(null);
      setRenovarData({ nuevaFechaInicio: '', nuevoMonto: '' });
      loadData();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al renovar venta');
    }
  };

  const openRenovarModal = (venta) => {
    setSelectedVenta(venta);
    const today = new Date().toISOString().split('T')[0];
    setRenovarData({
      nuevaFechaInicio: today,
      nuevoMonto: venta.monto?.toString() || ''
    });
    setRenovarModalOpen(true);
  };

  const handleEdit = (venta) => {
    setSelectedVenta(venta);
    setFormData({
      clienteId: venta.clienteId?.toString() || '',
      servicioId: venta.servicioId?.toString() || '',
      medioPagoId: venta.medioPagoId?.toString() || '',
      fechaInicio: venta.fechaInicio?.split('T')[0] || '',
      monto: venta.monto?.toString() || '',
      notas: venta.notas || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await ventasService.delete(selectedVenta.ventaId);
      showAlert('success', 'Venta eliminada exitosamente');
      setDeleteModalOpen(false);
      setSelectedVenta(null);
      loadData();
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Error al eliminar venta');
    }
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      servicioId: '',
      medioPagoId: '',
      fechaInicio: '',
      duracion: '30',
      monto: '',
      notas: ''
    });
    setErrors({});
    setSelectedVenta(null);
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
      render: (row) => <span className="font-medium">{row.clienteNombre || 'N/A'}</span>
    },
    { key: 'servicioNombre', label: 'Servicio' },
    { 
      key: 'fechaInicio', 
      label: 'Inicio',
      render: (row) => formatDate(row.fechaInicio)
    },
    { 
      key: 'fechaVencimiento', 
      label: 'Vencimiento',
      render: (row) => (
        <div>
          <div>{formatDate(row.fechaVencimiento)}</div>
          {row.estado === 'ProximoVencer' && (
            <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
              <AlertTriangle size={12} />
              {calculateDaysUntil(row.fechaVencimiento)} días
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'monto', 
      label: 'Monto',
      render: (row) => <span className="font-semibold text-green-600">{formatCurrency(row.monto)}</span>
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(row.estado)}`}>
          {getEstadoBadge(row.estado)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          {(row.estado === 'ProximoVencer' || row.estado === 'Vencido') && (
            <button
              onClick={() => openRenovarModal(row)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Renovar"
            >
              <RefreshCw size={18} />
            </button>
          )}
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => {
              setSelectedVenta(row);
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
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-2">Gestión de ventas y suscripciones</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Venta
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterEstado('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => handleFilterEstado('Activo')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'Activo'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => handleFilterEstado('ProximoVencer')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'ProximoVencer'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            Próximas a Vencer
          </button>
          <button
            onClick={() => handleFilterEstado('Vencido')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterEstado === 'Vencido'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Vencidas
          </button>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por cliente o servicio..." />
        </div>
        <Table columns={columns} data={filteredVentas} loading={loading} />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={selectedVenta ? 'Editar Venta' : 'Nueva Venta'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Cliente"
            name="clienteId"
            value={formData.clienteId}
            onChange={handleChange}
            error={errors.clienteId}
            options={clientes
              .filter(c => c.clienteID != null) // Filter out null/undefined only
              .map(c => ({
                value: c.clienteID.toString(),
                label: `${c.nombre || ''} ${c.apellido || ''}`.trim() || 'Sin nombre'
              }))}
            required
          />

          <Select
            label="Servicio"
            name="servicioId"
            value={formData.servicioId}
            onChange={handleChange}
            error={errors.servicioId}
            options={servicios
              .filter(s => s.servicioID != null) // Filter out null/undefined only
              .map(s => ({
                value: s.servicioID.toString(),
                label: `${s.nombre || 'Sin nombre'} - ${formatCurrency(s.precio || 0)}`
              }))}
            required
          />

          <Select
            label="Medio de Pago"
            name="medioPagoId"
            value={formData.medioPagoId}
            onChange={handleChange}
            error={errors.medioPagoId}
            options={mediosPago
              .filter(m => m.medioPagoID != null) // Filter out null/undefined only
              .map(m => ({
                value: m.medioPagoID.toString(),
                label: m.nombre || 'Sin nombre'
              }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de Inicio"
              type="date"
              name="fechaInicio"
              value={formData.fechaInicio}
              onChange={handleChange}
              error={errors.fechaInicio}
              required
            />
            <Input
              label="Duración (días)"
              type="number"
              name="duracion"
              value={formData.duracion}
              onChange={handleChange}
              error={errors.duracion}
              placeholder="Ej: 30"
              required
            />
            <Input
              label="Monto (C$)"
              type="number"
              step="0.01"
              name="monto"
              value={formData.monto}
              onChange={handleChange}
              error={errors.monto}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {selectedVenta ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Renovar Modal */}
      <Modal
        isOpen={renovarModalOpen}
        onClose={() => {
          setRenovarModalOpen(false);
          setSelectedVenta(null);
        }}
        title="Renovar Venta"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Cliente:</strong> {selectedVenta?.clienteNombre}
            </p>
            <p className="text-sm text-blue-900">
              <strong>Servicio:</strong> {selectedVenta?.servicioNombre}
            </p>
            <p className="text-sm text-blue-900">
              <strong>Vencimiento actual:</strong> {formatDate(selectedVenta?.fechaVencimiento)}
            </p>
          </div>

          <Input
            label="Nueva Fecha de Inicio"
            type="date"
            value={renovarData.nuevaFechaInicio}
            onChange={(e) => setRenovarData(prev => ({ ...prev, nuevaFechaInicio: e.target.value }))}
            required
          />

          <Input
            label="Nuevo Monto (€)"
            type="number"
            step="0.01"
            value={renovarData.nuevoMonto}
            onChange={(e) => setRenovarData(prev => ({ ...prev, nuevoMonto: e.target.value }))}
            required
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setRenovarModalOpen(false);
                setSelectedVenta(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="success" onClick={handleRenovar}>
              <RefreshCw size={16} className="mr-2" />
              Renovar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedVenta(null);
        }}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar esta venta?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedVenta(null);
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

export default Ventas;
