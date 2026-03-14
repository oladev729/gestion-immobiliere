const Paiement = require('../models/Paiement');
const LoyerMensuel = require('../models/LoyerMensuel');
const DepotGarantie = require('../models/DepotGarantie');
const db = require('../config/database');

const paiementController = {
    // ============================================================
    // PAYER UN LOYER
    // ============================================================
    async payerLoyer(req, res) {
        try {
            const { id_loyer, id_mode_payment, montant } = req.body;

            // Vérifier que le loyer existe
            const loyer = await LoyerMensuel.findById(id_loyer);
            if (!loyer) {
                return res.status(404).json({ message: 'Loyer non trouvé' });
            }

            // Vérifier que le loyer n'est pas déjà payé
            if (loyer.statut === 'paye') {
                return res.status(400).json({ message: 'Ce loyer est déjà payé' });
            }

            // Récupérer l'id_contact depuis le loyer
            const id_contact = loyer.id_contact;

            // Créer le paiement
            const paiement = await Paiement.payerLoyer({
                id_contact,
                id_loyer,
                id_mode_payment,
                montant,
                statut_paiement: 'valide'
            });

            res.status(201).json({
                message: 'Paiement effectué avec succès',
                paiement
            });

        } catch (error) {
            console.error('Erreur paiement loyer:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // PAYER UN DÉPÔT DE GARANTIE
    // ============================================================
    async payerDepot(req, res) {
        try {
            const { id_contact, id_mode_payment, montant } = req.body;

            // Vérifier que le contrat existe
            const contrat = await db.query(
                'SELECT * FROM contact WHERE id_contact = $1',
                [id_contact]
            );
            if (contrat.rows.length === 0) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Créer le dépôt de garantie
            const depot = await DepotGarantie.create({
                id_contact,
                montant_depot_verse: montant,
                date_versement: new Date(),
                mode_versement: req.body.mode_versement || 'virement'
            });

            // Créer le paiement
            const paiement = await Paiement.payerDepot({
                id_contact,
                id_depot: depot.id_depot,
                id_mode_payment,
                montant,
                statut_paiement: 'valide'
            });

            res.status(201).json({
                message: 'Dépôt de garantie effectué avec succès',
                depot,
                paiement
            });

        } catch (error) {
            console.error('Erreur paiement dépôt:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES PAIEMENTS D'UN CONTRAT
    // ============================================================
    async getPaiementsByContrat(req, res) {
        try {
            const { id_contact } = req.params;
            const paiements = await Paiement.findByContrat(id_contact);
            res.json(paiements);
        } catch (error) {
            console.error('Erreur récupération paiements:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES PAIEMENTS D'UN LOCATAIRE
    // ============================================================
    async getMesPaiements(req, res) {
        try {
            // Récupérer l'id_locataire depuis l'utilisateur connecté
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const paiements = await Paiement.findByLocataire(locataire.rows[0].id_locataire);
            res.json(paiements);

        } catch (error) {
            console.error('Erreur récupération mes paiements:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES LOYERS D'UN CONTRAT
    // ============================================================
    async getLoyersByContrat(req, res) {
        try {
            const { id_contact } = req.params;
            const loyers = await LoyerMensuel.findByContrat(id_contact);
            res.json(loyers);
        } catch (error) {
            console.error('Erreur récupération loyers:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES LOYERS IMPAYÉS
    // ============================================================
    async getImpayes(req, res) {
        try {
            const impayes = await LoyerMensuel.findImpayes();
            res.json(impayes);
        } catch (error) {
            console.error('Erreur récupération impayés:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // GÉNÉRER LES ÉCHÉANCES D'UN CONTRAT
    // ============================================================
    async genererEcheances(req, res) {
        try {
            const { id_contact } = req.params;

            // Récupérer le contrat
            const contrat = await db.query(
                'SELECT * FROM contact WHERE id_contact = $1',
                [id_contact]
            );

            if (contrat.rows.length === 0) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Vérifier que l'utilisateur est bien le propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            const bien = await db.query(
                'SELECT id_proprietaire FROM bien WHERE id_bien = $1',
                [contrat.rows[0].id_bien]
            );

            if (proprietaire.rows.length === 0 || 
                bien.rows[0].id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé' 
                });
            }

            // Générer les échéances
            const loyers = await LoyerMensuel.genererEcheances(contrat.rows[0]);

            res.status(201).json({
                message: 'Échéances générées avec succès',
                loyers
            });

        } catch (error) {
            console.error('Erreur génération échéances:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // STATISTIQUES DES PAIEMENTS
    // ============================================================
    async getStats(req, res) {
        try {
            const stats = await db.query(`
                SELECT 
                    COUNT(*) as total_paiements,
                    COUNT(CASE WHEN statut_paiement = 'valide' THEN 1 END) as paiements_valides,
                    COUNT(CASE WHEN statut_paiement = 'echoue' THEN 1 END) as paiements_echoues,
                    SUM(CASE WHEN statut_paiement = 'valide' THEN montant ELSE 0 END) as montant_total
                FROM payement
            `);

            const impayes = await db.query(`
                SELECT COUNT(*) as total_impayes
                FROM loyermensuel
                WHERE statut = 'impaye' AND date_echeance < CURRENT_DATE
            `);

            res.json({
                stats: stats.rows[0],
                impayes: impayes.rows[0].total_impayes
            });

        } catch (error) {
            console.error('Erreur stats paiements:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = paiementController;