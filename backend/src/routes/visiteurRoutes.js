const express = require('express');

const router = express.Router();

const visiteurController = require('../controllers/visiteurController');

const { authenticateToken } = require('../middleware/auth');



// ============================================================

// ROUTES PUBLIQUES (sans authentification)

// ============================================================



// Demande d'inscription (visiteur)

router.post('/demande', visiteurController.demandeInscription);



// Demande de visite pour un bien spécifique (visiteur)

router.post('/demande-visite/:id_bien', visiteurController.demandeVisiteBien);



// Valider une invitation (avant inscription)

router.get('/invitation/:token/valider', visiteurController.validerInvitation);



// Confirmer inscription après invitation

router.post('/invitation/confirmer', visiteurController.confirmerInscription);



// Nouvelle route pour confirmation depuis email
router.get('/confirm/:token', visiteurController.confirmInvitation);

// Dashboard visiteur
router.get('/dashboard-data', visiteurController.getVisitorDashboardData);

// Messagerie visiteur
router.get('/messages/:demandeId', visiteurController.getVisitorMessages);
router.post('/messages/:demandeId', visiteurController.sendVisitorMessage);



// ============================================================

// ROUTES PROTÉGÉES (propriétaire/admin)

// ============================================================



// Voir toutes les demandes

router.get('/demandes', authenticateToken, visiteurController.getDemandes);



// Voir les demandes en attente (pour la page inviter visiteur)

router.get('/demandes-en-attente', authenticateToken, visiteurController.getDemandesEnAttente);



// Voir une demande spécifique

router.get('/demandes/:id', authenticateToken, visiteurController.getDemandes);



// Envoyer une invitation (propriétaire)

router.post('/demandes/:id_demande/inviter', authenticateToken, visiteurController.envoyerInvitation);



// Nouvelle route simplifiée pour inviter un visiteur

router.post('/inviter/:demandeId', authenticateToken, visiteurController.inviterVisiteur);



// Statistiques

router.get('/stats', authenticateToken, visiteurController.getStats);



module.exports = router;