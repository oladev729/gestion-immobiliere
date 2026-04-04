const express = require('express');
const router = express.Router();
const visiteurController = require('../controllers/visiteurController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================================

// Demande d'inscription (visiteur)
router.post('/demande', visiteurController.demandeInscription);

// Valider une invitation (avant inscription)
router.get('/invitation/:token/valider', visiteurController.validerInvitation);

// Confirmer inscription après invitation
router.post('/invitation/confirmer', visiteurController.confirmerInscription);

// ============================================================
// ROUTES PROTÉGÉES (propriétaire/admin)
// ============================================================

// Voir toutes les demandes
router.get('/demandes', authenticateToken, visiteurController.getDemandes);

// Voir une demande spécifique
router.get('/demandes/:id', authenticateToken, visiteurController.getDemandes);

// Envoyer une invitation (propriétaire)
router.post('/demandes/:id_demande/inviter', authenticateToken, visiteurController.envoyerInvitation);

// Statistiques
router.get('/stats', authenticateToken, visiteurController.getStats);

module.exports = router;