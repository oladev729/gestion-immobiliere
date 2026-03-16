const Probleme = require('../models/Probleme');
const db = require('../config/database');

const problemeController = {
    // ============================================================
    // CRÉER UN SIGNALEMENT (locataire)
    // ============================================================
    async create(req, res) {
        try {
            const { id_bien, titre, description, categorie, priorite } = req.body;

            // Vérifier que l'utilisateur est un locataire
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Seul un locataire peut signaler un problème' 
                });
            }

            // Vérifier que le bien existe
            const bien = await db.query(
                'SELECT id_proprietaire, titre FROM bien WHERE id_bien = $1',
                [id_bien]
            );

            if (bien.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Bien non trouvé' 
                });
            }

            // Vérifier que le locataire est bien locataire de ce bien (contrat actif)
            const contratActif = await db.query(
                `SELECT * FROM contact 
                 WHERE id_locataire = $1 AND id_bien = $2 AND statut_contrat = 'actif'`,
                [locataire.rows[0].id_locataire, id_bien]
            );

            if (contratActif.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas locataire de ce bien' 
                });
            }

            const probleme = await Probleme.create({
                id_locataire: locataire.rows[0].id_locataire,
                id_bien,
                titre,
                description,
                categorie,
                priorite
            });

            res.status(201).json({
                message: 'Problème signalé avec succès',
                probleme
            });

        } catch (error) {
            console.error('Erreur création problème:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR MES SIGNALEMENTS (locataire connecté)
    // ============================================================
    async getMesProblemes(req, res) {
        try {
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const problemes = await Probleme.findByLocataire(locataire.rows[0].id_locataire);
            res.json(problemes);

        } catch (error) {
            console.error('Erreur récupération mes problèmes:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR LES SIGNALEMENTS REÇUS (propriétaire connecté)
    // ============================================================
    async getProblemesRecus(req, res) {
        try {
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const problemes = await Probleme.findByProprietaire(proprietaire.rows[0].id_proprietaire);
            res.json(problemes);

        } catch (error) {
            console.error('Erreur récupération problèmes reçus:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR LES SIGNALEMENTS D'UN BIEN
    // ============================================================
    async getProblemesByBien(req, res) {
        try {
            const { id_bien } = req.params;

            // Vérifier les droits d'accès
            const bien = await db.query(
                'SELECT id_proprietaire FROM bien WHERE id_bien = $1',
                [id_bien]
            );

            if (bien.rows.length === 0) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            // Vérifier si l'utilisateur est le propriétaire ou un locataire du bien
            const isProprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            const isLocataire = await db.query(
                `SELECT * FROM contact 
                 WHERE id_locataire = (SELECT id_locataire FROM locataire WHERE id_utilisateur = $1)
                 AND id_bien = $2 AND statut_contrat = 'actif'`,
                [req.user.id, id_bien]
            );

            if ((isProprietaire.rows.length === 0 || isProprietaire.rows[0].id_proprietaire !== bien.rows[0].id_proprietaire) 
                && isLocataire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Vous n\'avez pas accès aux problèmes de ce bien' 
                });
            }

            const problemes = await Probleme.findByBien(id_bien);
            res.json(problemes);

        } catch (error) {
            console.error('Erreur récupération problèmes du bien:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR UN SIGNALEMENT PAR ID
    // ============================================================
    async getProblemeById(req, res) {
        try {
            const { id } = req.params;
            const probleme = await Probleme.findById(id);

            if (!probleme) {
                return res.status(404).json({ message: 'Problème non trouvé' });
            }

            // Vérifier les droits d'accès
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            const isProprietaire = proprietaire.rows.length > 0;
            const isLocataire = locataire.rows.length > 0 && 
                probleme.id_locataire === locataire.rows[0].id_locataire;

            if (!isProprietaire && !isLocataire) {
                return res.status(403).json({ 
                    message: 'Vous n\'avez pas accès à ce problème' 
                });
            }

            res.json(probleme);

        } catch (error) {
            console.error('Erreur récupération problème:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // METTRE À JOUR LE STATUT D'UN PROBLÈME
    // ============================================================
    async updateStatut(req, res) {
        try {
            const { id } = req.params;
            const { statut } = req.body;

            const probleme = await Probleme.findById(id);

            if (!probleme) {
                return res.status(404).json({ message: 'Problème non trouvé' });
            }

            // Vérifier que l'utilisateur est le propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Seul le propriétaire peut modifier le statut' 
                });
            }

            const statutsValides = ['ouvert', 'en_cours', 'resolu', 'ferme'];
            if (!statutsValides.includes(statut)) {
                return res.status(400).json({ 
                    message: 'Statut invalide' 
                });
            }

            const problemeMisAJour = await Probleme.updateStatut(id, statut);

            res.json({
                message: 'Statut mis à jour avec succès',
                probleme: problemeMisAJour
            });

        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR LES PROBLÈMES PAR STATUT
    // ============================================================
    async getProblemesByStatut(req, res) {
        try {
            const { statut } = req.params;
            
            let problemes;
            if (req.user.type === 'proprietaire') {
                const proprietaire = await db.query(
                    'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                    [req.user.id]
                );
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

    // ============================================================
    // STATISTIQUES DES PROBLÈMES
    // ============================================================
    async getStats(req, res) {
        try {
            let stats;
            
            if (req.user.type === 'proprietaire') {
                const proprietaire = await db.query(
                    'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                    [req.user.id]
                );
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