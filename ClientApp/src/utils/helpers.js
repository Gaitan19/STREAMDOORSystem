export const generatePassword = (length = 16) => {
  // Requisitos de contraseña:
  // - Longitud: 10-60 caracteres
  // - Al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
  // - No incluir ~
  // - No contraseñas simples
  
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'; // Sin ~
  
  // Validar longitud
  const validLength = Math.max(10, Math.min(60, length));
  
  // Contraseñas simples a evitar
  const weakPasswords = [
    '12345678', '123456789', '1234567890', 
    'password', 'Password', 'PASSWORD',
    'qwerty', 'Qwerty', 'QWERTY',
    'abcdefgh', 'Abcdefgh', 'ABCDEFGH'
  ];
  
  let password = '';
  let attempts = 0;
  const maxAttempts = 10;
  
  // Generar contraseña válida
  do {
    password = '';
    
    // Asegurar al menos 1 de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar el resto de la longitud
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < validLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar caracteres
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    attempts++;
    
  } while (weakPasswords.includes(password) && attempts < maxAttempts);
  
  return password;
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
    'Activo': 'Activo',
    'ProximoVencer': 'Próximo a Vencer',
    'Vencido': 'Vencido',
    'Cancelado': 'Cancelado'
  };
  return labels[estado] || estado;
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
