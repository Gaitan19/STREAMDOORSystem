export const generatePassword = (length = 16) => {
  // Requisitos de contraseña:
  // - Siempre empieza con "StreamDoorNic"
  // - Longitud: 10-60 caracteres (después del prefijo)
  // - Al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
  // - No incluir ~
  // - No contraseñas simples
  
  const prefix = 'StreamDoorNic';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*'; // Simplified, sin ~
  
  // Calculate length for the random part (after prefix)
  const remainingLength = Math.max(10, length) - prefix.length;
  const validLength = Math.max(4, remainingLength); // At least 4 chars after prefix
  
  let randomPart = '';
  let attempts = 0;
  const maxAttempts = 10;
  
  // Generar parte aleatoria válida
  do {
    randomPart = '';
    
    // Asegurar al menos 1 de cada tipo
    randomPart += uppercase[Math.floor(Math.random() * uppercase.length)];
    randomPart += lowercase[Math.floor(Math.random() * lowercase.length)];
    randomPart += numbers[Math.floor(Math.random() * numbers.length)];
    randomPart += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar el resto de la longitud
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = randomPart.length; i < validLength; i++) {
      randomPart += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar caracteres
    randomPart = randomPart.split('').sort(() => Math.random() - 0.5).join('');
    attempts++;
    
  } while (attempts < maxAttempts);
  
  // Return prefix + random part
  return prefix + randomPart;
};

export const generateEmail = (baseName) => {
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  const randomDomain = domains[Math.floor(Math.random() * domains.length)];
  const randomNum = Math.floor(Math.random() * 9999);
  const sanitizedName = baseName.toLowerCase().replace(/\s+/g, '.');
  
  return `${sanitizedName}${randomNum}@${randomDomain}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatCurrency = (amount, moneda = 'C$') => {
  // Handle Nicaraguan Córdoba (C$) and USD
  if (moneda === 'C$') {
    return `C$ ${new Intl.NumberFormat('es-NI', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)}`;
  } else if (moneda === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }
  // Default fallback
  return `${moneda} ${amount || 0}`;
};

export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'Disponible':
      return 'bg-green-100 text-green-800';
    case 'Próxima a Vencer':
      return 'bg-orange-100 text-orange-800';
    case 'Vencida':
      return 'bg-red-100 text-red-800';
    case 'No Disponible':
      return 'bg-gray-100 text-gray-800';
    case 'Ocupada':
      return 'bg-blue-100 text-blue-800';
    case 'Activo':
      return 'bg-green-100 text-green-800';
    case 'ProximoVencer':
      return 'bg-orange-100 text-orange-800';
    case 'Vencido':
      return 'bg-red-100 text-red-800';
    case 'Cancelado':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

export const getEstadoBadge = (estado) => {
  const labels = {
    'Disponible': 'Disponible',
    'Próxima a Vencer': 'Próxima a Vencer',
    'Vencida': 'Vencida',
    'No Disponible': 'No Disponible',
    'Ocupada': 'Ocupada',
    'Activo': 'Activo',
    'ProximoVencer': 'Próximo a Vencer',
    'Vencido': 'Vencido',
    'Cancelado': 'Cancelado'
  };
  return labels[estado] || estado;
};

export const copyToClipboard = async (text, field = 'Texto') => {
  if (!text) {
    throw new Error(`No hay ${field.toLowerCase()} para copiar`);
  }
  await navigator.clipboard.writeText(text);
  return `${field} copiado al portapapeles`;
};

export const calculateDaysUntilExpiration = (fechaFinalizacion) => {
  if (!fechaFinalizacion) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(fechaFinalizacion);
  expiration.setHours(0, 0, 0, 0);
  const diffTime = expiration - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getRowColorClass = (estado) => {
  switch (estado) {
    case 'Vencida':
      return 'bg-red-50 hover:bg-red-100';
    case 'Próxima a Vencer':
      return 'bg-orange-50 hover:bg-orange-100';
    case 'Disponible':
      return 'bg-green-50 hover:bg-green-100';
    case 'No Disponible':
      return 'bg-gray-50 hover:bg-gray-100';
    default:
      return 'hover:bg-gray-50';
  }
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const calculateDaysUntil = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Generate unique account code (CodigoCuenta)
// Format: 2 letters from service name + 6 random numbers
// Example: "NE192599" for Netflix
export const generateCodigoCuenta = (servicioNombre) => {
  if (!servicioNombre || servicioNombre.length < 2) {
    throw new Error('El nombre del servicio debe tener al menos 2 caracteres');
  }
  
  // Extract first 2 letters and convert to uppercase
  const prefix = servicioNombre.substring(0, 2).toUpperCase();
  
  // Generate 6 random digits
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 100000-999999
  
  return `${prefix}${randomNum}`;
};
