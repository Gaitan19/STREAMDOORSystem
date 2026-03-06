import { useState, useEffect } from 'react';
import { rolesService } from '../services/apiService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Table from '../components/Table';
import { Shield, Plus, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

const getPermisos = (rol) => {
  const raw = Array.isArray(rol?.permisos) ? rol.permisos
            : Array.isArray(rol?.Permisos) ? rol.Permisos : [];
  return raw.map(p => ({
    Modulo: p.modulo ?? p.Modulo ?? '',
    PuedeVer: p.puedeVer ?? p.PuedeVer ?? false,
    PuedeCrear: p.puedeCrear ?? p.PuedeCrear ?? false,
    PuedeEditar: p.puedeEditar ?? p.PuedeEditar ?? false,
    PuedeEliminar: p.puedeEliminar ?? p.PuedeEliminar ?? false,
  }));
};

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [permisosModalOpen, setPermisosModalOpen] = useState(false);
  const [selectedRol, setSelectedRol] = useState(null);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState({ Nombre: '', Descripcion: '', Activo: true, Permisos: defaultPermisos() });
  const [saving, setSaving] = useState(false);

  const { canCreate, canEdit, canDelete } = useAuth();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await rolesService.getAll(true);
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      showAlert('error', 'Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const openCreate = () => {
    setEditingRol(null);
    setFormData({ Nombre: '', Descripcion: '', Activo: true, Permisos: defaultPermisos() });
    setModalOpen(true);
  };

  const openEdit = (rol) => {
    setEditingRol(rol);
    const existingPermisos = getPermisos(rol);
    const permisos = MODULOS.map(m => {
      const existing = existingPermisos.find(p => p.Modulo === m.id);
      return existing
        ? { Modulo: m.id, PuedeVer: existing.PuedeVer, PuedeCrear: existing.PuedeCrear, PuedeEditar: existing.PuedeEditar, PuedeEliminar: existing.PuedeEliminar }
        : { Modulo: m.id, PuedeVer: false, PuedeCrear: false, PuedeEditar: false, PuedeEliminar: false };
    });
    const nombre = rol.nombre ?? rol.Nombre ?? '';
    const descripcion = rol.descripcion ?? rol.Descripcion ?? '';
    const activo = rol.activo !== undefined ? rol.activo : (rol.Activo !== undefined ? rol.Activo : true);
    setFormData({ Nombre: nombre, Descripcion: descripcion, Activo: activo, Permisos: permisos });
    setModalOpen(true);
  };

  const openPermisos = (rol) => {
    setSelectedRol(rol);
    setPermisosModalOpen(true);
  };

  const openDelete = (rol) => {
    setSelectedRol(rol);
    setDeleteModalOpen(true);
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
        await rolesService.update(editingRol.rolID ?? editingRol.RolID, formData);
        showAlert('success', 'Rol actualizado exitosamente');
      } else {
        await rolesService.create(formData);
        showAlert('success', 'Rol creado exitosamente');
      }
      await fetchRoles();
      setModalOpen(false);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Error al guardar el rol');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRol) return;
    try {
      await rolesService.delete(selectedRol.rolID ?? selectedRol.RolID);
      showAlert('success', 'Rol eliminado exitosamente');
      await fetchRoles();
      setDeleteModalOpen(false);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Error al eliminar el rol');
      setDeleteModalOpen(false);
    }
  };

  const allEnabled = formData.Permisos.every(p => p.PuedeVer && p.PuedeCrear && p.PuedeEditar && p.PuedeEliminar);

  const columns = [
    {
      key: 'Nombre',
      label: 'Nombre',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-md">
            <Shield size={14} className="text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">{row.nombre ?? row.Nombre}</span>
        </div>
      )
    },
    {
      key: 'Descripcion',
      label: 'Descripción',
      render: (row) => (
        <span className="text-gray-500 text-sm">{row.descripcion ?? row.Descripcion ?? '—'}</span>
      )
    },
    {
      key: 'modulosCount',
      label: 'Módulos',
      render: (row) => {
        const permisos = getPermisos(row);
        const count = permisos.filter(p => p.PuedeVer).length;
        return (
          <Badge variant="info">{count} de {MODULOS.length}</Badge>
        );
      }
    },
    {
      key: 'Activo',
      label: 'Estado',
      render: (row) => {
        const activo = row.activo !== undefined ? row.activo : row.Activo;
        return (
          <Badge variant={activo ? 'success' : 'gray'}>
            {activo ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openPermisos(row); }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Ver permisos"
          >
            <Eye size={16} />
          </button>
          {canEdit('roles') && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(row); }}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Editar"
            >
              <Edit size={16} />
            </button>
          )}
          {canDelete('roles') && (
            <button
              onClick={(e) => { e.stopPropagation(); openDelete(row); }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
            <p className="text-sm text-gray-500">Gestión de roles y permisos del sistema</p>
          </div>
        </div>
        {canCreate('roles') && (
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus size={18} />
            <span>Nuevo Rol</span>
          </Button>
        )}
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Roles Table */}
      <Card>
        <Table
          columns={columns}
          data={roles}
          loading={loading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRol ? 'Editar Rol' : 'Nuevo Rol'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol *</label>
              <input
                type="text"
                value={formData.Nombre}
                onChange={e => setFormData(prev => ({ ...prev, Nombre: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del rol..."
              />
            </div>
          </div>

          {editingRol && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Estado:</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, Activo: !prev.Activo }))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  formData.Activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {formData.Activo ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          )}

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Permisos por Módulo</span>
              <button
                type="button"
                onClick={toggleAllModulos}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                {allEnabled ? 'Quitar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 min-w-[130px]">Módulo</th>
                      {PERMISOS_LABELS.map(p => (
                        <th key={p.key} className="text-center px-3 py-2.5 font-medium text-gray-600 w-16">{p.label}</th>
                      ))}
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-14">Todos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {MODULOS.map(m => {
                      const permiso = formData.Permisos.find(p => p.Modulo === m.id);
                      const allMod = permiso && permiso.PuedeVer && permiso.PuedeCrear && permiso.PuedeEditar && permiso.PuedeEliminar;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-700">{m.nombre}</td>
                          {PERMISOS_LABELS.map(p => (
                            <td key={p.key} className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={permiso ? !!permiso[p.key] : false}
                                onChange={() => togglePermiso(m.id, p.key)}
                                className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={!!allMod}
                              onChange={() => toggleAllPermisosForModulo(m.id)}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              {editingRol ? 'Actualizar' : 'Crear Rol'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Permissions Modal */}
      <Modal
        isOpen={permisosModalOpen}
        onClose={() => setPermisosModalOpen(false)}
        title={`Permisos — ${selectedRol?.nombre ?? selectedRol?.Nombre ?? ''}`}
        size="md"
      >
        {selectedRol && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 min-w-[130px]">Módulo</th>
                    {PERMISOS_LABELS.map(p => (
                      <th key={p.key} className="text-center px-3 py-2.5 font-medium text-gray-600 w-16">{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MODULOS.map(m => {
                    const permiso = getPermisos(selectedRol).find(p => p.Modulo === m.id);
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-700">{m.nombre}</td>
                        {PERMISOS_LABELS.map(p => (
                          <td key={p.key} className="px-3 py-2.5 text-center">
                            {permiso && permiso[p.key]
                              ? <CheckCircle size={16} className="mx-auto text-green-500" />
                              : <XCircle size={16} className="mx-auto text-gray-300" />
                            }
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
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Rol"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el rol <strong>{selectedRol?.nombre ?? selectedRol?.Nombre}</strong>? Esta acción no se puede deshacer si hay usuarios asignados.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Roles;
