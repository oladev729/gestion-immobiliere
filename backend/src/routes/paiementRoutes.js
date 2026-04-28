const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// ROUTES EXISTANTES
// ============================================================

// Paiement d'un loyer
router.post('/loyer', authenticateToken, paiementController.payerLoyer);

// Paiement d'un dépôt de garantie
router.post('/depot', authenticateToken, paiementController.payerDepot);

// Générer les échéances d'un contrat
router.post('/contrat/:id_contact/echeances', authenticateToken, paiementController.genererEcheances);

// Récupérer les paiements d'un contrat
router.get('/contrat/:id_contact', authenticateToken, paiementController.getPaiementsByContrat);

// Récupérer les loyers d'un contrat
router.get('/contrat/:id_contact/loyers', authenticateToken, paiementController.getLoyersByContrat);

// Récupérer mes paiements (locataire connecté)
router.get('/mes-paiements', authenticateToken, paiementController.getMesPaiements);

// Récupérer mes charges (locataire connecté)
router.get('/mes-charges', authenticateToken, paiementController.mesCharges);

// Récupérer mes notifications (locataire connecté)
router.get('/mes-notifications', authenticateToken, paiementController.mesNotifications);

// Récupérer les impayés
router.get('/impayes', authenticateToken, paiementController.getImpayes);

// Statistiques des paiements
router.get('/stats', authenticateToken, paiementController.getStats);

// ============================================================
// ROUTES CAURISPAY
// ============================================================

// Initier un paiement CaurisPay (locataire)
router.post('/caurispay/initier', authenticateToken, paiementController.initierCaurisPay);

// Vérifier statut paiement CaurisPay
router.post('/caurispay/statut', authenticateToken, paiementController.checkCaurisPayStatus);

// Obtenir les données du widget CaurisPay
router.get('/caurispay/widget', authenticateToken, paiementController.getCaurisPayWidgetData);

// Paiements reçus par le propriétaire
router.get('/recus', authenticateToken, paiementController.paiementsRecus);

module.exports = router;