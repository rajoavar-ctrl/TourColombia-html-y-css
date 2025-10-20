/* =================
SCRIPT BASE DE DATOS
====================*/


IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TourColombia')
BEGIN
    CREATE DATABASE TourColombia;
END
GO

-- Usar la base de datos
USE TourColombia;
GO

/* ============================================
   1. CREAR LOGIN A NIVEL SERVIDOR
   ============================================ */
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'turismo_login')
BEGIN
    CREATE LOGIN turismo_login
    WITH PASSWORD = N'sena@tour!23',
         CHECK_POLICY = ON,
         CHECK_EXPIRATION = OFF;
    PRINT '✅ Login creado: turismo_login';
END
ELSE
BEGIN
    PRINT '⚠️ El login turismo_login ya existe';
END
GO

/* ============================================
   2. CREAR USUARIO EN LA BASE DE DATOS
   ============================================ */
USE TourColombia; 
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'turismo_login')
BEGIN
    CREATE USER turismo_login FOR LOGIN turismo_login;
    
    -- Conceder permisos de lectura/escritura
    ALTER ROLE db_datareader ADD MEMBER turismo_login;
    ALTER ROLE db_datawriter ADD MEMBER turismo_login;
    
    PRINT '✅ Usuario creado y permisos asignados';
END
ELSE
BEGIN
    PRINT '⚠️ El usuario turismo_login ya existe';
END
GO

/* ============================================
   TABLA USUARIOS
   ============================================ */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
        Nombres NVARCHAR(100) NOT NULL,
        Apellidos NVARCHAR(100) NOT NULL,
        Cedula NVARCHAR(20) NOT NULL UNIQUE,
        Correo NVARCHAR(150) NOT NULL UNIQUE,
        PasswordHash VARBINARY(64) NOT NULL,
        PasswordSalt VARBINARY(16) NOT NULL,
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Usuarios creada';
END
GO

/* ============================================
   TABLA TRANSPORTE
   ============================================ */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TransporteOpciones')
BEGIN
    CREATE TABLE TransporteOpciones (
        IdTransporte INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(20) NOT NULL UNIQUE
    );
    
    INSERT INTO TransporteOpciones (Nombre) VALUES ('Bus'), ('Avion');
    PRINT '✅ Tabla TransporteOpciones creada y datos insertados';
END
GO

/* ============================================
   TABLA DESTINOS
   ============================================ */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Destinos')
BEGIN
    CREATE TABLE Destinos (
        IdDestino INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL UNIQUE,
        Descripcion NVARCHAR(500) NULL
    );
    
    INSERT INTO Destinos (Nombre) VALUES 
    ('Cartagena'), 
    ('Santa Marta'), 
    ('San Andres');
    
    PRINT '✅ Tabla Destinos creada y datos insertados';
END
GO

/* ============================================
   TABLA LUGARES
   ============================================ */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Lugares')
BEGIN
    CREATE TABLE Lugares (
        IdLugar INT IDENTITY(1,1) PRIMARY KEY,
        IdDestino INT NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(500) NULL,
        CONSTRAINT FK_Lugares_Destinos FOREIGN KEY (IdDestino) 
            REFERENCES Destinos(IdDestino)
    );
    
    -- Lugares de Cartagena (IdDestino = 1)
    INSERT INTO Lugares (IdDestino, Nombre) VALUES
    (1, 'Islas del Rosario'),
    (1, 'Volcán del Totumo'),
    (1, 'Playa Blanca'),
    (1, 'Playa Castillo Grande'),
    (1, 'Getsemaní'),
    (1, 'Museo del Oro Zenú');
    
    -- Lugares de Santa Marta (IdDestino = 2)
    INSERT INTO Lugares (IdDestino, Nombre) VALUES
    (2, 'Ciudad Perdida'),
    (2, 'Minca & Cascadas Marinka'),
    (2, 'Cabo San Juan'),
    (2, 'Playa Blanca'),
    (2, 'Parque Tayrona'),
    (2, 'Minca');
    
    -- Lugares de San Andrés (IdDestino = 3)
    INSERT INTO Lugares (IdDestino, Nombre) VALUES
    (3, 'El Acuario y Haynes Cay'),
    (3, 'La Piscinita'),
    (3, 'Spratt Bight'),
    (3, 'Playa San Luis'),
    (3, 'Coco Loco Bar'),
    (3, 'Disco Éxtasis');
    
    PRINT '✅ Tabla Lugares creada y datos insertados';
END
GO

/* ============================================
   TABLA RESERVAS
   ============================================ */
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reservas')
BEGIN
    CREATE TABLE Reservas (
        IdReserva INT IDENTITY(1,1) PRIMARY KEY,
        IdUsuario INT NOT NULL,
        CantidadBoletos INT NOT NULL CHECK (CantidadBoletos > 0),
        IdTransporte INT NOT NULL,
        IdDestino INT NOT NULL,
        IdLugar INT NOT NULL,
        FechaReserva DATETIME DEFAULT GETDATE(),
        Estado NVARCHAR(20) DEFAULT 'Activa' CHECK (Estado IN ('Activa', 'Cancelada', 'Completada')),
        CONSTRAINT FK_Reservas_Usuarios FOREIGN KEY (IdUsuario) 
            REFERENCES Usuarios(IdUsuario),
        CONSTRAINT FK_Reservas_Transporte FOREIGN KEY (IdTransporte) 
            REFERENCES TransporteOpciones(IdTransporte),
        CONSTRAINT FK_Reservas_Destinos FOREIGN KEY (IdDestino) 
            REFERENCES Destinos(IdDestino),
        CONSTRAINT FK_Reservas_Lugares FOREIGN KEY (IdLugar) 
            REFERENCES Lugares(IdLugar)
    );
    PRINT '✅ Tabla Reservas creada';
END
GO

/* ============================================
   VERIFICACIÓN FINAL
   ============================================ */
PRINT '===========================================';
PRINT '📊 RESUMEN DE LA BASE DE DATOS';
PRINT '===========================================';

SELECT 
    'Usuarios' AS Tabla,
    COUNT(*) AS TotalRegistros
FROM Usuarios
UNION ALL
SELECT 'TransporteOpciones', COUNT(*) FROM TransporteOpciones
UNION ALL
SELECT 'Destinos', COUNT(*) FROM Destinos
UNION ALL
SELECT 'Lugares', COUNT(*) FROM Lugares
UNION ALL
SELECT 'Reservas', COUNT(*) FROM Reservas;

PRINT '✅ Base de datos TourColombia configurada correctamente';
GO

/* ====================
   COLUMNAS CON BCRYPT
   ====================*/

USE TourColombia;
GO

-- Verificar la estructura actual
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Usuarios' AND COLUMN_NAME IN ('PasswordHash', 'PasswordSalt');
GO

-- Eliminar las columnas actuales
ALTER TABLE Usuarios DROP COLUMN PasswordHash, PasswordSalt;
GO

-- Agregar columnas como NVARCHAR (bcrypt genera strings)
ALTER TABLE Usuarios ADD 
    PasswordHash NVARCHAR(255) NOT NULL DEFAULT '',
    PasswordSalt NVARCHAR(50) NOT NULL DEFAULT '';
GO

PRINT 'Columnas modificadas exitosamente';

/* ====================
   PROCEDIMIENTO_ SALTHASH
   ====================*/

USE TourColombiaApp;
GO

-- 1) Procedimiento para registrar usuario (genera salt + hash y devuelve IdUsuario)
IF OBJECT_ID('dbo.sp_RegistrarUsuario','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RegistrarUsuario;
GO

CREATE PROCEDURE dbo.sp_RegistrarUsuario
    @Nombres NVARCHAR(100),
    @Apellidos NVARCHAR(100),
    @Cedula NVARCHAR(50),
    @Correo NVARCHAR(150),
    @Password NVARCHAR(400)
AS
BEGIN
    SET NOCOUNT ON;

    -- Evitar duplicados por correo o cédula
    IF EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Correo = @Correo OR Cedula = @Cedula)
    BEGIN
        RAISERROR('El correo o la cédula ya están registrados.', 16, 1);
        RETURN;
    END

    -- Generar salt seguro (16 bytes)
    DECLARE @Salt VARBINARY(16) = CRYPT_GEN_RANDOM(16);

    -- Convertir y concatenar salt + contraseña
    DECLARE @PasswordBinary VARBINARY(MAX) = CONVERT(VARBINARY(MAX), @Password);
    DECLARE @SaltPlusPass VARBINARY(MAX) = @Salt + @PasswordBinary;

    -- Hash SHA2_256(salt + pass)
    DECLARE @Hash VARBINARY(32) = HASHBYTES('SHA2_256', @SaltPlusPass);

    INSERT INTO dbo.Usuarios (Nombres, Apellidos, Cedula, Correo, PasswordSalt, PasswordHash)
    VALUES (@Nombres, @Apellidos, @Cedula, @Correo, @Salt, @Hash);

    -- Devolver Id insertado
    SELECT SCOPE_IDENTITY() AS IdUsuario;
END
GO

-- 2) Procedimiento para validar login (compara hash)
IF OBJECT_ID('dbo.sp_ValidarUsuario','P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ValidarUsuario;
GO

CREATE PROCEDURE dbo.sp_ValidarUsuario
    @Correo NVARCHAR(150),
    @Password NVARCHAR(400)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @IdUsuario INT;
    DECLARE @Salt VARBINARY(16);
    DECLARE @StoredHash VARBINARY(64);

    SELECT @IdUsuario = IdUsuario, @Salt = PasswordSalt, @StoredHash = PasswordHash
    FROM dbo.Usuarios
    WHERE Correo = @Correo;

    IF @IdUsuario IS NULL
    BEGIN
        -- usuario no existe
        SELECT NULL AS IdUsuario;
        RETURN;
    END

    DECLARE @PasswordBinary VARBINARY(MAX) = CONVERT(VARBINARY(MAX), @Password);
    DECLARE @SaltPlusPass VARBINARY(MAX) = @Salt + @PasswordBinary;
    DECLARE @Hash VARBINARY(32) = HASHBYTES('SHA2_256', @SaltPlusPass);

    IF @Hash = @StoredHash
        SELECT @IdUsuario AS IdUsuario;
    ELSE
        SELECT NULL AS IdUsuario;
END
GO