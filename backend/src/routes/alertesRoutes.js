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
        SELECT a.*, b.titre as bien_titre, b.adresse as bien_adresse,
               COALESCE(u_loc.nom, u_loc_fallback.nom) as locataire_nom, 
               COALESCE(u_loc.prenoms, u_loc_fallback.prenoms) as locataire_prenoms, 
               COALESCE(u_loc.email, u_loc_fallback.email) as locataire_email
        FROM alertes a
        LEFT JOIN bien b ON a.id_bien = b.id_bien
        LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
        LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
        LEFT JOIN utilisateur u_loc_fallback ON a.id_locataire = u_loc_fallback.id_utilisateur
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
        locataire_nom: alerte.locataire_nom,
        locataire_prenoms: alerte.locataire_prenoms,
        locataire_email: alerte.locataire_email,
        bien_titre: alerte.bien_titre,
        bien_adresse: alerte.bien_adresse
      });
    });
    
    // Diagnostic supplémentaire pour les signalements
    if (req.user.type === 'proprietaire') {
      const signalements = result.rows.filter(a => a.expediteur_type === 'locataire');
      console.log('\n🚨 DIAGNOSTIC SIGNALEMENTS:');
      console.log(`  - Total alertes: ${result.rows.length}`);
      console.log(`  - Signalements (expediteur_type='locataire'): ${signalements.length}`);
      signalements.forEach((s, i) => {
        console.log(`    ${i+1}. ${s.titre} - ${s.type_alerte} - ${s.expediteur_type}`);
      });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle alerte selon le type d'utilisateur
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, id_locataire } = req.body;

    // ── Sanitisation : convertir les chaînes vides en null pour les champs entiers ──
    const id_bien_clean     = id_bien     && String(id_bien).trim()     !== '' ? parseInt(id_bien)     : null;
    const id_locataire_clean= id_locataire&& String(id_locataire).trim()!== '' ? parseInt(id_locataire): null;

    let id_proprietaire;
    let id_locataire_final;
    let expediteur_type;
    let destinataire_type;

    if (req.user.type === 'proprietaire') {
      if (!id_locataire_clean) {
        return res.status(400).json({ message: 'Veuillez sélectionner un locataire destinataire.' });
      }

      // Récupérer l'id_proprietaire réel
      const propInfo = await db.query(
        'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
        [req.user.id]
      );
      if (propInfo.rows.length === 0) {
        return res.status(400).json({ message: 'Vous n\'êtes pas enregistré comme propriétaire' });
      }
      const id_proprietaire_actuel = propInfo.rows[0].id_proprietaire;

      // Vérifier que le locataire est bien locataire d'un bien de ce propriétaire (via contrats actifs)
      const locataireCheck = await db.query(`
        SELECT l.id_locataire, l.id_utilisateur, b.titre as bien_titre, b.id_bien
        FROM locataire l
        JOIN contact c ON c.id_locataire = l.id_locataire AND c.statut_contrat = 'actif'
        JOIN bien b ON c.id_bien = b.id_bien
        WHERE l.id_locataire = $1 AND b.id_proprietaire = $2
        LIMIT 1
      `, [id_locataire_clean, id_proprietaire_actuel]);

      if (locataireCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Ce locataire n\'est pas locataire d\'un de vos biens' });
      }

      id_proprietaire   = id_proprietaire_actuel;
      id_locataire_final= id_locataire_clean;
      expediteur_type   = 'proprietaire';
      destinataire_type = 'locataire';

    } else if (req.user.type === 'locataire') {
      if (!id_bien_clean) {
        return res.status(400).json({ message: 'Veuillez spécifier le bien concerné.' });
      }

      const proprietaireResult = await db.query(`
        SELECT b.id_proprietaire, l.id_locataire
        FROM bien b
        JOIN contact c ON c.id_bien = b.id_bien AND c.statut_contrat = 'actif'
        JOIN locataire l ON l.id_locataire = c.id_locataire
        WHERE b.id_bien = $1 AND l.id_utilisateur = $2
        LIMIT 1
      `, [id_bien_clean, req.user.id]);

      if (proprietaireResult.rows.length === 0) {
        return res.status(400).json({ message: 'Bien non trouvé ou vous n\'êtes pas locataire de ce bien' });
      }

      const bien = proprietaireResult.rows[0];
      id_proprietaire   = bien.id_proprietaire;
      id_locataire_final= bien.id_locataire;
      expediteur_type   = 'locataire';
      destinataire_type = 'proprietaire';

    } else {
      return res.status(403).json({ message: 'Type d\'utilisateur non autorisé' });
    }

    const result = await db.query(`
      INSERT INTO alertes
        (id_proprietaire, id_locataire, type_alerte, titre, description, date_echeance, priorite, id_bien, periodicite, statut, expediteur_type, destinataire_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'en_attente', $10, $11)
      RETURNING *
    `, [
      id_proprietaire,
      id_locataire_final,
      type_alerte || 'fiscale',
      titre,
      description,
      date_echeance || null,
      priorite || 'moyenne',
      id_bien_clean,
      periodicite || 'ponctuelle',
      expediteur_type,
      destinataire_type
    ]);

    console.log('✅ Alerte créée avec succès:', result.rows[0]?.id_alerte);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('❌ ERREUR POST /alertes:', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }

});

// Marquer une alerte comme traitée (résolue)
router.patch('/:id/marquer-traitee', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Étape 1 : récupérer l'id_proprietaire depuis la table proprietaire
    const propResult = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
      [req.user.id]
    );
    if (propResult.rows.length === 0) {
      return res.status(403).json({ message: 'Accès non autorisé - vous n\'êtes pas propriétaire' });
    }
    const id_proprietaire = propResult.rows[0].id_proprietaire;

    // Étape 2 : vérifier que l'alerte appartient bien à ce propriétaire
    const checkResult = await db.query(
      'SELECT * FROM alertes WHERE id_alerte = $1 AND id_proprietaire = $2',
      [id, id_proprietaire]
    );
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Alerte non trouvée ou accès refusé' });
    }
    const alerteObj = checkResult.rows[0];

    // Étape 3 : mettre à jour le statut (sans date_traitement si la colonne n'existe pas)
    let result;
    try {
      result = await db.query(
        `UPDATE alertes SET statut = 'traitee', date_traitement = NOW() WHERE id_alerte = $1 RETURNING *`,
        [id]
      );
    } catch (updateErr) {
      // Fallback sans date_traitement
      result = await db.query(
        `UPDATE alertes SET statut = 'traitee' WHERE id_alerte = $1 RETURNING *`,
        [id]
      );
    }

    // Étape 4 : notifier le locataire (best-effort, ne bloque pas la réponse)
    try {
      if (alerteObj.id_locataire) {
        let idUtilisateurLocataire = null;

        // Essai 1 : c'est un vrai id_locataire
        const locInfo = await db.query(
          'SELECT id_utilisateur FROM locataire WHERE id_locataire = $1',
          [alerteObj.id_locataire]
        );
        if (locInfo.rows.length > 0) {
          idUtilisateurLocataire = locInfo.rows[0].id_utilisateur;
        } else {
          // Essai 2 : c'est directement un id_utilisateur (anciens enregistrements)
          const userCheck = await db.query(
            'SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = $1',
            [alerteObj.id_locataire]
          );
          if (userCheck.rows.length > 0) {
            idUtilisateurLocataire = alerteObj.id_locataire;
          }
        }

        if (idUtilisateurLocataire) {
          await db.query(
            `INSERT INTO notification (id_utilisateur, titre, message, type) VALUES ($1, $2, $3, $4)`,
            [
              idUtilisateurLocataire,
              'Signalement résolu ✅',
              `Votre signalement "${alerteObj.titre}" a été marqué comme résolu par le propriétaire.`,
              'probleme'
            ]
          );
          console.log('✅ Notification envoyée au locataire (résolution signalement).');
        }
      }
    } catch (notifErr) {
      console.error('⚠️ Notification non-bloquante échouée:', notifErr.message);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur marquer-traitee:', error.message);
    res.status(500).json({ message: 'Erreur serveur', detail: error.message });
  }
});

// Supprimer une alerte
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'alerte appartient au propriétaire (robuste)
    const checkQuery = `
      SELECT a.id_alerte FROM alertes a
      LEFT JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
      WHERE a.id_alerte = $1 AND (a.id_proprietaire = $2 OR p.id_utilisateur = $2)
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

    // Vérifier que l'alerte existe et appartient à l'utilisateur (robuste)
    const checkQuery = `
      SELECT a.* FROM alertes a
      LEFT JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
      WHERE a.id_alerte = $1 AND (a.id_proprietaire = $2 OR p.id_utilisateur = $2)
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

// Route temporaire pour créer la table charges
router.get('/create-charges-table', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Création de la table charges - DÉBUT');
    
    // Vérifier si la table existe déjà
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'charges'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ La table charges existe déjà');
      return res.json({ message: 'Table charges existe déjà' });
    }
    
    // Créer la table charges
    const createTableQuery = `
      CREATE TABLE charges (
        id_charge SERIAL PRIMARY KEY,
        id_proprietaire INTEGER NOT NULL REFERENCES proprietaire(id_proprietaire),
        id_locataire INTEGER REFERENCES locataire(id_locataire),
        id_bien INTEGER REFERENCES bien(id_bien),
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        montant DECIMAL(10,2) NOT NULL,
        type VARCHAR(50) DEFAULT 'divers',
        date_echeance DATE NOT NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        statut VARCHAR(20) DEFAULT 'en_attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableQuery);
    console.log('✅ Table charges créée avec succès');
    
    // Créer quelques charges de test
    const insertTestQuery = `
      INSERT INTO charges (id_proprietaire, id_locataire, id_bien, titre, description, montant, type, date_echeance, statut)
      VALUES 
        (7, 1, 3, 'Charges communes Janvier', 'Charges de copropriété pour janvier', 150.00, 'copropriete', '2026-01-31', 'en_attente'),
        (7, 2, 5, 'Électricité Décembre', 'Consommation électrique décembre', 85.50, 'energie', '2026-01-15', 'en_attente'),
        (7, 2, 10, 'Eau Décembre', 'Consommation eau décembre', 45.00, 'eau', '2026-01-10', 'payee')
    `;
    
    await db.query(insertTestQuery);
    console.log('✅ Données de test insérées dans la table charges');
    
    res.json({ message: 'Table charges créée avec succès et données de test insérées' });
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table charges:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la table charges' });
  }
});

// Route de diagnostic pour les alertes/signalements
router.get('/diagnostic-alertes', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DIAGNOSTIC DES ALERTES - DÉBUT');
    console.log('👤 ID utilisateur:', req.user.id);
    console.log('👤 Type utilisateur:', req.user.type);
    
    // Vérifier toutes les alertes dans la table
    const allAlertes = await db.query('SELECT * FROM alertes ORDER BY date_creation DESC');
    console.log('📊 Toutes les alertes dans la table:', allAlertes.rows.length);
    allAlertes.rows.forEach((alerte, index) => {
      console.log(`  ${index + 1}. ID: ${alerte.id_alerte}, Type: ${alerte.type_alerte}, Expediteur: ${alerte.expediteur_type}, Destinataire: ${alerte.destinataire_type}, Titre: ${alerte.titre}`);
    });
    
    // Vérifier les alertes du propriétaire connecté
    const proprietaireInfo = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
    
    if (proprietaireInfo.rows.length === 0) {
      console.log('❌ Aucun propriétaire trouvé pour cet utilisateur');
      return res.json({ error: 'Aucun propriétaire trouvé pour cet utilisateur' });
    }
    
    const id_proprietaire_actuel = proprietaireInfo.rows[0].id_proprietaire;
    console.log('🔍 ID propriétaire pour les alertes:', id_proprietaire_actuel);
    
    // Vérifier les alertes du propriétaire avec jointures
    const userAlertes = await db.query(`
      SELECT a.*, b.titre as bien_titre, 
             u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms
      FROM alertes a
      LEFT JOIN bien b ON a.id_bien = b.id_bien
      LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
      LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
      WHERE a.id_proprietaire = $1
      ORDER BY a.date_creation DESC
    `, [id_proprietaire_actuel]);
    
    console.log('📊 Alertes du propriétaire:', userAlertes.rows.length);
    userAlertes.rows.forEach((alerte, index) => {
      console.log(`  ${index + 1}. ${alerte.titre} - ${alerte.type_alerte} - ${alerte.expediteur_type} -> ${alerte.destinataire_type}`);
    });
    
    // Diagnostic spécifique pour les signalements (expediteur_type = 'locataire')
    const signalements = userAlertes.rows.filter(a => a.expediteur_type === 'locataire');
    console.log('\n🚨 DIAGNOSTIC SIGNALEMENTS:');
    console.log(`  - Total alertes propriétaire: ${userAlertes.rows.length}`);
    console.log(`  - Signalements (expediteur_type='locataire'): ${signalements.length}`);
    signalements.forEach((s, i) => {
      console.log(`    ${i+1}. "${s.titre}" - ${s.type_alerte} - Locataire: ${s.locataire_nom}`);
    });
    
    // Vérifier s'il y a des alertes de test à créer
    if (userAlertes.rows.length === 0) {
      console.log('📝 Création d\'alertes de test...');
      const insertTestQuery = `
        INSERT INTO alertes (id_proprietaire, id_locataire, id_bien, titre, description, type_alerte, priorite, expediteur_type, destinataire_type, date_creation)
        VALUES 
          ($1, 1, 3, 'Test signalement locataire', 'Ceci est un signalement de test envoyé par un locataire', 'maintenance', 'moyenne', 'locataire', 'proprietaire', CURRENT_TIMESTAMP),
          ($1, 2, 5, 'Test communication propriétaire', 'Ceci est une communication de test envoyée par le propriétaire', 'fiscale', 'haute', 'proprietaire', 'locataire', CURRENT_TIMESTAMP)
      `;
      
      await db.query(insertTestQuery, [id_proprietaire_actuel]);
      console.log('✅ Alertes de test créées');
    } else {
      // Corriger l'alerte existante qui a les mauvaises valeurs
      console.log('🔧 Vérification et correction des alertes existantes...');
      const alerteIncorrecte = userAlertes.rows.find(a => a.expediteur_type === 'proprietaire' && a.type_alerte === 'maintenance');
      
      if (alerteIncorrecte) {
        console.log('🔧 Correction de l\'alerte incorrecte:', alerteIncorrecte.id_alerte);
        const updateQuery = `
          UPDATE alertes 
          SET expediteur_type = 'locataire', 
              destinataire_type = 'proprietaire',
              id_locataire = 1
          WHERE id_alerte = $1
        `;
        
        await db.query(updateQuery, [alerteIncorrecte.id_alerte]);
        console.log('✅ Alerte corrigée - maintenant expediteur_type = locataire');
      }
    }
    
    res.json({
      totalAlertes: allAlertes.rows.length,
      userAlertes: userAlertes.rows.length,
      signalements: signalements.length,
      proprietaireId: id_proprietaire_actuel,
      allAlertes: allAlertes.rows,
      userAlertes: userAlertes.rows,
      signalements: signalements
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic des alertes:', error);
    res.status(500).json({ message: 'Erreur lors du diagnostic des alertes' });
  }
});

// Route de diagnostic pour les charges
router.get('/diagnostic-charges', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DIAGNOSTIC DES CHARGES - DÉBUT');
    console.log('👤 ID utilisateur:', req.user.id);
    console.log('👤 Type utilisateur:', req.user.type);
    
    // Vérifier si la table charges existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'charges'
      )
    `);
    
    console.log('📋 Table charges existe:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      return res.json({ 
        error: 'Table charges n\'existe pas',
        suggestion: 'Appelez /create-charges-table d\'abord'
      });
    }
    
    // Vérifier les charges dans la table
    const allCharges = await db.query('SELECT * FROM charges ORDER BY date_creation DESC');
    console.log('📊 Toutes les charges dans la table:', allCharges.rows.length);
    allCharges.rows.forEach((charge, index) => {
      console.log(`  ${index + 1}. ID: ${charge.id_charge}, Propriétaire: ${charge.id_proprietaire}, Titre: ${charge.titre}, Montant: ${charge.montant}`);
    });
    
    // Vérifier les charges du propriétaire connecté
    const proprietaireInfo = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
    
    if (proprietaireInfo.rows.length === 0) {
      console.log('❌ Aucun propriétaire trouvé pour cet utilisateur');
      return res.json({ error: 'Aucun propriétaire trouvé pour cet utilisateur' });
    }
    
    const id_proprietaire_actuel = proprietaireInfo.rows[0].id_proprietaire;
    console.log('🔍 ID propriétaire pour les charges:', id_proprietaire_actuel);
    
    const userCharges = await db.query('SELECT * FROM charges WHERE id_proprietaire = $1 ORDER BY date_creation DESC', [id_proprietaire_actuel]);
    console.log('📊 Charges du propriétaire:', userCharges.rows.length);
    userCharges.rows.forEach((charge, index) => {
      console.log(`  ${index + 1}. ${charge.titre} - ${charge.montant}€ - ${charge.statut}`);
    });
    
    res.json({
      tableExists: tableExists.rows[0].exists,
      totalCharges: allCharges.rows.length,
      userCharges: userCharges.rows.length,
      proprietaireId: id_proprietaire_actuel,
      allCharges: allCharges.rows,
      userCharges: userCharges.rows
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic des charges:', error);
    res.status(500).json({ message: 'Erreur lors du diagnostic des charges' });
  }
});

// Routes pour les charges
router.get('/charges', authenticateToken, async (req, res) => {
  try {
    console.log('💰 Récupération des charges - DÉBUT');
    console.log('👤 ID utilisateur:', req.user.id);
    
    // Vérifier si la table charges existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'charges'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ La table charges n\'existe pas');
      return res.json([]);
    }
    
    // Récupérer l'ID du propriétaire
    const proprietaireInfo = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
    
    if (proprietaireInfo.rows.length === 0) {
      console.log('❌ Aucun propriétaire trouvé pour cet utilisateur');
      return res.json([]);
    }
    
    const id_proprietaire_actuel = proprietaireInfo.rows[0].id_proprietaire;
    console.log('🔍 ID propriétaire pour les charges:', id_proprietaire_actuel);
    
    const query = `
      SELECT c.*, b.titre as bien_titre, l.nom as locataire_nom, l.prenoms as locataire_prenoms
      FROM charges c
      LEFT JOIN bien b ON c.id_bien = b.id_bien
      LEFT JOIN locataire l ON c.id_locataire = l.id_locataire
      WHERE c.id_proprietaire = $1
      ORDER BY c.date_creation DESC
    `;
    
    const result = await db.query(query, [id_proprietaire_actuel]);
    console.log('📥 Charges récupérées:', result.rows.length);
    console.log('📋 Détails des charges:');
    result.rows.forEach((charge, index) => {
      console.log(`  ${index + 1}. ${charge.titre} - ${charge.montant}€ - ${charge.statut}`);
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des charges:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des charges' });
  }
});

// Route temporaire pour créer la table charges
router.post('/create-charges-table', authenticateToken, async (req, res) => {
  try {
    console.log('� Création manuelle de la table charges - DÉBUT');
    
    // Vérifier si la table existe déjà
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'charges'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ La table charges existe déjà');
      return res.json({ message: 'La table charges existe déjà' });
    }
    
    console.log('🔧 Création de la table charges...');
    await db.query(`
      CREATE TABLE charges (
        id_charge SERIAL PRIMARY KEY,
        id_proprietaire INTEGER NOT NULL,
        id_locataire INTEGER,
        id_bien INTEGER,
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        montant DECIMAL(10,2) NOT NULL,
        type VARCHAR(100) NOT NULL,
        date_echeance DATE NOT NULL,
        statut VARCHAR(50) DEFAULT 'en_attente',
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_paiement TIMESTAMP,
        FOREIGN KEY (id_proprietaire) REFERENCES proprietaire(id_proprietaire),
        FOREIGN KEY (id_locataire) REFERENCES locataire(id_locataire),
        FOREIGN KEY (id_bien) REFERENCES bien(id_bien)
      )
    `);
    
    console.log('✅ Table charges créée avec succès');
    
    // Insérer quelques données de test
    console.log('📝 Insertion de données de test...');
    await db.query(`
      INSERT INTO charges (id_proprietaire, id_locataire, id_bien, titre, description, montant, type, date_echeance)
      VALUES (7, 4, 3, 'Charge test', 'Ceci est une charge de test', 5000, 'entretien', '2026-05-20')
    `);
    
    console.log('✅ Données de test insérées');
    
    res.json({ 
      message: 'Table charges créée avec succès et données de test insérées',
      tableCreated: true 
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table charges:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de la table charges',
      error: error.message 
    });
  }
});

router.post('/charges', authenticateToken, async (req, res) => {
  try {
    console.log('💰 Création d\'une nouvelle charge - DÉBUT');
    console.log('👤 ID utilisateur:', req.user.id);
    console.log('📝 Données reçues:', req.body);
    
    const { id_locataire, id_bien, titre, description, montant, type, date_echeance } = req.body;
    
    // Validation des champs requis
    if (!titre || !montant || !date_echeance) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }
    
    // Récupérer l'ID du propriétaire
    const proprietaireInfo = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
    
    if (proprietaireInfo.rows.length === 0) {
      console.log('❌ Aucun propriétaire trouvé pour cet utilisateur');
      return res.status(403).json({ message: 'Utilisateur non autorisé' });
    }
    
    const id_proprietaire_actuel = proprietaireInfo.rows[0].id_proprietaire;
    console.log('🔍 ID propriétaire pour la charge:', id_proprietaire_actuel);
    
    console.log('🔍 Données pour insertion:');
    console.log('  - id_proprietaire:', id_proprietaire_actuel);
    console.log('  - id_locataire:', id_locataire || null);
    console.log('  - id_bien:', id_bien || null);
    console.log('  - titre:', titre);
    console.log('  - description:', description);
    console.log('  - montant:', montant);
    console.log('  - type:', type);
    console.log('  - date_echeance:', date_echeance);
    
    const query = `
      INSERT INTO charges (id_proprietaire, id_locataire, id_bien, titre, description, montant, type, date_echeance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    console.log('🔍 Exécution de la requête SQL...');
    const result = await db.query(query, [
      id_proprietaire_actuel, 
      id_locataire || null, 
      id_bien || null, 
      titre, 
      description, 
      montant, 
      type, 
      date_echeance
    ]);
    
    console.log('✅ Charge créée avec succès:', result.rows[0]);
    
    // Notifier le locataire si spécifié
    if (id_locataire) {
      console.log('📧 Notification du locataire pour la nouvelle charge');
      // TODO: Implémenter l'envoi d'email ou notification
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la charge:');
    console.error('  - Message:', error.message);
    console.error('  - Stack:', error.stack);
    console.error('  - Détails:', error.detail || 'Aucun détail supplémentaire');
    console.error('  - Code:', error.code || 'Aucun code');
    console.error('  - Position:', error.position || 'Aucune position');
    
    res.status(500).json({ 
      message: 'Erreur lors de la création de la charge',
      error: error.message,
      details: error.detail
    });
  }
});

router.put('/charges/:id/payer', authenticateToken, async (req, res) => {
  try {
    console.log('💰 Marquage d\'une charge comme payée - DÉBUT');
    console.log('🆔 ID charge:', req.params.id);
    
    const query = `
      UPDATE charges 
      SET statut = 'payee', updated_at = CURRENT_TIMESTAMP 
      WHERE id_charge = $1 AND id_proprietaire = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Charge non trouvée' });
    }
    
    console.log('✅ Charge marquée comme payée:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur lors du marquage de la charge:', error);
    res.status(500).json({ message: 'Erreur lors du marquage de la charge' });
  }
});

router.delete('/charges/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ Suppression d\'une charge - DÉBUT');
    console.log('🆔 ID charge:', req.params.id);
    
    const query = `
      DELETE FROM charges 
      WHERE id_charge = $1 AND id_proprietaire = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [req.params.id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Charge non trouvée' });
    }
    
    console.log('✅ Charge supprimée avec succès');
    res.json({ message: 'Charge supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la charge:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la charge' });
  }
});

module.exports = router;
