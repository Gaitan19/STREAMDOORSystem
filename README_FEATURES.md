# STREAMDOOR — Sistema de Gestión de Cuentas Streaming

**STREAMDOOR** es una plataforma web integral diseñada para negocios que comercializan y administran cuentas de servicios de streaming. Centraliza la gestión de clientes, cuentas, ventas, cobros y finanzas en un solo lugar, con control de acceso por roles para múltiples usuarios.

---

## Módulos del sistema

### 🔐 Autenticación y Seguridad
Inicio de sesión seguro con tokens JWT almacenados en cookies HttpOnly. Incluye flujo completo de **recuperación de contraseña** por correo electrónico, contraseñas cifradas con BCrypt y protección de rutas según el rol del usuario.

---

### 📊 Dashboard
Panel principal con indicadores clave del negocio: resumen de ventas del día, ingresos, egresos, clientes activos y cuentas disponibles. Incluye gráficas de tendencia para visualizar el rendimiento del negocio de forma rápida.

---

### 👥 Clientes
Registro y administración de la cartera de clientes. Permite crear, editar y buscar clientes con sus datos de contacto. Desde este módulo se puede consultar el historial de compras y el estado de cuenta de cada cliente.

---

### 📺 Servicios
Catálogo de plataformas de streaming que el negocio comercializa (Netflix, Disney+, HBO Max, etc.). Permite registrar y actualizar los servicios con su nombre, descripción y precio de venta.

---

### 📧 Correos
Gestión del banco de correos electrónicos usados para las cuentas de streaming. Almacena los correos y sus contraseñas de acceso de forma organizada y segura para su asignación a cuentas.

---

### 🗂 Cuentas
Núcleo operativo del sistema. Administra las cuentas de streaming disponibles, ocupadas y vencidas. Cada cuenta se asocia a un servicio y a un correo, e indica si es cuenta **propia** o de **terceros**, su contraseña de perfil y su fecha de vencimiento. Permite visualizar el estado en tiempo real.

---

### 🛒 Ventas
Registro de cada venta realizada a un cliente. Asocia la cuenta vendida, el combo o servicio, el precio y la fecha. Genera el detalle de la transacción y actualiza automáticamente el estado de la cuenta a "Ocupada". Incluye exportación de reportes a **PDF** y **Excel**.

---

### 📦 Combos
Creación de paquetes personalizados que agrupan varios servicios o perfiles a un precio especial. Facilita la venta de paquetes combinados y permite aplicarlos directamente en el módulo de ventas.

---

### 💳 Pagos
Control de los cobros realizados por las ventas. Permite registrar el medio de pago utilizado (efectivo, transferencia, etc.) y el estado del cobro, manteniendo un registro detallado de cada transacción financiera.

---

### 💰 Ingresos
Registro de todos los ingresos del negocio, ya sean por ventas de cuentas u otros conceptos. Permite categorizar y describir cada entrada de dinero para llevar una contabilidad clara.

---

### 💸 Egresos
Registro de los gastos y salidas de dinero del negocio. Permite categorizar egresos (compra de cuentas, servicios, gastos operativos) para tener control total del flujo de caja.

---

### 🔒 Cierre de Caja
Módulo de cierre contable del período. Consolida los ingresos y egresos del día o período seleccionado, genera un resumen financiero y permite cerrar el período para comenzar uno nuevo con saldo inicial definido.

---

### 👤 Usuarios
Administración de los usuarios que acceden al sistema. Permite crear cuentas de operadores y administradores, asignarles roles, activar o desactivar accesos y gestionar sus perfiles.

---

### 🛡 Roles y Permisos
Sistema de control de acceso granular. Cada rol define qué módulos puede ver, crear, editar o eliminar. Esto permite configurar distintos niveles de acceso para administradores, vendedores y otros perfiles del negocio.

---

### 💳 Medios de Pago
Catálogo de medios de pago disponibles en el negocio (efectivo, transferencia bancaria, tarjeta, etc.). Se usan al registrar cobros en el módulo de Pagos.

---

## Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | ASP.NET Core (C#) | .NET 8.0 |
| Frontend | React + Vite | React 19 / Vite 7 |
| Estilos | Tailwind CSS | 3.x |
| Base de datos | Microsoft SQL Server | 2019+ |
