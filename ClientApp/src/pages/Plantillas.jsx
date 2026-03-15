import { useState, useEffect } from 'react';
import { MessageSquare, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { plantillasService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Alert from '../components/Alert';

const PLANTILLA_INFO = {
  detalles_venta: {
    titulo: 'Detalles de Venta',
    descripcion: 'Se aplica por cada servicio al copiar los detalles de una venta (vista Ventas y Clientes). Para combos, el encabezado "🔥 COMBO ACTIVO" y el precio total del combo se añaden automáticamente.',
    variables: [
      { v: '{NOMBRE_SERVICIO}', d: 'Nombre del servicio' },
      { v: '{ID_VENTA}', d: 'Número de la venta' },
      { v: '{CORREO}', d: 'Correo de la cuenta' },
      { v: '{CONTRASENA}', d: 'Contraseña de la cuenta' },
      { v: '{PERFIL}', d: 'Número de perfil' },
      { v: '{PIN}', d: 'PIN del perfil (ej: "🔐 Pin: 1234") o vacío si no tiene' },
      { v: '{FECHA_INICIO}', d: 'Fecha de inicio' },
      { v: '{FECHA_FIN}', d: 'Fecha de corte / vencimiento' },
      { v: '{PRECIO}', d: 'Precio del servicio (vacío para items de combo)' },
      { v: '{MONEDA}', d: 'Moneda (C$, USD…)' },
    ],
  },
  proximo_vencer: {
    titulo: 'Próximo a Vencer',
    descripcion: 'Aviso que se copia cuando una suscripción está próxima a vencer (botón amarillo en Ventas).',
    variables: [
      { v: '{NOMBRE_CLIENTE}', d: 'Nombre completo del cliente' },
      { v: '{SERVICIOS}', d: 'Lista de servicios de la venta' },
      { v: '{ID_VENTA}', d: 'Número de la venta' },
      { v: '{FECHA_FIN}', d: 'Fecha de vencimiento' },
    ],
  },
  vencido: {
    titulo: 'Suscripción Vencida',
    descripcion: 'Aviso que se copia cuando una suscripción ya venció (botón rojo en Ventas).',
    variables: [
      { v: '{NOMBRE_CLIENTE}', d: 'Nombre completo del cliente' },
      { v: '{SERVICIOS}', d: 'Lista de servicios de la venta' },
      { v: '{ID_VENTA}', d: 'Número de la venta' },
      { v: '{FECHA_FIN}', d: 'Fecha de vencimiento' },
    ],
  },
  editar_venta: {
    titulo: 'Cambio de Cuenta',
    descripcion: 'Se copia por cada servicio cuando se edita / cambia la cuenta de una venta.',
    variables: [
      { v: '{NOMBRE_SERVICIO}', d: 'Nombre del servicio' },
      { v: '{CORREO}', d: 'Nuevo correo de la cuenta' },
      { v: '{CONTRASENA}', d: 'Nueva contraseña de la cuenta' },
      { v: '{PERFIL}', d: 'Número de perfil' },
      { v: '{PIN}', d: 'PIN del perfil (ej: "🔐 Pin: 1234") o vacío si no tiene' },
      { v: '{FECHA_INICIO}', d: 'Fecha de inicio' },
      { v: '{FECHA_FIN}', d: 'Fecha de corte' },
    ],
  },
};

// Order in which to display templates
const PLANTILLA_ORDER = ['detalles_venta', 'proximo_vencer', 'vencido', 'editar_venta'];

const PlantillaCard = ({ plantilla, onSave, canEdit }) => {
  const info = PLANTILLA_INFO[plantilla.clave] || {};
  const [contenido, setContenido] = useState(plantilla.contenido);
  const [saving, setSaving] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [localAlert, setLocalAlert] = useState(null);

  const isDirty = contenido !== plantilla.contenido;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(plantilla.clave, contenido);
      setLocalAlert({ type: 'success', message: 'Plantilla guardada' });
    } catch {
      setLocalAlert({ type: 'error', message: 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {info.titulo || plantilla.nombre}
          </h2>
          {info.descripcion && (
            <p className="text-sm text-gray-500 mt-1">{info.descripcion}</p>
          )}
        </div>

        {localAlert && (
          <Alert
            type={localAlert.type}
            message={localAlert.message}
            onClose={() => setLocalAlert(null)}
          />
        )}

        {/* Editor */}
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          disabled={!canEdit}
          rows={Math.max(8, contenido.split('\n').length + 1)}
          className="w-full font-mono text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-y"
        />

        {/* Variables toggle */}
        {info.variables && info.variables.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowVars(!showVars)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {showVars ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              Variables disponibles ({info.variables.length})
            </button>
            {showVars && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-md p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {info.variables.map(({ v, d }) => (
                  <div key={v} className="flex items-start gap-2 text-sm">
                    <code className="bg-white border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap">
                      {v}
                    </code>
                    <span className="text-gray-600 text-xs mt-0.5">{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            {isDirty && (
              <Button
                variant="secondary"
                onClick={() => { setContenido(plantilla.contenido); setLocalAlert(null); }}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Descartar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const Plantillas = () => {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const { canEdit } = useAuth();
  const canEditPlantillas = canEdit('plantillas');

  useEffect(() => {
    setLoading(true);
    plantillasService.getAll()
      .then(data => setPlantillas(data))
      .catch(() => setAlert({ type: 'error', message: 'Error al cargar las plantillas' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (clave, contenido) => {
    await plantillasService.update(clave, { contenido });
    setPlantillas(prev => prev.map(p => p.clave === clave ? { ...p, contenido } : p));
  };

  const ordered = PLANTILLA_ORDER
    .map(clave => plantillas.find(p => p.clave === clave))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare size={28} className="text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plantillas de Mensajes</h1>
          <p className="text-gray-600 mt-1">
            Personaliza los mensajes que se copian en las vistas de Ventas y Clientes.
          </p>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {loading ? (
        <Card>
          <div className="text-center py-12 text-gray-500">Cargando plantillas…</div>
        </Card>
      ) : ordered.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-500">
            No se encontraron plantillas. Ejecuta el script <code>data.sql</code> para generarlas.
          </div>
        </Card>
      ) : (
        ordered.map(plantilla => (
          <PlantillaCard
            key={plantilla.clave}
            plantilla={plantilla}
            onSave={handleSave}
            canEdit={canEditPlantillas}
          />
        ))
      )}
    </div>
  );
};

export default Plantillas;
