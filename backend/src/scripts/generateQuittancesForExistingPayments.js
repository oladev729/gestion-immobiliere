const db = require('../config/database');
const Quittance = require('../models/Quittance');

/**
 * Script pour générer les quittances pour les paiements existants
 * qui n'ont pas encore de quittance
 */
async function generateQuittancesForExistingPayments() {
    try {
        console.log('🔍 Recherche des paiements sans quittance...');
        
        // Récupérer tous les paiements qui n'ont pas de quittance
        const query = `
            SELECT p.*, 
                   lm.mois_concerne, lm.id_contact,
                   b.id_bien, b.titre as bien_titre
            FROM payement p
            LEFT JOIN loyermensuel lm ON p.id_loyer = lm.id_loyer
            LEFT JOIN contact c ON lm.id_contact = c.id_contact
            LEFT JOIN bien b ON c.id_bien = b.id_bien
            WHERE p.statut_paiement = 'valide'
            AND NOT EXISTS (
                SELECT 1 FROM quittance q WHERE q.id_paiement = p.id_payment
            )
        `;
        
        const result = await db.query(query);
        
        if (result.rows.length === 0) {
            console.log('✅ Tous les paiements valides ont déjà une quittance');
            return;
        }
        
        console.log(`📋 ${result.rows.length} paiement(s) sans quittance trouvé(s)`);
        
        // Générer les quittances pour chaque paiement
        for (const paiement of result.rows) {
            try {
                // Récupérer les informations nécessaires depuis loyermensuel
                const loyerQuery = `
                    SELECT lm.id_contact, c.id_locataire
                    FROM loyermensuel lm
                    LEFT JOIN contact c ON lm.id_contact = c.id_contact
                    WHERE lm.id_loyer = $1
                `;
                const loyerResult = await db.query(loyerQuery, [paiement.id_loyer]);
                
                let locataire_id_utilisateur = null;
                let proprietaire_id_utilisateur = null;
                
                if (loyerResult.rows.length > 0) {
                    const loyerInfo = loyerResult.rows[0];
                    
                    // Récupérer l'ID utilisateur du locataire
                    const locataireUserQuery = `
                        SELECT id_utilisateur FROM locataire WHERE id_locataire = $1
                    `;
                    const locataireUserResult = await db.query(locataireUserQuery, [loyerInfo.id_locataire]);
                    locataire_id_utilisateur = locataireUserResult.rows[0]?.id_utilisateur;
                }

                const quittanceData = {
                    id_paiement: paiement.id_payment,
                    id_locataire: locataire_id_utilisateur || 1, // Valeur par défaut si non trouvé
                    id_proprietaire: proprietaire_id_utilisateur || 1, // Valeur par défaut si non trouvé
                    id_bien: paiement.id_bien || 1,
                    type_quittance: paiement.id_loyer ? 'loyer' : 'depot_garantie',
                    periode: paiement.mois_concerne || new Date().toISOString().slice(0, 7),
                    montant: paiement.montant,
                    date_paiement: paiement.date_paiement,
                    reference_paiement: paiement.numero_transaction
                };

                const quittance = await Quittance.create(quittanceData);
                console.log(`✅ Quittance générée pour le paiement #${paiement.id_payment}: Quittance #${quittance.id_quittance}`);
                
            } catch (error) {
                console.error(`❌ Erreur génération quittance pour paiement #${paiement.id_payment}:`, error);
            }
        }
        
        console.log('✅ Génération des quittances terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération des quittances:', error);
    }
}

// Exécuter le script
generateQuittancesForExistingPayments()
    .then(() => {
        console.log('Script terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Erreur script:', error);
        process.exit(1);
    });
