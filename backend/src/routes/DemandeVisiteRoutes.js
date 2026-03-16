const express = require('express');
const router = express.Router();
const demandeVisiteController = require('../controllers/demandeVisiteController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// ROUTES PROTÉGÉES
// ============================================================

// Créer une demande de visite (locataire)
router.post('/', authenticateToken, demandeVisiteController.create);

// Voir mes demandes (locataire connecté)
router.get('/mes-demandes', authenticateToken, demandeVisiteController.getMesDemandes);

// Voir les demandes reçues (propriétaire connecté)
router.get('/demandes-recues', authenticateToken, demandeVisiteController.getDemandesRecues);

// Voir les demandes en attente
router.get('/en-attente', authenticateToken, demandeVisiteController.getDemandesEnAttente);

// Statistiques des demandes
router.get('/stats', authenticateToken, demandeVisiteController.getStats);

// Accepter une demande (propriétaire)
router.patch('/:id/accepter', authenticateToken, demandeVisiteController.accepter);

// Refuser une demande (propriétaire)
router.patch('/:id/refuser', authenticateToken, demandeVisiteController.refuser);

// Annuler une demande (locataire)
router.patch('/:id/annuler', authenticateToken, demandeVisiteController.annuler);

module.exports = router;