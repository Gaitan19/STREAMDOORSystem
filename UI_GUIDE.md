# 🎨 Interfaz de Usuario - STREAMDOORSystem

## Vista General de la UI

Este documento describe la interfaz de usuario del sistema.

---

## 🔐 Página de Login

**Características:**
- Formulario centrado con diseño limpio
- Campos para correo y contraseña
- Validación en tiempo real
- Mensajes de error claros
- Logo/título del sistema
- Botón de login con estados (normal, loading)
- Responsive design

**Paleta de Colores:**
- Fondo: Gris claro (#f9fafb)
- Primario: Azul (#3b82f6)
- Texto: Gris oscuro (#111827)
- Errores: Rojo (#ef4444)

---

## 📊 Dashboard

**Layout:**
- Sidebar izquierdo con navegación
- Área principal con:
  - 4 tarjetas de métricas (ventas, ingresos, renovaciones, servicios activos)
  - Gráfico de ventas (barras o líneas)
  - Lista de alertas de vencimiento
  - Tabla de últimas transacciones

**Características:**
- Cards con iconos y números grandes
- Colores distintivos por métrica
- Gráficos interactivos con Recharts
- Alertas con código de colores (verde/naranja/rojo)
- Responsive grid layout

**Navegación Sidebar:**
1. Dashboard (icono: LayoutDashboard)
2. Clientes (icono: Users)
3. Servicios (icono: Package)
4. Correos (icono: Mail)
5. Cuentas (icono: CreditCard)
6. Ventas (icono: ShoppingCart)
7. Medios de Pago (icono: Wallet)
8. Usuarios (icono: UserCog)

---

## 👥 Página de Clientes

**Layout:**
- Barra de búsqueda en la parte superior
- Botón "Nuevo Cliente" (azul, destacado)
- Tabla con columnas:
  - Nombre completo
  - WhatsApp
  - Correo
  - Fecha de registro
  - Estado
  - Acciones (ver, editar, eliminar)
- Paginación al final

**Modal de Crear/Editar:**
- Formulario con campos:
  - Nombre (requerido)
  - Apellido (requerido)
  - WhatsApp (requerido)
  - Correo (opcional)
  - Dirección (opcional)
- Botones: Guardar (azul), Cancelar (gris)

---

## 📧 Página de Correos

**Características Especiales:**
- **Generador de Credenciales** destacado
  - Botón "Generar Email/Password"
  - Muestra email y contraseña generados
  - Botón para regenerar
  - Botón para copiar
- Tabla de correos existentes
- Filtro por servicios asociados
- Columnas:
  - Email
  - Servicios asociados (chips de colores)
  - Fecha de creación
  - Acciones

**Vista de Detalle:**
- Email (con opción de copiar)
- Contraseña (oculta/mostrar)
- Lista de servicios asociados
- Historial de uso

---

## 🎬 Página de Cuentas

**Layout:**
- Filtros por:
  - Servicio (dropdown)
  - Tipo (Propia/Terceros)
  - Estado (Disponible/Ocupada/Vencida)
- Grid de tarjetas de cuentas

**Tarjeta de Cuenta:**
- Logo del servicio
- Tipo de cuenta (badge)
- Perfiles disponibles (ej: 2/4)
- Estado con color:
  - 🟢 Verde: Disponible
  - 🟠 Naranja: Próximo a vencer
  - 🔴 Rojo: Vencida
- Botones de acción

**Modal de Nueva Cuenta:**
- Seleccionar servicio
- Tipo de cuenta (radio buttons)
- Si es de terceros:
  - Seleccionar correo existente o crear nuevo
  - **Generador de credenciales** (si crea nuevo)
  - Número de perfiles
  - Para cada perfil: número y PIN

---

## 💰 Página de Ventas

**Vista Principal:**
- Filtros:
  - Cliente (búsqueda)
  - Servicio
  - Estado (Activo/Próximo a vencer/Vencido)
  - Rango de fechas
- Tabla con filas coloreadas según estado:
  - 🟢 Verde: Activo (> 3 días)
  - 🟠 Naranja: Próximo a vencer (≤ 3 días)
  - 🔴 Rojo: Vencido

**Columnas:**
- Cliente
- Servicio
- Fecha inicio
- Fecha fin
- Días restantes
- Monto
- Estado
- Acciones (renovar, ver detalles)

**Modal de Nueva Venta:**
1. Seleccionar cliente
2. Seleccionar cuenta/servicio
3. Duración (días)
4. Monto y moneda
5. Método de pago
6. Referencia de pago
7. Preview de fecha fin calculada

**Botón de Renovar:**
- Muestra fecha actual de fin
- Input para nueva duración
- Calcula y muestra nueva fecha fin
- Confirmar renovación

---

## 💳 Página de Medios de Pago

**Características:**
- CRUD completo de medios de pago
- Agrupados por tipo (Banco, Billetera Móvil)
- Columnas:
  - Tipo
  - Nombre
  - Número de cuenta
  - Beneficiario
  - Moneda
  - Acciones

**Modal de Edición:**
- Todos los campos editables
- Validación de formato
- Confirmación para eliminar

---

## 👤 Página de Usuarios

**Tabla de Usuarios:**
- Nombre
- Correo
- Teléfono (opcional)
- Fecha de creación
- Estado (Activo/Inactivo)
- Acciones

**Seguridad:**
- Contraseñas nunca se muestran
- Campo de contraseña solo en creación/cambio
- Confirmación para cambios críticos

---

## 📱 Responsive Design

### Mobile (< 768px)
- Sidebar se convierte en menú hamburguesa
- Tablas se convierten en cards apiladas
- Grid de una columna
- Botones en ancho completo
- Modals ocupan pantalla completa

### Tablet (768px - 1024px)
- Sidebar visible pero colapsable
- Tablas con scroll horizontal si necesario
- Grid de 2 columnas
- Cards más compactas

### Desktop (> 1024px)
- Sidebar fijo visible
- Tablas completas
- Grid de 3-4 columnas
- Tooltips y hover effects
- Espaciado generoso

---

## 🎨 Sistema de Diseño

### Colores Principales
- **Primario:** Azul #3b82f6
- **Secundario:** Gris #6b7280
- **Éxito:** Verde #10b981
- **Advertencia:** Naranja #f59e0b
- **Error:** Rojo #ef4444
- **Info:** Azul claro #3b82f6

### Tipografía
- **Fuente:** System UI (sans-serif)
- **Títulos:** font-bold, text-2xl/3xl
- **Cuerpo:** font-normal, text-base
- **Pequeño:** text-sm/xs

### Espaciado
- **Consistente:** 4px, 8px, 12px, 16px, 24px, 32px
- **Padding de cards:** p-6
- **Gap en grids:** gap-4/gap-6

### Componentes
- **Botones:** Redondeados (rounded-lg), sombras en hover
- **Inputs:** Borde sutil, focus ring azul
- **Cards:** Fondo blanco, sombra suave, bordes redondeados
- **Tablas:** Alternancia de filas, hover destacado
- **Modals:** Backdrop oscuro, animación de entrada

---

## ✨ Animaciones y Transiciones

- Hover en botones: scale y sombra
- Modals: fade in/out
- Alertas: slide in desde arriba
- Loading states: spinner animado
- Tooltips: fade in con delay

---

## 🔔 Notificaciones y Alertas

**Tipos:**
1. **Éxito:** Fondo verde, icono check
2. **Error:** Fondo rojo, icono X
3. **Advertencia:** Fondo naranja, icono exclamación
4. **Info:** Fondo azul, icono i

**Comportamiento:**
- Aparecen en la esquina superior derecha
- Auto-dismiss después de 5 segundos
- Pueden cerrarse manualmente
- Stack vertical si hay múltiples

---

## 🎯 Indicadores Visuales

### Estados de Venta
- 🟢 **Verde (bg-green-100):** Activo, más de 3 días
- 🟠 **Naranja (bg-orange-100):** Próximo a vencer, 3 días o menos
- 🔴 **Rojo (bg-red-100):** Vencido

### Estados de Cuenta
- **Disponible:** Badge verde
- **Ocupada:** Badge azul
- **Vencida:** Badge rojo
- **Inactiva:** Badge gris

### Badges
- Redondeados completamente (rounded-full)
- Tamaño pequeño (px-2 py-1)
- Colores de fondo suaves
- Texto en negrita

---

## 🚀 Experiencia de Usuario

### Feedback Inmediato
- Validación en tiempo real
- Mensajes de error específicos
- Confirmaciones antes de acciones destructivas
- Loading states durante operaciones

### Navegación Intuitiva
- Breadcrumbs en páginas de detalle
- Back buttons donde apropiado
- Links contextuales
- Search y filtros accesibles

### Accesibilidad
- Labels en todos los inputs
- Contraste adecuado
- Navegación por teclado
- ARIA labels donde necesario

---

**Nota:** El sistema está completamente implementado y listo para ejecutarse. Las descripciones anteriores corresponden al código real implementado en el frontend React.
