const Utilisateur = require('../models/Utilisateur');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const authController = {
    // ============================================================
    // INSCRIPTION
    // ============================================================
    async register(req, res) {
        try {
            const { nom, prenoms, email, telephone, mot_de_passe, type_utilisateur } = req.body;

            const existingUser = await Utilisateur.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'Un utilisateur avec cet email existe déjà' 
                });
            }

            const newUser = await Utilisateur.create({
                nom,
                prenoms,
                email,
                telephone,
                mot_de_passe,
                type_utilisateur
            });

            if (type_utilisateur === 'proprietaire') {
                await db.query(
                    'INSERT INTO proprietaire (id_utilisateur, adresse_fiscale) VALUES ($1, $2)',
                    [newUser.id_utilisateur, req.body.adresse_fiscale || null]
                );
            }

            if (type_utilisateur === 'locataire') {
                await db.query(
                    `INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite) 
                     VALUES ($1, $2, $3)`,
                    [newUser.id_utilisateur, true, email]
                );
            }

            const token = jwt.sign(
                { 
                    id: newUser.id_utilisateur, 
                    email: newUser.email,
                    type: newUser.type_utilisateur 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Inscription réussie',
                token,
                user: newUser
            });

        } catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // CONNEXION
    // ============================================================
    async login(req, res) {
        try {
            const { email, mot_de_passe, type_souhaite, confirmation } = req.body;

            const user = await Utilisateur.findByEmail(email);
            if (!user) {
                return res.status(401).json({ 
                    message: 'Email ou mot de passe incorrect' 
                });
            }

            if (user.statut !== 'actif') {
                return res.status(403).json({ 
                    message: 'Compte désactivé ou suspendu' 
                });
            }

            const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
            if (!validPassword) {
                return res.status(401).json({ 
                    message: 'Email ou mot de passe incorrect' 
                });
            }

            await db.query(
                'UPDATE utilisateur SET derniere_connexion = CURRENT_TIMESTAMP WHERE id_utilisateur = $1',
                [user.id_utilisateur]
            );

            // ============================================================
            // GESTION DOUBLE COMPTE
            // ============================================================
            if (type_souhaite && user.type_utilisateur !== type_souhaite) {
                
                if (confirmation === true) {
                    const autreCompte = await db.query(
                        'SELECT * FROM utilisateur WHERE email = $1 AND type_utilisateur = $2',
                        [email, type_souhaite]
                    );

                    if (autreCompte.rows.length > 0) {
                        const autreUser = autreCompte.rows[0];
                        
                        await db.query(
                            'UPDATE utilisateur SET derniere_connexion = CURRENT_TIMESTAMP WHERE id_utilisateur = $1',
                            [autreUser.id_utilisateur]
                        );

                        const token = jwt.sign(
                            { id: autreUser.id_utilisateur, email: autreUser.email, type: autreUser.type_utilisateur },
                            process.env.JWT_SECRET,
                            { expiresIn: '24h' }
                        );

                        return res.json({
                            message: `Connexion réussie en tant que ${type_souhaite}`,
                            token,
                            user: {
                                id: autreUser.id_utilisateur,
                                nom: autreUser.nom,
                                prenoms: autreUser.prenoms,
                                email: autreUser.email,
                                type: autreUser.type_utilisateur
                            }
                        });
                    } else {
                        return res.status(400).json({
                            message: `Vous n'avez pas encore de compte en tant que ${type_souhaite}. Utilisez l'invitation pour en créer un.`,
                            invitation_requise: true
                        });
                    }
                }

                return res.status(409).json({
                    message: `Vous êtes déjà inscrit en tant que ${user.type_utilisateur}. Voulez-vous vraiment vous connecter en tant que ${type_souhaite} ?`,
                    confirmation_requise: true,
                    type_actuel: user.type_utilisateur,
                    type_demande: type_souhaite
                });
            }

            // ============================================================
            // CONNEXION NORMALE
            // ============================================================
            const token = jwt.sign(
                { id: user.id_utilisateur, email: user.email, type: user.type_utilisateur },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            let roleInfo = null;
            if (user.type_utilisateur === 'proprietaire') {
                const result = await db.query(
                    'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                    [user.id_utilisateur]
                );
                roleInfo = result.rows[0];
            } else if (user.type_utilisateur === 'locataire') {
                const result = await db.query(
                    'SELECT id_locataire, compte_confirme FROM locataire WHERE id_utilisateur = $1',
                    [user.id_utilisateur]
                );
                roleInfo = result.rows[0];
            }

            res.json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id_utilisateur,
                    nom: user.nom,
                    prenoms: user.prenoms,
                    email: user.email,
                    telephone: user.telephone,
                    type: user.type_utilisateur,
                    roleInfo,
                    derniere_connexion: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erreur connexion:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // MOT DE PASSE OUBLIÉ
    // ============================================================
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const user = await Utilisateur.findByEmail(email);
            if (!user) {
                return res.status(404).json({ 
                    message: 'Aucun compte trouvé avec cet email' 
                });
            }

            const resetToken = crypto.randomBytes(32).toString('hex');
            
            const hashedToken = crypto
                .createHash('sha256')
                .update(resetToken)
                .digest('hex');

            const expiry = new Date();
            expiry.setHours(expiry.getHours() + 1);

            await db.query(
                'UPDATE utilisateur SET reset_token = $1, reset_token_expiry = $2 WHERE id_utilisateur = $3',
                [hashedToken, expiry, user.id_utilisateur]
            );

            const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
            console.log('🔗 Lien de réinitialisation:', resetUrl);

            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 VALUES ($1, $2, $3, $4)`,
                [user.id_utilisateur, 'Réinitialisation de mot de passe', 
                 'Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien.', 
                 'systeme']
            );

            res.json({ 
                message: 'Email de réinitialisation envoyé',
                reset_token_dev: resetToken
            });

        } catch (error) {
            console.error('Erreur forgot password:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉINITIALISER MOT DE PASSE
    // ============================================================
    async resetPassword(req, res) {
        try {
            const { token, nouveau_mot_de_passe } = req.body;

            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await db.query(
                'SELECT * FROM utilisateur WHERE reset_token = $1 AND reset_token_expiry > NOW()',
                [hashedToken]
            );

            if (user.rows.length === 0) {
                return res.status(400).json({ 
                    message: 'Token invalide ou expiré' 
                });
            }

            const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);

            await db.query(
                'UPDATE utilisateur SET mot_de_passe = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id_utilisateur = $2',
                [hashedPassword, user.rows[0].id_utilisateur]
            );

            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 VALUES ($1, $2, $3, $4)`,
                [user.rows[0].id_utilisateur, 'Mot de passe réinitialisé', 
                 'Votre mot de passe a été modifié.', 
                 'systeme']
            );

            res.json({ 
                message: 'Mot de passe réinitialisé avec succès' 
            });

        } catch (error) {
            console.error('Erreur reset password:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // STATISTIQUES CONNEXIONS
    // ============================================================
    async getConnexionsStats(req, res) {
        try {
            const stats = await db.query(`
                SELECT 
                    COUNT(*) as total_utilisateurs,
                    COUNT(CASE WHEN derniere_connexion > NOW() - INTERVAL '5 minutes' THEN 1 END) as en_ligne_5min,
                    COUNT(CASE WHEN derniere_connexion > NOW() - INTERVAL '1 hour' THEN 1 END) as connectes_derniere_heure,
                    COUNT(CASE WHEN derniere_connexion > NOW() - INTERVAL '24 hours' THEN 1 END) as connectes_aujourdhui,
                    COUNT(CASE WHEN derniere_connexion IS NULL THEN 1 END) as jamais_connectes
                FROM utilisateur
            `);

            const details = await db.query(`
                SELECT 
                    id_utilisateur,
                    nom,
                    prenoms,
                    email,
                    type_utilisateur,
                    derniere_connexion,
                    CASE 
                        WHEN derniere_connexion > NOW() - INTERVAL '5 minutes' THEN '🟢 En ligne'
                        WHEN derniere_connexion > NOW() - INTERVAL '1 hour' THEN '🟡 Connecté il y a < 1h'
                        WHEN derniere_connexion > NOW() - INTERVAL '24 hours' THEN '🔵 Connecté aujourd\'hui'
                        WHEN derniere_connexion IS NOT NULL THEN '⚫ Connecté il y a > 24h'
                        ELSE '⚪ Jamais connecté'
                    END as statut_connexion
                FROM utilisateur
                ORDER BY derniere_connexion DESC NULLS LAST
            `);

            res.json({
                stats: stats.rows[0],
                details: details.rows
            });

        } catch (error) {
            console.error('Erreur stats:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // PROFIL
    // ============================================================
    async getProfile(req, res) {
        try {
            const user = await Utilisateur.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }
            res.json({ user });
        } catch (error) {
            console.error('Erreur profil:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // CHANGER DE TYPE
    // ============================================================
    async switchType(req, res) {
        try {
            const { nouveau_type } = req.body;
            const userId = req.user.id;

            if (req.user.type === nouveau_type) {
                return res.status(400).json({ 
                    message: `Vous êtes déjà en tant que ${nouveau_type}` 
                });
            }

            const userEmail = req.user.email;
            const autreCompte = await db.query(
                'SELECT * FROM utilisateur WHERE email = $1 AND type_utilisateur = $2',
                [userEmail, nouveau_type]
            );

            if (autreCompte.rows.length > 0) {
                return res.status(400).json({
                    message: `Un compte ${nouveau_type} existe déjà. Utilisez la connexion avec type_souhaite.`
                });
            }

            const updated = await Utilisateur.update(userId, { 
                type_utilisateur: nouveau_type 
            });

            if (nouveau_type === 'proprietaire') {
                await db.query(
                    'INSERT INTO proprietaire (id_utilisateur) VALUES ($1) ON CONFLICT DO NOTHING',
                    [userId]
                );
            } else if (nouveau_type === 'locataire') {
                await db.query(
                    `INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite) 
                     VALUES ($1, $2, (SELECT email FROM utilisateur WHERE id_utilisateur = $1))
                     ON CONFLICT DO NOTHING`,
                    [userId, true]
                );
            }

            const token = jwt.sign(
                { id: userId, email: req.user.email, type: nouveau_type },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: `Compte changé en ${nouveau_type} avec succès`,
                token,
                user: updated
            });

        } catch (error) {
            console.error('Erreur switch:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // INVITER (VERSION CORRIGÉE AVEC TYPE DYNAMIQUE)
    // ============================================================
    async inviterLocataire(req, res) {
        try {
            const { email, nom, prenoms, type_souhaite } = req.body;
            const proprietaireId = req.user.id;

            // Détermine le type demandé (par défaut 'locataire')
            const typeDemande = type_souhaite || 'locataire';
            
            const userExistant = await Utilisateur.findByEmail(email);
            
            // Inclure le type dans le token
            const token = jwt.sign(
                { email, nom, prenoms, invitePar: proprietaireId, type: typeDemande },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            const locataireExistant = await db.query(
                'SELECT * FROM locataire WHERE email_invite = $1',
                [email]
            );

            if (locataireExistant.rows.length > 0) {
                await db.query(
                    `UPDATE locataire SET 
                     token_invitation = $1, 
                     date_invitation = CURRENT_TIMESTAMP,
                     date_expiration_token = CURRENT_TIMESTAMP + INTERVAL '7 days',
                     statut_invitation = 'en_attente',
                     id_utilisateur = NULL
                     WHERE email_invite = $2`,
                    [token, email]
                );
            } else {
                await db.query(
                    `INSERT INTO locataire 
                     (email_invite, token_invitation, date_invitation, date_expiration_token, statut_invitation)
                     VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', 'en_attente')`,
                    [email, token]
                );
            }

            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 VALUES (NULL, 'Invitation à rejoindre', 
                 'Vous avez été invité à devenir ${typeDemande === 'proprietaire' ? 'propriétaire' : 'locataire'}.', 
                 'invitation')`
            );

            res.json({
                message: 'Invitation envoyée avec succès',
                token_dev: token,
                type_invitation: typeDemande,
                note: userExistant ? `Double compte en tant que ${typeDemande}.` : `Nouveau compte en tant que ${typeDemande}.`
            });

        } catch (error) {
            console.error('Erreur invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // CONFIRMER INVITATION (VERSION CORRIGÉE)
    // ============================================================
    async confirmerInvitation(req, res) {
        try {
            const { token, mot_de_passe, telephone } = req.body;

            // Vérifier le token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Récupérer l'invitation
            const invitation = await db.query(
                `SELECT * FROM locataire 
                 WHERE email_invite = $1 AND token_invitation = $2 AND statut_invitation = 'en_attente'`,
                [decoded.email, token]
            );

            if (invitation.rows.length === 0) {
                return res.status(400).json({ 
                    message: 'Invitation invalide ou expirée' 
                });
            }

            // Vérifier expiration
            if (new Date() > new Date(invitation.rows[0].date_expiration_token)) {
                return res.status(400).json({ 
                    message: 'Invitation expirée' 
                });
            }

            // Vérifier si email existe déjà (pour double compte)
            const userExistant = await Utilisateur.findByEmail(decoded.email);
            
            // Créer le nouvel utilisateur avec le TYPE du token
            const newUser = await Utilisateur.create({
                nom: decoded.nom,
                prenoms: decoded.prenoms,
                email: decoded.email,
                telephone: telephone || '',
                mot_de_passe: mot_de_passe,
                type_utilisateur: decoded.type || 'locataire'  // ← Utilise le type du token
            });

            // Mettre à jour la table locataire
            await db.query(
                `UPDATE locataire 
                 SET id_utilisateur = $1, 
                     compte_confirme = true,
                     date_confirmation = CURRENT_TIMESTAMP,
                     statut_invitation = 'accepte'
                 WHERE email_invite = $2`,
                [newUser.id_utilisateur, decoded.email]
            );

            // Si c'est un propriétaire, créer l'entrée dans proprietaire
            if (newUser.type_utilisateur === 'proprietaire') {
                await db.query(
                    'INSERT INTO proprietaire (id_utilisateur) VALUES ($1) ON CONFLICT DO NOTHING',
                    [newUser.id_utilisateur]
                );
            }

            const authToken = jwt.sign(
                { id: newUser.id_utilisateur, email: newUser.email, type: newUser.type_utilisateur },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: userExistant 
                    ? `✅ Double compte créé ! Vous avez maintenant deux comptes (${userExistant.type_utilisateur} et ${newUser.type_utilisateur}) avec le même email.`
                    : `✅ Compte ${newUser.type_utilisateur} créé avec succès`,
                token: authToken,
                user: newUser,
                double_compte: !!userExistant
            });

        } catch (error) {
            console.error('Erreur confirmation:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(400).json({ message: 'Invitation expirée' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(400).json({ message: 'Token invalide' });
            }
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = authController;