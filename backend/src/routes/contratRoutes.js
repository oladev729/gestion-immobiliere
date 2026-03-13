const express = require('express');
const router = express.Router();
const contratController = require('../controllers/contratController');
const { authenticateToken, authorize } = require('../middleware/auth');

// ============================================================
// ROUTES PUBLIQUES
// ============================================================
// Aucune route publique pour les contrats

// ============================================================
// ROUTES PROTÉGÉES
// ============================================================

// Statistiques des contrats
router.get('/stats', authenticateToken, contratController.getStats);

// Contrats actifs
router.get('/actifs', authenticateToken, contratController.getContratsActifs);

// Contrats expirant bientôt
router.get('/expirants', authenticateToken, contratController.getContratsExpirants);

// Mes contrats (propriétaire)
router.get('/mes-contrats', authenticateToken, contratController.getMyContrats);

// Mes contrats (locataire)
router.get('/mes-contrats-locataire', authenticateToken, contratController.getMyContratsLocataire);

// Créer un contrat (propriétaire uniquement)
router.post('/', 
    authenticateToken, 
    authorize('proprietaire'), 
    contratController.create
);

// Détail d'un contrat
router.get('/:id', authenticateToken, contratController.getContratById);

// Modifier un contrat
router.put('/:id', authenticateToken, contratController.update);

// Terminer un contrat
router.patch('/:id/terminer', authenticateToken, contratController.terminer);

// Résilier un contrat
router.patch('/:id/resilier', authenticateToken, contratController.resilier);

module.exports = router;