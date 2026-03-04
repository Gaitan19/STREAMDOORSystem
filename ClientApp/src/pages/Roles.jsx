import { useState, useEffect } from 'react';
import { rolesService } from '../services/apiService';
import { Shield, Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const MODULOS = [
  { id: 'dashboard', nombre: 'Dashboard' },
  { id: 'clientes', nombre: 'Clientes' },
  { id: 'servicios', nombre: 'Servicios' },
  { id: 'combos', nombre: 'Combos' },
  { id: 'correos', nombre: 'Correos' },
  { id: 'cuentas', nombre: 'Cuentas' },
  { id: 'ventas', nombre: 'Ventas' },
  { id: 'ingresos', nombre: 'Ingresos' },
  { id: 'egresos', nombre: 'Egresos' },
  { id: 'medios-pago', nombre: 'Medios de Pago' },
  { id: 'usuarios', nombre: 'Usuarios' },
  { id: 'roles', nombre: 'Roles' },
];

const PERMISOS_LABELS = [
  { key: 'PuedeVer', label: 'Ver' },
  { key: 'PuedeCrear', label: 'Crear' },
  { key: 'PuedeEditar', label: 'Editar' },
  { key: 'PuedeEliminar', label: 'Eliminar' },
];

const defaultPermisos = () =>
  MODULOS.map(m => ({
    Modulo: m.id,
    PuedeVer: false,
    PuedeCrear: false,
    PuedeEditar: false,
    PuedeEliminar: false,
  }));

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [expandedRol, setExpandedRol] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Descripcion: '', Activo: true, Permisos: defaultPermisos() });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await rolesService.getAll(true);
      setRoles(data);
    } catch (err) {
      setError('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingRol(null);
    setFormData({ Nombre: '', Descripcion: '', Activo: true, Permisos: defaultPermisos() });
    setShowForm(true);
  };

  const openEdit = (rol) => {
    setEditingRol(rol);
    // Merge existing permissions with all modules
    const permisos = MODULOS.map(m => {
      const existing = rol.Permisos.find(p => p.Modulo === m.id);
      return existing
        ? { Modulo: m.id, PuedeVer: existing.PuedeVer, PuedeCrear: existing.PuedeCrear, PuedeEditar: existing.PuedeEditar, PuedeEliminar: existing.PuedeEliminar }
        : { Modulo: m.id, PuedeVer: false, PuedeCrear: false, PuedeEditar: false, PuedeEliminar: false };
    });
    setFormData({ Nombre: rol.Nombre, Descripcion: rol.Descripcion || '', Activo: rol.Activo, Permisos: permisos });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRol(null);
  };

  const togglePermiso = (moduloId, permisoKey) => {
    setFormData(prev => ({
      ...prev,
      Permisos: prev.Permisos.map(p =>
        p.Modulo === moduloId ? { ...p, [permisoKey]: !p[permisoKey] } : p
      )
    }));
  };

  const toggleAllPermisosForModulo = (moduloId) => {
    setFormData(prev => {
      const permiso = prev.Permisos.find(p => p.Modulo === moduloId);
      const allEnabled = permiso && permiso.PuedeVer && permiso.PuedeCrear && permiso.PuedeEditar && permiso.PuedeEliminar;
      return {
        ...prev,
        Permisos: prev.Permisos.map(p =>
          p.Modulo === moduloId
            ? { ...p, PuedeVer: !allEnabled, PuedeCrear: !allEnabled, PuedeEditar: !allEnabled, PuedeEliminar: !allEnabled }
            : p
        )
      };
    });
  };

  const toggleAllModulos = () => {
    setFormData(prev => {
      const allEnabled = prev.Permisos.every(p => p.PuedeVer && p.PuedeCrear && p.PuedeEditar && p.PuedeEliminar);
      return {
        ...prev,
        Permisos: prev.Permisos.map(p => ({
          ...p,
          PuedeVer: !allEnabled,
          PuedeCrear: !allEnabled,
          PuedeEditar: !allEnabled,
          PuedeEliminar: !allEnabled,
        }))
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Nombre.trim()) return;
    setSaving(true);
    try {
      if (editingRol) {
        await rolesService.update(editingRol.RolID, formData);
      } else {
        await rolesService.create(formData);
      }
      await fetchRoles();
      closeForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await rolesService.delete(id);
      await fetchRoles();
      setConfirmDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el rol');
      setConfirmDelete(null);
    }
  };

  const allEnabled = formData.Permisos.every(p => p.PuedeVer && p.PuedeCrear && p.PuedeEditar && p.PuedeEliminar);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
            <p className="text-sm text-gray-500">Gestión de roles y permisos del sistema</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo Rol</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Roles list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No hay roles registrados.</div>
      ) : (
        <div className="space-y-4">
          {roles.map(rol => (
            <div key={rol.RolID} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Role header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${rol.Activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{rol.Nombre}</h2>
                    {rol.Descripcion && (
                      <p className="text-sm text-gray-500">{rol.Descripcion}</p>
                    )}
                  </div>
                  {!rol.Activo && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inactivo</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(rol)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(rol.RolID)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => setExpandedRol(expandedRol === rol.RolID ? null : rol.RolID)}
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Ver permisos"
                  >
                    {expandedRol === rol.RolID ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Permissions table (expanded) */}
              {expandedRol === rol.RolID && (
                <div className="border-t px-6 py-4 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Permisos por módulo</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="pb-2 font-medium w-40">Módulo</th>
                          {PERMISOS_LABELS.map(p => (
                            <th key={p.key} className="pb-2 font-medium text-center w-20">{p.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {MODULOS.map(m => {
                          const permiso = rol.Permisos.find(p => p.Modulo === m.id);
                          return (
                            <tr key={m.id} className="border-t border-gray-100">
                              <td className="py-2 font-medium text-gray-700">{m.nombre}</td>
                              {PERMISOS_LABELS.map(p => (
                                <td key={p.key} className="py-2 text-center">
                                  {permiso && permiso[p.key] ? (
                                    <Check size={16} className="mx-auto text-green-500" />
                                  ) : (
                                    <X size={16} className="mx-auto text-gray-300" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar rol?</h3>
            <p className="text-gray-600 mb-6">Esta acción desactivará el rol. No se puede deshacer si hay usuarios asignados.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8 shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRol ? 'Editar Rol' : 'Nuevo Rol'}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol *</label>
                  <input
                    type="text"
                    value={formData.Nombre}
                    onChange={e => setFormData(prev => ({ ...prev, Nombre: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Vendedor, Supervisor..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={formData.Descripcion}
                    onChange={e => setFormData(prev => ({ ...prev, Descripcion: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción del rol..."
                  />
                </div>
              </div>

              {editingRol && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Estado:</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, Activo: !prev.Activo }))}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.Activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {formData.Activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              )}

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Permisos por Módulo</h3>
                  <button
                    type="button"
                    onClick={toggleAllModulos}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {allEnabled ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 w-40">Módulo</th>
                        {PERMISOS_LABELS.map(p => (
                          <th key={p.key} className="text-center px-2 py-2.5 font-medium text-gray-600 w-20">{p.label}</th>
                        ))}
                        <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-16">Todos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULOS.map((m, idx) => {
                        const permiso = formData.Permisos.find(p => p.Modulo === m.id);
                        const allMod = permiso && permiso.PuedeVer && permiso.PuedeCrear && permiso.PuedeEditar && permiso.PuedeEliminar;
                        return (
                          <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2.5 font-medium text-gray-700">{m.nombre}</td>
                            {PERMISOS_LABELS.map(p => (
                              <td key={p.key} className="px-2 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={permiso ? permiso[p.key] : false}
                                  onChange={() => togglePermiso(m.id, p.key)}
                                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                />
                              </td>
                            ))}
                            <td className="px-2 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={!!allMod}
                                onChange={() => toggleAllPermisosForModulo(m.id)}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Check size={18} />
                  )}
                  <span>{editingRol ? 'Actualizar' : 'Crear Rol'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
