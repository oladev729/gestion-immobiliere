const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Route pour inviter un locataire à un contrat (utilisée par le frontend)
router.post('/inviter-pour-contrat', authenticateToken, authController.inviterLocataire);

module.exports = router;
