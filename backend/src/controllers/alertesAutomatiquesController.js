const AlertesAutomatiquesService = require('../services/alertesAutomatiquesService');
const AlertesAutomatiquesJob = require('../jobs/alertesAutomatiquesJob');

class AlertesAutomatiquesController {
    // ============================================================
    // DÉMARRER LE SERVICE D'ALERTES AUTOMATIQUES
    // ============================================================
    static async demarrer(req, res) {
        try {
            console.log('🚀 Démarrage du service d\'alertes automatiques...');
            
            // Démarrer le job planifié
            AlertesAutomatiquesJob.demarrer();
            
            res.json({ 
                message: 'Service d\'alertes automatiques démarré avec succès',
                horaires: '8h00 et 14h00 tous les jours',
                fonctionnalites: [
                    'Détection des loyers impayés',
                    'Détection des dépôts de garantie en retard',
                    'Envoi automatique d\'alertes',
                    'Nettoyage des anciennes alertes'
                ]
            });
            
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du service d\'alertes automatiques:', error);
            res.status(500).json({ 
                message: 'Erreur lors du démarrage du service d\'alertes automatiques',
                error: error.message 
            });
        }
    }

    // ============================================================
    // ARRÊTER LE SERVICE D'ALERTES AUTOMATIQUES
    // ============================================================
    static async arreter(req, res) {
        try {
            console.log('🛑 Arrêt du service d\'alertes automatiques...');
            
            // Arrêter le job planifié
            AlertesAutomatiquesJob.arreter();
            
            res.json({ 
                message: 'Service d\'alertes automatiques arrêté avec succès'
            });
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du service d\'alertes automatiques:', error);
            res.status(500).json({ 
                message: 'Erreur lors de l\'arrêt du service d\'alertes automatiques',
                error: error.message 
            });
        }
    }

    // ============================================================
    // EXÉCUTER MANUELLEMENT LA VÉRIFICATION
    // ============================================================
    static async executerManuellement(req, res) {
        try {
            console.log('🧪 Exécution manuelle de la vérification des alertes automatiques...');
            
            await AlertesAutomatiquesJob.executerManuellement();
            
            res.json({ 
                message: 'Vérification manuelle exécutée avec succès'
            });
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'exécution manuelle:', error);
            res.status(500).json({ 
                message: 'Erreur lors de l\'exécution manuelle',
                error: error.message 
            });
        }
    }

    // ============================================================
    // MARQUER LES ALERTES COMME RÉSOLUES APRÈS PAIEMENT
    // ============================================================
    static async marquerAlertesResolues(req, res) {
        try {
            const { id_locataire, type_paiement } = req.body;
            
            if (!id_locataire || !type_paiement) {
                return res.status(400).json({ 
                    message: 'id_locataire et type_paiement sont requis' 
                });
            }
            
            console.log(`🔧 Marquage des alertes résolues pour locataire ${id_locataire} - Type: ${type_paiement}`);
            
            await AlertesAutomatiquesService.marquerAlertesResolues(id_locataire, type_paiement);
            
            res.json({ 
                message: 'Alertes marquées comme résolues avec succès'
            });
            
        } catch (error) {
            console.error('❌ Erreur lors du marquage des alertes résolues:', error);
            res.status(500).json({ 
                message: 'Erreur lors du marquage des alertes résolues',
                error: error.message 
            });
        }
    }

    // ============================================================
    // OBTENIR LES STATISTIQUES DES ALERTES AUTOMATIQUES
    // ============================================================
    static async getStatistiques(req, res) {
        try {
            console.log('📊 Récupération des statistiques des alertes automatiques...');
            
            const stats = await db.query(`
                SELECT 
                    COUNT(CASE WHEN type_alerte = 'paiement' AND titre ILIKE '%loyer impaye%' THEN 1 END) as loyers_impayes_count,
                    COUNT(CASE WHEN type_alerte = 'paiement' AND titre ILIKE '%depot garantie%' THEN 1 END) as depots_retard_count,
                    COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as alertes_en_attente_count,
                    COUNT(CASE WHEN statut = 'traitee' THEN 1 END) as alertes_traitees_count,
                    COUNT(CASE WHEN date_creation > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as alertes_recentes_count
                FROM alertes 
                WHERE expediteur_type = 'systeme'
            `);
            
            res.json({ 
                message: 'Statistiques récupérées avec succès',
                statistiques: stats.rows[0]
            });
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({ 
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message 
            });
        }
    }
}

module.exports = AlertesAutomatiquesController;
