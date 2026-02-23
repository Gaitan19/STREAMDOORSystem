-- ============================================
-- Datos Iniciales para DBStreamDoor
-- ============================================

USE DBStreamDoor;
GO


-- ============================================
-- Insertar Usuario Administrador
-- ============================================
INSERT INTO Usuarios (Nombre, Correo, Telefono, PasswordHash, Activo)
VALUES ('admin', 'admin@gmail.com', '87549961',
'$2a$11$f8XpVC0..VXSJYscHvg7LeT0/Ep8v8U/hhWHqW7IAQz2R1YN6booO', 1);
GO

-- ============================================
-- Insertar Servicios de Streaming
-- ============================================
INSERT INTO Servicios (Nombre, Descripcion, Precio) VALUES
('Netflix', 'Servicio de streaming de películas y series', 150.00),
('Prime Video', 'Servicio de streaming de Amazon', 140.00),
('Disney+', 'Servicio de streaming de Disney', 130.00),
('HBO Max', 'Servicio de streaming de HBO', 120.00),
('Spotify', 'Servicio de streaming de música', 110.00),
('YouTube Premium', 'Servicio de streaming de videos sin anuncios', 100.00),
('Apple TV+', 'Servicio de streaming de Apple', 150.00),
('Paramount+', 'Servicio de streaming de Paramount', 140.00),
('Star+', 'Servicio de streaming de Star', 130.00);
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
INSERT INTO MediosPago (Tipo, Nombre, NumeroCuenta, Beneficiario, Moneda) VALUES
('Banco', 'BAC', '1234567890', 'StreamDoor S.A.', 'C$'),
('Banco', 'Banpro', '0987654321', 'StreamDoor S.A.', 'C$'),
('Billetera Móvil', 'Tigo Money', '88888888', 'StreamDoor', 'C$'),
('Banco', 'BAC', '1111111111', 'StreamDoor S.A.', 'USD'),
('Billetera Móvil', 'Movistar Money', '77777777', 'StreamDoor', 'C$');
GO

PRINT 'Datos iniciales insertados exitosamente';
GO
