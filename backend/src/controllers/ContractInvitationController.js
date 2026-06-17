const InvitationLocataire = require('../models/InvitationLocataire');
const db = require('../config/database');

class ContractInvitationController {
    // ============================================================
    // CRÉER UNE INVITATION (propriétaire)
    // ============================================================
    static async createInvitation(req, res) {
        try {
            const { id_demande } = req.body;
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(404).json({ message: 'Propriétaire non trouvé' });
            }

            const invitation = await InvitationLocataire.create({
                id_demande,
                id_proprietaire: proprietaire.rows[0].id_proprietaire
            });

            res.status(201).json(invitation);
        } catch (error) {
            console.error('Erreur création invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // ============================================================
    // CRÉER UNE INVITATION DE CONTRAT (pour locataire existant)
    // ============================================================
    static async createContractInvitation(req, res) {
        try {
            const { id_locataire, id_contact, id_bien } = req.body;
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(404).json({ message: 'Propriétaire non trouvé' });
            }

            if (!id_locataire || !id_contact || !id_bien) {
                return res.status(400).json({ message: 'id_locataire, id_contact et id_bien sont requis' });
            }

            const invitation = await InvitationLocataire.createContractInvitation({
                id_locataire,
                id_proprietaire: proprietaire.rows[0].id_proprietaire,
                id_contact,
                id_bien
            });

            res.status(201).json(invitation);
        } catch (error) {
            console.error('Erreur création invitation contrat:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // ============================================================
    // RÉCUPÉRER UNE INVITATION PAR TOKEN
    // ============================================================
    static async getInvitationByToken(req, res) {
        try {
            const { token } = req.params;
            const invitation = await InvitationLocataire.findByToken(token);

            if (!invitation) {
                return res.status(404).json({ message: 'Invitation non trouvée' });
            }

            res.json(invitation);
        } catch (error) {
            console.error('Erreur récupération invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // ============================================================
    // ACCEPTER UNE INVITATION
    // ============================================================
    static async acceptInvitation(req, res) {
        try {
            const { token } = req.params;
            const invitation = await InvitationLocataire.validerToken(token);

            if (!invitation) {
                return res.status(404).json({ message: 'Invitation invalide ou expirée' });
            }

            const updated = await InvitationLocataire.marquerUtilisee(invitation.id_invitation);
            res.json({ message: 'Invitation acceptée avec succès', invitation: updated });
        } catch (error) {
            console.error('Erreur acceptation invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // ============================================================
    // REFUSER UNE INVITATION
    // ============================================================
    static async rejectInvitation(req, res) {
        try {
            const { token } = req.params;
            const invitation = await InvitationLocataire.findByToken(token);

            if (!invitation) {
                return res.status(404).json({ message: 'Invitation non trouvée' });
            }

            const updated = await InvitationLocataire.annuler(invitation.id_invitation);
            res.json({ message: 'Invitation refusée', invitation: updated });
        } catch (error) {
            console.error('Erreur refus invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // ============================================================
    // RÉCUPÉRER LES INVITATIONS REÇUES PAR UN LOCATAIRE
    // ============================================================
    static async getReceivedInvitations(req, res) {
        try {
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(404).json({ message: 'Locataire non trouvé' });
            }

            const id_locataire = locataire.rows[0].id_locataire;

            // Récupérer les invitations envoyées directement à ce locataire
            const query = `
                SELECT i.*,
                       b.titre as bien_titre,
                       b.adresse as bien_adresse,
                       b.ville as bien_ville,
                       u.nom as proprietaire_nom,
                       u.prenoms as proprietaire_prenoms,
                       u.email as proprietaire_email,
                       c.numero_contrat,
                       c.date_debut,
                       c.date_fin,
                       c.loyer_mensuel
                FROM invitation_locataire i
                LEFT JOIN bien b ON i.id_bien = b.id_bien
                LEFT JOIN utilisateur u ON i.id_proprietaire = u.id_utilisateur
                LEFT JOIN contact c ON i.id_contact = c.id_contact
                WHERE i.id_locataire = $1
                ORDER BY i.date_invitation DESC
            `;

            const result = await db.query(query, [id_locataire]);
            res.json({ invitations: result.rows });
        } catch (error) {
            console.error('Erreur récupération invitations reçues:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
}

module.exports = ContractInvitationController;
