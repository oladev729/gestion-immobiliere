const express = require('express');
const router = express.Router();
const DocumentController = require('../controllers/DocumentController');
const authMiddleware = require('../middleware/auth');

// Routes pour la génération de documents
router.post('/generate-contrat', authMiddleware, DocumentController.generateContrat);
router.post('/generate-receipt/:paymentId', authMiddleware, DocumentController.generateReceipt);

module.exports = router;
