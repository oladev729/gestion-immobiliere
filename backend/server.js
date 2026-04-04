const app = require('./src/app');
const path = require('path');
const express = require('express');

// Servir les fichiers uploadés (photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});