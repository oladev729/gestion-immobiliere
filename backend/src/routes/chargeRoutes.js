const express = require('express');
const router = express.Router();
const chargeController = require('../controllers/chargeController');
const { authenticateToken, authorize } = require('../middleware/auth');

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================
router.use(authenticateToken);

// ============================================================
// CRÉER UNE CHARGE (PROPRIÉTAIRE)
// ============================================================
router.post('/', authorize('proprietaire'), chargeController.create);

// ============================================================
// OBTENIR LES CHARGES DU PROPRIÉTAIRE
// ============================================================
router.get('/mes-charges', authorize('proprietaire'), chargeController.getChargesProprietaire);

// ============================================================
// OBTENIR LES CHARGES DU LOCATAIRE
// ============================================================
router.get('/mes-charges', authorize('locataire'), chargeController.getChargesLocataire);

// ============================================================
// METTRE À JOUR LE STATUT D'UNE CHARGE
// ============================================================
router.put('/:id_charge/statut', chargeController.updateStatut);

// ============================================================
// SUPPRIMER UNE CHARGE
// ============================================================
router.delete('/:id_charge', chargeController.delete);

// ============================================================
// OBTENIR LE SOLDE DU LOCATAIRE
// ============================================================
router.get('/solde', authorize('locataire'), chargeController.getSoldeLocataire);

module.exports = router;
