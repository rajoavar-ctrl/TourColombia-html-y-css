const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

router.post('/', async (req, res) => {
    console.log('📥 Solicitud de reserva recibida:', req.body);
    
    try {
        const { idUsuario, cantidadBoletos, idTransporte, idDestino, idLugar } = req.body;

        if (!idUsuario || !cantidadBoletos || !idTransporte || !idDestino || !idLugar) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }

        const pool = await getConnection();

        const result = await pool.request()
            .input('idUsuario', sql.Int, idUsuario)
            .input('cantidadBoletos', sql.Int, cantidadBoletos)
            .input('idTransporte', sql.Int, idTransporte)
            .input('idDestino', sql.Int, idDestino)
            .input('idLugar', sql.Int, idLugar)
            .query(`
                INSERT INTO Reservas (IdUsuario, CantidadBoletos, IdTransporte, IdDestino, IdLugar)
                OUTPUT INSERTED.IdReserva
                VALUES (@idUsuario, @cantidadBoletos, @idTransporte, @idDestino, @idLugar)
            `);

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente',
            data: { idReserva: result.recordset[0].IdReserva }
        });

    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la reserva',
            error: error.message
        });
    }
});

router.get('/opciones', async (req, res) => {
    try {
        const pool = await getConnection();

        const transportes = await pool.request().query('SELECT IdTransporte, Nombre FROM TransporteOpciones');
        const destinos = await pool.request().query('SELECT IdDestino, Nombre FROM Destinos');

        res.json({
            success: true,
            data: {
                transportes: transportes.recordset,
                destinos: destinos.recordset
            }
        });

    } catch (error) {
        console.error('Error al obtener opciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener opciones',
            error: error.message
        });
    }
});

router.get('/lugares/:idDestino', async (req, res) => {
    try {
        const { idDestino } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('idDestino', sql.Int, idDestino)
            .query('SELECT IdLugar, Nombre FROM Lugares WHERE IdDestino = @idDestino');

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener lugares:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener lugares',
            error: error.message
        });
    }
});

// NUEVA RUTA AGREGADA
router.get('/usuario/:idUsuario', async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('idUsuario', sql.Int, idUsuario)
            .query(`
                SELECT 
                    r.IdReserva,
                    r.CantidadBoletos,
                    t.Nombre AS Transporte,
                    d.Nombre AS Destino,
                    l.Nombre AS Lugar,
                    CONVERT(VARCHAR(19), r.FechaReserva, 120) AS FechaReserva,
                    r.Estado
                FROM Reservas r
                INNER JOIN TransporteOpciones t ON r.IdTransporte = t.IdTransporte
                INNER JOIN Destinos d ON r.IdDestino = d.IdDestino
                INNER JOIN Lugares l ON r.IdLugar = l.IdLugar
                WHERE r.IdUsuario = @idUsuario
                ORDER BY r.FechaReserva DESC
            `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservas',
            error: error.message
        });
    }
});


// Eliminar (cancelar) una reserva
router.delete('/:idReserva', async (req, res) => {
    try {
        const { idReserva } = req.params;
        const pool = await getConnection();

        // Verificar que la reserva existe
        const checkReserva = await pool.request()
            .input('idReserva', sql.Int, idReserva)
            .query('SELECT IdReserva FROM Reservas WHERE IdReserva = @idReserva');

        if (checkReserva.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Eliminar la reserva
        await pool.request()
            .input('idReserva', sql.Int, idReserva)
            .query('DELETE FROM Reservas WHERE IdReserva = @idReserva');

        res.json({
            success: true,
            message: 'Reserva eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la reserva',
            error: error.message
        });
    }
});

module.exports = router;