const express = require('express');
const router = express.Router();
const bienController = require('../controllers/bienController');
const { authenticateToken, authorize } = require('../middleware/auth');

// ============================================================
// ROUTES PUBLIQUES (accessibles sans authentification)
// ============================================================

// Liste des biens disponibles avec filtres
router.get('/disponibles', bienController.getBiensDisponibles);

// Recherche de biens
router.get('/search', bienController.searchBiens);

// ============================================================
// ROUTES PROTÉGÉES (nécessitent authentification)
// ============================================================

// Statistiques des biens
router.get('/stats', authenticateToken, bienController.getStats);

// Mes biens (propriétaire connecté)
router.get('/mes-biens', authenticateToken, bienController.getMyBiens);

// Créer un bien (propriétaire uniquement)
router.post('/', 
    authenticateToken, 
    authorize('proprietaire'), 
    bienController.create
);

// Modifier un bien
router.put('/:id', 
    authenticateToken, 
    bienController.update
);

// Changer le statut d'un bien
router.patch('/:id/statut', 
    authenticateToken, 
    bienController.changeStatut
);

// Supprimer un bien
router.delete('/:id', 
    authenticateToken, 
    bienController.delete
);

// ============================================================
// ROUTES POUR LES PHOTOS DES BIENS
// ============================================================

// Ajouter des photos à un bien
router.post('/:id/photos', 
    authenticateToken, 
    bienController.addPhotos
);

// Récupérer les photos d'un bien
router.get('/:id/photos', 
    authenticateToken, 
    bienController.getPhotos
);

// ============================================================
// ROUTE DYNAMIQUE À METTRE TOUJOURS EN DERNIER
// ============================================================

// Détail d'un bien (par ID)
router.get('/:id', bienController.getBienById);

module.exports = router;