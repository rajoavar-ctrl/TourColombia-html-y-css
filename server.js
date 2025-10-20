require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection, closeConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static('public'));

// Rutas de la API USUARIOS
const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

// Rutas de la API RESERVAS

const reservasRoutes = require('./routes/reservas');
app.use('/api/reservas', reservasRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'registrate.html'));
});

// Ruta de salud de la API
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
async function startServer() {
    try {
        await getConnection();
        
        app.listen(PORT, () => {
            console.log('===========================================');
            console.log('🚀 Servidor TourColombia');
            console.log('===========================================');
            console.log(`🌍 Servidor: http://localhost:${PORT}`);
            console.log(`📝 Registro: http://localhost:${PORT}/registrate.html`);
            console.log(`🔐 Login: http://localhost:${PORT}/iniciasession.html`);
            console.log(`🔌 API Health: http://localhost:${PORT}/api/health`);
            console.log('===========================================');
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error.message);
        process.exit(1);
    }
}

// Manejo de cierre
process.on('SIGINT', async () => {
    console.log('\n🔌 Cerrando servidor...');
    await closeConnection();
    process.exit(0);
});

startServer();

