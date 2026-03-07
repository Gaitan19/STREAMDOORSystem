import { useState, useEffect } from 'react';
import { combosService, serviciosService } from '../services/apiService';
import Button from '../components/Button';
import { FaPlus, FaEdit, FaTrash, FaBox } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Combos = () => {
  const [combos, setCombos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    serviciosIDs: [],
  });
  const [errors, setErrors] = useState({});

  const { canCreate, canEdit, canDelete } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [combosData, serviciosData] = await Promise.all([
        combosService.getAll(),
        serviciosService.getAll(),
      ]);
      setCombos(combosData);
      setServicios(serviciosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (combo = null) => {
    if (combo) {
      setEditingCombo(combo);
      setFormData({
        nombre: combo.nombre,
        descripcion: combo.descripcion || '',
        precio: combo.precio.toString(),
        serviciosIDs: combo.servicios.map((s) => s.servicioID),
      });
    } else {
      setEditingCombo(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        serviciosIDs: [],
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCombo(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      serviciosIDs: [],
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }

    if (formData.serviciosIDs.length < 2) {
      newErrors.servicios = 'Debe seleccionar al menos 2 servicios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: parseFloat(formData.precio),
        serviciosIDs: formData.serviciosIDs,
      };

      if (editingCombo) {
        await combosService.update(editingCombo.comboID, dataToSend);
      } else {
        await combosService.create(dataToSend);
      }

      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar combo:', error);
      setErrors({
        submit: error.response?.data?.message || 'Error al guardar el combo',
      });
    }
  };

  const handleDelete = async (comboID) => {
    if (!window.confirm('¿Está seguro de eliminar este combo?')) return;

    try {
      await combosService.delete(comboID);
      await loadData();
    } catch (error) {
      console.error('Error al eliminar combo:', error);
      alert('Error al eliminar el combo');
    }
  };

  const toggleServicio = (servicioID) => {
    setFormData((prev) => {
      const isSelected = prev.serviciosIDs.includes(servicioID);
      return {
        ...prev,
        serviciosIDs: isSelected
          ? prev.serviciosIDs.filter((id) => id !== servicioID)
          : [...prev.serviciosIDs, servicioID],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaBox className="text-blue-600" />
          Combos de Servicios
        </h1>
        {canCreate('combos') && (
          <Button onClick={() => handleOpenModal()} variant="primary">
            <FaPlus className="mr-2" />
            Nuevo Combo
          </Button>
        )}
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => (
          <div
            key={combo.comboID}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{combo.nombre}</h3>
              <div className="flex gap-2">
                {canEdit('combos') && (
                  <button
                    onClick={() => handleOpenModal(combo)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                )}
                {canDelete('combos') && (
                  <button
                    onClick={() => handleDelete(combo.comboID)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>

            {combo.descripcion && (
              <p className="text-gray-600 text-sm mb-3">{combo.descripcion}</p>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Servicios incluidos:</h4>
              <div className="flex flex-wrap gap-2">
                {combo.servicios.map((servicio) => (
                  <span
                    key={servicio.servicioID}
                    className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full"
                  >
                    {servicio.nombre}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Precio del combo:</span>
                <span className="text-2xl font-bold text-green-600">
                  C$ {combo.precio.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {combo.servicios.length} servicios incluidos
              </div>
            </div>
          </div>
        ))}
      </div>

      {combos.length === 0 && (
        <div className="text-center py-12">
          <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No hay combos registrados</p>
          <p className="text-gray-400 text-sm">Crea tu primer combo para comenzar</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCombo ? 'Editar Combo' : 'Nuevo Combo'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {errors.submit}
                </div>
              )}

              {/* Nombre */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Combo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Streaming Premium"
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Descripción del combo..."
                />
              </div>

              {/* Precio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.precio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio}</p>}
              </div>

              {/* Servicios */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicios del Combo * (mínimo 2)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4">
                  {servicios.map((servicio) => (
                    <label
                      key={servicio.servicioID}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.serviciosIDs.includes(servicio.servicioID)}
                        onChange={() => toggleServicio(servicio.servicioID)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {servicio.nombre} (C$ {servicio.precio?.toFixed(2) || '0.00'})
                      </span>
                    </label>
                  ))}
                </div>
                {errors.servicios && (
                  <p className="text-red-500 text-sm mt-1">{errors.servicios}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  {formData.serviciosIDs.length} servicio(s) seleccionado(s)
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button type="button" onClick={handleCloseModal} variant="secondary">
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingCombo ? 'Actualizar' : 'Crear Combo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combos;
