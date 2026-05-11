const Charge = require('../models/Charge');
const Alerte = require('../models/Alerte');
const db = require('../config/database');

const chargeController = {
    // ============================================================
    // CRÉER UNE CHARGE
    // ============================================================
    async create(req, res) {
        try {
            const { 
                id_locataire, 
                id_bien, 
                type_charge, 
                titre, 
                description, 
                montant, 
                date_echeance,
                periode_facture,
                reference_facture,
                notes
            } = req.body;

            const id_proprietaire = req.user.id;

            const chargeData = {
                id_proprietaire,
                id_locataire,
                id_bien,
                type_charge,
                titre,
                description,
                montant,
                date_echeance,
                periode_facture,
                reference_facture,
                notes
            };

            const charge = await Charge.create(chargeData);

            // 📧 NOTIFICATION AUTOMATIQUE AU LOCATAIRE
            await this.notifierLocataireCharge(charge, id_locataire, id_bien);

            res.status(201).json({
                message: 'Charge créée avec succès',
                charge
            });

        } catch (error) {
            console.error('Erreur création charge:', error);
            res.status(500).json({ 
                message: 'Erreur serveur lors de la création de la charge',
                details: error.message 
            });
        }
    },

    // ============================================================
    // NOTIFIER LE LOCATAIRE D'UNE NOUVELLE CHARGE
    // ============================================================
    async notifierLocataireCharge(charge, id_locataire, id_bien) {
        try {
            console.log(`📧 Notification automatique au locataire ${id_locataire} pour la charge: ${charge.titre}`);

            const alerteData = {
                id_locataire,
                id_proprietaire: charge.id_proprietaire,
                id_bien,
                type_alerte: 'fiscale',
                titre: `Nouvelle charge: ${charge.titre}`,
                description: `Une nouvelle charge a été ajoutée:\n\nType: ${charge.type_charge}\nMontant: ${charge.montant}€\nÉchéance: ${charge.date_echeance}\n\n${charge.description || ''}`,
                expediteur_type: 'systeme',
                statut: 'non_lu'
            };

            await Alerte.create(alerteData);
            console.log('✅ Notification envoyée au locataire avec succès');

        } catch (error) {
            console.error('⚠️ Erreur notification locataire:', error);
            // Ne pas bloquer la création de charge si la notification échoue
        }
    },

    // ============================================================
    // OBTENIR LES CHARGES DU PROPRIÉTAIRE
    // ============================================================
    async getChargesProprietaire(req, res) {
        try {
            const id_proprietaire = req.user.id;
            const charges = await Charge.findByProprietaire(id_proprietaire);
            
            res.json({
                message: 'Charges récupérées avec succès',
                charges
            });

        } catch (error) {
            console.error('Erreur récupération charges propriétaire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // OBTENIR LES CHARGES DU LOCATAIRE
    // ============================================================
    async getChargesLocataire(req, res) {
        try {
            const id_locataire = req.user.id;
            const charges = await Charge.findByLocataire(id_locataire);
            
            // Calculer le solde total
            const soldeInfo = await Charge.calculerSoldeLocataire(id_locataire);
            
            res.json({
                message: 'Charges récupérées avec succès',
                charges,
                solde: soldeInfo
            });

        } catch (error) {
            console.error('Erreur récupération charges locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // METTRE À JOUR LE STATUT D'UNE CHARGE
    // ============================================================
    async updateStatut(req, res) {
        try {
            const { id_charge } = req.params;
            const { statut, montant_paye } = req.body;

            const charge = await Charge.updateStatut(id_charge, statut, montant_paye);

            // 🧾 GÉNÉRER UNE QUITTANCE SI PAIEMENT COMPLET
            if (statut === 'paye') {
                await this.genererQuittanceCharge(charge, req.user.id);
            }

            res.json({
                message: 'Statut de la charge mis à jour avec succès',
                charge
            });

        } catch (error) {
            console.error('Erreur mise à jour statut charge:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // GÉNÉRER UNE QUITTANCE POUR CHARGE
    // ============================================================
    async genererQuittanceCharge(charge, id_utilisateur) {
        try {
            console.log(`🧾 Génération quittance pour charge: ${charge.titre}`);

            const quittanceData = {
                id_paiement: null, // Pas de paiement lié pour les charges
                id_locataire: charge.id_locataire,
                id_proprietaire: charge.id_proprietaire,
                id_bien: charge.id_bien,
                type_quittance: 'charge',
                periode: charge.periode_facture || new Date().toISOString().slice(0, 7),
                montant: charge.montant,
                date_paiement: charge.date_paiement || new Date(),
                reference_paiement: charge.reference_facture
            };

            // Importer Quittance model
            const Quittance = require('../models/Quittance');
            const quittance = await Quittance.create(quittanceData);
            
            console.log('✅ Quittance de charge générée:', quittance.id_quittance);

        } catch (error) {
            console.error('⚠️ Erreur génération quittance charge:', error);
        }
    },

    // ============================================================
    // SUPPRIMER UNE CHARGE
    // ============================================================
    async delete(req, res) {
        try {
            const { id_charge } = req.params;
            const success = await Charge.delete(id_charge);
            
            if (success) {
                res.json({ message: 'Charge supprimée avec succès' });
            } else {
                res.status(404).json({ message: 'Charge non trouvée' });
            }

        } catch (error) {
            console.error('Erreur suppression charge:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // OBTENIR LE SOLDE DU LOCATAIRE
    // ============================================================
    async getSoldeLocataire(req, res) {
        try {
            const id_locataire = req.user.id;
            const soldeInfo = await Charge.calculerSoldeLocataire(id_locataire);
            
            res.json({
                message: 'Solde récupéré avec succès',
                solde: soldeInfo
            });

        } catch (error) {
            console.error('Erreur récupération solde locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = chargeController;
