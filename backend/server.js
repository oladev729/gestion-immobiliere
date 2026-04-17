const app = require('./src/app');
const path = require('path');
const express = require('express');

// Servir les fichiers uploadés (photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5999;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur DÉMARRÉ sur http://127.0.0.1:${PORT}`);
});