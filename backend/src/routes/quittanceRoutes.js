const express = require('express');
const router = express.Router();
const quittanceController = require('../controllers/quittanceController');
const { authenticateToken, authorize } = require('../middleware/auth');

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================
router.use(authenticateToken);

// ============================================================
// GÉNÉRER UNE QUITTANCE AUTOMATIQUEMENT
// ============================================================
router.post('/generer', quittanceController.generateQuittance);

// ============================================================
// OBTENIR LES QUITTANCES DU LOCATAIRE
// ============================================================
router.get('/mes-quittances', authorize('locataire'), quittanceController.getQuittancesLocataire);

// ============================================================
// OBTENIR LES QUITTANCES DU PROPRIÉTAIRE
// ============================================================
router.get('/quittances-locataires', authorize('proprietaire'), quittanceController.getQuittancesProprietaire);

// ============================================================
// TÉLÉCHARGER UNE QUITTANCE EN PDF
// ============================================================
router.get('/:id_quittance/pdf', quittanceController.downloadQuittancePDF);

module.exports = router;
