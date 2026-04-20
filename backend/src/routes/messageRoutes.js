const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// ROUTES PROTÉGÉES
// ============================================================

// Envoyer un message
router.post('/send', authenticateToken, messageController.sendMessage);

// Récupérer une conversation avec un visiteur
router.get('/conversation/visitor', authenticateToken, messageController.getConversation);

// Récupérer une conversation spécifique avec un utilisateur
router.get('/conversation/:userId', authenticateToken, messageController.getConversation);

// Récupérer toutes les conversations de l'utilisateur
router.get('/conversations', authenticateToken, messageController.getConversations);

// Marquer un message comme lu
router.patch('/:messageId/read', authenticateToken, messageController.markAsRead);

module.exports = router;
