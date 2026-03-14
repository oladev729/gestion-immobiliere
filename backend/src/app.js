const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API fonctionnelle' });
});

// Importe la base de données
const db = require('./config/database');

// Route de test pour vérifier la connexion à la DB
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as time');
        res.json({ 
            message: 'Connexion DB réussie !', 
            time: result.rows[0].time 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur DB', error: error.message });
    }
});

//ROUTES D'AUTHENTIFICATION
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

//  ROUTES DES BIENS
const bienRoutes = require('./routes/bienRoutes');
app.use('/api/biens', bienRoutes);

//  ROUTES DES CONTRATS
const contratRoutes = require('./routes/contratRoutes');
app.use('/api/contrats', contratRoutes);

//  ROUTES DES PAIEMENTS
const paiementRoutes = require('./routes/paiementRoutes');
app.use('/api/paiements', paiementRoutes);

module.exports = app;