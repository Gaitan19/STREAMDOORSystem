import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Alert from './Alert';

const PerfilesModal = ({ isOpen, onClose, cuentaId, cuentaNombre }) => {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    numeroPerfil: '',
    pin: '',
    estado: 'Disponible'
  });

  useEffect(() => {
    if (isOpen && cuentaId) {
      loadPerfiles();
    }
  }, [isOpen, cuentaId]);

  const loadPerfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/perfiles/por-cuenta/${cuentaId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Error al cargar perfiles');
      
      const data = await response.json();
      setPerfiles(data);
    } catch (error) {
      showAlert('error', 'Error al cargar perfiles');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAdd = () => {
    setFormData({
      numeroPerfil: perfiles.length + 1,
      pin: '',
      estado: 'Disponible'
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (perfil) => {
    setFormData({
      numeroPerfil: perfil.numeroPerfil,
      pin: perfil.pin || '',
      estado: perfil.estado
    });
    setEditingId(perfil.perfilID);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ numeroPerfil: '', pin: '', estado: 'Disponible' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.numeroPerfil || formData.numeroPerfil < 1) {
      showAlert('error', 'El número de perfil debe ser mayor a 0');
      return;
    }

    // Check for duplicate number (only if creating or changing number)
    if (!editingId || formData.numeroPerfil !== perfiles.find(p => p.perfilID === editingId)?.numeroPerfil) {
      const isDuplicate = perfiles.some(p => 
        p.numeroPerfil === parseInt(formData.numeroPerfil) && p.perfilID !== editingId
      );
      if (isDuplicate) {
        showAlert('error', 'Ya existe un perfil con ese número');
        return;
      }
    }

    try {
      setLoading(true);

      const url = editingId 
        ? `/api/perfiles/${editingId}`
        : `/api/perfiles`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        cuentaID: cuentaId,  // Include cuentaID for both POST and PUT
        numeroPerfil: parseInt(formData.numeroPerfil),
        estado: formData.estado  // ✅ Include estado in payload
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar perfil');
      }

      showAlert('success', editingId ? 'Perfil actualizado' : 'Perfil creado exitosamente');
      handleCancel();
      await loadPerfiles();
    } catch (error) {
      showAlert('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (perfilId) => {
    if (!confirm('¿Está seguro de eliminar este perfil?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/perfiles/${perfilId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error al eliminar perfil');

      showAlert('success', 'Perfil eliminado exitosamente');
      await loadPerfiles();
    } catch (error) {
      showAlert('error', 'Error al eliminar perfil');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeColor = (estado) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-100 text-green-800';
      case 'Ocupado':
        return 'bg-blue-100 text-blue-800';
      case 'Vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Perfiles - ${cuentaNombre}`} size="lg">
      {alert && <Alert type={alert.type} message={alert.message} />}
      
      <div className="space-y-4">
        {/* Add Profile Button */}
        {!showForm && (
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Perfil
            </Button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {editingId ? 'Editar Perfil' : 'Nuevo Perfil'}
            </h4>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Número de Perfil"
                type="number"
                min="1"
                value={formData.numeroPerfil}
                onChange={(e) => setFormData({ ...formData, numeroPerfil: e.target.value })}
                required
              />
              <Input
                label="PIN (opcional)"
                type="text"
                maxLength="10"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Ej: 1234"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Profiles Table */}
        {loading && <div className="text-center py-4">Cargando...</div>}
        
        {!loading && perfiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay perfiles registrados. Agregue el primer perfil.
          </div>
        )}

        {!loading && perfiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {perfiles.map((perfil) => (
                  <tr key={perfil.perfilID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Perfil {perfil.numeroPerfil}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {perfil.pin || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeColor(perfil.estado)}`}>
                        {perfil.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(perfil)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        disabled={loading}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(perfil.perfilID)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {perfiles.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Total:</span> {perfiles.length}
              </div>
              <div>
                <span className="font-medium">Disponibles:</span> {perfiles.filter(p => p.estado === 'Disponible').length}
              </div>
              <div>
                <span className="font-medium">Ocupados:</span> {perfiles.filter(p => p.estado === 'Ocupado').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PerfilesModal;
