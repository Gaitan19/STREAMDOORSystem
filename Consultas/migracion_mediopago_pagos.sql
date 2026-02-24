-- ============================================
-- Migración: Agregar MedioPagoID a Ventas y Crear Tabla Pagos
-- Fecha: 2026-02-24
-- Descripción: Soluciona el error 500 al crear ventas
-- ============================================

USE DBStreamDoor;
GO

-- ============================================
-- PASO 1: Crear tabla Pagos si no existe
-- ============================================
PRINT 'Verificando tabla Pagos...';
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pagos')
BEGIN
    PRINT 'Creando tabla Pagos...';
    CREATE TABLE Pagos (
        PagoID INT PRIMARY KEY IDENTITY(1,1),
        VentaID INT NOT NULL,
        MedioPagoID INT NOT NULL,
        Monto DECIMAL(10,2) NOT NULL,
        Moneda NVARCHAR(10) NOT NULL CHECK (Moneda IN ('C$', 'USD')),
        FechaPago DATETIME DEFAULT GETDATE(),
        Referencia NVARCHAR(100) NULL,
        Notas NVARCHAR(500) NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Pagos_Ventas FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
        CONSTRAINT FK_Pagos_MediosPago FOREIGN KEY (MedioPagoID) REFERENCES MediosPago(MedioPagoID)
    );
    PRINT 'Tabla Pagos creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Tabla Pagos ya existe.';
END
GO

-- ============================================
-- PASO 2: Agregar columna MedioPagoID a Ventas
-- ============================================
PRINT 'Verificando columna MedioPagoID en Ventas...';
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Ventas') 
    AND name = 'MedioPagoID'
)
BEGIN
    PRINT 'Agregando columna MedioPagoID a Ventas...';
    ALTER TABLE Ventas ADD MedioPagoID INT NULL;
    PRINT 'Columna MedioPagoID agregada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Columna MedioPagoID ya existe en Ventas.';
END
GO

-- ============================================
-- PASO 3: Agregar Foreign Key de Ventas a MediosPago
-- ============================================
PRINT 'Verificando Foreign Key FK_Ventas_MediosPago...';
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'FK_Ventas_MediosPago'
)
BEGIN
    PRINT 'Creando Foreign Key FK_Ventas_MediosPago...';
    ALTER TABLE Ventas 
    ADD CONSTRAINT FK_Ventas_MediosPago 
    FOREIGN KEY (MedioPagoID) REFERENCES MediosPago(MedioPagoID);
    PRINT 'Foreign Key FK_Ventas_MediosPago creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'Foreign Key FK_Ventas_MediosPago ya existe.';
END
GO

-- ============================================
-- PASO 4: Verificación final
-- ============================================
PRINT '';
PRINT '===========================================';
PRINT 'VERIFICACIÓN DE MIGRACIÓN';
PRINT '===========================================';

-- Verificar tabla Pagos
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Pagos')
    PRINT '✓ Tabla Pagos existe';
ELSE
    PRINT '✗ ERROR: Tabla Pagos NO existe';

-- Verificar columna MedioPagoID en Ventas
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Ventas') AND name = 'MedioPagoID')
    PRINT '✓ Columna Ventas.MedioPagoID existe';
ELSE
    PRINT '✗ ERROR: Columna Ventas.MedioPagoID NO existe';

-- Verificar Foreign Key FK_Ventas_MediosPago
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Ventas_MediosPago')
    PRINT '✓ Foreign Key FK_Ventas_MediosPago existe';
ELSE
    PRINT '✗ ERROR: Foreign Key FK_Ventas_MediosPago NO existe';

-- Verificar Foreign Keys en tabla Pagos
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Pagos_Ventas')
    PRINT '✓ Foreign Key FK_Pagos_Ventas existe';
ELSE
    PRINT '✗ ERROR: Foreign Key FK_Pagos_Ventas NO existe';

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Pagos_MediosPago')
    PRINT '✓ Foreign Key FK_Pagos_MediosPago existe';
ELSE
    PRINT '✗ ERROR: Foreign Key FK_Pagos_MediosPago NO existe';

PRINT '===========================================';
PRINT 'MIGRACIÓN COMPLETADA';
PRINT '===========================================';
PRINT '';
PRINT 'IMPORTANTE:';
PRINT '- Reinicie la aplicación .NET para que los cambios surtan efecto';
PRINT '- Pruebe crear una nueva venta';
PRINT '- El error 500 debería estar resuelto';
PRINT '';
GO
