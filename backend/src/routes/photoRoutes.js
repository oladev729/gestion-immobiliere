const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PhotosBP = require('../models/PhotosBP');

// ============================================================
// ROUTES POUR LES PHOTOS DES PROBLÈMES
// ============================================================

// Ajouter une photo à un problème
router.post('/probleme/:id_probleme', authenticateToken, async (req, res) => {
    try {
        const { url_photosbp, description } = req.body;
        
        if (!url_photosbp) {
            return res.status(400).json({ 
                message: 'L\'URL de la photo est requise' 
            });
        }

        const photo = await PhotosBP.add(req.params.id_probleme, url_photosbp, description);
        res.status(201).json({
            message: 'Photo ajoutée avec succès',
            photo
        });
    } catch (error) {
        console.error('Erreur ajout photo problème:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les photos d'un problème
router.get('/probleme/:id_probleme', authenticateToken, async (req, res) => {
    try {
        const photos = await PhotosBP.findByProbleme(req.params.id_probleme);
        res.json(photos);
    } catch (error) {
        console.error('Erreur récupération photos:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Supprimer une photo
router.delete('/:id_photosbp', authenticateToken, async (req, res) => {
    try {
        const result = await PhotosBP.delete(req.params.id_photosbp);
        if (!result) {
            return res.status(404).json({ message: 'Photo non trouvée' });
        }
        res.json({ message: 'Photo supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression photo:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Mettre à jour la description d'une photo
router.patch('/:id_photosbp', authenticateToken, async (req, res) => {
    try {
        const { description } = req.body;
        const photo = await PhotosBP.updateDescription(req.params.id_photosbp, description);
        if (!photo) {
            return res.status(404).json({ message: 'Photo non trouvée' });
        }
        res.json({
            message: 'Description mise à jour',
            photo
        });
    } catch (error) {
        console.error('Erreur mise à jour description:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;