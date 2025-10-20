const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function getConnection() {
    try {
        if (pool) {
            return pool;
        }
        pool = await sql.connect(config);
        console.log('✅ Conexión a SQL Server establecida');
        return pool;
    } catch (err) {
        console.error('❌ Error al conectar a SQL Server:', err.message);
        throw err;
    }
}

async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('🔌 Conexión cerrada');
        }
    } catch (err) {
        console.error('Error al cerrar conexión:', err.message);
    }
}

module.exports = {
    getConnection,
    closeConnection,
    sql
};