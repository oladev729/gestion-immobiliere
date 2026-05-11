const express = require('express');
const router = express.Router();
const AlertesAutomatiquesController = require('../controllers/alertesAutomatiquesController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================
router.use(authenticateToken);

// ============================================================
// DÉMARRER LE SERVICE D'ALERTES AUTOMATIQUES
// ============================================================
router.post('/demarrer', AlertesAutomatiquesController.demarrer);

// ============================================================
// ARRÊTER LE SERVICE D'ALERTES AUTOMATIQUES
// ============================================================
router.post('/arreter', AlertesAutomatiquesController.arreter);

// ============================================================
// EXÉCUTER MANUELLEMENT LA VÉRIFICATION
// ============================================================
router.post('/executer-manuellement', AlertesAutomatiquesController.executerManuellement);

// ============================================================
// MARQUER LES ALERTES COMME RÉSOLUES APRÈS PAIEMENT
// ============================================================
router.post('/marquer-resolues', AlertesAutomatiquesController.marquerAlertesResolues);

// ============================================================
// OBTENIR LES STATISTIQUES DES ALERTES AUTOMATIQUES
// ============================================================
router.get('/statistiques', AlertesAutomatiquesController.getStatistiques);

module.exports = router;
