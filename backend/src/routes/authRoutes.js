const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Routes protégées
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/switch-type', authenticateToken, authController.switchType);
router.post('/inviter-locataire', authenticateToken, authController.inviterLocataire);

// Route admin/stats (protégée aussi)
router.get('/connexions-stats', authenticateToken, authController.getConnexionsStats);

// Route publique pour confirmer invitation
router.post('/confirmer-invitation', authController.confirmerInvitation);

module.exports = router;