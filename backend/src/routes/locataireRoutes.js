const express = require('express');
const router = express.Router();
const LocataireController = require('../controllers/locataireController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour les locataires (accessibles par les propriétaires)
router.get('/mes-locataires', authenticateToken, LocataireController.getMesLocataires);

module.exports = router;
