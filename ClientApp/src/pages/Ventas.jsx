import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Search, ShoppingCart, Calendar, Package } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import SearchBar from '../components/SearchBar';
import Table from '../components/Table';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { ventasService, clientesService, cuentasService, mediosPagoService, serviciosService, combosService } from '../services/apiService';
import { formatDate, formatCurrency } from '../utils/helpers';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [filteredVentas, setFilteredVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [alert, setAlert] = useState(null);
  
  // Client search
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteSearchResults, setClienteSearchResults] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [searchingClientes, setSearchingClientes] = useState(false);
  
  // Available servicios, accounts, combos and medios de pago
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [combosDisponibles, setCombosDisponibles] = useState([]);
  const [cuentasDisponibles, setCuentasDisponibles] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  
  // Two-step workflow for SERVICES
  // Step 1: Services the client wants (without accounts assigned yet)
  const [serviciosDeseados, setServiciosDeseados] = useState([]); // [{servicioID, nombre, precio}, ...]
  const [servicioParaAgregar, setServicioParaAgregar] = useState(null); // Temp selection for Step 1
  
  // Step 2: Assign accounts/profiles to each desired service
  const [serviciosCart, setServiciosCart] = useState([]); // Final cart with accounts assigned
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null); // For Step 2
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  
  // Two-step workflow for COMBOS
  const [combosDeseados, setCombosDeseados] = useState([]); // [{comboID, nombre, precio, servicios[]}, ...]
  const [comboParaAgregar, setComboParaAgregar] = useState(null); // Temp selection for Step 1
  const [combosCart, setCombosCart] = useState([]); // Combos with all services assigned
  const [comboSeleccionado, setComboSeleccionado] = useState(null); // For Step 2 combo assignment
  const [servicioComboSeleccionado, setServicioComboSeleccionado] = useState(null); // Service within combo to assign
  
  // Form data
  const [formData, setFormData] = useState({
    fechaFin: '',
    medioPagoID: '',
    moneda: 'C$',
    notas: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ventasData, mediosPagoData] = await Promise.all([
        ventasService.getAll(),
        mediosPagoService.getAll()
      ]);
      setVentas(ventasData);
      setFilteredVentas(ventasData);
      setMediosPago(mediosPagoData.filter(mp => mp.activo));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showAlert('error', 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCuentasDisponibles = async () => {
    try {
      const [cuentas, servicios, combos, mediosPagoData] = await Promise.all([
        cuentasService.getDisponibles(),
        serviciosService.getAll(),
        combosService.getAll(),
        mediosPagoService.getAll()
      ]);
      setCuentasDisponibles(cuentas);
      setServiciosDisponibles(servicios.filter(s => s.activo));
      setCombosDisponibles(combos.filter(c => c.activo));
      setMediosPago(mediosPagoData.filter(mp => mp.activo));
    } catch (error) {
      console.error('Error al cargar cuentas disponibles:', error);
      showAlert('error', 'Error al cargar cuentas disponibles');
    }
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearch = (searchTerm) => {
    const filtered = ventas.filter(venta =>
      venta.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.detalles?.some(d => d.nombreServicio?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredVentas(filtered);
  };

  // Client search with debounce
  const handleClienteSearch = async (searchTerm) => {
    setClienteSearch(searchTerm);
    
    if (searchTerm.trim().length < 2) {
      setClienteSearchResults([]);
      return;
    }
    
    try {
      setSearchingClientes(true);
      const results = await clientesService.search(searchTerm);
      setClienteSearchResults(results);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    } finally {
      setSearchingClientes(false);
    }
  };

  const handleClienteSelect = (cliente) => {
    setSelectedCliente(cliente);
    setClienteSearch(`${cliente.nombre} ${cliente.apellido} - ${cliente.telefono}`);
    setClienteSearchResults([]);
  };

  // Step 1: Add service to desired list (without account)
  const handleAgregarServicioDeseado = () => {
    if (!servicioParaAgregar) {
      showAlert('error', 'Seleccione un servicio');
      return;
    }
    
    // Check if service already in desired list
    const yaAgregado = serviciosDeseados.some(s => s.servicioID === servicioParaAgregar.servicioID);
    if (yaAgregado) {
      showAlert('error', 'Este servicio ya fue agregado');
      return;
    }
    
    setServiciosDeseados([...serviciosDeseados, servicioParaAgregar]);
    setServicioParaAgregar(null);
  };

  const handleRemoverServicioDeseado = (servicioID) => {
    setServiciosDeseados(serviciosDeseados.filter(s => s.servicioID !== servicioID));
    // Also remove from cart if it was already assigned
    setServiciosCart(serviciosCart.filter(sc => sc.servicioID !== servicioID));
  };

  // Step 2: Select service from desired list to assign account/profile
  const handleServicioSelect = (servicio) => {
    setServicioSeleccionado(servicio);
    setCuentaSeleccionada(null);
    setPerfilSeleccionado(null);
    setPerfilesDisponibles([]);
  };

  const handleCuentaSelect = async (cuenta) => {
    setCuentaSeleccionada(cuenta);
    setPerfilSeleccionado(null);
    
    try {
      const perfiles = await cuentasService.getPerfilesDisponibles(cuenta.cuentaID);
      setPerfilesDisponibles(perfiles);
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
      showAlert('error', 'Error al cargar perfiles disponibles');
      setPerfilesDisponibles([]);
    }
  };

  // Step 2: Assign account/profile to selected service
  const handleAsignarCuentaAServicio = () => {
    if (!servicioSeleccionado) {
      showAlert('error', 'Seleccione un servicio para asignar');
      return;
    }
    
    if (!cuentaSeleccionada) {
      showAlert('error', 'Seleccione una cuenta');
      return;
    }
    
    if (!perfilSeleccionado) {
      showAlert('error', 'Seleccione un perfil');
      return;
    }
    
    // Check if this profile is already assigned
    const perfilYaUsado = serviciosCart.some(s => s.perfilID === perfilSeleccionado.perfilID);
    if (perfilYaUsado) {
      showAlert('error', 'Este perfil ya fue asignado');
      return;
    }
    
    // Check if this service already has an account assigned
    const servicioYaAsignado = serviciosCart.some(s => s.servicioID === servicioSeleccionado.servicioID);
    if (servicioYaAsignado) {
      showAlert('error', 'Este servicio ya tiene una cuenta asignada');
      return;
    }
    
    const nuevoServicio = {
      cuentaID: cuentaSeleccionada.cuentaID,
      perfilID: perfilSeleccionado.perfilID,
      servicioID: servicioSeleccionado.servicioID,
      nombreServicio: servicioSeleccionado.nombre,
      codigoCuenta: cuentaSeleccionada.codigoCuenta,
      numeroPerfil: perfilSeleccionado.numeroPerfil,
      precio: servicioSeleccionado.precio || 0
    };
    
    setServiciosCart([...serviciosCart, nuevoServicio]);
    setServicioSeleccionado(null);
    setCuentaSeleccionada(null);
    setPerfilSeleccionado(null);
    setPerfilesDisponibles([]);
    showAlert('success', `Cuenta asignada a ${servicioSeleccionado.nombre}`);
  };

  const handleRemoverServicio = (index) => {
    setServiciosCart(serviciosCart.filter((_, i) => i !== index));
  };

  // === COMBO HANDLERS ===
  
  // Step 1: Add combo to desired list (without accounts)
  const handleAgregarComboDeseado = () => {
    if (!comboParaAgregar) {
      showAlert('error', 'Seleccione un combo');
      return;
    }
    
    // Check if combo already in desired list
    const yaAgregado = combosDeseados.some(c => c.comboID === comboParaAgregar.comboID);
    if (yaAgregado) {
      showAlert('error', 'Este combo ya fue agregado');
      return;
    }
    
    setCombosDeseados([...combosDeseados, comboParaAgregar]);
    setComboParaAgregar(null);
  };

  const handleRemoverComboDeseado = (comboID) => {
    setCombosDeseados(combosDeseados.filter(c => c.comboID !== comboID));
    // Also remove from cart if it was already assigned
    setCombosCart(combosCart.filter(cc => cc.comboID !== comboID));
  };

  // Step 2: Select combo from desired list to assign accounts/profiles
  const handleComboSelect = (combo) => {
    setComboSeleccionado(combo);
    setServicioComboSeleccionado(null);
    setCuentaSeleccionada(null);
    setPerfilSeleccionado(null);
    setPerfilesDisponibles([]);
  };

  // Assign account/profile to a service within a combo
  const handleAsignarCuentaACombo = () => {
    if (!comboSeleccionado) {
      showAlert('error', 'Seleccione un combo');
      return;
    }

    if (!servicioComboSeleccionado) {
      showAlert('error', 'Seleccione un servicio del combo');
      return;
    }
    
    if (!cuentaSeleccionada) {
      showAlert('error', 'Seleccione una cuenta');
      return;
    }
    
    if (!perfilSeleccionado) {
      showAlert('error', 'Seleccione un perfil');
      return;
    }
    
    // Check if this profile is already assigned
    const perfilYaUsado = combosCart.some(cc => cc.perfilID === perfilSeleccionado.perfilID) ||
                          serviciosCart.some(s => s.perfilID === perfilSeleccionado.perfilID);
    if (perfilYaUsado) {
      showAlert('error', 'Este perfil ya fue asignado');
      return;
    }
    
    // Check if this service in this combo already has an account assigned
    const servicioYaAsignado = combosCart.some(cc => 
      cc.comboID === comboSeleccionado.comboID && 
      cc.servicioID === servicioComboSeleccionado.servicioID
    );
    if (servicioYaAsignado) {
      showAlert('error', 'Este servicio del combo ya tiene una cuenta asignada');
      return;
    }
    
    const nuevoServicioCombo = {
      comboID: comboSeleccionado.comboID,
      cuentaID: cuentaSeleccionada.cuentaID,
      perfilID: perfilSeleccionado.perfilID,
      servicioID: servicioComboSeleccionado.servicioID,
      nombreServicio: servicioComboSeleccionado.nombre,
      codigoCuenta: cuentaSeleccionada.codigoCuenta,
      numeroPerfil: perfilSeleccionado.numeroPerfil,
      precio: comboSeleccionado.precio / comboSeleccionado.servicios.length // Distribute combo price
    };
    
    setCombosCart([...combosCart, nuevoServicioCombo]);
    setServicioComboSeleccionado(null);
    setCuentaSeleccionada(null);
    setPerfilSeleccionado(null);
    setPerfilesDisponibles([]);
    showAlert('success', `Cuenta asignada a ${servicioComboSeleccionado.nombre} del combo ${comboSeleccionado.nombre}`);
  };

  const handleRemoverCombo = (comboID, servicioID) => {
    setCombosCart(combosCart.filter(cc => !(cc.comboID === comboID && cc.servicioID === servicioID)));
  };

  const calcularMontoTotal = () => {
    const totalServicios = serviciosCart.reduce((total, servicio) => total + servicio.precio, 0);
    const totalCombos = combosCart.reduce((total, combo) => total + combo.precio, 0);
    return totalServicios + totalCombos;
  };

  const handleCreate = () => {
    setSelectedVenta(null);
    setSelectedCliente(null);
    setClienteSearch('');
    setClienteSearchResults([]);
    setServiciosDeseados([]); // Clear desired services list
    setServiciosCart([]);
    setServicioParaAgregar(null);
    setServicioSeleccionado(null);
    setCombosDeseados([]); // Clear desired combos list
    setCombosCart([]);
    setComboParaAgregar(null);
    setComboSeleccionado(null);
    setCuentaSeleccionada(null);
    setPerfilSeleccionado(null);
    setPerfilesDisponibles([]);
    setFormData({
      fechaFin: '',
      medioPagoID: '',
      moneda: 'C$',
      notas: ''
    });
    setErrors({});
    loadCuentasDisponibles();
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!selectedCliente) newErrors.cliente = 'Seleccione un cliente';
    if (serviciosCart.length === 0 && combosCart.length === 0) newErrors.servicios = 'Agregue al menos un servicio o combo';
    if (!formData.fechaFin) newErrors.fechaFin = 'Seleccione la fecha de finalización';
    
    // Validate fechaFin is in the future
    const fechaFin = new Date(formData.fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaFin <= hoy) {
      newErrors.fechaFin = 'La fecha de finalización debe ser futura';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Construct detalles array combining individual services and combo services
      const detalles = [
        // Individual services
        ...serviciosCart.map(s => ({
          cuentaID: s.cuentaID,
          perfilID: s.perfilID,
          servicioID: s.servicioID,
          comboID: null, // No combo ID for individual services
          precioUnitario: s.precio || 0
        })),
        // Combo services - combosCart is already flat, just map directly
        ...combosCart.map(cc => ({
          cuentaID: cc.cuentaID,
          perfilID: cc.perfilID,
          servicioID: cc.servicioID,
          comboID: cc.comboID, // Include combo ID for combo services
          precioUnitario: cc.precio || 0 // Price already distributed when added to cart
        }))
      ];

      const ventaData = {
        clienteID: selectedCliente.clienteID,
        fechaFin: formData.fechaFin,
        medioPagoID: formData.medioPagoID || null,
        moneda: formData.moneda,
        notas: formData.notas,
        detalles
      };

      await ventasService.create(ventaData);
      showAlert('success', 'Venta creada exitosamente');
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error al crear venta:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear venta';
      showAlert('error', errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await ventasService.delete(selectedVenta.ventaID);
      showAlert('success', 'Venta cancelada exitosamente');
      setDeleteModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      showAlert('error', 'Error al cancelar venta');
    }
  };

  const columns = [
    { 
      key: 'ventaID', 
      label: '#',
      render: (row) => `V-${row.ventaID}`
    },
    { 
      key: 'cliente', 
      label: 'Cliente',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.nombreCliente}</div>
          <div className="text-sm text-gray-500">ID: {row.clienteID}</div>
        </div>
      )
    },
    { 
      key: 'servicios', 
      label: 'Servicios',
      render: (row) => (
        <div className="space-y-1">
          {row.detalles?.map((detalle, idx) => (
            <Badge key={idx} variant="primary" size="sm">
              {detalle.nombreServicio} (P{detalle.numeroPerfil})
            </Badge>
          ))}
        </div>
      )
    },
    { 
      key: 'fechas', 
      label: 'Período',
      render: (row) => (
        <div className="text-sm">
          <div>{formatDate(row.fechaInicio)}</div>
          <div className="text-gray-500">→ {formatDate(row.fechaFin)}</div>
          <div className="text-xs text-gray-400">{row.diasRestantes} días restantes</div>
        </div>
      )
    },
    { 
      key: 'monto', 
      label: 'Monto',
      render: (row) => (
        <div className="font-semibold text-green-600">
          {formatCurrency(row.monto, row.moneda)}
        </div>
      )
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (row) => {
        let color = 'gray';
        if (row.estado === 'Activo') color = 'green';
        else if (row.estado === 'ProximoVencer') color = 'yellow';
        else if (row.estado === 'Vencido') color = 'red';
        else if (row.estado === 'Cancelado') color = 'gray';
        
        return <Badge variant={color}>{row.estado}</Badge>;
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setSelectedVenta(row);
              setDeleteModalOpen(true);
            }}
            disabled={row.estado === 'Cancelado'}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {alert && <Alert type={alert.type} message={alert.message} />}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <Button onClick={handleCreate}>
          <Plus size={20} />
          Nueva Venta
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <SearchBar
            placeholder="Buscar por cliente o servicio..."
            onSearch={handleSearch}
          />
        </div>

        <Table
          columns={columns}
          data={filteredVentas}
          loading={loading}
          emptyMessage="No hay ventas registradas"
        />
      </Card>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Venta"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-2">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => handleClienteSearch(e.target.value)}
                  placeholder="Buscar por nombre, apellido o teléfono..."
                  className="flex-1 outline-none"
                />
              </div>
              {clienteSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {clienteSearchResults.map((cliente) => (
                    <button
                      key={cliente.clienteID}
                      type="button"
                      onClick={() => handleClienteSelect(cliente)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium">{cliente.nombre} {cliente.segundoNombre} {cliente.apellido} {cliente.segundoApellido}</div>
                      <div className="text-sm text-gray-500">{cliente.telefono}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.cliente && (
              <p className="mt-1 text-sm text-red-600">{errors.cliente}</p>
            )}
          </div>

          {/* Step 1: Select Desired Services */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Paso 1: Servicios que Desea el Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Servicio
                </label>
                <select
                  value={servicioParaAgregar?.servicioID || ''}
                  onChange={(e) => {
                    const servicio = serviciosDisponibles.find(s => s.servicioID === parseInt(e.target.value));
                    setServicioParaAgregar(servicio || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar servicio...</option>
                  {serviciosDisponibles.map((servicio) => (
                    <option key={servicio.servicioID} value={servicio.servicioID}>
                      {servicio.nombre} - {formatCurrency(servicio.precio, 'C$')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAgregarServicioDeseado}
                  disabled={!servicioParaAgregar}
                  className="w-full"
                >
                  <Plus size={16} />
                  Agregar Servicio
                </Button>
              </div>
            </div>

            {/* Desired Services List */}
            {serviciosDeseados.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3 text-blue-900">
                  Servicios Deseados ({serviciosDeseados.length})
                </h4>
                <div className="space-y-2">
                  {serviciosDeseados.map((servicio) => {
                    const yaAsignado = serviciosCart.some(sc => sc.servicioID === servicio.servicioID);
                    return (
                      <div key={servicio.servicioID} className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-blue-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{servicio.nombre}</span>
                            {yaAsignado && (
                              <Badge variant="success" size="sm">✓ Cuenta Asignada</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(servicio.precio, formData.moneda)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverServicioDeseado(servicio.servicioID)}
                          className="text-red-600 hover:text-red-700"
                          disabled={yaAsignado}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {errors.servicios && (
              <p className="mt-2 text-sm text-red-600">{errors.servicios}</p>
            )}

            {/* Separator */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm font-medium text-gray-500">O</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Add Combo Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline-block mr-1" size={16} />
                Seleccionar Combo/Paquete
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={comboParaAgregar?.comboID || ''}
                  onChange={(e) => {
                    const combo = combosDisponibles.find(c => c.comboID === parseInt(e.target.value));
                    setComboParaAgregar(combo || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar combo...</option>
                  {combosDisponibles.map((combo) => (
                    <option key={combo.comboID} value={combo.comboID}>
                      {combo.nombre} - {formatCurrency(combo.precio, 'C$')} ({combo.servicios.length} servicios)
                    </option>
                  ))}
                </select>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAgregarComboDeseado}
                    disabled={!comboParaAgregar}
                    className="w-full"
                  >
                    <Package size={16} />
                    Agregar Combo
                  </Button>
                </div>
              </div>
              
              {/* Show combo details */}
              {comboParaAgregar && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-900 mb-2">
                    Servicios incluidos en "{comboParaAgregar.nombre}":
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comboParaAgregar.servicios.map(s => (
                      <Badge key={s.servicioID} variant="secondary" size="sm">
                        {s.nombre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desired Combos List */}
            {combosDeseados.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-3 text-purple-900">
                  <Package className="inline-block mr-1" size={16} />
                  Combos Deseados ({combosDeseados.length})
                </h4>
                <div className="space-y-2">
                  {combosDeseados.map((combo) => {
                    const todasAsignadas = combo.servicios.every(s =>
                      combosCart.some(cc => cc.comboID === combo.comboID && cc.servicioID === s.servicioID)
                    );
                    const parcialmenteAsignado = combo.servicios.some(s =>
                      combosCart.some(cc => cc.comboID === combo.comboID && cc.servicioID === s.servicioID)
                    );

                    return (
                      <div key={combo.comboID} className="bg-white p-3 rounded-lg border-2 border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{combo.nombre}</span>
                              {todasAsignadas && (
                                <Badge variant="success" size="sm">✓ Completo</Badge>
                              )}
                              {parcialmenteAsignado && !todasAsignadas && (
                                <Badge variant="warning" size="sm">⚠ Incompleto</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(combo.precio, formData.moneda)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverComboDeseado(combo.comboID)}
                            className="text-red-600 hover:text-red-700"
                            disabled={parcialmenteAsignado}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 flex flex-wrap gap-1">
                          <span className="font-medium">Servicios:</span>
                          {combo.servicios.map(s => {
                            const asignado = combosCart.some(cc => cc.comboID === combo.comboID && cc.servicioID === s.servicioID);
                            return (
                              <span key={s.servicioID} className={asignado ? 'text-green-600 font-medium' : ''}>
                                {s.nombre}{asignado ? ' ✓' : ''}{s !== combo.servicios[combo.servicios.length - 1] ? ',' : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Assign Accounts to Services */}
          {serviciosDeseados.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Paso 2: Asignar Cuentas a los Servicios</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio a Asignar *
                  </label>
                  <select
                    value={servicioSeleccionado?.servicioID || ''}
                    onChange={(e) => {
                      const servicio = serviciosDeseados.find(s => s.servicioID === parseInt(e.target.value));
                      if (servicio) handleServicioSelect(servicio);
                      else handleServicioSelect(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar servicio...</option>
                    {serviciosDeseados
                      .filter(s => !serviciosCart.some(sc => sc.servicioID === s.servicioID))
                      .map((servicio) => (
                        <option key={servicio.servicioID} value={servicio.servicioID}>
                          {servicio.nombre}
                        </option>
                      ))
                    }
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo se muestran servicios sin cuenta asignada
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta
                  </label>
                  <select
                    value={cuentaSeleccionada?.cuentaID || ''}
                    onChange={(e) => {
                      const cuenta = cuentasDisponibles
                        .filter(c => c.servicioID === servicioSeleccionado?.servicioID)
                        .find(c => c.cuentaID === parseInt(e.target.value));
                      if (cuenta) handleCuentaSelect(cuenta);
                    }}
                    disabled={!servicioSeleccionado}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {cuentasDisponibles
                      .filter(c => c.servicioID === servicioSeleccionado?.servicioID)
                      .map((cuenta) => (
                        <option key={cuenta.cuentaID} value={cuenta.cuentaID}>
                          {cuenta.codigoCuenta} ({cuenta.perfilesDisponibles} disponibles)
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Perfil
                  </label>
                  <select
                    value={perfilSeleccionado?.perfilID || ''}
                    onChange={(e) => {
                      const perfil = perfilesDisponibles.find(p => p.perfilID === parseInt(e.target.value));
                      setPerfilSeleccionado(perfil || null);
                    }}
                    disabled={!cuentaSeleccionada}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar perfil...</option>
                    {perfilesDisponibles.map((perfil) => (
                      <option key={perfil.perfilID} value={perfil.perfilID}>
                        Perfil #{perfil.numeroPerfil} {perfil.pin ? `(PIN: ${perfil.pin})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAsignarCuentaAServicio}
                    disabled={!servicioSeleccionado || !cuentaSeleccionada || !perfilSeleccionado}
                    className="w-full"
                  >
                    <Plus size={16} />
                    Asignar
                  </Button>
                </div>
              </div>

              {/* Final Cart with Assigned Accounts */}
              {serviciosCart.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-green-900">
                    <ShoppingCart size={18} />
                    Cuentas Asignadas ({serviciosCart.length}/{serviciosDeseados.length})
                  </h4>
                  <div className="space-y-2">
                    {serviciosCart.map((servicio, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-green-200">
                        <div className="flex-1">
                          <div className="font-medium">{servicio.nombreServicio}</div>
                          <div className="text-sm text-gray-500">
                            Cuenta: {servicio.codigoCuenta} | Perfil: #{servicio.numeroPerfil}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(servicio.precio, formData.moneda)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverServicio(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="font-semibold text-lg">Total:</span>
                <span className="font-bold text-xl text-green-600">
                  {formatCurrency(calcularMontoTotal(), formData.moneda)}
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Assign Accounts to Combo Services */}
          {combosDeseados.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">
                <Package className="inline-block mr-1" size={18} />
                Paso 2: Asignar Cuentas a los Servicios del Combo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Combo *
                  </label>
                  <select
                    value={comboSeleccionado?.comboID || ''}
                    onChange={(e) => {
                      const combo = combosDeseados.find(c => c.comboID === parseInt(e.target.value));
                      handleComboSelect(combo);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Seleccionar combo...</option>
                    {combosDeseados.map((combo) => {
                      const pendientes = combo.servicios.filter(s =>
                        !combosCart.some(cc => cc.comboID === combo.comboID && cc.servicioID === s.servicioID)
                      ).length;
                      return (
                        <option key={combo.comboID} value={combo.comboID}>
                          {combo.nombre} ({pendientes > 0 ? `${pendientes} pendientes` : 'Completo'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio del Combo *
                  </label>
                  <select
                    value={servicioComboSeleccionado?.servicioID || ''}
                    onChange={(e) => {
                      const servicio = comboSeleccionado?.servicios.find(s => s.servicioID === parseInt(e.target.value));
                      if (servicio) {
                        setServicioComboSeleccionado(servicio);
                        handleServicioSelect(servicio); // Also call handler to reset cuenta/perfil
                      }
                    }}
                    disabled={!comboSeleccionado}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    {comboSeleccionado?.servicios
                      .filter(s => !combosCart.some(cc => cc.comboID === comboSeleccionado.comboID && cc.servicioID === s.servicioID))
                      .map((servicio) => (
                        <option key={servicio.servicioID} value={servicio.servicioID}>
                          {servicio.nombre}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta
                  </label>
                  <select
                    value={cuentaSeleccionada?.cuentaID || ''}
                    onChange={(e) => {
                      const cuenta = cuentasDisponibles
                        .filter(c => c.servicioID === servicioComboSeleccionado?.servicioID)
                        .find(c => c.cuentaID === parseInt(e.target.value));
                      if (cuenta) handleCuentaSelect(cuenta);
                    }}
                    disabled={!servicioComboSeleccionado}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    {cuentasDisponibles
                      .filter(c => c.servicioID === servicioComboSeleccionado?.servicioID)
                      .map((cuenta) => (
                        <option key={cuenta.cuentaID} value={cuenta.cuentaID}>
                          {cuenta.codigoCuenta} ({cuenta.perfilesDisponibles} disponibles)
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Perfil
                  </label>
                  <select
                    value={perfilSeleccionado?.perfilID || ''}
                    onChange={(e) => {
                      const perfil = perfilesDisponibles.find(p => p.perfilID === parseInt(e.target.value));
                      setPerfilSeleccionado(perfil || null);
                    }}
                    disabled={!cuentaSeleccionada}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                  >
                    <option value="">Seleccionar...</option>
                    {perfilesDisponibles.map((perfil) => (
                      <option key={perfil.perfilID} value={perfil.perfilID}>
                        Perfil #{perfil.numeroPerfil} {perfil.pin ? `(PIN: ${perfil.pin})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAsignarCuentaACombo}
                    disabled={!comboSeleccionado || !servicioComboSeleccionado || !cuentaSeleccionada || !perfilSeleccionado}
                    className="w-full"
                  >
                    <Plus size={16} />
                    Asignar
                  </Button>
                </div>
              </div>

              {/* Combo Cart */}
              {combosCart.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-purple-900">
                    <Package size={18} />
                    Servicios de Combos Asignados
                  </h4>
                  <div className="space-y-3">
                    {combosDeseados.map(combo => {
                      const serviciosAsignados = combosCart.filter(cc => cc.comboID === combo.comboID);
                      if (serviciosAsignados.length === 0) return null;

                      return (
                        <div key={combo.comboID} className="bg-white p-3 rounded-lg border-2 border-purple-200">
                          <div className="font-medium text-purple-900 mb-2 flex items-center justify-between">
                            <span>{combo.nombre}</span>
                            <Badge variant={serviciosAsignados.length === combo.servicios.length ? "success" : "warning"}>
                              {serviciosAsignados.length}/{combo.servicios.length} asignados
                            </Badge>
                          </div>
                          <div className="space-y-2 ml-4">
                            {serviciosAsignados.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex-1">
                                  <div className="font-medium">{item.nombreServicio}</div>
                                  <div className="text-xs text-gray-500">
                                    {item.codigoCuenta} | Perfil #{item.numeroPerfil}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoverCombo(combo.comboID, item.servicioID)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fecha Fin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Finalización"
              type="date"
              value={formData.fechaFin}
              onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              error={errors.fechaFin}
              required
              icon={<Calendar size={20} />}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moneda *
              </label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="C$">C$ (Córdobas)</option>
                <option value="USD">USD (Dólares)</option>
              </select>
            </div>
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medio de Pago (Opcional)
            </label>
            <select
              value={formData.medioPagoID}
              onChange={(e) => setFormData({ ...formData, medioPagoID: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Sin medio de pago registrado</option>
              {mediosPago.map((mp) => (
                <option key={mp.medioPagoID} value={mp.medioPagoID}>
                  {mp.tipo} - {mp.nombre} ({mp.moneda})
                </option>
              ))}
            </select>
          </div>

          {/* Resumen de Venta */}
          {(serviciosCart.length > 0 || combosCart.length > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Resumen de la Venta</h4>
              
              {/* Servicios Individuales */}
              {serviciosCart.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Servicios Individuales:</p>
                  <div className="space-y-1">
                    {serviciosCart.map((sc, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">• {sc.nombreServicio}</span>
                        <span className="font-medium">{formatCurrency(sc.precio, formData.moneda)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Combos */}
              {combosCart.length > 0 && (() => {
                // Group combos by comboID
                const combosAgrupados = {};
                combosCart.forEach(cc => {
                  if (!combosAgrupados[cc.comboID]) {
                    combosAgrupados[cc.comboID] = {
                      nombre: cc.nombreCombo,
                      precio: 0,
                      servicios: []
                    };
                  }
                  combosAgrupados[cc.comboID].precio += cc.precio || 0;
                  combosAgrupados[cc.comboID].servicios.push(cc.nombreServicio);
                });

                return (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Combos:</p>
                    <div className="space-y-2">
                      {Object.values(combosAgrupados).map((combo, index) => (
                        <div key={index} className="border-l-2 border-blue-300 pl-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{combo.nombre}</span>
                            <span className="font-medium">{formatCurrency(combo.precio, formData.moneda)}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Incluye: {combo.servicios.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Total */}
              <div className="border-t border-blue-300 pt-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(calcularMontoTotal(), formData.moneda)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Venta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Cancelar Venta"
      >
        <div className="space-y-4">
          <p>¿Está seguro de que desea cancelar esta venta? Los perfiles asignados serán liberados.</p>
          {selectedVenta && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Cliente:</strong> {selectedVenta.nombreCliente}</p>
              <p><strong>Servicios:</strong></p>
              <ul className="list-disc list-inside ml-4">
                {selectedVenta.detalles?.map((detalle, idx) => (
                  <li key={idx}>{detalle.nombreServicio} - Perfil #{detalle.numeroPerfil}</li>
                ))}
              </ul>
              <p><strong>Monto:</strong> {formatCurrency(selectedVenta.monto, selectedVenta.moneda)}</p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              No, mantener
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Sí, cancelar venta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Ventas;
