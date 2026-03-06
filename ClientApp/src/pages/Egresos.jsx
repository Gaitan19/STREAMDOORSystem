import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, TrendingDown, Search, Calendar } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import { formatDate, formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const Egresos = () => {
  const [egresos, setEgresos] = useState([]);
  const [filteredEgresos, setFilteredEgresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEgreso, setSelectedEgreso] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filterType, setFilterType] = useState('todos'); // 'todos', 'cuentas', 'manuales'
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    cuentaID: null
  });
  const [errors, setErrors] = useState({});

  const { canCreate, canEdit, canDelete } = useAuth();

  useEffect(() => {
    loadEgresos();
  }, []);

  const loadEgresos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/egresos', { credentials: 'include' });
      const data = await response.json();
      setEgresos(data);
      setFilteredEgresos(data);
    } catch {
      showAlert('error', 'Error al cargar egresos');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const applyFilters = (searchTerm = '', filterType = 'todos') => {
    let filtered = egresos;

    // Apply type filter
    if (filterType === 'cuentas') {
      filtered = filtered.filter(eg => eg.cuentaID != null);
    } else if (filterType === 'manuales') {
      filtered = filtered.filter(eg => eg.cuentaID == null);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(egreso =>
        egreso.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        egreso.usuario?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEgresos(filtered);
  };

  const handleSearch = (searchTerm) => {
    applyFilters(searchTerm, filterType);
  };

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    applyFilters('', newFilter);
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
        descripcion: formData.descripcion,
        cuentaID: formData.cuentaID ? parseInt(formData.cuentaID) : null
      };

      if (selectedEgreso) {
        await fetch(`/api/egresos/${selectedEgreso.egresoID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        showAlert('success', 'Egreso actualizado exitosamente');
      } else {
        await fetch('/api/egresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        showAlert('success', 'Egreso creado exitosamente');
      }

      setModalOpen(false);
      resetForm();
      loadEgresos();
    } catch {
      showAlert('error', selectedEgreso ? 'Error al actualizar egreso' : 'Error al crear egreso');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await fetch(`/api/egresos/${selectedEgreso.egresoID}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      showAlert('success', 'Egreso eliminado exitosamente');
      setDeleteModalOpen(false);
      setSelectedEgreso(null);
      loadEgresos();
    } catch {
      showAlert('error', 'Error al eliminar egreso');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedEgreso(null);
    setModalOpen(true);
  };

  const openEditModal = (egreso) => {
    setSelectedEgreso(egreso);
    setFormData({
      monto: egreso.monto,
      descripcion: egreso.descripcion,
      cuentaID: egreso.cuentaID || null
    });
    setModalOpen(true);
  };

  const openDeleteModal = (egreso) => {
    setSelectedEgreso(egreso);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      monto: '',
      descripcion: '',
      cuentaID: null
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
    { key: 'monto', label: 'Monto', render: (row) => formatCurrency(row.monto) },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'usuario', label: 'Usuario' },
    { 
      key: 'cuentaID', 
      label: 'Cuenta', 
      render: (row) => row.cuentaID ? `CTA-${row.cuentaID}` : '-'
    }
  ];

  const actions = [
    ...(canEdit('egresos') ? [{
      icon: Edit,
      label: 'Editar',
      onClick: openEditModal,
      className: 'text-blue-600 hover:text-blue-800'
    }] : []),
    ...(canDelete('egresos') ? [{
      icon: Trash2,
      label: 'Eliminar',
      onClick: openDeleteModal,
      className: 'text-red-600 hover:text-red-800'
    }] : []),
  ];

  const totalEgresos = filteredEgresos.reduce((sum, egr) => sum + egr.monto, 0);

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.message} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Egresos</h1>
          <p className="text-gray-600 mt-1">Gestión de egresos del sistema</p>
        </div>
        {canCreate('egresos') && (
          <Button onClick={openCreateModal} icon={Plus}>
            Nuevo Egreso
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Egresos</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalEgresos)}</p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cantidad de Registros</p>
              <p className="text-2xl font-bold text-gray-800">{filteredEgresos.length}</p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Buscar por descripción o usuario..."
              onSearch={handleSearch}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="cuentas">De Cuentas</option>
              <option value="manuales">Manuales</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredEgresos}
          actions={actions}
          loading={loading}
          emptyMessage="No hay egresos registrados"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
          setSelectedEgreso(null);
        }}
        title={selectedEgreso ? 'Editar Egreso' : 'Nuevo Egreso'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Monto (C$)"
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
                setSelectedEgreso(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {selectedEgreso ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedEgreso(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Está seguro que desea eliminar este egreso? Esta acción no se puede deshacer.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Monto:</strong> {formatCurrency(selectedEgreso?.monto)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Descripción:</strong> {selectedEgreso?.descripcion}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedEgreso(null);
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

export default Egresos;
