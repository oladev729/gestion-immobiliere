const DemandeInscriptionVisiteur = require('../models/DemandeInscriptionVisiteur');
const InvitationLocataire = require('../models/InvitationLocataire');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const visiteurController = {
    // ============================================================
    // DEMANDE D'INSCRIPTION (visiteur)
    // ============================================================
    async demandeInscription(req, res) {
        console.log('?? Nouvelle demande d\'inscription reçue:', req.body);
        try {
            const { nom, prenoms, email, telephone, message } = req.body;

            if (!email) {
                console.warn('?? Tentative d\'inscription sans email');
                return res.status(400).json({ message: 'L\'email est requis' });
            }

            // Vérifier si l'email existe déjà
            console.log('?? Vérification de l\'existence de l\'email:', email);
            const existing = await DemandeInscriptionVisiteur.findByEmail(email);
            if (existing) {
                console.log('?? Email déjà existant');
                return res.status(400).json({ 
                    message: 'Une demande avec cet email existe déjà' 
                });
            }

            // Générer un code de suivi (Ex: VG-8273)
            const code_suivi = `VG-${Math.floor(1000 + Math.random() * 9000)}`;

            console.log('?? Création de la demande avec code:', code_suivi);
            const demande = await DemandeInscriptionVisiteur.create({
                nom, prenoms, email, telephone, message, code_suivi
            });

            console.log('?? Demande créée avec succès');
            res.status(201).json({
                message: 'Demande d\'inscription envoyée avec succès',
                code_suivi,
                demande
            });

        } catch (error) {
            console.error('?? Erreur CRITIQUE demande inscription:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: error.message,
                stack: error.stack
            });
        }
    },

    // ============================================================
    // DEMANDE DE VISITE POUR UN BIEN SPÉCIFIQUE (visiteur)
    // ============================================================
    async demandeVisiteBien(req, res) {
        console.log('?? Nouvelle demande de visite pour bien:', req.params.id_bien);
        try {
            const { id_bien } = req.params;
            const { nom, prenoms, email, telephone, message, date_visite_souhaitee } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'L\'email est requis' });
            }

            // Vérifier si le bien existe
            const bien = await db.query('SELECT * FROM bien WHERE id_bien = $1', [id_bien]);
            if (bien.rows.length === 0) {
                return res.status(404).json({ message: 'Bien non trouvé' });
            }

            // Vérifier si une demande existe déjà pour ce bien et cet email
            const existing = await db.query(
                'SELECT * FROM demande_inscription_visiteur WHERE id_bien = $1 AND email = $2 AND statut = $3',
                [id_bien, email, 'en_attente']
            );
            
            if (existing.rows.length > 0) {
                return res.status(400).json({ 
                    message: 'Une demande de visite existe déjà pour ce bien' 
                });
            }

            // Générer un code de suivi (Ex: VG-8273)
            const code_suivi = `VG-${Math.floor(1000 + Math.random() * 9000)}`;

            // Créer la demande de visite liée au bien avec la date souhaitée
            const demande = await db.query(`
                INSERT INTO demande_inscription_visiteur 
                (nom, prenoms, email, telephone, message, id_bien, date_visite_souhaitee, statut, date_demande, code_suivi)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente', CURRENT_TIMESTAMP, $8)
                RETURNING *
            `, [nom, prenoms, email, telephone, message, id_bien, date_visite_souhaitee || null, code_suivi]);

            console.log('?? Demande de visite créée avec succès:', demande.rows[0]);
            res.status(201).json({
                message: 'Demande de visite envoyée avec succès',
                code_suivi,
                demande: demande.rows[0]
            });

        } catch (error) {
            console.error('?? Erreur demande visite bien:', error);
            res.status(500).json({ 
                message: 'Erreur serveur',
                error: error.message
            });
        }
    },

    // ============================================================
    // VOIR TOUTES LES DEMANDES (propriétaire connecté) - VISITEURS + LOCATAIRES
    // ============================================================
    async getDemandes(req, res) {
        console.log('Récupération des demandes pour propriétaire:', req.user.id);
        try {
            const { statut } = req.query;
            
            // Récupérer l'ID du propriétaire connecté
            const proprietaireResult = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );
            
            if (proprietaireResult.rows.length === 0) {
                console.log('Aucun propriétaire trouvé pour cet utilisateur');
                return res.json([]);
            }
            
            const id_proprietaire = proprietaireResult.rows[0].id_proprietaire;
            console.log('Propriétaire ID:', id_proprietaire);
            
            // Récupérer les demandes des visiteurs pour ce propriétaire
            let demandesVisiteurs = [];
            try {
                const queryVisiteurs = `
                    SELECT d.*, 
                           b.titre as bien_titre,
                           b.adresse as bien_adresse,
                           b.ville as bien_ville,
                           'visiteur' as type_demandeur
                    FROM demande_inscription_visiteur d
                    LEFT JOIN bien b ON d.id_bien = b.id_bien
                    WHERE b.id_proprietaire = $1
                    ${statut ? 'AND d.statut = $2' : ''}
                    ORDER BY d.date_demande DESC
                `;
                
                const paramsVisiteurs = statut ? [id_proprietaire, statut] : [id_proprietaire];
                const resultVisiteurs = await db.query(queryVisiteurs, paramsVisiteurs);
                demandesVisiteurs = resultVisiteurs.rows;
            } catch (error) {
                console.log('Erreur récupération demandes visiteurs:', error.message);
            }
            
            // Récupérer les demandes de visite des locataires pour ce propriétaire
            let demandesLocataires = [];
            try {
                const queryLocataires = `
                    SELECT 
                        dv.*,
                        u.nom as locataire_nom,
                        u.prenoms as locataire_prenoms,
                        u.email as locataire_email,
                        b.titre as bien_titre,
                        b.adresse as bien_adresse,
                        b.ville as bien_ville,
                        CASE 
                            WHEN dv.statut_demande = 'en_attente' THEN 'En attente'
                            WHEN dv.statut_demande = 'acceptee' THEN 'Acceptée'
                            WHEN dv.statut_demande = 'refusee' THEN 'Refusée'
                            ELSE dv.statut_demande
                        END as statut_libelle,
                        'locataire' as type_demandeur
                    FROM demander_visite dv
                    LEFT JOIN utilisateur u ON dv.id_locataire = u.id_utilisateur
                    LEFT JOIN bien b ON dv.id_bien = b.id_bien
                    WHERE dv.id_proprietaire = $1
                    ${statut ? 'AND dv.statut_demande = $2' : ''}
                    ORDER BY dv.date_demande DESC
                `;
                
                const params = statut ? [id_proprietaire, statut] : [id_proprietaire];
                const resultLocataires = await db.query(queryLocataires, params);
                demandesLocataires = resultLocataires.rows;
            } catch (error) {
                console.log('Table demander_visite non trouvée ou vide:', error.message);
            }
            
            // Ajouter le type demandeur pour les demandes visiteur
            const demandesVisiteursFormatees = demandesVisiteurs.map(demande => ({
                ...demande,
                type_demandeur: 'visiteur',
                locataire_nom: demande.nom,
                locataire_prenoms: demande.prenoms,
                locataire_email: demande.email,
                locataire_telephone: demande.telephone,
                statut_libelle: demande.statut === 'en_attente' ? 'En attente' : 
                              demande.statut === 'acceptee' ? 'Acceptée' : 
                              demande.statut === 'refusee' ? 'Refusée' : demande.statut
            }));
            
            // Combiner toutes les demandes
            const toutesDemandes = [...demandesVisiteursFormatees, ...demandesLocataires];
            
            // Trier par date de demande
            toutesDemandes.sort((a, b) => new Date(b.date_demande || b.date_inscription) - new Date(a.date_demande || a.date_inscription));
            
            console.log('Demandes récupérées:', demandesVisiteursFormatees.length, 'visiteurs +', demandesLocataires.length, 'locataires =', toutesDemandes.length, 'total');
            
            res.json(toutesDemandes);

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
            console.log('?? Lien d\'invitation:', invitationUrl);

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
    // VOIR LES DEMANDES EN ATTENTE (pour la page inviter visiteur) - CORRIGÉ
    // ============================================================
    async getDemandesEnAttente(req, res) {
        console.log('?? Récupération des demandes en attente pour propriétaire:', req.user.id);
        
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
                    console.warn('?? Utilisateur non reconnu comme propriétaire:', req.user.id);
                    return res.status(403).json({ 
                        message: 'Seul un propriétaire peut voir les demandes en attente' 
                    });
                }

                // Récupérer les demandes en attente POUR CE PROPRIÉTAIRE UNIQUEMENT
                const demandes = await db.query(`
                    SELECT 
                        di.*,
                        b.titre as bien_titre,
                        'visiteur' as type_demandeur
                    FROM demande_inscription_visiteur di
                    LEFT JOIN bien b ON di.id_bien = b.id_bien
                    WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                    ORDER BY di.date_demande DESC
                `, [proprietaire.rows[0].id_proprietaire]);

                console.log(`?? ${demandes.rows.length} demandes en attente trouvées pour ce propriétaire`);
                res.json({ demandes: demandes.rows });
            }

        } catch (error) {
            console.error('?? Erreur récupération demandes en attente:', error);
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

            console.log("?? Message envoyé: %s", info.messageId);
            console.log("?? URL de visualisation de l'email: %s", nodemailer.getTestMessageUrl(info));

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
    // DASHBOARD VISITEUR (récupérer les demandes par email)
    // ============================================================
    async getVisitorDashboardData(req, res) {
        try {
            const { email, code } = req.query;
            if (!email) return res.status(400).json({ message: "L'email est requis" });

            // On vérifie le code si fourni (sécurité supplémentaire)
            let query = `
                SELECT di.*, b.titre as bien_titre, b.ville as bien_ville, b.adresse as bien_adresse,
                       p.nom as proprietaire_nom, p.prenoms as proprietaire_prenoms, u.email as proprietaire_email
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
                LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
                WHERE di.email = $1
            `;
            const params = [email];

            if (code) {
                query += ` AND di.code_suivi = $2`;
                params.push(code);
            }

            query += ` ORDER BY di.date_demande DESC`;

            const requests = await db.query(query, params);
            res.json(requests.rows);
        } catch (error) {
            console.error('Erreur dashboard visiteur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // LOGIN VISITEUR (vérification email + code)
    // ============================================================
    async loginVisiteur(req, res) {
        try {
            const { email, code_suivi } = req.body;
            
            if (!email || !code_suivi) {
                return res.status(400).json({ message: 'L\'email et le code de suivi sont requis' });
            }

            const demande = await DemandeInscriptionVisiteur.findByCredentials(email, code_suivi);
            
            if (!demande) {
                return res.status(401).json({ message: 'Email ou code de suivi incorrect' });
            }

            res.json({
                message: 'Connexion réussie',
                visitor: {
                    email: demande.email,
                    nom: demande.nom,
                    prenoms: demande.prenoms,
                    code_suivi: demande.code_suivi
                }
            });
        } catch (error) {
            console.error('Erreur login visiteur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // MESSAGERIE VISITEUR (récupérer les messages)
    // ============================================================
    async getVisitorMessages(req, res) {
        try {
            const { demandeId } = req.params;

            // Récupérer les messages liés à cette demande spécifique
            const messages = await db.query(`
                SELECT m.*, 
                       u.nom as proprietaire_nom, u.prenoms as proprietaire_prenoms, u.email as proprietaire_email
                FROM messages m
                LEFT JOIN bien b ON m.id_bien = b.id_bien
                LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
                LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
                WHERE m.id_demande = $1
                ORDER BY m.date_envoi ASC
            `, [demandeId]);

            const visitorInfoResult = await db.query(`
                SELECT di.*, b.titre as bien_titre,
                       u.nom as proprietaire_nom, u.prenoms as proprietaire_prenoms, u.email as proprietaire_email
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
                LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
                WHERE di.id_demande = $1
            `, [demandeId]);

            res.json({
                messages: messages.rows,
                visitorInfo: visitorInfoResult.rows[0]
            });
        } catch (error) {
            console.error('Erreur messages visiteur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // MESSAGERIE VISITEUR (envoyer un message)
    // ============================================================
    async sendVisitorMessage(req, res) {
        try {
            const { demandeId } = req.params;
            const { contenu, expediteur_type } = req.body;

            const demande = await db.query('SELECT * FROM demande_inscription_visiteur WHERE id_demande = $1', [demandeId]);
            if (demande.rows.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });

            const { id_bien, email } = demande.rows[0];

            // On insère dans la table messages
            const newMessage = await db.query(`
                INSERT INTO messages (contenu, id_bien, date_envoi, expediteur_type, id_demande, id_expediteur)
                VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, 0)
                RETURNING *
            `, [contenu, id_bien, expediteur_type, demandeId]);

            res.status(201).json({ message: newMessage.rows[0] });
        } catch (error) {
            console.error('Erreur envoi message visiteur:', error);
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
