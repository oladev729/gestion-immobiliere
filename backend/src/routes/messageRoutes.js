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

// Récupérer une conversation par demandeId
router.get('/conversation/demande/:demandeId', authenticateToken, messageController.getConversation);

// Récupérer toutes les conversations de l'utilisateur
router.get('/conversations', authenticateToken, messageController.getConversations);

// Marquer un message comme lu
router.patch('/:messageId/read', authenticateToken, messageController.markAsRead);

// Diagnostic des messages entre Ayath et Nazifath
router.get('/diagnostic/ayath-nazifath', messageController.diagnosticMessagesAyathNazifath);

// Diagnostic des conversations du propriétaire
router.get('/diagnostic/proprietaire-conversations', messageController.diagnosticConversationsProprietaire);

// Diagnostic direct pour le propriétaire
router.get('/diagnostic/direct-proprietaire', messageController.diagnosticDirectProprietaire);

module.exports = router;
