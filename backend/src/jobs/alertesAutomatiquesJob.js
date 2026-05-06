const cron = require('node-cron');
const AlertesAutomatiquesService = require('../services/alertesAutomatiquesService');

class AlertesAutomatiquesJob {
    // ============================================================
    // DÉMARRER LE JOB PLANIFIÉ
    // ============================================================
    static demarrer() {
        console.log('🚀 Démarrage du job d\'alertes automatiques...');
        
        // Exécuter tous les jours à 8h00 du matin
        cron.schedule('0 8 * * *', async () => {
            console.log('⏰ Exécution du job d\'alertes automatiques -', new Date().toLocaleString('fr-FR'));
            
            try {
                // 1. Nettoyer les anciennes alertes automatiques
                await AlertesAutomatiquesService.nettoyerAnciennesAlertes();
                
                // 2. Vérifier les paiements manqués
                await AlertesAutomatiquesService.verifierPaiementsManques();
                
                console.log('✅ Job d\'alertes automatiques terminé avec succès');
                
            } catch (error) {
                console.error('❌ Erreur lors de l\'exécution du job d\'alertes automatiques:', error);
            }
        });

        // Optionnel: Exécuter aussi à 14h00 pour les rappels de l'après-midi
        cron.schedule('0 14 * * *', async () => {
            console.log('⏰ Exécution du job d\'alertes automatiques (rappel) -', new Date().toLocaleString('fr-FR'));
            
            try {
                // Vérification rapide uniquement des nouveaux paiements manqués
                await AlertesAutomatiquesService.verifierPaiementsManques();
                
            } catch (error) {
                console.error('❌ Erreur lors du rappel d\'alertes automatiques:', error);
            }
        });

        console.log('✅ Job d\'alertes automatiques démarré avec succès');
        console.log('📅 Horaires prévus : 8h00 et 14h00 tous les jours');
    }

    // ============================================================
    // ARRÊTER LE JOB
    // ============================================================
    static arreter() {
        console.log('🛑 Arrêt du job d\'alertes automatiques...');
        cron.getTasks().forEach(task => task.stop());
        console.log('✅ Job d\'alertes automatiques arrêté');
    }

    // ============================================================
    // TEST MANUEL DU JOB
    // ============================================================
    static async executerManuellement() {
        console.log('🧪 Exécution manuelle du job d\'alertes automatiques...');
        
        try {
            await AlertesAutomatiquesService.verifierPaiementsManques();
            console.log('✅ Exécution manuelle terminée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'exécution manuelle:', error);
        }
    }
}

module.exports = AlertesAutomatiquesJob;
