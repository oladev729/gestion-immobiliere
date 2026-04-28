const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); 
const { authenticateToken } = require('../middleware/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/confirmer-invitation', authController.confirmerInvitation);

// Routes protégées
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/switch-type', authenticateToken, authController.switchType);
router.post('/inviter-locataire', authenticateToken, authController.inviterLocataire);
router.get('/connexions-stats', authenticateToken, authController.getConnexionsStats);
router.get('/locataires', authenticateToken, authController.getLocataires);

router.get('/debug-me', authenticateToken, (req, res) => {
    res.json({
        token_user: req.user,
        server_time: new Date().toISOString()
    });
});

module.exports = router;