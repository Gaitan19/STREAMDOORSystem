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
        Precio DECIMAL(10,2) NULL,
        Activo BIT DEFAULT 1
    );
END
GO

-- Migración: Agregar columna Precio si no existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Servicios') AND name = 'Precio')
BEGIN
    ALTER TABLE Servicios ADD Precio DECIMAL(10,2) NULL;
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
        Estado NVARCHAR(30) DEFAULT 'Disponible' CHECK (Estado IN ('Disponible', 'Ocupada', 'Vencida', 'Inactiva', 'Próxima a Vencer', 'No Disponible')),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        Activo BIT DEFAULT 1,
        FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID),
        FOREIGN KEY (CorreoID) REFERENCES Correos(CorreoID)
    );
END
GO

-- Migración: Actualizar tabla Cuentas existente
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Cuentas')
BEGIN
    -- Agregar FechaFinalizacion si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('Cuentas') 
                   AND name = 'FechaFinalizacion')
    BEGIN
        ALTER TABLE Cuentas ADD FechaFinalizacion DATETIME NULL;
        PRINT 'Column FechaFinalizacion added to Cuentas table.';
    END
    
    -- Agregar Password si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('Cuentas') 
                   AND name = 'Password')
    BEGIN
        ALTER TABLE Cuentas ADD Password NVARCHAR(100) NULL;
        PRINT 'Column Password added to Cuentas table.';
    END
    
    -- Agregar CorreoTerceros si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('Cuentas') 
                   AND name = 'CorreoTerceros')
    BEGIN
        ALTER TABLE Cuentas ADD CorreoTerceros NVARCHAR(100) NULL;
        PRINT 'Column CorreoTerceros added to Cuentas table.';
    END
    
    -- Agregar CodigoCuenta si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns 
                   WHERE object_id = OBJECT_ID('Cuentas') 
                   AND name = 'CodigoCuenta')
    BEGIN
        ALTER TABLE Cuentas ADD CodigoCuenta NVARCHAR(10) NULL;
        PRINT 'Column CodigoCuenta added to Cuentas table.';
    END
    
    -- Agregar constraint UNIQUE a CodigoCuenta si no existe
    IF NOT EXISTS (SELECT * FROM sys.indexes 
                   WHERE name = 'UQ_Cuentas_CodigoCuenta' 
                   AND object_id = OBJECT_ID('Cuentas'))
    BEGIN
        ALTER TABLE Cuentas ADD CONSTRAINT UQ_Cuentas_CodigoCuenta UNIQUE (CodigoCuenta);
        PRINT 'UNIQUE constraint added to CodigoCuenta column.';
    END
    
    -- Actualizar constraint CHECK de Estado para incluir nuevos valores
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT @ConstraintName = name 
    FROM sys.check_constraints 
    WHERE parent_object_id = OBJECT_ID('Cuentas') 
    AND COL_NAME(parent_object_id, parent_column_id) = 'Estado';
    
    IF @ConstraintName IS NOT NULL
    BEGIN
        DECLARE @SQL NVARCHAR(MAX);
        SET @SQL = 'ALTER TABLE Cuentas DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
        EXEC sp_executesql @SQL;
        PRINT 'Dropped old Estado CHECK constraint: ' + @ConstraintName;
        
        ALTER TABLE Cuentas ADD CONSTRAINT CK_Cuentas_Estado 
            CHECK (Estado IN ('Disponible', 'Ocupada', 'Vencida', 'Inactiva', 'Próxima a Vencer', 'No Disponible'));
        PRINT 'Added new Estado CHECK constraint with extended values.';
    END
    ELSE
    BEGIN
        -- Si no existe constraint, agregar uno nuevo
        ALTER TABLE Cuentas ADD CONSTRAINT CK_Cuentas_Estado 
            CHECK (Estado IN ('Disponible', 'Ocupada', 'Vencida', 'Inactiva', 'Próxima a Vencer', 'No Disponible'));
        PRINT 'Added Estado CHECK constraint.';
    END
    
    -- Ampliar el tamaño de la columna Estado si es necesario
    IF EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('Cuentas') 
               AND name = 'Estado' 
               AND max_length < 60)  -- NVARCHAR(30) = 60 bytes
    BEGIN
        ALTER TABLE Cuentas ALTER COLUMN Estado NVARCHAR(30) NOT NULL;
        PRINT 'Estado column resized to NVARCHAR(30).';
    END
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
        FechaInicio DATETIME NOT NULL,
        FechaFin DATETIME NOT NULL,
        Duracion INT NULL, -- En días (opcional, para compatibilidad)
        Monto DECIMAL(10,2) NOT NULL,
        Moneda NVARCHAR(10) NOT NULL CHECK (Moneda IN ('C$', 'USD')),
        Estado NVARCHAR(20) DEFAULT 'Activo' CHECK (Estado IN ('Activo', 'ProximoVencer', 'Vencido', 'Cancelado')),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID)
    );
END
GO

-- Migración: Actualizar tabla Ventas existente para quitar CuentaID y PerfilID
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Ventas')
BEGIN
    -- Hacer Duracion nullable para compatibilidad
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ventas') AND name = 'Duracion')
    BEGIN
        ALTER TABLE Ventas ALTER COLUMN Duracion INT NULL;
    END

    -- Eliminar CuentaID si existe (los datos se migrarán a VentasDetalles)
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ventas') AND name = 'CuentaID')
    BEGIN
        -- Primero eliminar el foreign key constraint
        DECLARE @ConstraintName nvarchar(200)
        SELECT @ConstraintName = name FROM sys.foreign_keys 
        WHERE parent_object_id = OBJECT_ID('Ventas') AND referenced_object_id = OBJECT_ID('Cuentas')
        IF @ConstraintName IS NOT NULL
            EXEC('ALTER TABLE Ventas DROP CONSTRAINT ' + @ConstraintName)
        
        -- Ahora eliminar la columna
        ALTER TABLE Ventas DROP COLUMN CuentaID;
    END

    -- Eliminar PerfilID si existe (los datos se migrarán a VentasDetalles)
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ventas') AND name = 'PerfilID')
    BEGIN
        -- Primero eliminar el foreign key constraint
        DECLARE @ConstraintName2 nvarchar(200)
        SELECT @ConstraintName2 = name FROM sys.foreign_keys 
        WHERE parent_object_id = OBJECT_ID('Ventas') AND referenced_object_id = OBJECT_ID('Perfiles')
        IF @ConstraintName2 IS NOT NULL
            EXEC('ALTER TABLE Ventas DROP CONSTRAINT ' + @ConstraintName2)
        
        -- Ahora eliminar la columna
        ALTER TABLE Ventas DROP COLUMN PerfilID;
    END
END
GO

-- ============================================
-- Tabla: VentasDetalles (Detalle de servicios por venta)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VentasDetalles')
BEGIN
    CREATE TABLE VentasDetalles (
        VentaDetalleID INT PRIMARY KEY IDENTITY(1,1),
        VentaID INT NOT NULL,
        CuentaID INT NOT NULL,
        PerfilID INT NOT NULL,
        ServicioID INT NOT NULL,
        PrecioUnitario DECIMAL(10,2) NOT NULL,
        FechaAsignacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
        FOREIGN KEY (CuentaID) REFERENCES Cuentas(CuentaID),
        FOREIGN KEY (PerfilID) REFERENCES Perfiles(PerfilID),
        FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID)
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
-- Tabla: Combos (Paquetes de Servicios)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Combos')
BEGIN
    CREATE TABLE Combos (
        ComboID INT PRIMARY KEY IDENTITY(1,1),
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        Precio DECIMAL(10,2) NOT NULL,
        Activo BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- Tabla: ComboServicios (Relación Many-to-Many entre Combos y Servicios)
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ComboServicios')
BEGIN
    CREATE TABLE ComboServicios (
        ComboServicioID INT PRIMARY KEY IDENTITY(1,1),
        ComboID INT NOT NULL,
        ServicioID INT NOT NULL,
        FOREIGN KEY (ComboID) REFERENCES Combos(ComboID) ON DELETE CASCADE,
        FOREIGN KEY (ServicioID) REFERENCES Servicios(ServicioID),
        CONSTRAINT UQ_ComboServicios_Combo_Servicio UNIQUE(ComboID, ServicioID)
    );
END
GO

-- Migración: Agregar columna ComboID a VentasDetalles si no existe
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'VentasDetalles')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentasDetalles') AND name = 'ComboID')
    BEGIN
        ALTER TABLE VentasDetalles ADD ComboID INT NULL;
        ALTER TABLE VentasDetalles ADD CONSTRAINT FK_VentasDetalles_Combos FOREIGN KEY (ComboID) REFERENCES Combos(ComboID);
        PRINT 'Column ComboID added to VentasDetalles table.';
    END
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VentasDetalles_VentaID')
    CREATE INDEX IX_VentasDetalles_VentaID ON VentasDetalles(VentaID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VentasDetalles_PerfilID')
    CREATE INDEX IX_VentasDetalles_PerfilID ON VentasDetalles(PerfilID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ComboServicios_ComboID')
    CREATE INDEX IX_ComboServicios_ComboID ON ComboServicios(ComboID);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ComboServicios_ServicioID')
    CREATE INDEX IX_ComboServicios_ServicioID ON ComboServicios(ServicioID);
GO



PRINT 'Base de datos DBStreamDoor creada exitosamente';
GO
