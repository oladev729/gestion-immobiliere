const express = require('express');
const router = express.Router();
const { initiatePayment, checkPaymentStatus, getPaymentHistory, getWidgetData } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour les paiements

// Initier un paiement (authentifié)
router.post('/initiate', authenticateToken, initiatePayment);

// Vérifier le statut d'un paiement (authentifié)
router.post('/status', authenticateToken, checkPaymentStatus);

// Obtenir l'historique des paiements (authentifié)
router.get('/history', authenticateToken, getPaymentHistory);

// Obtenir les données pour le widget CaurisPay (authentifié)
router.get('/widget', authenticateToken, getWidgetData);

module.exports = router;
