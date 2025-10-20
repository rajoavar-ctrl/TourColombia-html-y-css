const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    res.json({ success: true, message: 'Ruta de prueba funciona' });
});

module.exports = router;