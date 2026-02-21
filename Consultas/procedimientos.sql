-- ============================================
-- Procedimientos Almacenados para DBStreamDoor
-- ============================================

USE DBStreamDoor;
GO

-- ============================================
-- PROCEDIMIENTOS PARA USUARIOS
-- ============================================

-- Crear Usuario
CREATE OR ALTER PROCEDURE sp_CrearUsuario
    @Nombre NVARCHAR(100),
    @Correo NVARCHAR(100),
    @Telefono NVARCHAR(20) = NULL,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    INSERT INTO Usuarios (Nombre, Correo, Telefono, PasswordHash)
    VALUES (@Nombre, @Correo, @Telefono, @PasswordHash);
    
    SELECT SCOPE_IDENTITY() AS UsuarioID;
END
GO

-- Obtener Usuario por Correo
CREATE OR ALTER PROCEDURE sp_ObtenerUsuarioPorCorreo
    @Correo NVARCHAR(100)
AS
BEGIN
    SELECT UsuarioID, Nombre, Correo, Telefono, PasswordHash, FechaCreacion, Activo
    FROM Usuarios
    WHERE Correo = @Correo AND Activo = 1;
END
GO

-- Listar Usuarios
CREATE OR ALTER PROCEDURE sp_ListarUsuarios
AS
BEGIN
    SELECT UsuarioID, Nombre, Correo, Telefono, FechaCreacion, Activo
    FROM Usuarios
    WHERE Activo = 1
    ORDER BY Nombre;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA CLIENTES
-- ============================================

-- Crear Cliente
CREATE OR ALTER PROCEDURE sp_CrearCliente
    @Nombre NVARCHAR(100),
    @SegundoNombre NVARCHAR(100) = NULL,
    @Apellido NVARCHAR(100),
    @SegundoApellido NVARCHAR(100) = NULL,
    @Telefono NVARCHAR(20)
AS
BEGIN
    INSERT INTO Clientes (Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono)
    VALUES (@Nombre, @SegundoNombre, @Apellido, @SegundoApellido, @Telefono);
    
    SELECT SCOPE_IDENTITY() AS ClienteID;
END
GO

-- Actualizar Cliente
CREATE OR ALTER PROCEDURE sp_ActualizarCliente
    @ClienteID INT,
    @Nombre NVARCHAR(100),
    @SegundoNombre NVARCHAR(100) = NULL,
    @Apellido NVARCHAR(100),
    @SegundoApellido NVARCHAR(100) = NULL,
    @Telefono NVARCHAR(20)
AS
BEGIN
    UPDATE Clientes
    SET Nombre = @Nombre,
        SegundoNombre = @SegundoNombre,
        Apellido = @Apellido,
        SegundoApellido = @SegundoApellido,
        Telefono = @Telefono
    WHERE ClienteID = @ClienteID;
END
GO

-- Listar Clientes
CREATE OR ALTER PROCEDURE sp_ListarClientes
AS
BEGIN
    SELECT ClienteID, Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono, FechaRegistro, Activo
    FROM Clientes
    WHERE Activo = 1
    ORDER BY Nombre, Apellido;
END
GO

-- Obtener Cliente por ID con historial
CREATE OR ALTER PROCEDURE sp_ObtenerClienteConHistorial
    @ClienteID INT
AS
BEGIN
    -- Datos del cliente
    SELECT ClienteID, Nombre, SegundoNombre, Apellido, SegundoApellido, Telefono, FechaRegistro, Activo
    FROM Clientes
    WHERE ClienteID = @ClienteID;
    
    -- Historial de ventas
    SELECT V.VentaID, S.Nombre AS Servicio, V.FechaInicio, V.FechaFin, V.Monto, V.Moneda, V.Estado
    FROM Ventas V
    INNER JOIN Cuentas C ON V.CuentaID = C.CuentaID
    INNER JOIN Servicios S ON C.ServicioID = S.ServicioID
    WHERE V.ClienteID = @ClienteID
    ORDER BY V.FechaInicio DESC;
    
    -- Pagos realizados
    SELECT P.PagoID, P.Monto, P.Moneda, P.FechaPago, P.Referencia, M.Nombre AS MedioPago
    FROM Pagos P
    INNER JOIN Ventas V ON P.VentaID = V.VentaID
    INNER JOIN MediosPago M ON P.MedioPagoID = M.MedioPagoID
    WHERE V.ClienteID = @ClienteID
    ORDER BY P.FechaPago DESC;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA SERVICIOS
-- ============================================

-- Crear Servicio
CREATE OR ALTER PROCEDURE sp_CrearServicio
    @Nombre NVARCHAR(50),
    @Descripcion NVARCHAR(255) = NULL,
    @Precio DECIMAL(10,2) = NULL
AS
BEGIN
    INSERT INTO Servicios (Nombre, Descripcion, Precio)
    VALUES (@Nombre, @Descripcion, @Precio);
    
    SELECT SCOPE_IDENTITY() AS ServicioID;
END
GO

-- Listar Servicios
CREATE OR ALTER PROCEDURE sp_ListarServicios
AS
BEGIN
    SELECT ServicioID, Nombre, Descripcion, Precio, Activo
    FROM Servicios
    WHERE Activo = 1
    ORDER BY Nombre;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA CORREOS
-- ============================================

-- Crear Correo
CREATE OR ALTER PROCEDURE sp_CrearCorreo
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @Notas NVARCHAR(500) = NULL
AS
BEGIN
    INSERT INTO Correos (Email, Password, Notas)
    VALUES (@Email, @Password, @Notas);
    
    SELECT SCOPE_IDENTITY() AS CorreoID;
END
GO

-- Listar Correos con servicios asociados
CREATE OR ALTER PROCEDURE sp_ListarCorreos
AS
BEGIN
    SELECT C.CorreoID, C.Email, C.Password, C.FechaCreacion, C.Notas, C.Activo,
           STRING_AGG(S.Nombre, ', ') AS ServiciosAsociados
    FROM Correos C
    LEFT JOIN CorreosServicios CS ON C.CorreoID = CS.CorreoID
    LEFT JOIN Servicios S ON CS.ServicioID = S.ServicioID
    WHERE C.Activo = 1
    GROUP BY C.CorreoID, C.Email, C.Password, C.FechaCreacion, C.Notas, C.Activo
    ORDER BY C.FechaCreacion DESC;
END
GO

-- Asociar Correo con Servicio
CREATE OR ALTER PROCEDURE sp_AsociarCorreoServicio
    @CorreoID INT,
    @ServicioID INT
AS
BEGIN
    IF NOT EXISTS (SELECT 1 FROM CorreosServicios WHERE CorreoID = @CorreoID AND ServicioID = @ServicioID)
    BEGIN
        INSERT INTO CorreosServicios (CorreoID, ServicioID)
        VALUES (@CorreoID, @ServicioID);
    END
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA CUENTAS
-- ============================================

-- Crear Cuenta
CREATE OR ALTER PROCEDURE sp_CrearCuenta
    @ServicioID INT,
    @CorreoID INT = NULL,
    @TipoCuenta NVARCHAR(20),
    @NumeroPerfiles INT = 1
AS
BEGIN
    INSERT INTO Cuentas (ServicioID, CorreoID, TipoCuenta, NumeroPerfiles, PerfilesDisponibles)
    VALUES (@ServicioID, @CorreoID, @TipoCuenta, @NumeroPerfiles, @NumeroPerfiles);
    
    SELECT SCOPE_IDENTITY() AS CuentaID;
END
GO

-- Listar Cuentas
CREATE OR ALTER PROCEDURE sp_ListarCuentas
AS
BEGIN
    SELECT C.CuentaID, S.Nombre AS Servicio, CO.Email, C.TipoCuenta, 
           C.NumeroPerfiles, C.PerfilesDisponibles, C.Estado, C.FechaCreacion
    FROM Cuentas C
    INNER JOIN Servicios S ON C.ServicioID = S.ServicioID
    LEFT JOIN Correos CO ON C.CorreoID = CO.CorreoID
    WHERE C.Activo = 1
    ORDER BY S.Nombre, C.FechaCreacion DESC;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA PERFILES
-- ============================================

-- Crear Perfil
CREATE OR ALTER PROCEDURE sp_CrearPerfil
    @CuentaID INT,
    @NumeroPerfil INT,
    @PIN NVARCHAR(10) = NULL
AS
BEGIN
    INSERT INTO Perfiles (CuentaID, NumeroPerfil, PIN)
    VALUES (@CuentaID, @NumeroPerfil, @PIN);
    
    SELECT SCOPE_IDENTITY() AS PerfilID;
END
GO

-- Listar Perfiles de una Cuenta
CREATE OR ALTER PROCEDURE sp_ListarPerfilesPorCuenta
    @CuentaID INT
AS
BEGIN
    SELECT PerfilID, CuentaID, NumeroPerfil, PIN, Estado, Activo
    FROM Perfiles
    WHERE CuentaID = @CuentaID AND Activo = 1
    ORDER BY NumeroPerfil;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA MEDIOS DE PAGO
-- ============================================

-- Crear Medio de Pago
CREATE OR ALTER PROCEDURE sp_CrearMedioPago
    @Tipo NVARCHAR(50),
    @Nombre NVARCHAR(100),
    @NumeroCuenta NVARCHAR(50) = NULL,
    @Beneficiario NVARCHAR(100) = NULL,
    @Moneda NVARCHAR(10)
AS
BEGIN
    INSERT INTO MediosPago (Tipo, Nombre, NumeroCuenta, Beneficiario, Moneda)
    VALUES (@Tipo, @Nombre, @NumeroCuenta, @Beneficiario, @Moneda);
    
    SELECT SCOPE_IDENTITY() AS MedioPagoID;
END
GO

-- Listar Medios de Pago
CREATE OR ALTER PROCEDURE sp_ListarMediosPago
AS
BEGIN
    SELECT MedioPagoID, Tipo, Nombre, NumeroCuenta, Beneficiario, Moneda, Activo, FechaCreacion
    FROM MediosPago
    WHERE Activo = 1
    ORDER BY Tipo, Nombre;
END
GO

-- Actualizar Medio de Pago
CREATE OR ALTER PROCEDURE sp_ActualizarMedioPago
    @MedioPagoID INT,
    @Tipo NVARCHAR(50),
    @Nombre NVARCHAR(100),
    @NumeroCuenta NVARCHAR(50) = NULL,
    @Beneficiario NVARCHAR(100) = NULL,
    @Moneda NVARCHAR(10)
AS
BEGIN
    UPDATE MediosPago
    SET Tipo = @Tipo,
        Nombre = @Nombre,
        NumeroCuenta = @NumeroCuenta,
        Beneficiario = @Beneficiario,
        Moneda = @Moneda
    WHERE MedioPagoID = @MedioPagoID;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA VENTAS
-- ============================================

-- Crear Venta
CREATE OR ALTER PROCEDURE sp_CrearVenta
    @ClienteID INT,
    @CuentaID INT,
    @PerfilID INT = NULL,
    @FechaInicio DATETIME,
    @Duracion INT,
    @Monto DECIMAL(10,2),
    @Moneda NVARCHAR(10)
AS
BEGIN
    DECLARE @FechaFin DATETIME;
    SET @FechaFin = DATEADD(DAY, @Duracion, @FechaInicio);
    
    INSERT INTO Ventas (ClienteID, CuentaID, PerfilID, FechaInicio, FechaFin, Duracion, Monto, Moneda)
    VALUES (@ClienteID, @CuentaID, @PerfilID, @FechaInicio, @FechaFin, @Duracion, @Monto, @Moneda);
    
    -- Actualizar estado de la cuenta
    UPDATE Cuentas
    SET PerfilesDisponibles = PerfilesDisponibles - 1,
        Estado = CASE WHEN (PerfilesDisponibles - 1) = 0 THEN 'Ocupada' ELSE 'Disponible' END
    WHERE CuentaID = @CuentaID;
    
    -- Si es un perfil específico, actualizarlo
    IF @PerfilID IS NOT NULL
    BEGIN
        UPDATE Perfiles
        SET Estado = 'Ocupado'
        WHERE PerfilID = @PerfilID;
    END
    
    SELECT SCOPE_IDENTITY() AS VentaID;
END
GO

-- Renovar Venta
CREATE OR ALTER PROCEDURE sp_RenovarVenta
    @VentaID INT,
    @Duracion INT
AS
BEGIN
    DECLARE @FechaFinActual DATETIME;
    DECLARE @NuevaFechaFin DATETIME;
    
    SELECT @FechaFinActual = FechaFin FROM Ventas WHERE VentaID = @VentaID;
    
    -- Si la venta ya venció, renovar desde hoy, si no desde la fecha fin actual
    IF @FechaFinActual < GETDATE()
        SET @NuevaFechaFin = DATEADD(DAY, @Duracion, GETDATE());
    ELSE
        SET @NuevaFechaFin = DATEADD(DAY, @Duracion, @FechaFinActual);
    
    UPDATE Ventas
    SET FechaFin = @NuevaFechaFin,
        Duracion = @Duracion,
        Estado = 'Activo'
    WHERE VentaID = @VentaID;
END
GO

-- Listar Ventas
CREATE OR ALTER PROCEDURE sp_ListarVentas
AS
BEGIN
    SELECT V.VentaID, 
           C.Nombre + ' ' + C.Apellido AS Cliente,
           S.Nombre AS Servicio,
           V.FechaInicio, V.FechaFin, V.Duracion, V.Monto, V.Moneda, V.Estado,
           DATEDIFF(DAY, GETDATE(), V.FechaFin) AS DiasRestantes
    FROM Ventas V
    INNER JOIN Clientes C ON V.ClienteID = C.ClienteID
    INNER JOIN Cuentas CU ON V.CuentaID = CU.CuentaID
    INNER JOIN Servicios S ON CU.ServicioID = S.ServicioID
    ORDER BY V.FechaFin ASC;
END
GO

-- Actualizar Estados de Ventas
CREATE OR ALTER PROCEDURE sp_ActualizarEstadosVentas
AS
BEGIN
    -- Marcar como vencidas
    UPDATE Ventas
    SET Estado = 'Vencido'
    WHERE FechaFin < GETDATE() AND Estado != 'Vencido';
    
    -- Marcar como próximas a vencer (3 días antes)
    UPDATE Ventas
    SET Estado = 'ProximoVencer'
    WHERE DATEDIFF(DAY, GETDATE(), FechaFin) BETWEEN 0 AND 3 
    AND Estado = 'Activo';
    
    -- Actualizar estado de cuentas vencidas
    UPDATE Cuentas
    SET Estado = 'Vencida'
    WHERE CuentaID IN (
        SELECT DISTINCT CuentaID 
        FROM Ventas 
        WHERE Estado = 'Vencido'
    );
    
    -- Actualizar estado de perfiles vencidos
    UPDATE Perfiles
    SET Estado = 'Vencido'
    WHERE PerfilID IN (
        SELECT DISTINCT PerfilID 
        FROM Ventas 
        WHERE Estado = 'Vencido' AND PerfilID IS NOT NULL
    );
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA PAGOS
-- ============================================

-- Registrar Pago
CREATE OR ALTER PROCEDURE sp_RegistrarPago
    @VentaID INT,
    @MedioPagoID INT,
    @Monto DECIMAL(10,2),
    @Moneda NVARCHAR(10),
    @Referencia NVARCHAR(100) = NULL,
    @Notas NVARCHAR(500) = NULL
AS
BEGIN
    INSERT INTO Pagos (VentaID, MedioPagoID, Monto, Moneda, Referencia, Notas)
    VALUES (@VentaID, @MedioPagoID, @Monto, @Moneda, @Referencia, @Notas);
    
    SELECT SCOPE_IDENTITY() AS PagoID;
END
GO

-- ============================================
-- PROCEDIMIENTOS PARA DASHBOARD
-- ============================================

-- Obtener Métricas del Dashboard
CREATE OR ALTER PROCEDURE sp_ObtenerMetricasDashboard
    @FechaInicio DATETIME = NULL,
    @FechaFin DATETIME = NULL
AS
BEGIN
    -- Si no se especifican fechas, usar el mes actual
    IF @FechaInicio IS NULL
        SET @FechaInicio = DATEADD(MONTH, DATEDIFF(MONTH, 0, GETDATE()), 0);
    IF @FechaFin IS NULL
        SET @FechaFin = GETDATE();
    
    -- Total de ventas en el período
    SELECT COUNT(*) AS TotalVentas,
           SUM(Monto) AS TotalIngresos
    FROM Ventas
    WHERE FechaCreacion BETWEEN @FechaInicio AND @FechaFin;
    
    -- Servicios más vendidos
    SELECT TOP 5 S.Nombre, COUNT(*) AS Cantidad
    FROM Ventas V
    INNER JOIN Cuentas C ON V.CuentaID = C.CuentaID
    INNER JOIN Servicios S ON C.ServicioID = S.ServicioID
    WHERE V.FechaCreacion BETWEEN @FechaInicio AND @FechaFin
    GROUP BY S.Nombre
    ORDER BY Cantidad DESC;
    
    -- Renovaciones pendientes (próximas a vencer en 3 días)
    SELECT COUNT(*) AS RenovacionesPendientes
    FROM Ventas
    WHERE DATEDIFF(DAY, GETDATE(), FechaFin) BETWEEN 0 AND 3
    AND Estado IN ('Activo', 'ProximoVencer');
    
    -- Alertas de vencimiento
    SELECT V.VentaID, 
           C.Nombre + ' ' + C.Apellido AS Cliente,
           S.Nombre AS Servicio,
           V.FechaFin,
           DATEDIFF(DAY, GETDATE(), V.FechaFin) AS DiasRestantes
    FROM Ventas V
    INNER JOIN Clientes C ON V.ClienteID = C.ClienteID
    INNER JOIN Cuentas CU ON V.CuentaID = CU.CuentaID
    INNER JOIN Servicios S ON CU.ServicioID = S.ServicioID
    WHERE DATEDIFF(DAY, GETDATE(), V.FechaFin) BETWEEN 0 AND 3
    AND V.Estado IN ('Activo', 'ProximoVencer')
    ORDER BY V.FechaFin ASC;
END
GO

PRINT 'Procedimientos almacenados creados exitosamente';
GO
