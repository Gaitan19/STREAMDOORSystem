import { useState, useEffect } from 'react';
import { MessageSquare, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { plantillasService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';

// Map of template key -> list of available variables with descriptions
const PLANTILLA_VARIABLES = {
  combo_header: [
    { variable: '{NOMBRES_SERVICIOS}', desc: 'Nombres de los servicios del combo separados por "+"' },
  ],
  combo_item: [
    { variable: '{NOMBRE_SERVICIO}', desc: 'Nombre del servicio' },
    { variable: '{ID_VENTA}', desc: 'Número de la venta' },
    { variable: '{CORREO}', desc: 'Correo de la cuenta' },
    { variable: '{CONTRASENA}', desc: 'Contraseña de la cuenta' },
    { variable: '{PERFIL}', desc: 'Número de perfil' },
    { variable: '{PIN_LINEA}', desc: 'Línea con PIN del perfil (o vacío si no tiene)' },
    { variable: '{FECHA_INICIO}', desc: 'Fecha de inicio de la suscripción' },
    { variable: '{FECHA_FIN}', desc: 'Fecha de fin (corte) de la suscripción' },
  ],
  combo_footer: [
    { variable: '{PRECIO_COMBO}', desc: 'Precio total del combo' },
    { variable: '{MONEDA}', desc: 'Moneda de la venta' },
  ],
  individual_item: [
    { variable: '{NOMBRE_SERVICIO}', desc: 'Nombre del servicio' },
    { variable: '{ID_VENTA}', desc: 'Número de la venta' },
    { variable: '{CORREO}', desc: 'Correo de la cuenta' },
    { variable: '{CONTRASENA}', desc: 'Contraseña de la cuenta' },
    { variable: '{PERFIL}', desc: 'Número de perfil' },
    { variable: '{PIN_LINEA}', desc: 'PIN del perfil (o vacío si no tiene)' },
    { variable: '{FECHA_INICIO}', desc: 'Fecha de inicio de la suscripción' },
    { variable: '{FECHA_FIN}', desc: 'Fecha de fin (corte) de la suscripción' },
    { variable: '{PRECIO}', desc: 'Precio del servicio' },
    { variable: '{MONEDA}', desc: 'Moneda de la venta' },
  ],
  mensaje_footer: [
    { variable: '{PRECIO_TOTAL}', desc: 'Precio total de la compra' },
    { variable: '{MONEDA}', desc: 'Moneda de la venta' },
  ],
  proximo_vencer: [
    { variable: '{NOMBRE_CLIENTE}', desc: 'Nombre completo del cliente' },
    { variable: '{SERVICIOS}', desc: 'Lista de servicios contratados' },
    { variable: '{ID_VENTA}', desc: 'Número de la venta' },
    { variable: '{FECHA_FIN}', desc: 'Fecha de vencimiento' },
  ],
  vencido: [
    { variable: '{NOMBRE_CLIENTE}', desc: 'Nombre completo del cliente' },
    { variable: '{SERVICIOS}', desc: 'Lista de servicios contratados' },
    { variable: '{ID_VENTA}', desc: 'Número de la venta' },
    { variable: '{FECHA_FIN}', desc: 'Fecha de vencimiento' },
  ],
  cambio_cuenta_item: [
    { variable: '{NOMBRE_SERVICIO}', desc: 'Nombre del servicio' },
    { variable: '{CORREO}', desc: 'Nuevo correo de la cuenta' },
    { variable: '{CONTRASENA}', desc: 'Nueva contraseña de la cuenta' },
    { variable: '{PERFIL}', desc: 'Número de perfil' },
    { variable: '{PIN_LINEA}', desc: 'Línea con PIN del perfil (o vacío si no tiene)' },
    { variable: '{FECHA_INICIO}', desc: 'Fecha de inicio' },
    { variable: '{FECHA_FIN}', desc: 'Fecha de corte' },
  ],
};

const PlantillaEditor = ({ plantilla, onSave, canEdit }) => {
  const [contenido, setContenido] = useState(plantilla.contenido);
  const [saving, setSaving] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [localAlert, setLocalAlert] = useState(null);
  const vars = PLANTILLA_VARIABLES[plantilla.clave] || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(plantilla.clave, contenido);
      setLocalAlert({ type: 'success', message: 'Plantilla guardada correctamente' });
    } catch {
      setLocalAlert({ type: 'error', message: 'Error al guardar la plantilla' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setContenido(plantilla.contenido);
    setLocalAlert(null);
  };

  const isDirty = contenido !== plantilla.contenido;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{plantilla.nombre}</h3>
            {plantilla.descripcion && (
              <p className="text-sm text-gray-500 mt-0.5">{plantilla.descripcion}</p>
            )}
          </div>
          <span className="text-xs font-mono bg-gray-200 text-gray-600 px-2 py-1 rounded">
            {plantilla.clave}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {localAlert && (
          <Alert
            type={localAlert.type}
            message={localAlert.message}
            onClose={() => setLocalAlert(null)}
          />
        )}

        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          disabled={!canEdit}
          rows={contenido.split('\n').length + 2}
          className="w-full font-mono text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-y"
          placeholder="Contenido de la plantilla..."
        />

        {vars.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowVars(!showVars)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {showVars ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Variables disponibles ({vars.length})
            </button>
            {showVars && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-md p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {vars.map(({ variable, desc }) => (
                  <div key={variable} className="flex items-start gap-2 text-sm">
                    <code className="bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">
                      {variable}
                    </code>
                    <span className="text-gray-600 text-xs mt-0.5">{desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {canEdit && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            {isDirty && (
              <Button
                variant="secondary"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Descartar cambios
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Plantillas = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const { canEdit } = useAuth();

  const canEditPlantillas = canEdit('plantillas');

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      const data = await plantillasService.getAll();
      setPlantillas(data);
    } catch {
      setAlert({ type: 'error', message: 'Error al cargar las plantillas' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantillas();
  }, []);

  const handleSave = async (clave, contenido) => {
    await plantillasService.update(clave, { contenido });
    // Update local state to reflect saved value
    setPlantillas(prev =>
      prev.map(p => p.clave === clave ? { ...p, contenido } : p)
    );
  };

  const GRUPOS = [
    {
      titulo: 'Mensaje de Detalles de Venta',
      descripcion: 'Estas plantillas se usan al copiar los detalles completos de una venta (en Ventas y en el historial del Cliente).',
      claves: ['combo_header', 'combo_item', 'combo_footer', 'individual_item', 'mensaje_footer'],
    },
    {
      titulo: 'Avisos de Vencimiento',
      descripcion: 'Mensajes de aviso cuando una venta está próxima a vencer o ya venció.',
      claves: ['proximo_vencer', 'vencido'],
    },
    {
      titulo: 'Cambio de Cuenta',
      descripcion: 'Mensaje que se envía al cliente cuando se cambia la cuenta/correo de un servicio.',
      claves: ['cambio_cuenta_item'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare size={28} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas de Mensajes</h1>
          <p className="text-gray-600 mt-1">
            Personaliza los mensajes que se copian al portapapeles en las vistas de Ventas y Clientes.
          </p>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {loading ? (
        <Card>
          <div className="text-center py-12 text-gray-500">Cargando plantillas...</div>
        </Card>
      ) : (
        GRUPOS.map((grupo) => {
          const grupoPlantillas = plantillas.filter(p => grupo.claves.includes(p.clave));
          if (grupoPlantillas.length === 0) return null;

          return (
            <Card key={grupo.titulo}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{grupo.titulo}</h2>
                <p className="text-sm text-gray-500 mt-1">{grupo.descripcion}</p>
              </div>
              <div className="space-y-4">
                {grupo.claves.map(clave => {
                  const plantilla = grupoPlantillas.find(p => p.clave === clave);
                  if (!plantilla) return null;
                  return (
                    <PlantillaEditor
                      key={plantilla.clave}
                      plantilla={plantilla}
                      onSave={handleSave}
                      canEdit={canEditPlantillas}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default Plantillas;
