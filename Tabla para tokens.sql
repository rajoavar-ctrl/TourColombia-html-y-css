USE TourColombia;
GO

-- Tabla para tokens de recuperación de contraseña
CREATE TABLE RecuperacionPassword (
    IdRecuperacion INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL,
    Token NVARCHAR(255) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    FechaExpiracion DATETIME NOT NULL,
    Usado BIT DEFAULT 0,
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario) ON DELETE CASCADE
);
GO

-- Índice para búsqueda rápida por token
CREATE INDEX IDX_Token ON RecuperacionPassword(Token);
GO


USE TourColombia;
GO

-- Verificar si la tabla existe
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'RecuperacionPassword';
GO

USE TourColombia;
GO

-- Insertar un token de prueba para el usuario con correo rajoavar@gmail.com
DECLARE @IdUsuario INT;
DECLARE @Token NVARCHAR(255) = 'token-prueba-123456789';
DECLARE @FechaExpiracion DATETIME = DATEADD(HOUR, 1, GETDATE()); -- Válido por 1 hora

-- Obtener el IdUsuario del correo
SELECT @IdUsuario = IdUsuario 
FROM Usuarios 
WHERE Correo = 'rajoavar@gmail.com';

-- Insertar token
INSERT INTO RecuperacionPassword (IdUsuario, Token, FechaExpiracion, Usado)
VALUES (@IdUsuario, @Token, @FechaExpiracion, 0);

PRINT 'Token creado: token-prueba-123456789';
PRINT 'Válido hasta: ' + CONVERT(VARCHAR, @FechaExpiracion, 120);
GO


USE TourColombia;
GO

-- Ver tokens y cuál fue usado
SELECT 
    r.IdRecuperacion,
    r.Token,
    r.Usado,
    r.FechaCreacion,
    r.FechaExpiracion,
    u.Correo,
    u.Nombres
FROM RecuperacionPassword r
INNER JOIN Usuarios u ON r.IdUsuario = u.IdUsuario
WHERE u.Correo = 'rajoavar@gmail.com'
ORDER BY r.FechaCreacion DESC;
GO

USE TourColombia;
GO

-- Eliminar tokens viejos
DELETE FROM RecuperacionPassword
WHERE IdUsuario = (SELECT IdUsuario FROM Usuarios WHERE Correo = 'rajoavar@gmail.com');

-- Crear un nuevo token válido por 24 horas (para tener tiempo de probar)
DECLARE @IdUsuario INT;
DECLARE @Token NVARCHAR(255) = 'token-nuevo-' + CONVERT(VARCHAR, GETDATE(), 112) + '-123';
DECLARE @FechaExpiracion DATETIME = DATEADD(HOUR, 24, GETDATE()); -- 24 horas

SELECT @IdUsuario = IdUsuario 
FROM Usuarios 
WHERE Correo = 'rajoavar@gmail.com';

INSERT INTO RecuperacionPassword (IdUsuario, Token, FechaExpiracion, Usado)
VALUES (@IdUsuario, @Token, @FechaExpiracion, 0);

PRINT '✅ Token creado exitosamente';
PRINT 'Token: ' + @Token;
PRINT 'Válido hasta: ' + CONVERT(VARCHAR, @FechaExpiracion, 120);

-- Mostrar el token para que lo copies
SELECT 
    @Token AS 'TOKEN PARA USAR',
    CONVERT(VARCHAR, @FechaExpiracion, 120) AS 'Válido hasta',
    DATEDIFF(HOUR, GETDATE(), @FechaExpiracion) AS 'Horas restantes';
GO