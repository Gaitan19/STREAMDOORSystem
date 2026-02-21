-- ============================================
-- Nombre de la Base de Datos: DBStreamDoor
-- Sistema de Gestión de Streaming
-- ============================================

USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'DBStreamDoor')
BEGIN
    CREATE DATABASE DBStreamDoor;
END
GO

USE DBStreamDoor;
GO

-- ============================================
-- Tabla: Usuarios del Sistema
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        UsuarioID INT PRIMARY KEY IDENTITY(1,1),
        Nombre NVARCHAR(100) NOT NULL,
        Correo NVARCHAR(100) NOT NULL UNIQUE,
        Telefono NVARCHAR(20) NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        Activo BIT DEFAULT 1
    );
END
GO

-- ============================================
-- Tabla: Clientes
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clientes')
BEGIN
    CREATE TABLE Clientes (
        ClienteID INT PRIMARY KEY IDENTITY(1,1),
        Nombre NVARCHAR(100) NOT NULL,
        SegundoNombre NVARCHAR(100) NULL,
        Apellido NVARCHAR(100) NOT NULL,
        SegundoApellido NVARCHAR(100) NULL,
        Telefono NVARCHAR(20) NOT NULL,
        FechaRegistro DATETIME DEFAULT GETDATE(),
        Activo BIT DEFAULT 1
    );
END
GO

-- Migración: Actualizar tabla Clientes existente
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Clientes')
BEGIN
    -- Renombrar WhatsApp a Telefono si existe
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'WhatsApp')
    BEGIN
        EXEC sp_rename 'Clientes.WhatsApp', 'Telefono', 'COLUMN';
    END

    -- Agregar SegundoNombre si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'SegundoNombre')
    BEGIN
        ALTER TABLE Clientes ADD SegundoNombre NVARCHAR(100) NULL;
    END

    -- Agregar SegundoApellido si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'SegundoApellido')
    BEGIN
        ALTER TABLE Clientes ADD SegundoApellido NVARCHAR(100) NULL;
    END

    -- Eliminar Correo si existe
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'Correo')
    BEGIN
        ALTER TABLE Clientes DROP COLUMN Correo;
    END

    -- Eliminar Direccion si existe
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'Direccion')
    BEGIN
        ALTER TABLE Clientes DROP COLUMN Direccion;
    END
END
GO

-- ============================================
-- Tabla: Servicios de Streaming (Plataformas)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Servicios')
BEGIN
    CREATE TABLE Servicios (
        ServicioID INT PRIMARY KEY IDENTITY(1,1),
        Nombre NVARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        Activo BIT DEFAULT 1
    );
END
GO

-- ============================================
-- Tabla: Correos (Gestión de correos para cuentas)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Correos')
BEGIN
    CREATE TABLE Correos (
        CorreoID INT PRIMARY KEY IDENTITY(1,1),
        Email NVARCHAR(100) NOT NULL UNIQUE,
        Password NVARCHAR(255) NOT NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        Notas NVARCHAR(500) NULL,
        Activo BIT DEFAULT 1
    );
END
GO

-- ============================================
-- Tabla: Cuentas de Streaming
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Cuentas')
BEGIN
    CREATE TABLE Cuentas (
        CuentaID INT PRIMARY KEY IDENTITY(1,1),
        ServicioID INT NOT NULL,
        CorreoID INT NULL, -- NULL si es cuenta propia, FK si es de terceros
        TipoCuenta NVARCHAR(20) NOT NULL CHECK (TipoCuenta IN ('Propia', 'Terceros')),
        NumeroPerfiles INT DEFAULT 1,
        PerfilesDisponibles INT DEFAULT 1,
        Estado NVARCHAR(20) DEFAULT 'Disponible' CHECK (Estado IN ('Disponible', 'Ocupada', 'Vencida', 'Inactiva')),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        Activo BIT DEFAULT 1,
        FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID),
        FOREIGN KEY (CorreoID) REFERENCES Correos(CorreoID)
    );
END
GO

-- ============================================
-- Tabla: Perfiles de Cuentas (para cuentas de terceros)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Perfiles')
BEGIN
    CREATE TABLE Perfiles (
        PerfilID INT PRIMARY KEY IDENTITY(1,1),
        CuentaID INT NOT NULL,
        NumeroPerfil INT NOT NULL,
        PIN NVARCHAR(10) NULL,
        Estado NVARCHAR(20) DEFAULT 'Disponible' CHECK (Estado IN ('Disponible', 'Ocupado', 'Vencido')),
        Activo BIT DEFAULT 1,
        FOREIGN KEY (CuentaID) REFERENCES Cuentas(CuentaID)
    );
END
GO

-- ============================================
-- Tabla: Medios de Pago (Catálogos editables)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MediosPago')
BEGIN
    CREATE TABLE MediosPago (
        MedioPagoID INT PRIMARY KEY IDENTITY(1,1),
        Tipo NVARCHAR(50) NOT NULL, -- Banco, Billetera Móvil, etc.
        Nombre NVARCHAR(100) NOT NULL,
        NumeroCuenta NVARCHAR(50) NULL,
        Beneficiario NVARCHAR(100) NULL,
        Moneda NVARCHAR(10) NOT NULL CHECK (Moneda IN ('C$', 'USD')),
        Activo BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- Tabla: Ventas
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Ventas')
BEGIN
    CREATE TABLE Ventas (
        VentaID INT PRIMARY KEY IDENTITY(1,1),
        ClienteID INT NOT NULL,
        CuentaID INT NOT NULL,
        PerfilID INT NULL, -- Solo si la cuenta es de terceros
        FechaInicio DATETIME NOT NULL,
        FechaFin DATETIME NOT NULL,
        Duracion INT NOT NULL, -- En días
        Monto DECIMAL(10,2) NOT NULL,
        Moneda NVARCHAR(10) NOT NULL CHECK (Moneda IN ('C$', 'USD')),
        Estado NVARCHAR(20) DEFAULT 'Activo' CHECK (Estado IN ('Activo', 'ProximoVencer', 'Vencido', 'Cancelado')),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
        FOREIGN KEY (CuentaID) REFERENCES Cuentas(CuentaID),
        FOREIGN KEY (PerfilID) REFERENCES Perfiles(PerfilID)
    );
END
GO

-- ============================================
-- Tabla: Pagos
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pagos')
BEGIN
    CREATE TABLE Pagos (
        PagoID INT PRIMARY KEY IDENTITY(1,1),
        VentaID INT NOT NULL,
        MedioPagoID INT NOT NULL,
        Monto DECIMAL(10,2) NOT NULL,
        Moneda NVARCHAR(10) NOT NULL CHECK (Moneda IN ('C$', 'USD')),
        FechaPago DATETIME DEFAULT GETDATE(),
        Referencia NVARCHAR(100) NULL,
        Notas NVARCHAR(500) NULL,
        FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
        FOREIGN KEY (MedioPagoID) REFERENCES MediosPago(MedioPagoID)
    );
END
GO

-- ============================================
-- Tabla: Relación Correos-Servicios
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CorreosServicios')
BEGIN
    CREATE TABLE CorreosServicios (
        CorreoServicioID INT PRIMARY KEY IDENTITY(1,1),
        CorreoID INT NOT NULL,
        ServicioID INT NOT NULL,
        FechaAsociacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (CorreoID) REFERENCES Correos(CorreoID),
        FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID)
    );
END
GO

-- ============================================
-- Índices para mejor rendimiento
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Ventas_Estado')
    CREATE INDEX IX_Ventas_Estado ON Ventas(Estado);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Ventas_FechaFin')
    CREATE INDEX IX_Ventas_FechaFin ON Ventas(FechaFin);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Cuentas_Estado')
    CREATE INDEX IX_Cuentas_Estado ON Cuentas(Estado);
GO

PRINT 'Base de datos DBStreamDoor creada exitosamente';
GO
