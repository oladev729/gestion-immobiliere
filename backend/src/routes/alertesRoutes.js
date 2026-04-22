const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Middleware pour vérifier l'authentification
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Accès non autorisé' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Récupérer toutes les alertes du propriétaire
router.get('/mes-alertes', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT a.*, b.titre as bien_titre
      FROM alertes a
      LEFT JOIN biens b ON a.id_bien = b.id_bien
      WHERE a.id_proprietaire = $1
      ORDER BY a.date_echeance ASC, a.priorite DESC
    `;
    
    const result = await db.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle alerte
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite } = req.body;
    
    const query = `
      INSERT INTO alertes (id_proprietaire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')
      RETURNING *
    `;
    
    const values = [req.user.id, type_alerte, titre, description, date_echeance, priorite, id_bien || null, periodicite];
    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer une alerte comme traitée
router.patch('/:id/marquer-traitee', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'alerte appartient au propriétaire
    const checkQuery = `
      SELECT id FROM alertes 
      WHERE id_alerte = $1 AND id_proprietaire = $2
    `;
    
    const checkResult = await db.query(checkQuery, [id, req.user.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    const updateQuery = `
      UPDATE alertes 
      SET statut = 'traitee', date_traitement = NOW()
      WHERE id_alerte = $1
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors du traitement de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une alerte
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'alerte appartient au propriétaire
    const checkQuery = `
      SELECT id FROM alertes 
      WHERE id_alerte = $1 AND id_proprietaire = $2
    `;
    
    const checkResult = await db.query(checkQuery, [id, req.user.id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    const deleteQuery = `
      DELETE FROM alertes 
      WHERE id_alerte = $1
    `;
    
    await db.query(deleteQuery, [id]);
    res.json({ message: 'Alerte supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'alerte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les alertes urgentes
router.get('/urgentes', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT a.*, b.titre as bien_titre
      FROM alertes a
      LEFT JOIN biens b ON a.id_bien = b.id_bien
      WHERE a.id_proprietaire = $1 
        AND a.statut = 'en_attente'
        AND (a.priorite = 'urgente' OR a.date_echeance <= NOW() + INTERVAL '7 days')
      ORDER BY a.date_echeance ASC
    `;
    
    const result = await db.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes urgentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer des alertes fiscales automatiques
router.post('/auto-fiscales', authMiddleware, async (req, res) => {
  try {
    // Récupérer tous les biens du propriétaire
    const biensQuery = `
      SELECT * FROM biens 
      WHERE id_proprietaire = $1
    `;
    
    const biensResult = await db.query(biensQuery, [req.user.id]);
    const biens = biensResult.rows;
    
    const alertesCreees = [];
    const currentYear = new Date().getFullYear();
    
    for (const bien of biens) {
      // Alerte impôt foncier (décembre)
      const dateImpotFoncier = `${currentYear}-12-31`;
      const impotQuery = `
        INSERT INTO alertes (id_proprietaire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')
        ON CONFLICT (id_proprietaire, id_bien, type_alerte, date_echeance) DO NOTHING
        RETURNING *
      `;
      
      const impotValues = [
        req.user.id, 
        'fiscale', 
        `Impôt foncier - ${bien.titre}`,
        `Déclaration annuelle de l'impôt foncier pour le bien: ${bien.titre}`,
        dateImpotFoncier,
        'haute',
        bien.id_bien,
        'annuelle'
      ];
      
      const impotResult = await db.query(impotQuery, impotValues);
      if (impotResult.rows.length > 0) {
        alertesCreees.push(impotResult.rows[0]);
      }
      
      // Alerte taxe d'habitation (janvier)
      const dateTaxeHabitation = `${currentYear + 1}-01-31`;
      const taxeQuery = `
        INSERT INTO alertes (id_proprietaire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')
        ON CONFLICT (id_proprietaire, id_bien, type_alerte, date_echeance) DO NOTHING
        RETURNING *
      `;
      
      const taxeValues = [
        req.user.id,
        'fiscale',
        `Taxe d'habitation - ${bien.titre}`,
        `Déclaration annuelle de la taxe d'habitation pour le bien: ${bien.titre}`,
        dateTaxeHabitation,
        'moyenne',
        bien.id_bien,
        'annuelle'
      ];
      
      const taxeResult = await db.query(taxeQuery, taxeValues);
      if (taxeResult.rows.length > 0) {
        alertesCreees.push(taxeResult.rows[0]);
      }
    }
    
    res.status(201).json({
      message: 'Alertes fiscales créées avec succès',
      alertes: alertesCreees
    });
  } catch (error) {
    console.error('Erreur lors de la création des alertes fiscales automatiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer des alertes de maintenance automatiques
router.post('/auto-maintenance', authMiddleware, async (req, res) => {
  try {
    // Récupérer tous les contrats actifs
    const contratsQuery = `
      SELECT c.*, b.titre as bien_titre, b.id_bien
      FROM contrats c
      JOIN biens b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 AND c.date_fin > NOW()
    `;
    
    const contratsResult = await db.query(contratsQuery, [req.user.id]);
    const contrats = contratsResult.rows;
    
    const alertesCreees = [];
    
    for (const contrat of contrats) {
      const currentDate = new Date();
      const contractStart = new Date(contrat.date_debut);
      const monthsDiff = (currentDate - contractStart) / (1000 * 60 * 60 * 24 * 30);
      
      // Alerte maintenance annuelle (après 1 an)
      if (monthsDiff >= 12) {
        const lastMaintenanceDate = new Date(contractStart);
        lastMaintenanceDate.setFullYear(lastMaintenanceDate.getFullYear() + 1);
        
        if (currentDate >= lastMaintenanceDate) {
          const nextMaintenanceDate = new Date(lastMaintenanceDate);
          nextMaintenanceDate.setFullYear(nextMaintenanceDate.getFullYear() + 1);
          
          const maintenanceQuery = `
            INSERT INTO alertes (id_proprietaire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')
            ON CONFLICT (id_proprietaire, id_bien, type_alerte, date_echeance) DO NOTHING
            RETURNING *
          `;
          
          const maintenanceValues = [
            req.user.id,
            'maintenance',
            `Maintenance annuelle - ${contrat.bien_titre}`,
            `Inspection et maintenance annuelle requise pour le bien: ${contrat.bien_titre}`,
            nextMaintenanceDate.toISOString().split('T')[0],
            'moyenne',
            contrat.id_bien,
            'annuelle'
          ];
          
          const maintenanceResult = await db.query(maintenanceQuery, maintenanceValues);
          if (maintenanceResult.rows.length > 0) {
            alertesCreees.push(maintenanceResult.rows[0]);
          }
        }
      }
      
      // Alerte révision chaudière (annuelle)
      const revisionDate = new Date(contractStart);
      revisionDate.setMonth(revisionDate.getMonth() + 12);
      
      const revisionQuery = `
        INSERT INTO alertes (id_proprietaire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')
        ON CONFLICT (id_proprietaire, id_bien, type_alerte, date_echeance) DO NOTHING
        RETURNING *
      `;
      
      const revisionValues = [
        req.user.id,
        'maintenance',
        `Révision chaudière - ${contrat.bien_titre}`,
        `Contrôle annuel de la chaudière obligatoire pour le bien: ${contrat.bien_titre}`,
        revisionDate.toISOString().split('T')[0],
        'haute',
        contrat.id_bien,
        'annuelle'
      ];
      
      const revisionResult = await db.query(revisionQuery, revisionValues);
      if (revisionResult.rows.length > 0) {
        alertesCreees.push(revisionResult.rows[0]);
      }
    }
    
    res.status(201).json({
      message: 'Alertes de maintenance créées avec succès',
      alertes: alertesCreees
    });
  } catch (error) {
    console.error('Erreur lors de la création des alertes de maintenance automatiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
