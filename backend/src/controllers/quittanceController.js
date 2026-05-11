const Quittance = require('../models/Quittance');
const db = require('../config/database');

const quittanceController = {
    // ============================================================
    // GÉNÉRER UNE QUITTANCE AUTOMATIQUEMENT
    // ============================================================
    async generateQuittance(req, res) {
        try {
            console.log('🧾 Génération de quittance automatique...');
            const { id_paiement, type_quittance } = req.body;

            // Récupérer les informations du paiement
            const paiementQuery = `
                SELECT p.*, 
                       lm.id_contact, lm.mois_concerne, lm.date_echeance,
                       c.id_locataire, c.id_proprietaire, c.id_bien,
                       l.id_utilisateur as locataire_id_utilisateur,
                       prop.id_utilisateur as proprietaire_id_utilisateur,
                       b.titre as bien_titre
                FROM payement p
                LEFT JOIN loyermensuel lm ON p.id_loyer = lm.id_loyer
                LEFT JOIN contact c ON lm.id_contact = c.id_contact
                LEFT JOIN locataire l ON c.id_locataire = l.id_locataire
                LEFT JOIN proprietaire prop ON c.id_proprietaire = prop.id_proprietaire
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                WHERE p.id_payement = $1
            `;
            
            const paiementResult = await db.query(paiementQuery, [id_paiement]);
            if (paiementResult.rows.length === 0) {
                return res.status(404).json({ message: 'Paiement non trouvé' });
            }

            const paiement = paiementResult.rows[0];
            
            // Générer la référence
            const reference = await Quittance.generateReference();

            // Créer la quittance
            const quittanceData = {
                id_paiement: id_paiement,
                id_locataire: paiement.locataire_id_utilisateur,
                id_proprietaire: paiement.proprietaire_id_utilisateur,
                id_bien: paiement.id_bien,
                type_quittance: type_quittance || 'loyer',
                periode: paiement.mois_concerne || new Date().toISOString().slice(0, 7),
                montant: paiement.montant,
                date_paiement: paiement.date_paiement,
                reference_paiement: paiement.numero_transaction || reference
            };

            const quittance = await Quittance.create(quittanceData);

            res.status(201).json({
                message: 'Quittance générée avec succès',
                quittance
            });

        } catch (error) {
            console.error('Erreur génération quittance:', error);
            res.status(500).json({ 
                message: 'Erreur serveur lors de la génération de la quittance',
                details: error.message 
            });
        }
    },

    // ============================================================
    // OBTENIR LES QUITTANCES DU LOCATAIRE
    // ============================================================
    async getQuittancesLocataire(req, res) {
        try {
            const id_locataire = req.user.id;
            const quittances = await Quittance.findByLocataire(id_locataire);
            
            res.json({
                message: 'Quittances récupérées avec succès',
                quittances
            });

        } catch (error) {
            console.error('Erreur récupération quittances locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // OBTENIR LES QUITTANCES DU PROPRIÉTAIRE
    // ============================================================
    async getQuittancesProprietaire(req, res) {
        try {
            // Récupérer l'ID propriétaire depuis l'utilisateur
            const proprioQuery = `
                SELECT p.id_proprietaire 
                FROM proprietaire p 
                WHERE p.id_utilisateur = $1
            `;
            
            const proprioResult = await db.query(proprioQuery, [req.user.id]);
            if (proprioResult.rows.length === 0) {
                return res.status(404).json({ message: 'Propriétaire non trouvé' });
            }

            const id_proprietaire = proprioResult.rows[0].id_proprietaire;
            const quittances = await Quittance.findByProprietaire(id_proprietaire);
            
            res.json({
                message: 'Quittances récupérées avec succès',
                quittances
            });

        } catch (error) {
            console.error('Erreur récupération quittances propriétaire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // TÉLÉCHARGER UNE QUITTANCE EN PDF
    // ============================================================
    async downloadQuittance(req, res) {
        try {
            const { id_quittance } = req.params;
            const quittance = await Quittance.findById(id_quittance);
            
            if (!quittance) {
                return res.status(404).json({ message: 'Quittance non trouvée' });
            }

            // TODO: Implémenter la génération PDF ici
            // Pour l'instant, retourner les données de la quittance
            res.json({
                message: 'Données de la quittance pour génération PDF',
                quittance
            });

        } catch (error) {
            console.error('Erreur téléchargement quittance:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = quittanceController;
