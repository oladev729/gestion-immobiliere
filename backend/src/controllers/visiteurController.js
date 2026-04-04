const DemandeInscriptionVisiteur = require('../models/DemandeInscriptionVisiteur');
const InvitationLocataire = require('../models/InvitationLocataire');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const visiteurController = {
    // ============================================================
    // DEMANDE D'INSCRIPTION (visiteur)
    // ============================================================
    async demandeInscription(req, res) {
        try {
            const { nom, prenoms, email, telephone, message } = req.body;

            // Vérifier si l'email existe déjà
            const existing = await DemandeInscriptionVisiteur.findByEmail(email);
            if (existing) {
                return res.status(400).json({ 
                    message: 'Une demande avec cet email existe déjà' 
                });
            }

            const demande = await DemandeInscriptionVisiteur.create({
                nom, prenoms, email, telephone, message
            });

            res.status(201).json({
                message: 'Demande d\'inscription envoyée avec succès',
                demande
            });

        } catch (error) {
            console.error('Erreur demande inscription:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR TOUTES LES DEMANDES (propriétaire/admin)
    // ============================================================
    async getDemandes(req, res) {
        try {
            const { statut } = req.query;
            const demandes = await DemandeInscriptionVisiteur.findAll(statut);
            res.json(demandes);
        } catch (error) {
            console.error('Erreur récupération demandes:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR UNE DEMANDE PAR ID
    // ============================================================
    async getDemandeById(req, res) {
        try {
            const { id } = req.params;
            const demande = await DemandeInscriptionVisiteur.findById(id);
            
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }
            
            res.json(demande);
        } catch (error) {
            console.error('Erreur récupération demande:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // ENVOYER UNE INVITATION (propriétaire)
    // ============================================================
    async envoyerInvitation(req, res) {
        try {
            const { id_demande } = req.params;
            const proprietaireId = req.user.id;

            // Récupérer l'ID du propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [proprietaireId]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Seul un propriétaire peut envoyer une invitation' 
                });
            }

            // Vérifier que la demande existe
            const demande = await DemandeInscriptionVisiteur.findById(id_demande);
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }

            if (demande.statut !== 'en_attente') {
                return res.status(400).json({ 
                    message: 'Cette demande a déjà été traitée' 
                });
            }

            const invitation = await InvitationLocataire.create({
                id_demande,
                id_proprietaire: proprietaire.rows[0].id_proprietaire
            });

            // Ici, tu enverrais un email avec le lien d'invitation
            const invitationUrl = `http://localhost:5173/register-from-invite?token=${invitation.token}`;
            console.log('🔗 Lien d\'invitation:', invitationUrl);

            res.status(201).json({
                message: 'Invitation envoyée avec succès',
                invitation: {
                    ...invitation,
                    invitation_url: invitationUrl
                }
            });

        } catch (error) {
            console.error('Erreur envoi invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VALIDER UNE INVITATION (pour inscription)
    // ============================================================
    async validerInvitation(req, res) {
        try {
            const { token } = req.params;
            const invitation = await InvitationLocataire.validerToken(token);
            
            if (!invitation) {
                return res.status(400).json({ 
                    message: 'Invitation invalide ou déjà utilisée' 
                });
            }

            const demande = await DemandeInscriptionVisiteur.findById(invitation.id_demande);
            
            res.json({
                message: 'Invitation valide',
                invitation,
                demande: {
                    nom: demande.nom,
                    prenoms: demande.prenoms,
                    email: demande.email,
                    telephone: demande.telephone
                }
            });

        } catch (error) {
            console.error('Erreur validation invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // CONFIRMER INSCRIPTION APRÈS INVITATION
    // ============================================================
    async confirmerInscription(req, res) {
        try {
            const { token, mot_de_passe } = req.body;
            
            const invitation = await InvitationLocataire.validerToken(token);
            if (!invitation) {
                return res.status(400).json({ 
                    message: 'Invitation invalide ou déjà utilisée' 
                });
            }

            const demande = await DemandeInscriptionVisiteur.findById(invitation.id_demande);
            
            // Créer l'utilisateur locataire
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            const newUser = await db.query(
                `INSERT INTO utilisateur (nom, prenoms, email, telephone, mot_de_passe, type_utilisateur)
                 VALUES ($1, $2, $3, $4, $5, 'locataire')
                 RETURNING id_utilisateur`,
                [demande.nom, demande.prenoms, demande.email, demande.telephone, hashedPassword]
            );

            // Créer l'entrée locataire
            await db.query(
                `INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite)
                 VALUES ($1, true, $2)`,
                [newUser.rows[0].id_utilisateur, demande.email]
            );

            // Marquer l'invitation comme utilisée
            await InvitationLocataire.marquerUtilisee(invitation.id_invitation);

            res.status(201).json({
                message: 'Inscription confirmée avec succès',
                user: {
                    id: newUser.rows[0].id_utilisateur,
                    nom: demande.nom,
                    prenoms: demande.prenoms,
                    email: demande.email
                }
            });

        } catch (error) {
            console.error('Erreur confirmation inscription:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // STATISTIQUES DES DEMANDES ET INVITATIONS
    // ============================================================
    async getStats(req, res) {
        try {
            const demandesStats = await DemandeInscriptionVisiteur.getStats();
            const invitationsStats = await InvitationLocataire.getStats();
            
            res.json({
                demandes: demandesStats,
                invitations: invitationsStats
            });
        } catch (error) {
            console.error('Erreur stats:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = visiteurController;