const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Récupérer les alertes selon le type d'utilisateur
router.get('/mes-alertes', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Récupération des alertes - DÉBUT');
    console.log('👤 ID utilisateur:', req.user.id);
    console.log('👤 Type utilisateur:', req.user.type);
    
    let query;
    let params;
    
    if (req.user.type === 'proprietaire') {
      // Propriétaire : voit les signalements reçus des locataires + ses communications envoyées
      console.log('🏠 Récupération des alertes pour le propriétaire');
      
      // D'abord, trouver l'ID du propriétaire à partir de l'ID utilisateur
      const proprietaireInfo = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
      
      if (proprietaireInfo.rows.length === 0) {
        console.log('❌ Aucun propriétaire trouvé pour cet utilisateur');
        return res.json([]);
      }
      
      const id_proprietaire_actuel = proprietaireInfo.rows[0].id_proprietaire;
      console.log('🔍 ID propriétaire pour les alertes:', id_proprietaire_actuel);
      
      // Correction automatique : mettre à jour les anciennes alertes avec le mauvais ID
      const oldAlerts = await db.query('SELECT id_alerte FROM alertes WHERE id_proprietaire = $1 AND expediteur_type = $2', [req.user.id, 'locataire']);
      if (oldAlerts.rows.length > 0) {
        console.log('🔧 Correction des anciennes alertes de signalement...');
        const updatePromises = oldAlerts.rows.map(alerte => 
          db.query('UPDATE alertes SET id_proprietaire = $1 WHERE id_alerte = $2', [id_proprietaire_actuel, alerte.id_alerte])
        );
        await Promise.all(updatePromises);
        console.log(`✅ ${oldAlerts.rows.length} alertes de signalement mises à jour vers le propriétaire ${id_proprietaire_actuel}`);
      }
      
      query = `
        SELECT a.*, b.titre as bien_titre, 
               u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms
        FROM alertes a
        LEFT JOIN bien b ON a.id_bien = b.id_bien
        LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
        LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
        WHERE a.id_proprietaire = $1
        ORDER BY a.date_creation DESC, a.priorite DESC
      `;
      params = [id_proprietaire_actuel];
    } else if (req.user.type === 'locataire') {
      // Locataire : voit les communications du propriétaire (fiscales)
      console.log('🏠 Récupération des alertes pour le locataire');
      query = `
        SELECT a.*, b.titre as bien_titre, u.nom as proprietaire_nom, u.prenoms as proprietaire_prenoms
        FROM alertes a
        LEFT JOIN bien b ON a.id_bien = b.id_bien
        LEFT JOIN utilisateur u ON a.id_proprietaire = u.id_utilisateur
        LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
        WHERE l.id_utilisateur = $1 AND a.destinataire_type = 'locataire'
        ORDER BY a.date_creation DESC, a.priorite DESC
      `;
      params = [req.user.id];
    } else {
      return res.status(403).json({ 
        message: 'Type d\'utilisateur non autorisé' 
      });
    }
    
    const result = await db.query(query, params);
    console.log('📥 Alertes trouvées:', result.rows.length);
    console.log('📋 Détails des alertes:');
    result.rows.forEach((alerte, index) => {
      console.log(`  Alerte ${index + 1}:`, {
        id_alerte: alerte.id_alerte,
        titre: alerte.titre,
        type_alerte: alerte.type_alerte,
        expediteur_type: alerte.expediteur_type,
        destinataire_type: alerte.destinataire_type,
        locataire_nom: alerte.locataire_nom
      });
    });
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle alerte selon le type d'utilisateur
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 ROUTE POST APPELÉE');
    console.log('🚀 Création d\'une nouvelle alerte');
    console.log('👤 ID utilisateur:', req.user?.id);
    console.log('👤 Type utilisateur:', req.user?.type);
    console.log('📝 Données reçues:', req.body);
    
    const { type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, id_locataire } = req.body;
    
    console.log('🔍 Validation des données requises:');
    console.log('  - type_alerte:', type_alerte);
    console.log('  - titre:', titre);
    console.log('  - description:', description);
    console.log('  - id_bien:', id_bien);
    
    let id_proprietaire;
    let id_locataire_final;
    let expediteur_type;
    let destinataire_type;
    
    if (req.user.type === 'proprietaire') {
      // Propriétaire : envoie une alerte fiscale à un locataire
      console.log('🏠 Création d\'alerte fiscale par le propriétaire');
      
      if (!id_locataire) {
        return res.status(400).json({ 
          message: 'ID du locataire requis pour créer une alerte fiscale' 
        });
      }
      
      // D'abord, trouver l'ID du propriétaire à partir de l'ID utilisateur
      const proprietaireInfo = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
      
      if (proprietaireInfo.rows.length === 0) {
        return res.status(400).json({ 
          message: 'Vous n\'êtes pas enregistré comme propriétaire' 
        });
      }
      
      const id_proprietaire_actuel = proprietaireInfo.rows[0].id_proprietaire;
      console.log('🔍 ID propriétaire actuel:', id_proprietaire_actuel);
      
      // Vérifier que le locataire existe et est bien locataire d'un bien du propriétaire
      const locataireQuery = `
        SELECT l.id_locataire, l.id_utilisateur, b.titre as bien_titre, b.id_bien
        FROM locataire l
        JOIN locataire_bien lb ON l.id_locataire = lb.id_locataire
        JOIN bien b ON lb.id_bien = b.id_bien
        WHERE l.id_locataire = $1 AND b.id_proprietaire = $2
      `;
      
      const locataireResult = await db.query(locataireQuery, [id_locataire, id_proprietaire_actuel]);
      
      if (locataireResult.rows.length === 0) {
        return res.status(400).json({ 
          message: 'Le locataire spécifié n\'existe pas ou n\'est pas locataire de vos biens' 
        });
      }
      
      id_proprietaire = id_proprietaire_actuel;
      id_locataire_final = id_locataire;
      expediteur_type = 'proprietaire';
      destinataire_type = 'locataire';
      
    } else if (req.user.type === 'locataire') {
      // Locataire : signale un problème de maintenance
      console.log('🏠 Création de signalement maintenance par le locataire');
      
      const proprietaireQuery = `
        SELECT b.id_proprietaire, l.id_locataire, l.id_utilisateur
        FROM bien b
        JOIN contact c ON c.id_bien = b.id_bien AND c.statut_contrat = 'actif'
        JOIN locataire l ON l.id_locataire = c.id_locataire
        WHERE b.id_bien = $1 AND l.id_utilisateur = $2
      `;
      
      const proprietaireResult = await db.query(proprietaireQuery, [id_bien, req.user.id]);
      
      if (proprietaireResult.rows.length === 0) {
        return res.status(400).json({ 
          message: 'Bien non trouvé ou vous n\'êtes pas locataire de ce bien' 
        });
      }
      
      const bien = proprietaireResult.rows[0];
      
      id_proprietaire = bien.id_proprietaire;
      id_locataire_final = req.user.id;
      expediteur_type = 'locataire';
      destinataire_type = 'proprietaire';
      
    } else {
      return res.status(403).json({ 
        message: 'Type d\'utilisateur non autorisé' 
      });
    }
    
    console.log('🔍 Validation des données:');
    console.log('  - type_alerte:', type_alerte);
    console.log('  - titre:', titre);
    console.log('  - description:', description);
    console.log('  - date_echeance:', date_echeance);
    console.log('  - priorite:', priorite);
    console.log('  - id_bien:', id_bien);
    console.log('  - periodicite:', periodicite);
    console.log('  - id_proprietaire:', id_proprietaire);
    console.log('  - id_locataire:', id_locataire_final);
    console.log('  - expediteur_type:', expediteur_type);
    console.log('  - destinataire_type:', destinataire_type);
    
    const query = `
      INSERT INTO alertes (id_proprietaire, id_locataire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut, expediteur_type, destinataire_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [id_proprietaire, id_locataire_final, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, 'en_attente', expediteur_type, destinataire_type];
    console.log('📋 Valeurs pour la requête:', values);
    
    console.log('🔨 Exécution de la requête...');
    console.log('📋 Dernière vérification avant insertion:');
    console.log('  - expediteur_type dans values:', values[10]);
    console.log('  - destinataire_type dans values:', values[11]);
    const result = await db.query(query, values);
    
    console.log('✅ Alerte créée avec succès:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ ERREUR DANS LA ROUTE POST:');
    console.error('❌ Message d\'erreur:', error.message);
    console.error('❌ Code d\'erreur:', error.code);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Détails complets:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// Marquer une alerte comme traitée
router.patch('/:id/marquer-traitee', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'alerte appartient au propriétaire
    const checkQuery = `
      SELECT id_alerte FROM alertes 
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
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'alerte appartient au propriétaire
    const checkQuery = `
      SELECT id_alerte FROM alertes 
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
router.get('/urgentes', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT a.*, b.titre as bien_titre
      FROM alertes a
      LEFT JOIN bien b ON a.id_bien = b.id_bien
      WHERE a.id_proprietaire = $1 
        AND a.statut = 'en_attente'
        AND (a.priorite = 'urgente' OR a.date_echeance <= NOW() + INTERVAL '7 days')
      ORDER BY a.date_echeance ASC
    `;
    
    const result = await db.query(query, [req.user.id]);
    console.log('📥 Résultat de la requête alertes:', result.rows.length);
    console.log('📋 Détails des alertes trouvées:');
    result.rows.forEach((alerte, index) => {
      console.log(`  Alerte ${index + 1}:`, {
        id_alerte: alerte.id_alerte,
        titre: alerte.titre,
        type_alerte: alerte.type_alerte,
        expediteur_type: alerte.expediteur_type,
        destinataire_type: alerte.destinataire_type,
        locataire_nom: alerte.locataire_nom
      });
    });
    
    console.log('🔍 Fin de la récupération des alertes');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes urgentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer des alertes fiscales automatiques
router.post('/auto-fiscales', authenticateToken, async (req, res) => {
  try {
    // Récupérer tous les biens du propriétaire
    const biensQuery = `
      SELECT * FROM bien 
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
router.post('/auto-maintenance', authenticateToken, async (req, res) => {
  try {
    // Récupérer tous les contrats actifs
    const contratsQuery = `
      SELECT c.*, b.titre as bien_titre, b.id_bien
      FROM contact c
      JOIN bien b ON c.id_bien = b.id_bien
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

// Supprimer une alerte
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🔥 ROUTE DELETE APPELÉE - ID:', req.params.id);
    console.log('🔥 ROUTE DELETE APPELÉE - User:', req.user?.id);
    
    console.log('🗑️ Suppression de l\'alerte:', req.params.id);
    console.log('👤 ID utilisateur:', req.user.id);
    console.log('👤 Type utilisateur:', req.user.type);

    const alerteId = req.params.id;

    // Vérifier que l'alerte existe et appartient à l'utilisateur
    const checkQuery = `
      SELECT * FROM alertes 
      WHERE id_alerte = $1 AND id_proprietaire = $2
    `;
    const checkResult = await db.query(checkQuery, [alerteId, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Alerte non trouvee ou non autorisee' 
      });
    }

    // Supprimer l'alerte
    const deleteQuery = 'DELETE FROM alertes WHERE id_alerte = $1';
    await db.query(deleteQuery, [alerteId]);

    console.log('✅ Alerte supprimée avec succès');
    res.json({ message: 'Alerte supprimée avec succès' });

  } catch (error) {
    console.error('❌ ERREUR DANS LA ROUTE DELETE:', error);
    console.error('❌ Détails de l\'erreur:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

module.exports = router;
