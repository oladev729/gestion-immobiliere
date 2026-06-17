const express = require('express');
const router = express.Router();
const ContractInvitationController = require('../controllers/ContractInvitationController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour les invitations de contrat
router.post('/invite-locataire', authenticateToken, ContractInvitationController.createInvitation);
router.post('/invite-contrat', authenticateToken, ContractInvitationController.createContractInvitation);
router.get('/invitation/:token', ContractInvitationController.getInvitationByToken);
router.post('/accept/:token', ContractInvitationController.acceptInvitation);
router.post('/reject/:token', ContractInvitationController.rejectInvitation);
router.get('/recues', authenticateToken, ContractInvitationController.getReceivedInvitations);

module.exports = router;
