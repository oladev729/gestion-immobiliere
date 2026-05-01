const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Routes pour les paiements

// Initier un paiement (authentifié)
router.post('/initiate', auth, paymentController.initiatePayment);

// Vérifier le statut d'un paiement (authentifié)
router.post('/status', auth, paymentController.checkPaymentStatus);

// Obtenir l'historique des paiements (authentifié)
router.get('/history', auth, paymentController.getPaymentHistory);

// Obtenir les données pour le widget CaurisPay (authentifié)
router.get('/widget', auth, paymentController.getWidgetData);

module.exports = router;
