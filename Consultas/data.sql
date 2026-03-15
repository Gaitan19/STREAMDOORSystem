-- ============================================
-- Datos Iniciales para DBStreamDoor
-- ============================================

USE DBStreamDoor;
GO


-- ============================================
-- Insertar Rol Administrador (idempotente)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM Roles WHERE Nombre = 'Administrador')
BEGIN
    INSERT INTO Roles (Nombre, Descripcion, Activo)
    VALUES ('Administrador', 'Rol con acceso completo a todos los módulos del sistema', 1);
END
GO

-- Insertar permisos del rol Administrador (idempotente)
DECLARE @AdminRolID INT = (SELECT RolID FROM Roles WHERE Nombre = 'Administrador');

IF @AdminRolID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM RolPermisos WHERE RolID = @AdminRolID)
BEGIN
    INSERT INTO RolPermisos (RolID, Modulo, PuedeVer, PuedeCrear, PuedeEditar, PuedeEliminar) VALUES
    (@AdminRolID, 'dashboard',   1, 1, 1, 1),
    (@AdminRolID, 'clientes',    1, 1, 1, 1),
    (@AdminRolID, 'servicios',   1, 1, 1, 1),
    (@AdminRolID, 'combos',      1, 1, 1, 1),
    (@AdminRolID, 'correos',     1, 1, 1, 1),
    (@AdminRolID, 'cuentas',     1, 1, 1, 1),
    (@AdminRolID, 'ventas',      1, 1, 1, 1),
    (@AdminRolID, 'ingresos',    1, 1, 1, 1),
    (@AdminRolID, 'egresos',     1, 1, 1, 1),
    (@AdminRolID, 'cierre',      1, 1, 1, 1),
    (@AdminRolID, 'medios-pago', 1, 1, 1, 1),
    (@AdminRolID, 'usuarios',    1, 1, 1, 1),
    (@AdminRolID, 'roles',       1, 1, 1, 1);
END
GO

-- Agregar permiso de Cierre de Caja al Administrador si ya existe el rol con permisos (idempotente)
DECLARE @AdminRolID2 INT = (SELECT RolID FROM Roles WHERE Nombre = 'Administrador');

IF @AdminRolID2 IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM RolPermisos WHERE RolID = @AdminRolID2 AND Modulo = 'cierre')
BEGIN
    INSERT INTO RolPermisos (RolID, Modulo, PuedeVer, PuedeCrear, PuedeEditar, PuedeEliminar)
    VALUES (@AdminRolID2, 'cierre', 1, 1, 1, 1);
END
GO

-- ============================================
-- Insertar Usuario Administrador (idempotente)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Correo = 'admin@gmail.com')
BEGIN
    INSERT INTO Usuarios (Nombre, Correo, Telefono, PasswordHash, Activo, RolID)
    SELECT 'admin', 'admin@gmail.com', '87549961',
    '$2a$11$f8XpVC0..VXSJYscHvg7LeT0/Ep8v8U/hhWHqW7IAQz2R1YN6booO', 1, RolID
    FROM Roles WHERE Nombre = 'Administrador';
END
GO

-- ============================================
-- Insertar Servicios de Streaming (idempotente)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Netflix')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Netflix', 'Servicio de streaming de películas y series', 150.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Prime Video')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Prime Video', 'Servicio de streaming de Amazon', 140.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Disney+')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Disney+', 'Servicio de streaming de Disney', 130.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'HBO Max')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('HBO Max', 'Servicio de streaming de HBO', 120.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Spotify')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Spotify', 'Servicio de streaming de música', 110.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'YouTube Premium')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('YouTube Premium', 'Servicio de streaming de videos sin anuncios', 100.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Apple TV+')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Apple TV+', 'Servicio de streaming de Apple', 150.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Paramount+')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Paramount+', 'Servicio de streaming de Paramount', 140.00);

IF NOT EXISTS (SELECT 1 FROM Servicios WHERE Nombre = 'Star+')
    INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES ('Star+', 'Servicio de streaming de Star', 130.00);
GO



-- ============================================
-- Datos de Ejemplo: Combos Populares
-- ============================================

-- Insertar combos de ejemplo solo si la tabla está vacía
IF NOT EXISTS (SELECT * FROM Combos)
BEGIN
    -- Combo Premium: Netflix + Prime Video + Disney+
    INSERT INTO Combos (Nombre, Descripcion, Precio, Activo)
    VALUES ('Streaming Premium', 'Acceso a Netflix, Prime Video y Disney+', 600.00, 1);
    
    DECLARE @ComboPremiumID INT = SCOPE_IDENTITY();
    
    -- Asociar servicios al combo (asumiendo IDs de servicios ya creados)
    -- Nota: Estos INSERT solo funcionarán si los servicios existen
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%Netflix%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboPremiumID, ServicioID FROM Servicios WHERE Nombre LIKE '%Netflix%';
    
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%Prime%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboPremiumID, ServicioID FROM Servicios WHERE Nombre LIKE '%Prime%';
    
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%Disney%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboPremiumID, ServicioID FROM Servicios WHERE Nombre LIKE '%Disney%';
    
    -- Combo Anime: Crunchyroll + Funimation
    INSERT INTO Combos (Nombre, Descripcion, Precio, Activo)
    VALUES ('Pack Anime', 'Acceso a Crunchyroll y Funimation', 350.00, 1);
    
    DECLARE @ComboAnimeID INT = SCOPE_IDENTITY();
    
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%Crunchyroll%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboAnimeID, ServicioID FROM Servicios WHERE Nombre LIKE '%Crunchyroll%';
    
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%Funimation%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboAnimeID, ServicioID FROM Servicios WHERE Nombre LIKE '%Funimation%';
    
    -- Combo Entretenimiento: HBO Max + Prime Video
    INSERT INTO Combos (Nombre, Descripcion, Precio, Activo)
    VALUES ('Entretenimiento Total', 'Acceso a HBO Max y Prime Video', 450.00, 1);
    
    DECLARE @ComboEntretenimientoID INT = SCOPE_IDENTITY();
    
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%HBO%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboEntretenimientoID, ServicioID FROM Servicios WHERE Nombre LIKE '%HBO%';
    
    IF EXISTS (SELECT * FROM Servicios WHERE Nombre LIKE '%Prime%')
        INSERT INTO ComboServicios (ComboID, ServicioID)
        SELECT @ComboEntretenimientoID, ServicioID FROM Servicios WHERE Nombre LIKE '%Prime%';
    
    PRINT 'Combos de ejemplo insertados exitosamente';
END
GO

-- ============================================
-- Insertar Medios de Pago de Ejemplo
-- ============================================
IF NOT EXISTS (SELECT 1 FROM MediosPago)
BEGIN
    INSERT INTO MediosPago (Tipo, Nombre, NumeroCuenta, Beneficiario, Moneda) VALUES
    ('Banco', 'BAC', '1234567890', 'StreamDoor S.A.', 'C$'),
    ('Banco', 'Banpro', '0987654321', 'StreamDoor S.A.', 'C$'),
    ('Billetera Móvil', 'Tigo Money', '88888888', 'StreamDoor', 'C$'),
    ('Banco', 'BAC', '1111111111', 'StreamDoor S.A.', '$'),
    ('Billetera Móvil', 'Movistar Money', '77777777', 'StreamDoor', 'C$');
END
GO

-- ============================================
-- Insertar Clientes de Ejemplo (idempotente)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '85621034')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Carlos', 'Ernesto', 'Martínez', 'Ruiz', '85621034');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '88374512')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('María', 'José', 'González', 'López', '88374512');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '86190247')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Luis', 'Alberto', 'Pérez', 'Medina', '86190247');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '87053681')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Ana', 'Patricia', 'Hernández', 'Castillo', '87053681');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '58417930')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Jorge', 'Antonio', 'Ramos', 'Flores', '58417930');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '83762501')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Sofía', 'Isabel', 'Torres', 'Vargas', '83762501');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '89245163')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Diego', 'Alejandro', 'Sánchez', 'Morales', '89245163');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '56831074')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Laura', 'Valentina', 'Jiménez', 'Cruz', '56831074');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '84509362')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Roberto', 'Enrique', 'Ramírez', 'Aguilar', '84509362');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '87183640')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Gabriela', 'Alejandra', 'Moreno', 'Reyes', '87183640');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '55920817')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Miguel', 'Ángel', 'Castro', 'Ortega', '55920817');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '86074295')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Valeria', 'Cristina', 'Méndez', 'Salinas', '86074295');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '88631740')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Fernando', 'José', 'Rojas', 'Espinoza', '88631740');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '57348026')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Paola', 'Marcela', 'Gutiérrez', 'Vega', '57348026');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '84712539')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Andrés', 'Ricardo', 'Vargas', 'Herrera', '84712539');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '89064183')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Natalia', 'Fernanda', 'Fuentes', 'Delgado', '89064183');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '58203947')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Ricardo', 'Sebastián', 'Silva', 'Contreras', '58203947');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '83517062')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Karla', 'Daniela', 'Núñez', 'Campos', '83517062');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '86948301')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Héctor', 'Manuel', 'Palacios', 'Miranda', '86948301');

IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Telefono = '87295436')
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES ('Claudia', 'Beatriz', 'Mendoza', 'Iglesias', '87295436');
GO

PRINT 'Datos iniciales insertados exitosamente';
GO

-- ============================================
-- Agregar permiso de Plantillas al Administrador (idempotente)
-- ============================================
DECLARE @AdminRolID3 INT = (SELECT RolID FROM Roles WHERE Nombre = 'Administrador');

IF @AdminRolID3 IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM RolPermisos WHERE RolID = @AdminRolID3 AND Modulo = 'plantillas')
BEGIN
    INSERT INTO RolPermisos (RolID, Modulo, PuedeVer, PuedeCrear, PuedeEditar, PuedeEliminar)
    VALUES (@AdminRolID3, 'plantillas', 1, 0, 1, 0);
END
GO

-- ============================================
-- Plantillas de Mensajes (idempotente)
-- ============================================
IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'combo_header')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'combo_header',
        'Encabezado de Combo',
        'Texto de encabezado para un combo de servicios. Variables: {NOMBRES_SERVICIOS}',
        N'🔥 COMBO ACTIVO [{NOMBRES_SERVICIOS}]

'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'combo_item')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'combo_item',
        'Item de Servicio en Combo',
        'Datos de un servicio dentro de un combo. Variables: {NOMBRE_SERVICIO}, {ID_VENTA}, {CORREO}, {CONTRASENA}, {PERFIL}, {PIN_LINEA}, {FECHA_INICIO}, {FECHA_FIN}',
        N'DATOS DE ACCESO {NOMBRE_SERVICIO}
🆔 # VENTA: V-{ID_VENTA}
🛡 CORREO: {CORREO}
⚔ CONTRASEÑA: {CONTRASENA}
👤 PERFIL: {PERFIL}
{PIN_LINEA}⏳ F. DE INICIO: {FECHA_INICIO}
✂ F. DE FIN: {FECHA_FIN}

'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'combo_footer')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'combo_footer',
        'Precio del Combo',
        'Pie de un combo con el precio. Variables: {PRECIO_COMBO}, {MONEDA}',
        N'💰 PRECIO DEL COMBO: {PRECIO_COMBO} {MONEDA}

'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'individual_item')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'individual_item',
        'Suscripción Individual',
        'Datos de un servicio individual. Variables: {NOMBRE_SERVICIO}, {ID_VENTA}, {CORREO}, {CONTRASENA}, {PERFIL}, {PIN_LINEA} (ej: 🔐 Pin: 1234 o vacío), {FECHA_INICIO}, {FECHA_FIN}, {PRECIO}, {MONEDA}',
        N'📌 SUSCRIPCIÓN ACTIVA [{NOMBRE_SERVICIO}]

Acceda con los siguientes datos por favor
🛡 Correo: {CORREO}
⚔ Contraseña: {CONTRASENA}
⚙ Tipo: PERFIL

👤 Perfil: {PERFIL}      {PIN_LINEA}
🆔 # VENTA: V-{ID_VENTA}

⏳ Fecha de inicio: {FECHA_INICIO}
✂ Fecha de corte: {FECHA_FIN}

💰 PRECIO: {PRECIO} {MONEDA}

'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'mensaje_footer')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'mensaje_footer',
        'Pie del Mensaje de Venta',
        'Texto al final del mensaje de detalles de venta. Variables: {PRECIO_TOTAL}, {MONEDA}',
        N'💸 PRECIO DE COMPRA: {PRECIO_TOTAL} {MONEDA}

*💵 GRACIAS POR SU COMPRA 🛍*'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'proximo_vencer')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'proximo_vencer',
        'Aviso de Próximo Vencimiento',
        'Mensaje para notificar al cliente que su suscripción está próxima a vencer. Variables: {NOMBRE_CLIENTE}, {SERVICIOS}, {ID_VENTA}, {FECHA_FIN}',
        N'⚠️ *AVISO DE PRÓXIMO VENCIMIENTO*

Hola {NOMBRE_CLIENTE} 👋

Te informamos que tu suscripción de *{SERVICIOS}* está próxima a vencer.

📋 *Detalles de tu venta:*
🆔 # Venta: V-{ID_VENTA}
✂ Fecha de vencimiento: *{FECHA_FIN}*

Para renovar tu suscripción y seguir disfrutando del servicio sin interrupciones, por favor contáctanos antes de esa fecha.

*¡Gracias por preferirnos! 🙌*'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'vencido')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'vencido',
        'Aviso de Suscripción Vencida',
        'Mensaje para notificar al cliente que su suscripción ha vencido. Variables: {NOMBRE_CLIENTE}, {SERVICIOS}, {ID_VENTA}, {FECHA_FIN}',
        N'❌ *AVISO DE SUSCRIPCIÓN VENCIDA*

Hola {NOMBRE_CLIENTE} 👋

Te informamos que tu suscripción de *{SERVICIOS}* ha vencido.

📋 *Detalles de tu venta:*
🆔 # Venta: V-{ID_VENTA}
✂ Fecha de vencimiento: *{FECHA_FIN}*

Para reactivar tu servicio, por favor contáctanos. ¡Estaremos encantados de ayudarte!

*¡Gracias por preferirnos! 🙌*'
    );
GO

IF NOT EXISTS (SELECT 1 FROM PlantillasMensajes WHERE Clave = 'cambio_cuenta_item')
    INSERT INTO PlantillasMensajes (Clave, Nombre, Descripcion, Contenido) VALUES (
        'cambio_cuenta_item',
        'Item de Cambio de Cuenta',
        'Datos de un servicio cuando se cambia de cuenta. Variables: {NOMBRE_SERVICIO}, {CORREO}, {CONTRASENA}, {PERFIL}, {PIN_LINEA}, {FECHA_INICIO}, {FECHA_FIN}',
        N'📧 *CAMBIO DE CORREO [{NOMBRE_SERVICIO}]*

_Acceda nuevamente con los siguientes datos por favor_
🛡 *Correo:* {CORREO}
⚔ *Contraseña:* {CONTRASENA}
⚙ Tipo: PERFIL

👤 Perfil: {PERFIL}      🔐 Pin: {PIN_LINEA}
⏳ Fecha de inicio: {FECHA_INICIO}
✂ Fecha de corte: {FECHA_FIN}

'
    );
GO

PRINT 'Plantillas de mensajes insertadas exitosamente';
GO
