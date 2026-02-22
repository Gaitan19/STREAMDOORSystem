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
