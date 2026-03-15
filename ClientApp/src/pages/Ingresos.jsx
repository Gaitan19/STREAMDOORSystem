import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, TrendingUp, Search, Calendar } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { formatDate, formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const CURRENCY_NAME = import.meta.env.VITE_CURRENCY_NAME || 'Cordobas';
const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || 'C$';
const CURRENCY_OPTIONS = [
  { value: CURRENCY_SYMBOL, label: `${CURRENCY_SYMBOL} — ${CURRENCY_NAME}` },
  { value: '$', label: '$ — Dólares' },
];

const Ingresos = () => {
  const [ingresos, setIngresos] = useState([]);
  const [filteredIngresos, setFilteredIngresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedIngreso, setSelectedIngreso] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filterType, setFilterType] = useState('todos'); // 'todos', 'ventas', 'manuales'
  const [filterMoneda, setFilterMoneda] = useState('todos'); // 'todos', CURRENCY_SYMBOL, '$'
  const [formData, setFormData] = useState({
    monto: '',
    moneda: CURRENCY_SYMBOL,
    descripcion: '',
    ventaID: null
  });
  const [errors, setErrors] = useState({});

  const { canCreate, canEdit, canDelete } = useAuth();

  useEffect(() => {
    loadIngresos();
  }, []);

  const loadIngresos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ingresos', { credentials: 'include' });
      const data = await response.json();
      setIngresos(data);
      setFilteredIngresos(data);
    } catch {
      showAlert('error', 'Error al cargar ingresos');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const applyFilters = (searchTerm = '', filterType = 'todos', filterMoneda = 'todos') => {
    let filtered = ingresos;

    // Apply type filter
    if (filterType === 'ventas') {
      filtered = filtered.filter(ing => ing.ventaID != null);
    } else if (filterType === 'manuales') {
      filtered = filtered.filter(ing => ing.ventaID == null);
    }

    // Apply currency filter
    if (filterMoneda !== 'todos') {
      filtered = filtered.filter(ing => (ing.moneda || CURRENCY_SYMBOL) === filterMoneda);
    }

    // Apply search filter (description or user)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ingreso =>
        ingreso.descripcion?.toLowerCase().includes(term) ||
        ingreso.usuario?.toLowerCase().includes(term)
      );
    }

    setFilteredIngresos(filtered);
  };

  const handleSearch = (searchTerm) => {
    applyFilters(searchTerm, filterType, filterMoneda);
  };

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    applyFilters('', newFilter, filterMoneda);
  };

  const handleMonedaFilterChange = (newMoneda) => {
    setFilterMoneda(newMoneda);
    applyFilters('', filterType, newMoneda);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    if (!formData.descripcion || formData.descripcion.trim() === '') {
      newErrors.descripcion = 'La descripción es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const body = {
        monto: parseFloat(formData.monto),
        moneda: formData.moneda,
        descripcion: formData.descripcion,
        ventaID: formData.ventaID ? parseInt(formData.ventaID) : null
      };

      if (selectedIngreso) {
        await fetch(`/api/ingresos/${selectedIngreso.ingresoID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        showAlert('success', 'Ingreso actualizado exitosamente');
      } else {
        await fetch('/api/ingresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        showAlert('success', 'Ingreso creado exitosamente');
      }

      setModalOpen(false);
      resetForm();
      loadIngresos();
    } catch {
      showAlert('error', selectedIngreso ? 'Error al actualizar ingreso' : 'Error al crear ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await fetch(`/api/ingresos/${selectedIngreso.ingresoID}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      showAlert('success', 'Ingreso eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedIngreso(null);
      loadIngresos();
    } catch {
      showAlert('error', 'Error al eliminar ingreso');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedIngreso(null);
    setModalOpen(true);
  };

  const openEditModal = (ingreso) => {
    setSelectedIngreso(ingreso);
    setFormData({
      monto: ingreso.monto,
      moneda: ingreso.moneda || CURRENCY_SYMBOL,
      descripcion: ingreso.descripcion,
      ventaID: ingreso.ventaID || null
    });
    setModalOpen(true);
  };

  const openDeleteModal = (ingreso) => {
    setSelectedIngreso(ingreso);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      monto: '',
      moneda: CURRENCY_SYMBOL,
      descripcion: '',
      ventaID: null
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const columns = [
    { key: 'fechaCreacion', label: 'Fecha', render: (row) => formatDate(row.fechaCreacion) },
    { key: 'moneda', label: 'Moneda', render: (row) => row.moneda || CURRENCY_SYMBOL },
    { key: 'monto', label: 'Monto', render: (row) => formatCurrency(row.monto, row.moneda || CURRENCY_SYMBOL) },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'usuario', label: 'Usuario' },
    { 
      key: 'ventaID', 
      label: 'Venta', 
      render: (row) => row.ventaID ? `V-${row.ventaID}` : '-'
    }
  ];

  const actions = [
    ...(canEdit('ingresos') ? [{
      icon: Edit,
      label: 'Editar',
      onClick: openEditModal,
      className: 'text-blue-600 hover:text-blue-800'
    }] : []),
    ...(canDelete('ingresos') ? [{
      icon: Trash2,
      label: 'Eliminar',
      onClick: openDeleteModal,
      className: 'text-red-600 hover:text-red-800'
    }] : []),
  ];

  const totalesPorMoneda = Object.entries(
    filteredIngresos.reduce((acc, ing) => {
      const moneda = ing.moneda || CURRENCY_SYMBOL;
      acc[moneda] = (acc[moneda] || 0) + ing.monto;
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.message} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ingresos</h1>
          <p className="text-gray-600 mt-1">Gestión de ingresos del sistema</p>
        </div>
        {canCreate('ingresos') && (
          <Button onClick={openCreateModal} icon={Plus}>
            Nuevo Ingreso
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Total Ingresos</p>
              {totalesPorMoneda.length === 0 ? (
                <p className="text-2xl font-bold text-green-600">—</p>
              ) : (
                <div className="space-y-0.5">
                  {totalesPorMoneda.map(([moneda, total]) => (
                    <p key={moneda} className="text-xl font-bold text-green-600">
                      {formatCurrency(total, moneda)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cantidad de Registros</p>
              <p className="text-2xl font-bold text-gray-800">{filteredIngresos.length}</p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6 space-y-3">
          <SearchBar
            placeholder="Buscar por descripción o usuario..."
            onSearch={handleSearch}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 sm:w-52">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="todos">Todos</option>
                <option value="ventas">De Ventas</option>
                <option value="manuales">Manuales</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 sm:w-48">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Moneda</label>
              <select
                value={filterMoneda}
                onChange={(e) => handleMonedaFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="todos">Todas las monedas</option>
                <option value={CURRENCY_SYMBOL}>{CURRENCY_SYMBOL}</option>
                <option value="$">$</option>
              </select>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredIngresos}
          actions={actions}
          loading={loading}
          emptyMessage="No hay ingresos registrados"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
          setSelectedIngreso(null);
        }}
        title={selectedIngreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda *
            </label>
            <select
              name="moneda"
              value={formData.moneda}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CURRENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <Input
            label={`Monto (${formData.moneda})`}
            name="monto"
            type="number"
            step="0.01"
            value={formData.monto}
            onChange={handleInputChange}
            error={errors.monto}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
            )}
          </div>



          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                resetForm();
                setSelectedIngreso(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {selectedIngreso ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedIngreso(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Está seguro que desea eliminar este ingreso? Esta acción no se puede deshacer.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Monto:</strong> {formatCurrency(selectedIngreso?.monto)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Descripción:</strong> {selectedIngreso?.descripcion}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedIngreso(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Ingresos;
