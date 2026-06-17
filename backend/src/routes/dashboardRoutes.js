const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Route pour la répartition des revenus
router.get('/repartition-revenus', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération répartition des revenus');
    
    const proprietaireInfo = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', 
      [req.user.id]
    );
    
    if (proprietaireInfo.rows.length === 0) {
      return res.status(403).json({ message: 'Propriétaire non trouvé' });
    }
    
    const id_proprietaire = proprietaireInfo.rows[0].id_proprietaire;

    // Loyers (paiements valides)
    const loyersQuery = await db.query(`
      SELECT COALESCE(SUM(p.montant), 0) as total_loyers
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 AND p.statut_paiement = 'valide'
    `, [id_proprietaire]);
    const totalLoyers = parseFloat(loyersQuery.rows[0].total_loyers);

    // Charges
    const chargesQuery = await db.query(`
      SELECT COALESCE(SUM(c.montant), 0) as total_charges
      FROM charges c
      WHERE c.id_proprietaire = $1 AND c.statut = 'paye'
    `, [id_proprietaire]);
    const totalCharges = parseFloat(chargesQuery.rows[0].total_charges);

    // Dépôts de garantie
    const depotsQuery = await db.query(`
      SELECT COALESCE(SUM(c.montant_caution), 0) as total_depots
      FROM contact c
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 AND c.statut_contrat = 'actif'
    `, [id_proprietaire]);
    const totalDepots = parseFloat(depotsQuery.rows[0].total_depots);

    const data = [totalLoyers, totalCharges, totalDepots];

    console.log('✅ Répartition des revenus:', data);
    res.json(data);

  } catch (error) {
    console.error('❌ Erreur répartition des revenus:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des revenus' });
  }
});

// Route pour la performance mensuelle
router.get('/performance-mensuelle', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération performance mensuelle');
    
    const proprietaireInfo = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', 
      [req.user.id]
    );
    
    if (proprietaireInfo.rows.length === 0) {
      return res.status(403).json({ message: 'Propriétaire non trouvé' });
    }
    
    const id_proprietaire = proprietaireInfo.rows[0].id_proprietaire;

    // Revenus mensuels sur 12 mois
    const revenusQuery = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM p.date_paiement) as mois,
        COALESCE(SUM(p.montant), 0) as revenus
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND p.statut_paiement = 'valide'
        AND p.date_paiement >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM p.date_paiement)
      ORDER BY mois
    `, [id_proprietaire]);

    // Initialiser les 12 mois avec 0
    const revenueData = new Array(12).fill(0);
    revenusQuery.rows.forEach(row => {
      const moisIndex = parseInt(row.mois) - 1; // 0-indexed
      revenueData[moisIndex] = parseFloat(row.revenus);
    });

    // Taux d'occupation mensuel sur 12 mois
    const occupationQuery = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM c.date_debut) as mois,
        COUNT(*) as total_biens,
        COUNT(CASE WHEN b.statut = 'loué' THEN 1 END) as biens_loues
      FROM bien b
      LEFT JOIN contact c ON b.id_bien = c.id_bien 
        AND c.statut_contrat = 'actif'
        AND c.date_debut >= CURRENT_DATE - INTERVAL '12 months'
      WHERE b.id_proprietaire = $1
      GROUP BY EXTRACT(MONTH FROM c.date_debut)
      ORDER BY mois
    `, [id_proprietaire]);

    // Calculer le taux d'occupation moyen
    const occupancyData = new Array(12).fill(0);
    occupationQuery.rows.forEach(row => {
      const moisIndex = parseInt(row.mois) - 1;
      const taux = row.total_biens > 0 ? (row.biens_loues / row.total_biens) * 100 : 0;
      occupancyData[moisIndex] = Math.round(taux);
    });

    const data = {
      revenue: revenueData,
      occupancy: occupancyData
    };

    console.log('✅ Performance mensuelle:', data);
    res.json(data);

  } catch (error) {
    console.error('❌ Erreur performance mensuelle:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la performance' });
  }
});

// Route pour la relation propriétaire-locataire
router.get('/relation-proprietaire-locataire', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération relation propriétaire-locataire');
    
    const proprietaireInfo = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', 
      [req.user.id]
    );
    
    if (proprietaireInfo.rows.length === 0) {
      return res.status(403).json({ message: 'Propriétaire non trouvé' });
    }
    
    const id_proprietaire = proprietaireInfo.rows[0].id_proprietaire;

    // Total biens
    const biensQuery = await db.query(
      'SELECT COUNT(*) as total_biens FROM bien WHERE id_proprietaire = $1',
      [id_proprietaire]
    );
    const totalBiens = parseInt(biensQuery.rows[0].total_biens);

    // Biens loués
    const biensLouesQuery = await db.query(
      'SELECT COUNT(*) as biens_loues FROM bien WHERE id_proprietaire = $1 AND statut = \'loué\'',
      [id_proprietaire]
    );
    const biensLoues = parseInt(biensLouesQuery.rows[0].biens_loues);

    // Total locataires actifs
    const locatairesQuery = await db.query(`
      SELECT COUNT(DISTINCT c.id_locataire) as total_locataires
      FROM contact c
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 AND c.statut_contrat = 'actif'
    `, [id_proprietaire]);
    const totalLocataires = parseInt(locatairesQuery.rows[0].total_locataires);

    const data = {
      totalProperties: totalBiens,
      occupiedProperties: biensLoues,
      totalTenants: totalLocataires
    };

    console.log('✅ Relation propriétaire-locataire:', data);
    res.json(data);

  } catch (error) {
    console.error('❌ Erreur relation propriétaire-locataire:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la relation' });
  }
});

// Route principale du tableau de bord pour les stats cards
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération stats dashboard pour propriétaire');
    
    // Récupérer l'ID du propriétaire
    const proprietaireInfo = await db.query(
      'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', 
      [req.user.id]
    );
    
    if (proprietaireInfo.rows.length === 0) {
      return res.status(403).json({ message: 'Propriétaire non trouvé' });
    }
    
    const id_proprietaire = proprietaireInfo.rows[0].id_proprietaire;

    // 1. Nombre de biens
    const biensQuery = await db.query(
      'SELECT COUNT(*) as total_biens FROM bien WHERE id_proprietaire = $1',
      [id_proprietaire]
    );
    const totalBiens = parseInt(biensQuery.rows[0].total_biens);

    // 2. Nombre de contrats actifs
    const contratsQuery = await db.query(`
      SELECT COUNT(*) as total_contrats
      FROM contact c
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 AND c.statut_contrat = 'actif'
    `, [id_proprietaire]);
    const totalContrats = parseInt(contratsQuery.rows[0].total_contrats);

    // 3. Revenus totaux (tous les paiements valides)
    const revenusQuery = await db.query(`
      SELECT COALESCE(SUM(p.montant), 0) as revenus_totaux
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 AND p.statut_paiement = 'valide'
    `, [id_proprietaire]);
    const revenusTotaux = parseFloat(revenusQuery.rows[0].revenus_totaux);

    // 4. Revenus du mois en cours
    const revenusMoisQuery = await db.query(`
      SELECT COALESCE(SUM(p.montant), 0) as revenus_mois
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND p.statut_paiement = 'valide'
        AND DATE_TRUNC('month', p.date_paiement) = DATE_TRUNC('month', CURRENT_DATE)
    `, [id_proprietaire]);
    const revenusMois = parseFloat(revenusMoisQuery.rows[0].revenus_mois);

    // 5. Revenus du mois précédent pour calculer le changement
    const revenusMoisPrecedentQuery = await db.query(`
      SELECT COALESCE(SUM(p.montant), 0) as revenus_mois_precedent
      FROM payement p
      JOIN contact c ON p.id_contact = c.id_contact
      JOIN bien b ON c.id_bien = b.id_bien
      WHERE b.id_proprietaire = $1 
        AND p.statut_paiement = 'valide'
        AND DATE_TRUNC('month', p.date_paiement) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    `, [id_proprietaire]);
    const revenusMoisPrecedent = parseFloat(revenusMoisPrecedentQuery.rows[0].revenus_mois_precedent);

    // Calculer le pourcentage de changement
    let revenueChange = 0;
    if (revenusMoisPrecedent > 0) {
      revenueChange = ((revenusMois - revenusMoisPrecedent) / revenusMoisPrecedent) * 100;
    }

    const stats = {
      revenue: revenusTotaux,
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      orders: totalContrats,
      ordersChange: 0, // Pourrait être calculé si nécessaire
      properties: totalBiens,
      contracts: totalContrats
    };

    console.log('✅ Stats dashboard calculées:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Erreur dashboard stats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

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
