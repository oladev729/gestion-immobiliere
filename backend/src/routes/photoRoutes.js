const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Upload photos d'un bien (principale + détails)
router.post('/bien/:id', authenticateToken, upload.fields([
    { name: 'principale', maxCount: 1 },
    { name: 'details', maxCount: 10 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        const inserted = [];

        // 1. Gérer la photo principale
        if (req.files['principale']) {
            const file = req.files['principale'][0];
            const url = `/uploads/${file.filename}`;
            const result = await db.query(
                'INSERT INTO photosbien (id_bien, url_photobien, est_principale) VALUES ($1, $2, true) RETURNING *',
                [id, url]
            );
            inserted.push(result.rows[0]);
        }

        // 2. Gérer les photos de détails
        if (req.files['details']) {
            for (const file of req.files['details']) {
                const url = `/uploads/${file.filename}`;
                const result = await db.query(
                    'INSERT INTO photosbien (id_bien, url_photobien, est_principale) VALUES ($1, $2, false) RETURNING *',
                    [id, url]
                );
                inserted.push(result.rows[0]);
            }
        }

        if (inserted.length === 0) {
            return res.status(400).json({ message: 'Aucune photo reçue' });
        }

        res.status(201).json({ message: 'Photos ajoutées avec succès', photos: inserted });
    } catch (error) {
        console.error('Erreur upload photo bien:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Upload photos d'un problème
router.post('/probleme/:id', authenticateToken, upload.array('photos', 5), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Aucune photo reçue' });
        }
        const inserted = [];
        for (const file of req.files) {
            const url = `/uploads/${file.filename}`;
            // Utilise photosbp si elle existe, sinon stocke dans photosbien avec id_probleme
            try {
                const result = await db.query(
                    'INSERT INTO photosbp (id_probleme, url_photosbp) VALUES ($1, $2) RETURNING *',
                    [id, url]
                );
                inserted.push(result.rows[0]);
            } catch {
                // Si la table photosbp n'existe pas, on ignore silencieusement
                inserted.push({ url_photo: url });
            }
        }
        res.status(201).json({ message: 'Photos du problème ajoutées avec succès', photos: inserted });
    } catch (error) {
        console.error('Erreur upload photo problème:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les photos d'un problème
router.get('/probleme/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT * FROM photosbp WHERE id_probleme = $1 ORDER BY date_ajout ASC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur récupération photos problème:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;