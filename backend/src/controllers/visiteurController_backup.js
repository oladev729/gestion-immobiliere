const DemandeInscriptionVisiteur = require('../models/DemandeInscriptionVisiteur');
const InvitationLocataire = require('../models/InvitationLocataire');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const visiteurController = {
    // ============================================================
    // DEMANDE D'INSCRIPTION (visiteur)
    // ============================================================
    async demandeInscription(req, res) {
        console.log('📥 Nouvelle demande d\'inscription reçue:', req.body);
        try {
            const { nom, prenoms, email, telephone, message } = req.body;

            if (!email) {
                console.warn('⚠️ Tentative d\'inscription sans email');
                return res.status(400).json({ message: 'L\'email est requis' });
            }

            // Vérifier si l'email existe déjà
            console.log('🔍 Vérification de l\'existence de l\'email:', email);
            const existing = await DemandeInscriptionVisiteur.findByEmail(email);
            if (existing) {
                console.log('❌ Email déjà existant');
                return res.status(400).json({ 
                    message: 'Une demande avec cet email existe déjà' 
                });
            }

            console.log('💾 Création de la demande...');
            const demande = await DemandeInscriptionVisiteur.create({
                nom, prenoms, email, telephone, message
            });

            console.log('✅ Demande créée avec succès');
            res.status(201).json({
                message: 'Demande d\'inscription envoyée avec succès',
                demande
            });

        } catch (error) {
            console.error('🔥 Erreur CRITIQUE demande inscription:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: error.message,
                stack: error.stack
            });
        }
    },

    // ============================================================
    // VOIR TOUTES LES DEMANDES (propriétaire/admin)
    // ============================================================
    async getDemandes(req, res) {
        console.log('📥 Récupération de toutes les demandes');
        try {
            const { statut } = req.query;
            const demandes = await DemandeInscriptionVisiteur.findAll(statut);
            console.log(`✅ ${demandes.length} demandes récupérées`);
            res.json(demandes);
        } catch (error) {
            console.error('🔥 Erreur récupération demandes:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: error.message 
            });
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
            const { token, mot_de_passe, telephone } = req.body;
            
            const invitation = await InvitationLocataire.validerToken(token);
            if (!invitation) {
                return res.status(400).json({ 
                    message: 'Invitation invalide ou déjà utilisée' 
                });
            }

            const demande = await DemandeInscriptionVisiteur.findById(invitation.id_demande);
            if (!demande) {
                return res.status(404).json({ message: 'Demande non trouvée' });
            }

            // Mettre à jour l'utilisateur locataire existant (créé lors de l'invitation)
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            
            const updatedUser = await db.query(
                `UPDATE utilisateur 
                 SET mot_de_passe = $1, telephone = $2, statut = 'actif'
                 WHERE email = $3
                 RETURNING id_utilisateur, nom, prenoms, email`,
                [hashedPassword, telephone || demande.telephone, demande.email]
            );

            if (updatedUser.rows.length === 0) {
                // Si l'utilisateur n'existait pas (fallback au cas où), on le crée
                const newUser = await db.query(
                    `INSERT INTO utilisateur (nom, prenoms, email, telephone, mot_de_passe, type_utilisateur)
                     VALUES ($1, $2, $3, $4, $5, 'locataire')
                     RETURNING id_utilisateur`,
                    [demande.nom, demande.prenoms, demande.email, telephone || demande.telephone, hashedPassword]
                );

                await db.query(
                    `INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite)
                     VALUES ($1, true, $2)`,
                    [newUser.rows[0].id_utilisateur, demande.email]
                );
            } else {
                // Mettre à jour l'entrée locataire
                await db.query(
                    `UPDATE locataire 
                     SET compte_confirme = true 
                     WHERE id_utilisateur = $1`,
                    [updatedUser.rows[0].id_utilisateur]
                );
            }

            // Marquer l'invitation comme utilisée
            await InvitationLocataire.marquerUtilisee(invitation.id_invitation);

            res.status(200).json({
                message: 'Inscription confirmée avec succès. Vous pouvez maintenant vous connecter.',
                user: updatedUser.rows[0] || {}
            });

        } catch (error) {
            console.error('Erreur confirmation inscription:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VOIR LES DEMANDES EN ATTENTE (pour la page inviter visiteur)
    // ============================================================
    async getDemandesEnAttente(req, res) {
        console.log('📥 Récupération des demandes en attente pour propriétaire:', req.user.id);
        
        try {
            // En mode démo (pool is null), on court-circuite la vérification réelle
            const isDemoMode = db.pool === null || db.pool === undefined;

            if (!isDemoMode) {
                // Vérifier que l'utilisateur est un propriétaire (Base réelle seulement)
                const proprietaire = await db.query(
                    'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                    [req.user.id]
                );

                if (proprietaire.rows.length === 0) {
                    console.warn('⚠️ Utilisateur non reconnu comme propriétaire:', req.user.id);
                    return res.status(403).json({ 
                        message: 'Seul un propriétaire peut voir les demandes en attente' 
                    });
                }
            }

            // Récupérer les demandes en attente
            const demandes = await db.query(`
                SELECT 
                    di.*
                FROM demande_inscription_visiteur di
                WHERE di.statut = 'en_attente'
                ORDER BY di.date_demande DESC
            `);

            console.log(`✅ ${demandes.rows.length} demandes en attente trouvées`);
            res.json({ demandes: demandes.rows });

        } catch (error) {
            console.error('🔥 Erreur récupération demandes en attente:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: error.message 
            });
        }
    },

    // ============================================================
    // INVITER UN VISITEUR (créer un compte locataire sans mot de passe)
    // ============================================================
    async inviterVisiteur(req, res) {
        try {
            const { demandeId } = req.params;
            const proprietaireId = req.user.id;
            const nodemailer = require('nodemailer');

            // 1. Vérifier que l'utilisateur est un propriétaire
            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [proprietaireId]
            );

            if (proprietaire.rows.length === 0) {
                return res.status(403).json({ 
                    message: 'Seul un propriétaire peut inviter un visiteur' 
                });
            }

            // 2. Récupérer la demande
            const demande = await db.query(
                'SELECT * FROM demande_inscription_visiteur WHERE id_demande = $1 AND statut = $2',
                [demandeId, 'en_attente']
            );

            if (demande.rows.length === 0) {
                return res.status(404).json({ 
                    message: 'Demande non trouvée ou déjà traitée' 
                });
            }

            const { nom, prenoms, email, telephone } = demande.rows[0];

            // 3. Créer le compte utilisateur (sans mot de passe réel pour l'instant)
            // On vérifie d'abord s'il existe déjà (sécurité)
            const userExists = await db.query('SELECT id_utilisateur FROM utilisateur WHERE email = $1', [email]);
            let id_utilisateur;

            if (userExists.rows.length === 0) {
                const randomPassword = require('crypto').randomBytes(16).toString('hex');
                const hashedPassword = await bcrypt.hash(randomPassword, 10);
                
                const newUser = await db.query(
                    `INSERT INTO utilisateur (nom, prenoms, email, telephone, mot_de_passe, type_utilisateur)
                     VALUES ($1, $2, $3, $4, $5, 'locataire')
                     RETURNING id_utilisateur`,
                    [nom, prenoms, email, telephone, hashedPassword]
                );
                id_utilisateur = newUser.rows[0].id_utilisateur;

                // Créer l'entrée locataire
                await db.query(
                    `INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite)
                     VALUES ($1, false, $2)`,
                    [id_utilisateur, email]
                );
            } else {
                id_utilisateur = userExists.rows[0].id_utilisateur;
            }

            // 4. Générer un token d'invitation
            const crypto = require('crypto');
            const token = crypto.randomBytes(32).toString('hex');

            // 5. Créer l'invitation
            await db.query(`
                INSERT INTO invitation_locataire (
                    id_demande, 
                    id_proprietaire, 
                    token, 
                    statut
                ) VALUES ($1, $2, $3, 'envoyee')
            `, [demandeId, proprietaire.rows[0].id_proprietaire, token]);

            // 6. Mettre à jour le statut de la demande
            await db.query(
                'UPDATE demande_inscription_visiteur SET statut = $1 WHERE id_demande = $2',
                ['invite', demandeId]
            );

            // 7. Envoyer l'email via Ethereal
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, 
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            const confirmationUrl = `http://localhost:5173/confirm-invitation?token=${token}`;
            
            const info = await transporter.sendMail({
                from: '"ImmoGest" <noreply@immogest.com>',
                to: email,
                subject: "Invitation à rejoindre ImmoGest",
                text: `Bonjour ${prenoms}, votre propriétaire vous invite à rejoindre ImmoGest. Cliquez ici pour confirmer votre compte : ${confirmationUrl}`,
                html: `<p>Bonjour <b>${prenoms}</b>,</p><p>Votre propriétaire vous invite à rejoindre <b>ImmoGest</b>.</p><p>Veuillez cliquer sur le bouton ci-dessous pour confirmer votre compte et choisir votre mot de passe :</p><a href="${confirmationUrl}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Confirmer mon compte</a>`,
            });

            console.log("📧 Message envoyé: %s", info.messageId);
            console.log("🔗 URL de visualisation de l'email: %s", nodemailer.getTestMessageUrl(info));

            res.json({
                message: 'Invitation envoyée avec succès',
                confirmation_url: confirmationUrl,
                ethereal_url: nodemailer.getTestMessageUrl(info),
                email_envoye: email
            });

        } catch (error) {
            console.error('Erreur invitation visiteur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // CONFIRMER UNE INVITATION (depuis l'email)
    // ============================================================
    async confirmInvitation(req, res) {
        try {
            const { token } = req.params;

            // Vérifier le token
            const invitation = await db.query(`
                SELECT 
                    il.*,
                    di.nom,
                    di.prenoms,
                    di.email,
                    di.telephone,
                    di.adresse,
                    di.ville,
                    di.pays
                FROM invitation_locataire il
                JOIN demande_inscription_visiteur di ON il.id_demande = di.id_demande
                WHERE il.token = $1 
                AND il.statut = 'envoyee'
                AND il.date_invitation > CURRENT_TIMESTAMP - INTERVAL '7 days'
            `, [token]);

            if (invitation.rows.length === 0) {
                return res.status(400).json({ 
                    message: 'Invitation invalide ou expirée' 
                });
            }

            // Rediriger vers la page d'inscription pré-remplie
            // En production, vous pourriez retourner une page HTML ou rediriger
            const inscriptionUrl = `http://localhost:5174/register-from-invite?token=${token}`;
            
            res.json({
                message: 'Invitation valide',
                redirection: inscriptionUrl,
                donnees: {
                    nom: invitation.rows[0].nom,
                    prenoms: invitation.rows[0].prenoms,
                    email: invitation.rows[0].email,
                    telephone: invitation.rows[0].telephone,
                    adresse: invitation.rows[0].adresse,
                    ville: invitation.rows[0].ville,
                    pays: invitation.rows[0].pays
                }
            });

        } catch (error) {
            console.error('Erreur confirmation invitation:', error);
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