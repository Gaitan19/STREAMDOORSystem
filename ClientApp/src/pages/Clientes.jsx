import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Phone, ShoppingBag, Eye, Calendar, DollarSign, Copy, MessageCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { clientesService, ventasService, plantillasService } from '../services/apiService';
import { validatePhone } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

// Common country phone prefixes
const PAISES_PREFIJOS = [
  { code: '+505', label: '🇳🇮 +505 Nicaragua' },
  { code: '+506', label: '🇨🇷 +506 Costa Rica' },
  { code: '+504', label: '🇭🇳 +504 Honduras' },
  { code: '+503', label: '🇸🇻 +503 El Salvador' },
  { code: '+502', label: '🇬🇹 +502 Guatemala' },
  { code: '+507', label: '🇵🇦 +507 Panamá' },
  { code: '+53',  label: '🇨🇺 +53  Cuba' },
  { code: '+1',   label: '🇺🇸 +1   EE.UU. / Canadá' },
  { code: '+52',  label: '🇲🇽 +52  México' },
  { code: '+57',  label: '🇨🇴 +57  Colombia' },
  { code: '+58',  label: '🇻🇪 +58  Venezuela' },
  { code: '+51',  label: '🇵🇪 +51  Perú' },
  { code: '+54',  label: '🇦🇷 +54  Argentina' },
  { code: '+55',  label: '🇧🇷 +55  Brasil' },
  { code: '+56',  label: '🇨🇱 +56  Chile' },
  { code: '+34',  label: '🇪🇸 +34  España' },
];

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
    prefijoTelefono: '+505',
    telefono: ''
  });
  const [errors, setErrors] = useState({});
  const [plantillas, setPlantillas] = useState({});

  // Sorting for the Clientes table
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  const { canCreate, canEdit, canDelete } = useAuth();

  useEffect(() => {
    loadClientes();
    plantillasService.getAll()
      .then(data => {
        const map = {};
        data.forEach(p => { map[p.clave] = p.contenido; });
        setPlantillas(map);
      })
      .catch(() => {});
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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showAlert('success', `${label} copiado al portapapeles`);
  };

  const buildWhatsAppUrl = (prefijoTelefono, telefono, message) => {
    const prefix = (prefijoTelefono || '').replace(/[^\d]/g, '');
    const phone = (telefono || '').replace(/[^\d]/g, '');
    const fullPhone = prefix ? `${prefix}${phone}` : phone;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  };

  // Format sale details for WhatsApp using stored templates
  const formatWhatsAppMessage = (venta) => {
    if (!venta || !venta.detalles || venta.detalles.length === 0) return '';

    const fmtDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const applyTpl = (key, vars, fallback) => {
      const tpl = plantillas[key] || fallback;
      return Object.entries(vars).reduce(
        (str, [k, v]) => str.replaceAll(`{${k}}`, v ?? ''),
        tpl
      );
    };

    // Group services by combo
    const comboGroups = {};
    const individualServices = [];

    venta.detalles.forEach(detalle => {
      if (detalle.comboID) {
        if (!comboGroups[detalle.comboID]) {
          comboGroups[detalle.comboID] = {
            nombreCombo: detalle.nombreCombo,
            servicios: [],
            precioCombo: 0
          };
        }
        comboGroups[detalle.comboID].servicios.push(detalle);
        comboGroups[detalle.comboID].precioCombo += (detalle.precioUnitario || 0);
      } else {
        individualServices.push(detalle);
      }
    });

    let message = '';

    // Format combos
    Object.values(comboGroups).forEach(combo => {
      const serviceNames = combo.servicios.map(s => s.nombreServicio).join(' + ');
      message += applyTpl('combo_header',
        { NOMBRES_SERVICIOS: serviceNames.toUpperCase() },
        `🔥 COMBO ACTIVO [{NOMBRES_SERVICIOS}]\n\n`
      );

      combo.servicios.forEach(detalle => {
        const pinLinea = detalle.pinPerfil ? `🔐 PIN: ${detalle.pinPerfil}\n` : '';
        message += applyTpl('combo_item', {
          NOMBRE_SERVICIO: detalle.nombreServicio.toUpperCase(),
          ID_VENTA: venta.ventaID,
          CORREO: detalle.correoCuenta || detalle.emailCuenta,
          CONTRASENA: detalle.passwordCuenta,
          PERFIL: detalle.numeroPerfil,
          PIN_LINEA: pinLinea,
          FECHA_INICIO: fmtDate(venta.fechaInicio),
          FECHA_FIN: fmtDate(venta.fechaFin),
        },
          `DATOS DE ACCESO {NOMBRE_SERVICIO}\n🆔 # VENTA: V-{ID_VENTA}\n🛡 CORREO: {CORREO}\n⚔ CONTRASEÑA: {CONTRASENA}\n👤 PERFIL: {PERFIL}\n{PIN_LINEA}⏳ F. DE INICIO: {FECHA_INICIO}\n✂ F. DE FIN: {FECHA_FIN}\n\n`
        );
      });

      message += applyTpl('combo_footer',
        { PRECIO_COMBO: combo.precioCombo.toFixed(2), MONEDA: venta.moneda },
        `💰 PRECIO DEL COMBO: {PRECIO_COMBO} {MONEDA}\n\n`
      );
    });

    // Format individual services
    individualServices.forEach((detalle, index) => {
      if (index > 0 || Object.keys(comboGroups).length > 0) message += '\n';
      const pinLinea = detalle.pinPerfil ? `🔐 Pin: ${detalle.pinPerfil}` : '';
      message += applyTpl('individual_item', {
        NOMBRE_SERVICIO: detalle.nombreServicio.toUpperCase(),
        ID_VENTA: venta.ventaID,
        CORREO: detalle.correoCuenta || detalle.emailCuenta,
        CONTRASENA: detalle.passwordCuenta,
        PERFIL: detalle.numeroPerfil,
        PIN_LINEA: pinLinea,
        FECHA_INICIO: fmtDate(venta.fechaInicio),
        FECHA_FIN: fmtDate(venta.fechaFin),
        PRECIO: (detalle.precioUnitario || 0).toFixed(2),
        MONEDA: venta.moneda,
      },
        `📌 SUSCRIPCIÓN ACTIVA [{NOMBRE_SERVICIO}]\n\nAcceda con los siguientes datos por favor\n🛡 Correo: {CORREO}\n⚔ Contraseña: {CONTRASENA}\n⚙ Tipo: PERFIL\n\n👤 Perfil: {PERFIL}      {PIN_LINEA}\n🆔 # VENTA: V-{ID_VENTA}\n\n⏳ Fecha de inicio: {FECHA_INICIO}\n✂ Fecha de corte: {FECHA_FIN}\n\n💰 PRECIO: {PRECIO} {MONEDA}\n\n`
      );
    });

    // Add total price at the end (only once)
    if (message.trim()) {
      message += applyTpl('mensaje_footer',
        { PRECIO_TOTAL: venta.monto?.toFixed(2) || '0.00', MONEDA: venta.moneda },
        `💸 PRECIO DE COMPRA: {PRECIO_TOTAL} {MONEDA}\n\n*💵 GRACIAS POR SU COMPRA 🛍*`
      );
    }

    return message;
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

  const getSortedClientes = () => {
    if (!sortBy) return filteredClientes;
    return [...filteredClientes].sort((a, b) => {
      const valA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
      const valB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
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
      prefijoTelefono: cliente.prefijoTelefono || '+505',
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
      prefijoTelefono: '+505',
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
          {canEdit('clientes') && (
            <button
              onClick={() => handleEdit(row)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit size={18} />
            </button>
          )}
          {canDelete('clientes') && (
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
          )}
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
        {canCreate('clientes') && (
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
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card>
        <div className="mb-4 space-y-3">
          <SearchBar onSearch={handleSearch} placeholder="Buscar por nombre, apellido o teléfono..." />
          {/* Sort controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setSortDir('asc'); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin ordenar</option>
              <option value="nombre">Nombre del cliente</option>
            </select>
            {sortBy && (
              <button
                type="button"
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Cambiar dirección de orden"
              >
                {sortDir === 'asc' ? '↑ Ascendente' : '↓ Descendente'}
              </button>
            )}
          </div>
        </div>
        <Table columns={columns} data={getSortedClientes()} loading={loading} />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                name="prefijoTelefono"
                value={formData.prefijoTelefono}
                onChange={handleChange}
                className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PAISES_PREFIJOS.map(p => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
              <Input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                error={errors.telefono}
                required
                placeholder="Ej: 88888888"
                className="flex-1"
              />
            </div>
            {errors.telefono && (
              <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
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
                {(() => {
                  // Group services by comboID
                  const combos = {};
                  const individualServices = [];
                  
                  (selectedVenta.detalles || []).forEach(detalle => {
                    if (detalle.comboID) {
                      if (!combos[detalle.comboID]) {
                        combos[detalle.comboID] = [];
                      }
                      combos[detalle.comboID].push(detalle);
                    } else {
                      individualServices.push(detalle);
                    }
                  });

                  return (
                    <>
                      {/* Render Combos */}
                      {Object.entries(combos).map(([comboID, services]) => {
                        const comboPrice = services.reduce((sum, s) => sum + (s.precioUnitario || 0), 0);
                        const comboName = services.map(s => s.nombreServicio).join(' + ');
                        
                        return (
                          <div key={`combo-${comboID}`} className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                            <div className="flex items-start justify-between mb-3">
                              <h5 className="font-semibold text-orange-900 flex items-center gap-2">
                                🔥 COMBO: {comboName}
                              </h5>
                              <div className="text-right">
                                <p className="text-xs text-gray-600">Combo #{comboID}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {services.map((detalle, idx) => (
                                <div key={idx} className="bg-white border border-orange-200 rounded p-3">
                                  <h6 className="font-semibold text-gray-900 mb-2">{detalle.nombreServicio}</h6>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><strong>Correo:</strong> {detalle.emailCuenta}</p>
                                    <p><strong>Contraseña:</strong> {detalle.passwordCuenta}</p>
                                    <p><strong>Perfil:</strong> Perfil {detalle.numeroPerfil}</p>
                                    {detalle.pinPerfil && <p><strong>PIN:</strong> {detalle.pinPerfil}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-orange-300 bg-orange-100 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                              <p className="font-semibold text-orange-900">
                                💰 PRECIO DEL COMBO: {selectedVenta.moneda} {comboPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Render Individual Services */}
                      {individualServices.map((detalle, index) => (
                        <div key={`individual-${index}`} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{detalle.nombreServicio}</h5>
                              <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <p><strong>Correo:</strong> {detalle.emailCuenta}</p>
                                <p><strong>Contraseña:</strong> {detalle.passwordCuenta}</p>
                                <p><strong>Perfil:</strong> Perfil {detalle.numeroPerfil}</p>
                                {detalle.pinPerfil && <p><strong>PIN:</strong> {detalle.pinPerfil}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                💰 {selectedVenta.moneda} {detalle.precioUnitario?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center pt-4 border-t gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    const message = formatWhatsAppMessage(selectedVenta);
                    copyToClipboard(message, 'Detalles');
                  }}
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Copy size={16} />
                  Copiar Detalles
                </Button>
                {selectedCliente?.telefono && (
                  <a
                    href={buildWhatsAppUrl(
                      selectedCliente.prefijoTelefono,
                      selectedCliente.telefono,
                      formatWhatsAppMessage(selectedVenta)
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <MessageCircle size={16} />
                    Abrir en WhatsApp
                  </a>
                )}
              </div>
              <Button variant="secondary" onClick={() => {
                setDetallesModalOpen(false);
                setSelectedVenta(null);
              }}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Clientes;
