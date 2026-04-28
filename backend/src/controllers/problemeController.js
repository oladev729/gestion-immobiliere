const Probleme = require('../models/Probleme');
const db = require('../config/database');

const problemeController = {

    async create(req, res) {
        try {
            const { id_bien, titre, description, categorie, priorite } = req.body;
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );
            if (locataire.rows.length === 0) {
                return res.status(403).json({ message: 'Seul un locataire peut signaler un problème' });
            }
            const bien = await db.query(
                'SELECT id_proprietaire, titre FROM bien WHERE id_bien = $1',
                [id_bien]
            );
            if (bien.rows.length === 0) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }
            const contratActif = await db.query(
                `SELECT * FROM contact WHERE id_locataire = $1 AND id_bien = $2 AND statut_contrat = 'actif'`,
                [locataire.rows[0].id_locataire, id_bien]
            );
            if (contratActif.rows.length === 0) {
                return res.status(403).json({ message: "Vous n'êtes pas locataire de ce bien" });
            }
            const probleme = await Probleme.create({
                id_locataire: locataire.rows[0].id_locataire,
                id_bien, titre, description, categorie, priorite
            });
            res.status(201).json({ message: 'Problème signalé avec succès', probleme });
        } catch (error) {
            console.error('Erreur création problème:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async getMesProblemes(req, res) {
        try {
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );
            if (locataire.rows.length === 0) return res.status(200).json([]);
            const problemes = await Probleme.findByLocataire(locataire.rows[0].id_locataire);
            res.json(problemes);
        } catch (error) {
            console.error('Erreur récupération mes problèmes:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async getProblemesRecus(req, res) {
        try {
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );
            if (proprietaire.rows.length === 0) return res.status(200).json([]);
            const problemes = await Probleme.findByProprietaire(proprietaire.rows[0].id_proprietaire);
            res.json(problemes);
        } catch (error) {
            console.error('Erreur récupération problèmes reçus:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async getProblemesByBien(req, res) {
        try {
            const { id_bien } = req.params;
            const bien = await db.query('SELECT id_proprietaire FROM bien WHERE id_bien = $1', [id_bien]);
            if (bien.rows.length === 0) return res.status(404).json({ message: 'Bien non trouvé' });
            const isProprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]
            );
            const isLocataire = await db.query(
                `SELECT * FROM contact WHERE id_locataire = (SELECT id_locataire FROM locataire WHERE id_utilisateur = $1) AND id_bien = $2 AND statut_contrat = 'actif'`,
                [req.user.id, id_bien]
            );
            if ((isProprietaire.rows.length === 0 || isProprietaire.rows[0].id_proprietaire !== bien.rows[0].id_proprietaire) && isLocataire.rows.length === 0) {
                return res.status(403).json({ message: "Vous n'avez pas accès aux problèmes de ce bien" });
            }
            const problemes = await Probleme.findByBien(id_bien);
            res.json(problemes);
        } catch (error) {
            console.error('Erreur récupération problèmes du bien:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async getProblemeById(req, res) {
        try {
            const { id } = req.params;
            const probleme = await Probleme.findById(id);
            if (!probleme) return res.status(404).json({ message: 'Problème non trouvé' });
            const proprietaire = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
            const locataire = await db.query('SELECT id_locataire FROM locataire WHERE id_utilisateur = $1', [req.user.id]);
            const isProprietaire = proprietaire.rows.length > 0;
            const isLocataire = locataire.rows.length > 0 && probleme.id_locataire === locataire.rows[0].id_locataire;
            if (!isProprietaire && !isLocataire) {
                return res.status(403).json({ message: "Vous n'avez pas accès à ce problème" });
            }
            res.json(probleme);
        } catch (error) {
            console.error('Erreur récupération problème:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async updateStatut(req, res) {
        try {
            const { id } = req.params;
            const { statut } = req.body;
            const probleme = await Probleme.findById(id);
            if (!probleme) return res.status(404).json({ message: 'Problème non trouvé' });
            const proprietaire = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
            if (proprietaire.rows.length === 0) {
                return res.status(403).json({ message: 'Seul le propriétaire peut modifier le statut' });
            }
            const statutsValides = ['ouvert', 'en_cours', 'resolu', 'ferme'];
            if (!statutsValides.includes(statut)) return res.status(400).json({ message: 'Statut invalide' });
            const problemeMisAJour = await Probleme.updateStatut(id, statut);
            res.json({ message: 'Statut mis à jour avec succès', probleme: problemeMisAJour });
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async gererProbleme(req, res) {
        try {
            const { id } = req.params;
            const { statut, montant_depense, description_travaux } = req.body;

            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );
            if (proprietaire.rows.length === 0) {
                return res.status(403).json({ message: 'Seul le propriétaire peut gérer un problème' });
            }

            const problemeResult = await db.query(
                'SELECT * FROM problemes WHERE id_probleme = $1',
                [id]
            );
            if (problemeResult.rows.length === 0) {
                return res.status(404).json({ message: 'Problème non trouvé' });
            }
            const probleme = problemeResult.rows[0];

            const statutsValides = ['ouvert', 'en_cours', 'resolu', 'ferme'];
            if (statut && !statutsValides.includes(statut)) {
                return res.status(400).json({ message: 'Statut invalide' });
            }

            let problemeMisAJour = probleme;
            if (statut) {
                const updateResult = await db.query(
                    'UPDATE problemes SET statut_probleme = $1 WHERE id_probleme = $2 RETURNING *',
                    [statut, id]
                );
                problemeMisAJour = updateResult.rows[0];
            }

            let charge = null;
            if (montant_depense && parseFloat(montant_depense) > 0) {
                const contrat = await db.query(
                    `SELECT id_contact FROM contact WHERE id_locataire = $1 AND id_bien = $2 AND statut_contrat = 'actif' LIMIT 1`,
                    [probleme.id_locataire, probleme.id_bien]
                );
                if (contrat.rows.length === 0) {
                    return res.json({
                        message: 'Statut mis à jour. Aucun contrat actif trouvé pour ajouter la charge.',
                        probleme: problemeMisAJour,
                        charge: null
                    });
                }
                const numeroTransaction = 'CHG-' + Date.now();
                const insertCharge = await db.query(
                    `INSERT INTO payement (id_contact, numero_transaction, montant, statut_paiement, date_paiement)
                     VALUES ($1, $2, $3, 'en_attente', NOW()) RETURNING *`,
                    [
                        contrat.rows[0].id_contact,
                        numeroTransaction,
                        parseFloat(montant_depense)
                    ]
                );
                charge = insertCharge.rows[0];

                // Créer une notification pour le locataire
                try {
                    await db.query(
                        `INSERT INTO notification (id_utilisateur, titre, message, type, lu)
                         VALUES (
                            (SELECT id_utilisateur FROM locataire WHERE id_locataire = $1),
                            'Nouvelle charge ajoutée',
                            $2,
                            'charge',
                            false
                         )`,
                        [
                            probleme.id_locataire,
                            `Une charge de ${parseFloat(montant_depense).toLocaleString('fr-FR')} FCFA a été ajoutée pour la réparation : ${probleme.titre}`
                        ]
                    );
                } catch (notifError) {
                    console.error('Erreur création notification locataire:', notifError);
                    // Ne pas bloquer le processus si la notification échoue
                }
            }

            res.json({
                message: charge
                    ? "Problème géré et charge ajoutée au locataire avec succès."
                    : "Statut du problème mis à jour avec succès.",
                probleme: problemeMisAJour,
                charge
            });

        } catch (error) {
            console.error('Erreur gestion problème:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async getProblemesByStatut(req, res) {
        try {
            const { statut } = req.params;
            let problemes;
            if (req.user.type === 'proprietaire') {
                const proprietaire = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
                problemes = await Probleme.findByStatut(statut, proprietaire.rows[0]?.id_proprietaire);
            } else {
                problemes = await Probleme.findByStatut(statut);
            }
            res.json(problemes);
        } catch (error) {
            console.error('Erreur récupération problèmes par statut:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    async getStats(req, res) {
        try {
            let stats;
            if (req.user.type === 'proprietaire') {
                const proprietaire = await db.query('SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1', [req.user.id]);
                stats = await Probleme.getStats(proprietaire.rows[0]?.id_proprietaire);
            } else {
                stats = await Probleme.getStats();
            }
            res.json(stats);
        } catch (error) {
            console.error('Erreur stats problèmes:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = problemeController;
