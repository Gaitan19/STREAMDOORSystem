import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, Lock, Eye, EyeOff, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const CURRENCY_SYMBOL = import.meta.env.VITE_CURRENCY_SYMBOL || 'C$';
const CURRENCY_NAME = import.meta.env.VITE_CURRENCY_NAME || 'Cordobas';
const ENV_USD_RATE = parseFloat(import.meta.env.VITE_CURRENCY_TO_USD_RATE) || 36.50;
const LS_RATE_KEY = 'currency_usd_rate';

const Perfil = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    telefono: ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  // Exchange rate state
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [currentRate, setCurrentRate] = useState(ENV_USD_RATE);
  const [rateError, setRateError] = useState('');
  const [rateMessage, setRateMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
    // Load exchange rate from localStorage
    const stored = localStorage.getItem(LS_RATE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) setCurrentRate(parsed);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setProfileForm({
          nombre: data.nombre,
          telefono: data.telefono || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});

    const newErrors = {};
    if (!profileForm.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
        setProfile({ ...profile, ...profileForm });
        setEditing(false);
        
        // Update user in auth context
        window.location.reload(); // Simple way to update context
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al actualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});

    const newErrors = {};
    
    if (!passwordForm.oldPassword) {
      newErrors.oldPassword = 'La contraseña anterior es requerida';
    }
    
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setChangingPassword(false);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const handleRateSubmit = (e) => {
    e.preventDefault();
    setRateError('');
    setRateMessage({ type: '', text: '' });
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed <= 0) {
      setRateError('Ingresa un tipo de cambio válido mayor a 0');
      return;
    }
    localStorage.setItem(LS_RATE_KEY, parsed.toFixed(2));
    setCurrentRate(parsed);
    setEditingRate(false);
    setRateMessage({ type: 'success', text: 'Tipo de cambio actualizado correctamente' });
  };

  const handleResetRate = () => {
    localStorage.removeItem(LS_RATE_KEY);
    setCurrentRate(ENV_USD_RATE);
    setEditingRate(false);
    setRateMessage({ type: 'success', text: `Tipo de cambio restablecido al valor predeterminado (${ENV_USD_RATE})` });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información personal y seguridad</p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Information Card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Información Personal</h2>
                <p className="text-sm text-gray-600">Actualiza tus datos personales</p>
              </div>
            </div>
            {!editing && (
              <Button onClick={() => setEditing(true)} variant="secondary">
                Editar
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <Input
                    type="text"
                    value={profileForm.nombre}
                    onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                    error={errors.nombre}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    value={profileForm.telefono}
                    onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                    placeholder="(505) 8888-8888"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setProfileForm({
                      nombre: profile.nombre,
                      telefono: profile.telefono || ''
                    });
                    setErrors({});
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{profile?.nombre}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Correo Electrónico</p>
                  <p className="font-medium text-gray-900">{profile?.correo}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{profile?.telefono || 'No registrado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Miembro desde</p>
                  <p className="font-medium text-gray-900">
                    {new Date(profile?.fechaCreacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Change Password Card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
                <p className="text-sm text-gray-600">Cambia tu contraseña regularmente</p>
              </div>
            </div>
            {!changingPassword && (
              <Button onClick={() => setChangingPassword(true)} variant="secondary">
                Cambiar Contraseña
              </Button>
            )}
          </div>

          {changingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Anterior *
                </label>
                <div className="relative">
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    error={errors.oldPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    error={errors.newPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    error={errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Consejos para una contraseña segura:</strong>
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Usa al menos 8 caracteres</li>
                  <li>Combina letras mayúsculas y minúsculas</li>
                  <li>Incluye números y símbolos</li>
                  <li>No uses información personal obvia</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordForm({
                      oldPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setErrors({});
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Cambiar Contraseña
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-gray-600">
              <p>Por motivos de seguridad, te recomendamos cambiar tu contraseña periódicamente.</p>
            </div>
          )}
        </Card>

        {/* Exchange Rate Card */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tipo de Cambio</h2>
                <p className="text-sm text-gray-600">
                  Tasa de conversión de {CURRENCY_SYMBOL} ({CURRENCY_NAME}) a dólares ($)
                </p>
              </div>
            </div>
            {!editingRate && (
              <Button onClick={() => { setRateInput(currentRate.toFixed(2)); setRateError(''); setEditingRate(true); }} variant="secondary">
                Editar
              </Button>
            )}
          </div>

          {rateMessage.text && (
            <div className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
              rateMessage.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {rateMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${rateMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {rateMessage.text}
              </p>
            </div>
          )}

          {editingRate ? (
            <form onSubmit={handleRateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1 $ = ¿Cuántos {CURRENCY_SYMBOL}? *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  placeholder={`Ej: ${ENV_USD_RATE}`}
                  error={rateError}
                />
                {rateError && (
                  <p className="mt-1 text-sm text-red-600">{rateError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Valor predeterminado (desde .env): {ENV_USD_RATE}
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={handleResetRate}>
                  Restablecer predeterminado
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditingRate(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-gray-600">Tipo de cambio actual</p>
                <p className="text-2xl font-bold text-gray-900">
                  1 $ = {currentRate.toFixed(2)} {CURRENCY_SYMBOL}
                </p>
                {(() => {
                  const stored = localStorage.getItem(LS_RATE_KEY);
                  return stored && parseFloat(stored) !== ENV_USD_RATE ? (
                    <p className="text-xs text-blue-600 mt-1">Valor personalizado (predeterminado: {ENV_USD_RATE})</p>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Perfil;
