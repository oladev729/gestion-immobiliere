const cron = require('node-cron');
const AutomatisationService = require('../services/automatisationService');

class AutomatisationJob {
  
  static demarrer() {
    console.log('🤖 Démarrage du job d\'automatisation...');
    
    // Tous les jours à 8h00 : Notifications proactives
    cron.schedule('0 8 * * *', async () => {
      console.log('🔔 Exécution notifications proactives');
      try {
        await AutomatisationService.envoyerNotificationsProactives();
      } catch (error) {
        console.error('❌ Erreur notifications proactives:', error);
      }
    });
    
    // Tous les jours à 9h00 : Génération quittances automatiques
    cron.schedule('0 9 * * *', async () => {
      console.log('📄 Génération quittances automatiques');
      try {
        await this.genererQuittancesEnAttente();
      } catch (error) {
        console.error('❌ Erreur génération quittances:', error);
      }
    });
    
    // Tous les lundis à 10h00 : Nettoyage fichiers temporaires
    cron.schedule('0 10 * * 1', async () => {
      console.log('🧹 Nettoyage fichiers temporaires');
      try {
        await this.nettoyerFichiersTemporaires();
      } catch (error) {
        console.error('❌ Erreur nettoyage:', error);
      }
    });
    
    // 1er du mois à 7h00 : Création échéances mensuelles
    cron.schedule('0 7 1 * *', async () => {
      console.log('📅 Création échéances mensuelles');
      try {
        await this.creerEcheancesMensuelles();
      } catch (error) {
        console.error('❌ Erreur création échéances:', error);
      }
    });
    
    console.log('✅ Job d\'automatisation démarré avec succès');
  }
  
  // Générer les quittances pour les paiements validés récents
  static async genererQuittancesEnAttente() {
    const db = require('../config/database');
    
    const paiementsSansQuittance = await db.query(`
      SELECT p.id_payment
      FROM payement p
      LEFT JOIN quittance q ON p.id_payment = q.id_paiement
      WHERE p.statut_paiement = 'valide' 
        AND q.id_quittance IS NULL
        AND p.date_paiement >= CURRENT_DATE - INTERVAL '7 days'
    `);
    
    for (const paiement of paiementsSansQuittance.rows) {
      try {
        await AutomatisationService.genererQuittance(paiement.id_payment);
      } catch (error) {
        console.error(`❌ Erreur quittance paiement ${paiement.id_payment}:`, error);
      }
    }
    
    console.log(`✅ ${paiementsSansQuittance.rows.length} quittances générées`);
  }
  
  // Nettoyer les fichiers temporaires
  static async nettoyerFichiersTemporaires() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = path.join(__dirname, '../../uploads/temp');
    const files = await fs.readdir(tempDir).catch(() => []);
    
    const oldFiles = files.filter(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.stat(filePath);
      return stats.then(s => (Date.now() - s.mtime.getTime()) > 24 * 60 * 60 * 1000); // Plus de 24h
    });
    
    for (const file of oldFiles) {
      try {
        await fs.unlink(path.join(tempDir, file));
      } catch (error) {
        console.error(`❌ Erreur suppression ${file}:`, error);
      }
    }
    
    console.log(`✅ ${oldFiles.length} fichiers temporaires supprimés`);
  }
  
  // Créer les échéances mensuelles pour les nouveaux contrats
  static async creerEcheancesMensuelles() {
    const db = require('../config/database');
    
    const contratsActifs = await db.query(`
      SELECT c.id_contact, c.loyer_mensuel, c.charge
      FROM contact c
      WHERE c.statut_contrat = 'actif'
    `);
    
    for (const contrat of contratsActifs.rows) {
      try {
        await AutomatisationService.creerEcheancesLoyer(
          contrat.id_contact,
          contrat.loyer_mensuel,
          contrat.charge
        );
      } catch (error) {
        console.error(`❌ Erreur échéances contrat ${contrat.id_contact}:`, error);
      }
    }
    
    console.log(`✅ Échéances créées pour ${contratsActifs.rows.length} contrats`);
  }
}

module.exports = AutomatisationJob;
