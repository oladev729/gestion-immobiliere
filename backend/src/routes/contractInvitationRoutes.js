const express = require('express');
const router = express.Router();
const ContractInvitationController = require('../controllers/ContractInvitationController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour les invitations de contrat
router.post('/invite-locataire', authenticateToken, ContractInvitationController.createInvitation);
router.get('/invitation/:token', ContractInvitationController.getInvitationByToken);
router.post('/accept/:token', ContractInvitationController.acceptInvitation);
router.post('/reject/:token', ContractInvitationController.rejectInvitation);

module.exports = router;
