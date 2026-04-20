const DemandeVisite = require('../models/DemandeVisite');
const db = require('../config/database');

const demandeVisiteController = {
    // ============================================================
    // CRÉER UNE DEMANDE DE VISITE (locataire)
    // ============================================================
    async create(req, res) {
        try {
            const { id_bien, date_visite, message } = req.body;

            // Vérifier que l'utilisateur est un locataire
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Seul un locataire peut faire une demande de visite' 
                });
            }

            // Récupérer les infos du bien
            const bien = await db.query(
                'SELECT id_proprietaire, titre FROM bien WHERE id_bien = $1',
                [id_bien]
            );

            if (bien.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Bien non trouvé' 
                });
            }

            // Vérifier les demandes existantes
            const demandeExistante = await db.query(
                `SELECT * FROM demander_visite 
                 WHERE id_locataire = $1 AND id_bien = $2 AND statut_demande = 'en_attente'`,
                [locataire.rows[0].id_locataire, id_bien]
            );

            if (demandeExistante.rows.length > 0) {
                return res.status(400).json({ 
                    message: 'Vous avez déjà une demande en attente pour ce bien' 
                });
            }

            // Formater la date pour timestamp without time zone
            // PostgreSQL accepte les formats ISO avec T ou avec espace
            let formattedDate = date_visite;
            if (typeof date_visite === 'string') {
                // Garder le format ISO (avec T) ou avec espace, les deux marchent
                formattedDate = date_visite;
            }

            const demande = await DemandeVisite.create({
                id_locataire: locataire.rows[0].id_locataire,
                id_bien,
                id_proprietaire: bien.rows[0].id_proprietaire,
                date_visite: formattedDate,
                message
            });

            res.status(201).json({
                message: 'Demande de visite créée avec succès',
                demande
            });

        } catch (error) {
            console.error('Erreur création demande:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR MES DEMANDES (locataire connecté)
    // ============================================================
    async getMesDemandes(req, res) {
        try {
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const demandes = await DemandeVisite.findMesDemandes(locataire.rows[0].id_locataire);
            res.json(demandes);

        } catch (error) {
            console.error('Erreur récupération mes demandes:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR LES DEMANDES REÇUES (propriétaire connecté)
    // ============================================================
    async getDemandesRecues(req, res) {
        try {
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const demandes = await DemandeVisite.findDemandesRecues(proprietaire.rows[0].id_proprietaire);
            res.json(demandes);

        } catch (error) {
            console.error('Erreur récupération demandes reçues:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // ACCEPTER UNE DEMANDE (propriétaire)
    // ============================================================
    async accepter(req, res) {
        try {
            const { id } = req.params;

            // Vérifier que la demande existe
            const demande = await DemandeVisite.findById(id);
            
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }

            // Pour les visiteurs, pas de vérification de propriétaire (pas de table proprietaire associée)
            if (demande.type_demandeur === 'visiteur') {
                // Mettre à jour le statut pour les visiteurs
                await db.query(
                    'UPDATE demande_inscription_visiteur SET statut = $1 WHERE id_demande = $2',
                    ['acceptee', id]
                );
                
                return res.json({ message: 'Demande de visiteur acceptée avec succès' });
            }

            // Pour les locataires, vérifier que l'utilisateur est le propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0 || 
                demande.id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à traiter cette demande' 
                });
            }

            // Vérifier que la demande est en attente
            if (demande.statut_demande !== 'en_attente') {
                return res.status(400).json({ 
                    message: 'Cette demande a déjà été traitée' 
                });
            }

            const demandeAcceptee = await DemandeVisite.accepter(id);

            res.json({
                message: 'Demande acceptée',
                demande: demandeAcceptee
            });

        } catch (error) {
            console.error('Erreur acceptation demande:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // REFUSER UNE DEMANDE (propriétaire)
    // ============================================================
    async refuser(req, res) {
        try {
            const { id } = req.params;

            const demande = await DemandeVisite.findById(id);
            
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }

            // Pour les visiteurs, pas de vérification de propriétaire (pas de table proprietaire associée)
            if (demande.type_demandeur === 'visiteur') {
                // Mettre à jour le statut pour les visiteurs
                await db.query(
                    'UPDATE demande_inscription_visiteur SET statut = $1 WHERE id_demande = $2',
                    ['refusee', id]
                );
                
                return res.json({ message: 'Demande de visiteur refusée avec succès' });
            }

            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0 || 
                demande.id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à traiter cette demande' 
                });
            }

            if (demande.statut_demande !== 'en_attente') {
                return res.status(400).json({ 
                    message: 'Cette demande a déjà été traitée' 
                });
            }

            const demandeRefusee = await DemandeVisite.refuser(id);

            res.json({
                message: 'Demande refusée',
                demande: demandeRefusee
            });

        } catch (error) {
            console.error('Erreur refus demande:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // ANNULER UNE DEMANDE (locataire)
    // ============================================================
    async annuler(req, res) {
        try {
            const { id } = req.params;

            const demande = await DemandeVisite.findById(id);
            
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }

            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0 || 
                demande.id_locataire !== locataire.rows[0].id_locataire) {
                return res.status(403).json({ 
                    message: 'Vous n\'êtes pas autorisé à annuler cette demande' 
                });
            }

            if (demande.statut_demande !== 'en_attente') {
                return res.status(400).json({ 
                    message: 'Cette demande ne peut plus être annulée' 
                });
            }

            const demandeAnnulee = await DemandeVisite.annuler(id);

            res.json({
                message: 'Demande annulée avec succès',
                demande: demandeAnnulee
            });

        } catch (error) {
            console.error('Erreur annulation demande:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR LES DEMANDES EN ATTENTE
    // ============================================================
    async getDemandesEnAttente(req, res) {
        try {
            let demandes;
            
            if (req.user.type === 'proprietaire') {
                const proprietaire = await db.query(
                    'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                    [req.user.id]
                );
                demandes = await DemandeVisite.findEnAttente(proprietaire.rows[0]?.id_proprietaire);
            } else {
                demandes = await DemandeVisite.findEnAttente();
            }

            res.json(demandes);

        } catch (error) {
            console.error('Erreur récupération demandes en attente:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // STATISTIQUES DES DEMANDES
    // ============================================================
    async getStats(req, res) {
        try {
            let stats;
            
            if (req.user.type === 'proprietaire') {
                const proprietaire = await db.query(
                    'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                    [req.user.id]
                );
                stats = await DemandeVisite.getStats(proprietaire.rows[0]?.id_proprietaire);
            } else {
                stats = await DemandeVisite.getStats();
            }

            res.json(stats);

        } catch (error) {
            console.error('Erreur stats demandes:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = demandeVisiteController;