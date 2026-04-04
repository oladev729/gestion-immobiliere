const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// TOUTES LES ROUTES NÉCESSITENT UNE AUTHENTIFICATION
// ============================================================

// Voir toutes mes notifications
router.get('/', authenticateToken, notificationController.getMyNotifications);

// Voir mes notifications non lues
router.get('/non-lues', authenticateToken, notificationController.getNonLues);

// Compter mes notifications non lues
router.get('/count', authenticateToken, notificationController.countNonLues);

// Marquer une notification comme lue
router.patch('/:id/lire', authenticateToken, notificationController.markAsRead);

// Marquer toutes mes notifications comme lues
router.patch('/lire-tout', authenticateToken, notificationController.markAllAsRead);

// Supprimer une notification
router.delete('/:id', authenticateToken, notificationController.delete);

module.exports = router;