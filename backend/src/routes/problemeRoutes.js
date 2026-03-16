const express = require('express');
const router = express.Router();
const problemeController = require('../controllers/problemeController');
const { authenticateToken } = require('../middleware/auth');

// ============================================================
// ROUTES SPÉCIFIQUES (à mettre AVANT les routes avec :id)
// ============================================================
router.get('/stats', authenticateToken, problemeController.getStats);
router.get('/mes-problemes', authenticateToken, problemeController.getMesProblemes);
router.get('/problemes-recus', authenticateToken, problemeController.getProblemesRecus);
router.get('/statut/:statut', authenticateToken, problemeController.getProblemesByStatut);
router.get('/bien/:id_bien', authenticateToken, problemeController.getProblemesByBien);

// ============================================================
// ROUTES AVEC PARAMÈTRE :id (à mettre EN DERNIER)
// ============================================================
router.post('/', authenticateToken, problemeController.create);
router.get('/:id', authenticateToken, problemeController.getProblemeById);
router.patch('/:id/statut', authenticateToken, problemeController.updateStatut);

module.exports = router;