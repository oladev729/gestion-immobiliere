const db = require('../config/database');
const Paiement = require('../models/Paiement');
const Alerte = require('../models/Alerte');

class AlertesAutomatiquesService {
    // ============================================================
    // VÉRIFIER LES PAIEMENTS MANQUÉS QUOTIDIENNEMENT
    // ============================================================
    static async verifierPaiementsManques() {
        console.log('🔍 Début de la vérification des paiements manqués...');
        
        try {
            // 1. Détecter les loyers impayés
            const loyersImpayes = await this.detecterLoyersImpayes();
            console.log(`📊 ${loyersImpayes.length} loyers impayés détectés`);
            
            // 2. Détecter les dépôts de garantie en retard
            const depotsEnRetard = await this.detecterDepotsEnRetard();
            console.log(`🏦 ${depotsEnRetard.length} dépôts de garantie en retard détectés`);
            
            // 3. Envoyer les alertes automatiques
            for (const loyer of loyersImpayes) {
                await this.envoyerAlerteLoyerImpaye(loyer);
            }
            
            for (const depot of depotsEnRetard) {
                await this.envoyerAlerteDepotRetard(depot);
            }
            
            console.log('✅ Vérification des paiements manqués terminée');
            
        } catch (error) {
            console.error('❌ Erreur lors de la vérification des paiements manqués:', error);
        }
    }

    // ============================================================
    // DÉTECTER LES LOYERS IMPAYÉS
    // ============================================================
    static async detecterLoyersImpayes() {
        const query = `
            SELECT l.*, 
                   c.id_locataire,
                   c.id_bien,
                   u.email as locataire_email,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms,
                   b.titre as bien_titre,
                   p.id_proprietaire
            FROM loyermensuel l
            JOIN contact c ON l.id_contact = c.id_contact
            JOIN locataire lc ON c.id_locataire = lc.id_locataire
            JOIN utilisateur u ON lc.id_utilisateur = u.id_utilisateur
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            WHERE l.statut = 'impaye' 
              AND l.date_echeance < CURRENT_DATE
              AND l.date_echeance >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY l.date_echeance ASC
        `;
        
        const result = await db.query(query);
        return result.rows;
    }

    // ============================================================
    // DÉTECTER LES DÉPÔTS DE GARANTIE EN RETARD
    // ============================================================
    static async detecterDepotsEnRetard() {
        const query = `
            SELECT dg.*, 
                   c.id_locataire,
                   c.id_bien,
                   u.email as locataire_email,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms,
                   b.titre as bien_titre,
                   p.id_proprietaire
            FROM depotgarantie dg
            JOIN contact c ON dg.id_contact = c.id_contact
            JOIN locataire lc ON c.id_locataire = lc.id_locataire
            JOIN utilisateur u ON lc.id_utilisateur = u.id_utilisateur
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            WHERE dg.statut = 'en_attente' 
              AND dg.date_versement < CURRENT_DATE
              AND dg.date_versement >= CURRENT_DATE - INTERVAL '15 days'
            ORDER BY dg.date_versement ASC
        `;
        
        const result = await db.query(query);
        return result.rows;
    }

    // ============================================================
    // ENVOYER ALERTE POUR LOYER IMPAYÉ
    // ============================================================
    static async envoyerAlerteLoyerImpaye(loyerData) {
        // Vérifier si une alerte similaire existe déjà
        const alerteExistante = await db.query(`
            SELECT id_alerte FROM alertes 
            WHERE id_locataire = $1 
              AND id_bien = $2 
              AND type_alerte = 'paiement'
              AND titre ILIKE '%loyer impaye%'
              AND statut = 'en_attente'
              AND date_creation > CURRENT_DATE - INTERVAL '7 days'
        `, [loyerData.id_locataire, loyerData.id_bien]);

        if (alerteExistante.rows.length > 0) {
            console.log(`⚠️ Alerte existante pour loyer impayé - Locataire: ${loyerData.locataire_email}`);
            return;
        }

        const alerteData = {
            id_proprietaire: loyerData.id_proprietaire,
            id_locataire: loyerData.id_locataire,
            id_bien: loyerData.id_bien,
            type_alerte: 'paiement',
            titre: `Loyer impayé - ${loyerData.bien_titre}`,
            description: `Le loyer du mois ${new Date(loyerData.mois_concerne).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} n'a pas été payé. Montant dû: ${loyerData.montant_loyer}€. Date d'échéance: ${new Date(loyerData.date_echeance).toLocaleDateString('fr-FR')}.`,
            date_echeance: loyerData.date_echeance,
            priorite: 'haute',
            periodicite: 'ponctuelle',
            statut: 'en_attente',
            expediteur_type: 'systeme',
            destinataire_type: 'locataire'
        };

        await db.query(`
            INSERT INTO alertes (
                id_proprietaire, id_locataire, id_bien, type_alerte, titre, description,
                date_echeance, priorite, periodicite, statut, expediteur_type, destinataire_type,
                date_creation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        `, [
            alerteData.id_proprietaire, alerteData.id_locataire, alerteData.id_bien,
            alerteData.type_alerte, alerteData.titre, alerteData.description,
            alerteData.date_echeance, alerteData.priorite, alerteData.periodicite, alerteData.statut,
            alerteData.expediteur_type, alerteData.destinataire_type
        ]);

        console.log(`📧 Alerte loyer impayé envoyée à: ${loyerData.locataire_email}`);
    }

    // ============================================================
    // ENVOYER ALERTE POUR DÉPÔT DE GARANTIE EN RETARD
    // ============================================================
    static async envoyerAlerteDepotRetard(depotData) {
        // Vérifier si une alerte similaire existe déjà
        const alerteExistante = await db.query(`
            SELECT id_alerte FROM alertes 
            WHERE id_locataire = $1 
              AND id_bien = $2 
              AND type_alerte = 'paiement'
              AND titre ILIKE '%depot garantie%'
              AND statut = 'en_attente'
              AND date_creation > CURRENT_DATE - INTERVAL '7 days'
        `, [depotData.id_locataire, depotData.id_bien]);

        if (alerteExistante.rows.length > 0) {
            console.log(`⚠️ Alerte existante pour dépôt en retard - Locataire: ${depotData.locataire_email}`);
            return;
        }

        const alerteData = {
            id_proprietaire: depotData.id_proprietaire,
            id_locataire: depotData.id_locataire,
            id_bien: depotData.id_bien,
            type_alerte: 'paiement',
            titre: `Dépôt de garantie en retard - ${depotData.bien_titre}`,
            description: `Le dépôt de garantie de ${depotData.montant_depot_verse}€ devait être versé le ${new Date(depotData.date_versement).toLocaleDateString('fr-FR')}. Veuillez régulariser cette situation dès que possible.`,
            date_echeance: depotData.date_versement,
            priorite: 'haute',
            periodicite: 'ponctuelle',
            statut: 'en_attente',
            expediteur_type: 'systeme',
            destinataire_type: 'locataire'
        };

        await db.query(`
            INSERT INTO alertes (
                id_proprietaire, id_locataire, id_bien, type_alerte, titre, description,
                date_echeance, priorite, periodicite, statut, expediteur_type, destinataire_type,
                date_creation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        `, [
            alerteData.id_proprietaire, alerteData.id_locataire, alerteData.id_bien,
            alerteData.type_alerte, alerteData.titre, alerteData.description,
            alerteData.date_echeance, alerteData.priorite, alerteData.periodicite, alerteData.statut,
            alerteData.expediteur_type, alerteData.destinataire_type
        ]);

        console.log(`📧 Alerte dépôt en retard envoyée à: ${depotData.locataire_email}`);
    }

    // ============================================================
    // MARQUER LES ALERTES COMME RÉSOLUES APRÈS PAIEMENT
    // ============================================================
    static async marquerAlertesResolues(id_locataire, type_paiement) {
        console.log(`🔧 Marquage des alertes résolues pour locataire ${id_locataire} - Type: ${type_paiement}`);
        
        await db.query(`
            UPDATE alertes 
            SET statut = 'traitee'
            WHERE id_locataire = $1 
              AND type_alerte = 'paiement'
              AND statut = 'en_attente'
              AND (titre ILIKE '%loyer impaye%' OR titre ILIKE '%depot garantie%')
        `, [id_locataire]);

        console.log(`✅ Alertes marquées comme traitées pour le locataire ${id_locataire}`);
    }

    // ============================================================
    // NETTOYER LES ANCIENNES ALERTES AUTOMATIQUES
    // ============================================================
    static async nettoyerAnciennesAlertes() {
        console.log('🧹 Nettoyage des anciennes alertes automatiques...');
        
        await db.query(`
            DELETE FROM alertes 
            WHERE expediteur_type = 'systeme'
              AND statut = 'en_attente'
              AND date_creation < CURRENT_DATE - INTERVAL '90 days'
        `);

        console.log('✅ Nettoyage des anciennes alertes terminé');
    }
}

module.exports = AlertesAutomatiquesService;
