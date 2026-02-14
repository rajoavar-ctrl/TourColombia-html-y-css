const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getConnection, sql } = require('../config/database');
const crypto = require('crypto');

// ============================================
// RUTA: Registrar nuevo usuario
// POST /api/usuarios/registro
// ============================================
router.post('/registro', async (req, res) => {
    console.log('📥 Solicitud de registro recibida:', req.body);
    
    try {
        const { nombres, apellidos, cedula, correo, password } = req.body;

        if (!nombres || !apellidos || !cedula || !correo || !password) {
            console.log('❌ Faltan campos obligatorios');
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            console.log('❌ Formato de correo inválido');
            return res.status(400).json({
                success: false,
                message: 'Formato de correo inválido'
            });
        }

        if (password.length < 6) {
            console.log('❌ Contraseña muy corta');
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        console.log('✅ Validaciones pasadas, conectando a BD...');
        const pool = await getConnection();

        console.log('🔍 Verificando si el correo existe...');
        const checkEmail = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .query('SELECT IdUsuario FROM Usuarios WHERE Correo = @correo');

        if (checkEmail.recordset.length > 0) {
            console.log('❌ El correo ya está registrado');
            return res.status(409).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        console.log('🔍 Verificando si la cédula existe...');
        const checkCedula = await pool.request()
            .input('cedula', sql.NVarChar, cedula)
            .query('SELECT IdUsuario FROM Usuarios WHERE Cedula = @cedula');

        if (checkCedula.recordset.length > 0) {
            console.log('❌ La cédula ya está registrada');
            return res.status(409).json({
                success: false,
                message: 'La cédula ya está registrada'
            });
        }

        console.log('🔐 Generando hash de contraseña...');
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log('✅ Hash generado');

        console.log('💾 Insertando usuario en la base de datos...');
        const result = await pool.request()
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('cedula', sql.NVarChar, cedula)
            .input('correo', sql.NVarChar, correo)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('passwordSalt', sql.NVarChar, 'bcrypt')
            .query(`
                INSERT INTO Usuarios (Nombres, Apellidos, Cedula, Correo, PasswordHash, PasswordSalt)
                OUTPUT INSERTED.IdUsuario
                VALUES (@nombres, @apellidos, @cedula, @correo, @passwordHash, @passwordSalt)
            `);

        const nuevoUsuarioId = result.recordset[0].IdUsuario;
        console.log('✅ Usuario registrado con ID:', nuevoUsuarioId);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                idUsuario: nuevoUsuarioId,
                nombres,
                apellidos,
                correo
            }
        });

    } catch (error) {
        console.error('💥 ERROR EN REGISTRO:');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});

// ============================================
// RUTA: Iniciar Sesión
// POST /api/usuarios/login
// ============================================
router.post('/login', async (req, res) => {
    console.log('📥 Solicitud de login recibida');
    
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son obligatorios'
            });
        }

        const pool = await getConnection();

        const result = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .query(`
                SELECT 
                    IdUsuario,
                    Nombres,
                    Apellidos,
                    Cedula,
                    Correo,
                    PasswordHash
                FROM Usuarios
                WHERE Correo = @correo
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = result.recordset[0];
        const passwordMatch = await bcrypt.compare(password, usuario.PasswordHash);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos'
            });
        }

        console.log('✅ Login exitoso para:', correo);

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                idUsuario: usuario.IdUsuario,
                nombres: usuario.Nombres,
                apellidos: usuario.Apellidos,
                cedula: usuario.Cedula,
                correo: usuario.Correo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
});

// ============================================
// RUTA: Obtener información del usuario
// GET /api/usuarios/:id
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    IdUsuario,
                    Nombres,
                    Apellidos,
                    Cedula,
                    Correo,
                    FechaCreacion
                FROM Usuarios
                WHERE IdUsuario = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
});

// ============================================
// RUTA: Actualizar información del usuario
// PUT /api/usuarios/:id
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombres, apellidos, cedula, correo } = req.body;

        if (!nombres || !apellidos || !cedula || !correo) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        const pool = await getConnection();

        const checkUser = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT IdUsuario FROM Usuarios WHERE IdUsuario = @id');

        if (checkUser.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const checkEmail = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .input('id', sql.Int, id)
            .query('SELECT IdUsuario FROM Usuarios WHERE Correo = @correo AND IdUsuario != @id');

        if (checkEmail.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El correo ya está en uso por otro usuario'
            });
        }

        const checkCedula = await pool.request()
            .input('cedula', sql.NVarChar, cedula)
            .input('id', sql.Int, id)
            .query('SELECT IdUsuario FROM Usuarios WHERE Cedula = @cedula AND IdUsuario != @id');

        if (checkCedula.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'La cédula ya está en uso por otro usuario'
            });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('nombres', sql.NVarChar, nombres)
            .input('apellidos', sql.NVarChar, apellidos)
            .input('cedula', sql.NVarChar, cedula)
            .input('correo', sql.NVarChar, correo)
            .query(`
                UPDATE Usuarios
                SET Nombres = @nombres,
                    Apellidos = @apellidos,
                    Cedula = @cedula,
                    Correo = @correo
                WHERE IdUsuario = @id
            `);

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                idUsuario: id,
                nombres,
                apellidos,
                cedula,
                correo
            }
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
});

// ============================================
// RUTA: Generar Token de recuperación
// POST /api/usuarios/:id
// ============================================

// Solicitar Token de contraseña
router.post('/solicitar-recuperacion', async (req, res) => {
    try {
        const { correo } = req.body;

        console.log('📧 Solicitud de recuperación para:', correo);

        if (!correo) {
            return res.status(400).json({
                success: false,
                message: 'El correo es obligatorio'
            });
        }

        const pool = await getConnection();

        // Verificar que el usuario existe
        const usuario = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .query('SELECT IdUsuario, Nombres FROM Usuarios WHERE Correo = @correo');

        // Por seguridad, siempre respondemos lo mismo (exista o no el correo)
        if (usuario.recordset.length === 0) {
            console.log('⚠️ Correo no existe, pero no lo revelamos');
            return res.json({
                success: true,
                message: 'Si el correo existe, recibirás un enlace de recuperación'
            });
        }

        const idUsuario = usuario.recordset[0].IdUsuario;
        
        // Generar token único y seguro
        const token = crypto.randomBytes(32).toString('hex');
        
        // Token válido por 1 hora
        const fechaExpiracion = new Date();
        fechaExpiracion.setHours(fechaExpiracion.getHours() + 1);

        // Guardar token en BD
        await pool.request()
            .input('idUsuario', sql.Int, idUsuario)
            .input('token', sql.NVarChar, token)
            .input('fechaExpiracion', sql.DateTime, fechaExpiracion)
            .query(`
                INSERT INTO RecuperacionPassword (IdUsuario, Token, FechaExpiracion)
                VALUES (@idUsuario, @token, @fechaExpiracion)
            `);

        console.log('✅ Token generado:', token);
        console.log(`🔗 Enlace: http://localhost:3000/restablecer-password.html?token=${token}`);

        res.json({
            success: true,
            message: 'Si el correo existe, recibirás un enlace de recuperación',
            // ⚠️ SOLO PARA DESARROLLO - QUITAR EN PRODUCCIÓN
            debug: {
                token: token,
                enlace: `http://localhost:3000/restablecer-password.html?token=${token}`
            }
        });

    } catch (error) {
        console.error('❌ Error al solicitar recuperación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar la solicitud'
        });
    }
});





// ============================================
// RUTA: Restablecer contraseña
// POST /api/usuarios/:id
// ============================================

//Restablecer contraseña
router.post('/restablecer-password', async (req, res) => {
    try {
        console.log('🔧 Endpoint de restablecimiento llamado');
        console.log('Body recibido:', req.body);

        const { token, nuevaPassword } = req.body;

        // ===== VALIDACIONES =====
        if (!token || !nuevaPassword) {
            console.log('❌ Faltan datos');
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son obligatorios'
            });
        }

        if (nuevaPassword.length < 6) {
            console.log('❌ Contraseña muy corta');
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        const pool = await getConnection();

        // ===== 1. BUSCAR TOKEN EN LA BASE DE DATOS =====
        console.log('🔍 Buscando token:', token);
        const recuperacion = await pool.request()
            .input('token', sql.NVarChar, token)
            .query(`
                SELECT IdRecuperacion, IdUsuario, FechaExpiracion, Usado
                FROM RecuperacionPassword
                WHERE Token = @token
            `);

        if (recuperacion.recordset.length === 0) {
            console.log('❌ Token no existe en BD');
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        const rec = recuperacion.recordset[0];
        console.log('✅ Token encontrado:', {
            IdRecuperacion: rec.IdRecuperacion,
            IdUsuario: rec.IdUsuario,
            Usado: rec.Usado,
            FechaExpiracion: rec.FechaExpiracion
        });

        // ===== 2. VERIFICAR SI YA FUE USADO =====
        if (rec.Usado === 1) {
            console.log('❌ Token ya fue usado');
            return res.status(400).json({
                success: false,
                message: 'Este enlace ya fue utilizado'
            });
        }

        // ===== 3. VERIFICAR SI EXPIRÓ =====
        const ahora = new Date();
        const expiracion = new Date(rec.FechaExpiracion);
        
        if (ahora > expiracion) {
            console.log('❌ Token expirado');
            console.log('Ahora:', ahora);
            console.log('Expiracion:', expiracion);
            return res.status(400).json({
                success: false,
                message: 'Este enlace ha expirado. Solicita uno nuevo'
            });
        }

        // ===== 4. GENERAR NUEVO HASH CON BCRYPT =====
        console.log('🔐 Generando hash de nueva contraseña...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nuevaPassword, salt);
        console.log('✅ Hash generado:', hash.substring(0, 20) + '...');

        // ===== 5. ACTUALIZAR CONTRASEÑA EN USUARIOS =====
        console.log('💾 Actualizando contraseña en tabla Usuarios...');
        const updateResult = await pool.request()
            .input('idUsuario', sql.Int, rec.IdUsuario)
            .input('hash', sql.NVarChar, hash)
            .query(`
                UPDATE Usuarios
                SET PasswordHash = @hash
                WHERE IdUsuario = @idUsuario
            `);

        console.log('✅ Filas afectadas:', updateResult.rowsAffected[0]);

        // ===== 6. MARCAR TOKEN COMO USADO =====
        console.log('🔒 Marcando token como usado...');
        await pool.request()
            .input('idRecuperacion', sql.Int, rec.IdRecuperacion)
            .query(`
                UPDATE RecuperacionPassword
                SET Usado = 1
                WHERE IdRecuperacion = @idRecuperacion
            `);

        console.log('✅✅✅ CONTRASEÑA ACTUALIZADA EXITOSAMENTE ✅✅✅');

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌❌❌ ERROR AL RESTABLECER:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer contraseña',
            error: error.message
        });
    }
});


// ============================================
// RUTA: Eliminar cuenta
// DELETE /api/usuarios/:id
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const checkUser = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT IdUsuario FROM Usuarios WHERE IdUsuario = @id');

        if (checkUser.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Reservas WHERE IdUsuario = @id');

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Usuarios WHERE IdUsuario = @id');

        res.json({
            success: true,
            message: 'Cuenta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
});

module.exports = router;
