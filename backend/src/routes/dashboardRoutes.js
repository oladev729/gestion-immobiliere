const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Route principale du tableau de bord stratégique
router.get('/strategique', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération stats dashboard stratégique');
    
    // Récupérer l'ID du propriétaire
    const proprietaireInfo = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', 
      [req.user.id]
    );
    
    if (proprietaireInfo.rows.length === 0) {
      return res.status(403).json({ message: 'Propriétaire non trouvé' });
    }
    
    const id_proprietaire = proprietaireInfo.rows[0].id_proprietaire;

    // 1. Taux d'occupation
    const biensStats = await db.query(`
      SELECT 
        COUNT(*) as total_biens,
        COUNT(CASE WHEN statut = 'loué' THEN 1 END) as biens_loues
      FROM bien 
      WHERE id_proprietaire = $1
    `, [id_proprietaire]);
    
    const totalBiens = parseInt(biensStats.rows[0].total_biens);
    const biensLoues = parseInt(biensStats.rows[0].biens_loues);
    const tauxOccupation = totalBiens > 0 ? Math.round((biensLoues / totalBiens) * 100) : 0;

    // 2. Revenus mensuels
    const revenusQuery = await db.query(`
      SELECT 
        COALESCE(SUM(p.montant), 0) as revenus_mensuels
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND p.statut_paiement = 'valide'
        AND DATE_TRUNC('month', p.date_paiement) = DATE_TRUNC('month', CURRENT_DATE)
    `, [id_proprietaire]);
    
    const revenusMensuels = parseFloat(revenusQuery.rows[0].revenus_mensuels);

    // 3. Nombre d'impayés
    const impayesQuery = await db.query(`
      SELECT COUNT(*) as impayes_count
      FROM loyermensuel lm
      JOIN contact c ON lm.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND lm.statut = 'en_attente'
        AND lm.date_echeance < CURRENT_DATE
    `, [id_proprietaire]);
    
    const impayesCount = parseInt(impayesQuery.rows[0].impayes_count);

    // 4. Performance mensuelle (12 derniers mois)
    const performanceQuery = await db.query(`
      SELECT 
        TO_CHAR(date_trunc('month', p.date_paiement), 'YYYY-MM') as mois,
        COALESCE(SUM(p.montant), 0) as revenus
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND p.statut_paiement = 'valide'
        AND p.date_paiement >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY date_trunc('month', p.date_paiement)
      ORDER BY mois DESC
    `, [id_proprietaire]);

    // 5. Total locataires
    const locatairesQuery = await db.query(`
      SELECT COUNT(DISTINCT c.id_locataire) as total_locataires
      FROM contact c
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND c.statut_contrat = 'actif'
    `, [id_proprietaire]);

    const totalLocataires = parseInt(locatairesQuery.rows[0].total_locataires);

    const stats = {
      tauxOccupation,
      revenusMensuels,
      impayesCount,
      totalBiens,
      totalLocataires,
      performanceMensuelle: performanceQuery.rows
    };

    console.log('✅ Stats dashboard calculées:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Erreur dashboard stratégique:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

// Route pour les alertes critiques
router.get('/alertes-critiques', authenticateToken, async (req, res) => {
  try {
    const proprietaireInfo = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', 
      [req.user.id]
    );
    
    if (proprietaireInfo.rows.length === 0) {
      return res.status(403).json({ message: 'Propriétaire non trouvé' });
    }
    
    const id_proprietaire = proprietaireInfo.rows[0].id_proprietaire;

    // Contrats expirant dans 30 jours
    const contratsExpirant = await db.query(`
      SELECT c.numero_contrat, b.titre, c.date_fin, 
        (c.date_fin - CURRENT_DATE) as jours_restants
      FROM contact c
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND c.statut_contrat = 'actif'
        AND c.date_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    `, [id_proprietaire]);

    // Loyers impayés depuis plus de 15 jours
    const loyersCritiques = await db.query(`
      SELECT lm.mois_concerne, b.titre, lm.montant_loyer,
        (CURRENT_DATE - lm.date_echeance) as jours_retard
      FROM loyermensuel lm
      JOIN contact c ON lm.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND lm.statut = 'en_attente'
        AND lm.date_echeance < CURRENT_DATE - INTERVAL '15 days'
    `, [id_proprietaire]);

    res.json({
      contratsExpirant: contratsExpirant.rows,
      loyersCritiques: loyersCritiques.rows
    });

  } catch (error) {
    console.error('❌ Erreur alertes critiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des alertes' });
  }
});

module.exports = router;
