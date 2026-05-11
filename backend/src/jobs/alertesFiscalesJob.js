const cron = require('node-cron');
const Alerte = require('../models/Alerte');
const db = require('../config/database');

class AlertesFiscalesJob {
    constructor() {
        this.isRunning = false;
        this.job = null;
    }

    // ============================================================
    // DÉMARRER LE JOB D'ALERTES FISCALES
    // ============================================================
    demarrer() {
        if (this.isRunning) {
            console.log('⚠️ Job d\'alertes fiscales déjà en cours d\'exécution');
            return;
        }

        console.log('📅 Démarrage du job d\'alertes fiscales...');
        this.isRunning = true;

        // Exécuter tous les jours à 8h00
        this.job = cron.schedule('0 8 * * *', async () => {
            console.log('🔔 Vérification des échéances d\'alertes fiscales...');
            await this.verifierEcheances();
        }, {
            scheduled: true,
            timezone: 'Africa/Abidjan'
        });

        console.log('✅ Job d\'alertes fiscales démarré - Exécution quotidienne à 8h00');
    }

    // ============================================================
    // VÉRIFIER LES ÉCHÉANCES ET ENVOYER LES RAPPELS
    // ============================================================
    async verifierEcheances() {
        try {
            const aujourdHui = new Date();
            const dans30Jours = new Date(aujourdHui.getTime() + 30 * 24 * 60 * 60 * 1000);
            const dans15Jours = new Date(aujourdHui.getTime() + 15 * 24 * 60 * 60 * 1000);
            const dans7Jours = new Date(aujourdHui.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Récupérer les alertes fiscales avec date d'échéance
            const query = `
                SELECT a.*, 
                       u_loc.email as locataire_email,
                       u_loc.nom as locataire_nom,
                       u_loc.prenoms as locataire_prenoms,
                       b.titre as bien_titre
                FROM alertes a
                JOIN utilisateur u_loc ON a.id_locataire = u_loc.id_utilisateur
                LEFT JOIN bien b ON a.id_bien = b.id_bien
                WHERE a.type_alerte = 'fiscale' 
                AND a.date_echeance IS NOT NULL
                AND a.statut_echeance != 'expire'
                ORDER BY a.date_echeance ASC
            `;

            const result = await db.query(query);
            const alertes = result.rows;

            console.log(`📋 ${alertes.length} alertes fiscales trouvées avec échéance`);

            for (const alerte of alertes) {
                await this.traiterEcheance(alerte, aujourdHui, dans30Jours, dans15Jours, dans7Jours);
            }

        } catch (error) {
            console.error('❌ Erreur vérification échéances:', error);
        }
    }

    // ============================================================
    // TRAITER UNE ÉCHÉANCE SPÉCIFIQUE
    // ============================================================
    async traiterEcheance(alerte, aujourdHui, dans30Jours, dans15Jours, dans7Jours) {
        try {
            const rappelsEnvoyes = JSON.parse(alerte.rappels_envoyes || '[]');
            const dateEcheance = new Date(alerte.date_echeance);

            // Vérifier si l'alerte est expirée
            if (dateEcheance < aujourdHui) {
                await this.marquerExpiree(alerte.id_alerte);
                console.log(`⏰ Alerte fiscale ${alerte.id_alerte} expirée`);
                return;
            }

            // Vérifier les rappels à envoyer
            const rappelsAEnvoyer = [];

            // Rappel J-30
            if (dateEcheance <= dans30Jours && !rappelsEnvoyes.includes('J-30')) {
                rappelsAEnvoyer.push('J-30');
            }

            // Rappel J-15
            if (dateEcheance <= dans15Jours && !rappelsEnvoyes.includes('J-15')) {
                rappelsAEnvoyer.push('J-15');
            }

            // Rappel J-7
            if (dateEcheance <= dans7Jours && !rappelsEnvoyes.includes('J-7')) {
                rappelsAEnvoyer.push('J-7');
            }

            // Envoyer les rappels
            for (const rappel of rappelsAEnvoyer) {
                await this.envoyerRappel(alerte, rappel);
                rappelsEnvoyes.push(rappel);
            }

            // Mettre à jour les rappels envoyés
            if (rappelsAEnvoyer.length > 0) {
                await this.mettreAJourRappels(alerte.id_alerte, rappelsEnvoyes);
            }

        } catch (error) {
            console.error(`❌ Erreur traitement échéance ${alerte.id_alerte}:`, error);
        }
    }

    // ============================================================
    // ENVOYER UN RAPPEL
    // ============================================================
    async envoyerRappel(alerte, typeRappel) {
        try {
            console.log(`📧 Envoi rappel ${typeRappel} pour alerte ${alerte.id_alerte} à ${alerte.locataire_email}`);

            // Créer une nouvelle alerte de type rappel
            const rappelData = {
                id_locataire: alerte.id_locataire,
                id_proprietaire: alerte.id_proprietaire,
                id_bien: alerte.id_bien,
                type_alerte: 'fiscale',
                titre: `Rappel ${typeRappel} - ${alerte.titre}`,
                description: `Rappel important : ${alerte.description}\n\nÉchéance : ${new Date(alerte.date_echeance).toLocaleDateString('fr-FR')}\nType de rappel : ${typeRappel}`,
                expediteur_type: 'systeme',
                statut: 'non_lu'
            };

            await Alerte.create(rappelData);
            console.log(`✅ Rappel ${typeRappel} envoyé avec succès`);

        } catch (error) {
            console.error(`❌ Erreur envoi rappel ${typeRappel}:`, error);
        }
    }

    // ============================================================
    // METTRE À JOUR LES RAPPELS ENVOYÉS
    // ============================================================
    async mettreAJourRappels(idAlerte, rappelsEnvoyes) {
        try {
            const query = `
                UPDATE alertes 
                SET rappels_envoyes = $1, statut_echeance = 'rappel_envoye'
                WHERE id_alerte = $2
            `;
            
            await db.query(query, [JSON.stringify(rappelsEnvoyes), idAlerte]);
        } catch (error) {
            console.error('❌ Erreur mise à jour rappels:', error);
        }
    }

    // ============================================================
    // MARQUER UNE ALERTE COMME EXPIRÉE
    // ============================================================
    async marquerExpiree(idAlerte) {
        try {
            const query = `
                UPDATE alertes 
                SET statut_echeance = 'expire'
                WHERE id_alerte = $1
            `;
            
            await db.query(query, [idAlerte]);
        } catch (error) {
            console.error('❌ Erreur marquage expiré:', error);
        }
    }

    // ============================================================
    // EXÉCUTION MANUELLE
    // ============================================================
    async executerManuellement() {
        console.log('🔄 Exécution manuelle du job d\'alertes fiscales...');
        await this.verifierEcheances();
    }

    // ============================================================
    // ARRÊTER LE JOB
    // ============================================================
    arreter() {
        if (this.job) {
            this.job.stop();
            this.isRunning = false;
            console.log('⏹️ Job d\'alertes fiscales arrêté');
        }
    }

    // ============================================================
    // OBTENIR LE STATUT
    // ============================================================
    getStatut() {
        return {
            isRunning: this.isRunning,
            nextExecution: this.job ? this.job.nextDate() : null
        };
    }
}

module.exports = new AlertesFiscalesJob();
