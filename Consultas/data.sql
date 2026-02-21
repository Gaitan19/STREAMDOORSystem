-- ============================================
-- Datos Iniciales para DBStreamDoor
-- ============================================

USE DBStreamDoor;
GO

-- ============================================
-- Insertar Servicios de Streaming
-- ============================================
INSERT INTO Servicios (Nombre, Descripcion) VALUES
('Netflix', 'Servicio de streaming de películas y series'),
('Prime Video', 'Servicio de streaming de Amazon'),
('Disney+', 'Servicio de streaming de Disney'),
('HBO Max', 'Servicio de streaming de HBO'),
('Spotify', 'Servicio de streaming de música'),
('YouTube Premium', 'Servicio de streaming de videos sin anuncios'),
('Apple TV+', 'Servicio de streaming de Apple'),
('Paramount+', 'Servicio de streaming de Paramount'),
('Star+', 'Servicio de streaming de Star');
GO

-- ============================================
-- Insertar Usuario Administrador por Defecto
-- ============================================
-- Usuario: admin@streamdoor.com
-- Contraseña: 1234567890
-- IMPORTANTE: Cambiar esta contraseña después del primer login por seguridad
INSERT INTO Usuarios (Nombre, Correo, Telefono, PasswordHash) VALUES
('Administrador', 'admin@streamdoor.com', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
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
