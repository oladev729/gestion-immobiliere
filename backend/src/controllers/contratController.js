const Contrat = require('../models/Contrat');
const db = require('../config/database');

const contratController = {
    // ============================================================
    // CRÉER UN NOUVEAU CONTRAT
    // ============================================================
    async create(req, res) {
        try {
            // Vérifier que l'utilisateur est bien propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Seul un propriétaire peut créer un contrat' 
                });
            }

            // Vérifier que le bien appartient bien à ce propriétaire
            const bien = await db.query(
                'SELECT id_proprietaire, statut FROM bien WHERE id_bien = $1',
                [req.body.id_bien]
            );

            if (bien.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Bien non trouvé' 
                });
            }

            if (bien.rows[0].id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ 
                    message: 'Ce bien ne vous appartient pas' 
                });
            }

            if (bien.rows[0].statut !== 'disponible') {
                return res.status(400).json({ 
                    message: 'Ce bien n\'est pas disponible pour la location' 
                });
            }

            // Vérifier que le locataire existe
            const locataire = await db.query(
                'SELECT * FROM locataire WHERE id_locataire = $1',
                [req.body.id_locataire]
            );

            if (locataire.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Locataire non trouvé' 
                });
            }

            // Générer un numéro de contrat unique si non fourni
            if (!req.body.numero_contrat) {
                const annee = new Date().getFullYear();
                const count = await db.query(
                    'SELECT COUNT(*) FROM contact WHERE EXTRACT(YEAR FROM date_creation) = $1',
                    [annee]
                );
                const numero = (parseInt(count.rows[0].count) + 1).toString().padStart(4, '0');
                req.body.numero_contrat = `CT-${annee}-${numero}`;
            }

            const newContrat = await Contrat.create({
                ...req.body,
                statut_contrat: 'en_attente'
            });

            // Créer une notification pour le locataire
            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 SELECT $1, 'Nouveau contrat', 
                 'Un contrat de location a été créé pour le bien ' || $2, 
                 'contrat'`,
                [locataire.rows[0].id_utilisateur, req.body.id_bien]
            );

            res.status(201).json({
                message: 'Contrat créé avec succès',
                contrat: newContrat
            });

        } catch (error) {
            console.error('Erreur création contrat:', error);
            res.status(500).json({ 
                message: error.message || 'Erreur serveur' 
            });
        }
    },

    // ============================================================
    // RÉCUPÉRER MES CONTRATS (propriétaire)
    // ============================================================
    async getMyContrats(req, res) {
        try {
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const contrats = await Contrat.findByProprietaire(proprietaire.rows[0].id_proprietaire);
            res.json(contrats);

        } catch (error) {
            console.error('Erreur récupération contrats:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER MES CONTRATS (locataire)
    // ============================================================
    async getMyContratsLocataire(req, res) {
        try {
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const contrats = await Contrat.findByLocataire(locataire.rows[0].id_locataire);
            res.json(contrats);

        } catch (error) {
            console.error('Erreur récupération contrats locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER UN CONTRAT PAR ID
    // ============================================================
    async getContratById(req, res) {
        try {
            const contrat = await Contrat.findById(req.params.id);
            
            if (!contrat) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Vérifier les droits d'accès
            const user = req.user;
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [user.id]
            );
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [user.id]
            );

            const isProprietaire = proprietaire.rows.length > 0 && 
                contrat.id_proprietaire === proprietaire.rows[0].id_proprietaire;
            const isLocataire = locataire.rows.length > 0 && 
                contrat.id_locataire === locataire.rows[0].id_locataire;

            if (!isProprietaire && !isLocataire) {
                return res.status(403).json({ 
                    message: 'Vous n\'avez pas accès à ce contrat' 
                });
            }

            res.json(contrat);

        } catch (error) {
            console.error('Erreur récupération contrat:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // METTRE À JOUR UN CONTRAT
    // ============================================================
    async update(req, res) {
        try {
            const contrat = await Contrat.findById(req.params.id);
            
            if (!contrat) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Vérifier que l'utilisateur est bien le propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0 || 
                contrat.id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à modifier ce contrat' 
                });
            }

            // Ne pas permettre la modification du statut via cette route
            delete req.body.statut_contrat;

            const updatedContrat = await Contrat.update(req.params.id, req.body);

            res.json({
                message: 'Contrat mis à jour avec succès',
                contrat: updatedContrat
            });

        } catch (error) {
            console.error('Erreur mise à jour contrat:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // TERMINER UN CONTRAT
    // ============================================================
    async terminer(req, res) {
        try {
            const contrat = await Contrat.findById(req.params.id);
            
            if (!contrat) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Vérifier les droits
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0 || 
                contrat.id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ 
                    message: 'Seul le propriétaire peut terminer ce contrat' 
                });
            }

            const updatedContrat = await Contrat.terminer(req.params.id);

            res.json({
                message: 'Contrat terminé avec succès',
                contrat: updatedContrat
            });

        } catch (error) {
            console.error('Erreur terminaison contrat:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉSILIER UN CONTRAT
    // ============================================================
    async resilier(req, res) {
        try {
            const contrat = await Contrat.findById(req.params.id);
            
            if (!contrat) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Vérifier les droits (propriétaire ou locataire)
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            const isProprietaire = proprietaire.rows.length > 0 && 
                contrat.id_proprietaire === proprietaire.rows[0].id_proprietaire;
            const isLocataire = locataire.rows.length > 0 && 
                contrat.id_locataire === locataire.rows[0].id_locataire;

            if (!isProprietaire && !isLocataire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à résilier ce contrat' 
                });
            }

            const updatedContrat = await Contrat.resilier(req.params.id);

            res.json({
                message: 'Contrat résilié avec succès',
                contrat: updatedContrat
            });

        } catch (error) {
            console.error('Erreur résiliation contrat:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // ACCEPTER UN CONTRAT (locataire)
    // ============================================================
    async accepter(req, res) {
        try {
            const contrat = await Contrat.findById(req.params.id);
            
            if (!contrat) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            // Vérifier que l'utilisateur est bien le locataire du contrat
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0 || 
                contrat.id_locataire !== locataire.rows[0].id_locataire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à accepter ce contrat' 
                });
            }

            const updatedContrat = await Contrat.update(req.params.id, { 
                statut_contrat: 'actif',
                date_signature: new Date()
            });

            // Notifier le propriétaire
            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 SELECT u.id_utilisateur, 'Contrat accepté', 
                 'Le locataire a accepté le contrat pour le bien ' || b.titre, 
                 'contrat'
                 FROM proprietaire p
                 JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
                 JOIN bien b ON b.id_proprietaire = p.id_proprietaire
                 WHERE p.id_proprietaire = $1 AND b.id_bien = $2`,
                [contrat.id_proprietaire, contrat.id_bien]
            );

            res.json({
                message: 'Contrat accepté avec succès',
                contrat: updatedContrat
            });

        } catch (error) {
            console.error('Erreur acceptation contrat:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES CONTRATS ACTIFS
    // ============================================================
    async getContratsActifs(req, res) {
        try {
            const contrats = await Contrat.findActifs();
            res.json(contrats);
        } catch (error) {
            console.error('Erreur récupération contrats actifs:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES CONTRATS EXPIRE BIENTÔT
    // ============================================================
    async getContratsExpirants(req, res) {
        try {
            const { jours = 30 } = req.query;
            const contrats = await Contrat.findExpirantDans(jours);
            res.json(contrats);
        } catch (error) {
            console.error('Erreur récupération contrats expirants:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // STATISTIQUES DES CONTRATS
    // ============================================================
    async getStats(req, res) {
        try {
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            let stats;
            if (proprietaire.rows.length > 0) {
                stats = await Contrat.countByStatut(proprietaire.rows[0].id_proprietaire);
            } else {
                stats = await Contrat.countByStatut();
            }

            res.json(stats);

        } catch (error) {
            console.error('Erreur stats contrats:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = contratController;