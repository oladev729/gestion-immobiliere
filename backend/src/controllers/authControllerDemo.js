const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Utilisateurs de démonstration (sans base de données)
const demoUsers = [
    {
        id: 1,
        nom: 'Yessoufou',
        prenoms: 'Zenabou',
        email: 'yessoufouzenabou46@gmail.com',
        mot_de_passe: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ', // '123456' hashé
        type_utilisateur: 'proprietaire',
        telephone: '+229XXXXXXXXX'
    },
    {
        id: 2,
        nom: 'Agossou',
        prenoms: 'Roland',
        email: 'agossouroland@gmail.com',
        mot_de_passe: '$2a$10$rOzJqQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQ', // '123456' hashé
        type_utilisateur: 'locataire',
        telephone: '+229XXXXXXXXX'
    }
];

const authControllerDemo = {
    // Inscription
    async register(req, res) {
        try {
            const { nom, prenoms, email, mot_de_passe, type_souhaite } = req.body;

            // Vérifier si l'email existe déjà
            const existingUser = demoUsers.find(user => user.email === email);
            if (existingUser) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }

            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

            // Créer un nouvel utilisateur (simulation)
            const newUser = {
                id: demoUsers.length + 1,
                nom,
                prenoms,
                email,
                mot_de_passe: hashedPassword,
                type_utilisateur: type_souhaite
            };

            demoUsers.push(newUser);

            // Générer le token JWT
            const token = jwt.sign(
                { 
                    id: newUser.id, 
                    email: newUser.email, 
                    type: newUser.type_utilisateur 
                },
                process.env.JWT_SECRET || 'immogest_secret_key_2024',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                message: 'Inscription réussie',
                user: {
                    id: newUser.id,
                    nom: newUser.nom,
                    prenoms: newUser.prenoms,
                    email: newUser.email,
                    type_utilisateur: newUser.type_utilisateur
                },
                token
            });

        } catch (error) {
            console.error('Erreur inscription:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Connexion
    async login(req, res) {
        try {
            const { email, mot_de_passe, type_souhaite } = req.body;

            // Rechercher l'utilisateur
            const user = demoUsers.find(u => u.email === email);
            if (!user) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Vérifier le mot de passe
            const passwordMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Vérifier le type d'utilisateur
            if (type_souhaite && user.type_utilisateur !== type_souhaite) {
                return res.status(401).json({ 
                    message: `Ce compte n'est pas un compte ${type_souhaite}` 
                });
            }

            // Générer le token JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    type: user.type_utilisateur 
                },
                process.env.JWT_SECRET || 'immogest_secret_key_2024',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Connexion réussie',
                user: {
                    id: user.id,
                    nom: user.nom,
                    prenoms: user.prenoms,
                    email: user.email,
                    type_utilisateur: user.type_utilisateur,
                    telephone: user.telephone
                },
                token
            });

        } catch (error) {
            console.error('Erreur connexion:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Mot de passe oublié
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            
            const user = demoUsers.find(u => u.email === email);
            if (!user) {
                return res.status(404).json({ message: 'Email non trouvé' });
            }

            // Simulation d'envoi d'email
            console.log(`📧 Email de réinitialisation envoyé à: ${email}`);

            res.json({
                message: 'Email de réinitialisation envoyé avec succès'
            });

        } catch (error) {
            console.error('Erreur mot de passe oublié:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Réinitialiser mot de passe
    async resetPassword(req, res) {
        try {
            const { token, nouveau_mot_de_passe } = req.body;

            // Simulation de validation de token
            const user = demoUsers[0]; // Simulation

            // Hasher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);
            user.mot_de_passe = hashedPassword;

            res.json({
                message: 'Mot de passe réinitialisé avec succès'
            });

        } catch (error) {
            console.error('Erreur réinitialisation mot de passe:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Confirmer invitation
    async confirmerInvitation(req, res) {
        try {
            const { token, mot_de_passe } = req.body;

            // Simulation de confirmation
            console.log(`📧 Confirmation d'invitation pour le token: ${token}`);

            res.json({
                message: 'Invitation confirmée avec succès',
                user: {
                    id: 999,
                    nom: 'Visiteur',
                    prenoms: 'Invité',
                    email: 'visiteur@email.com'
                }
            });

        } catch (error) {
            console.error('Erreur confirmation invitation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Obtenir le profil
    async getProfile(req, res) {
        try {
            const user = demoUsers.find(u => u.id === req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            res.json({
                id: user.id,
                nom: user.nom,
                prenoms: user.prenoms,
                email: user.email,
                type_utilisateur: user.type_utilisateur,
                telephone: user.telephone
            });

        } catch (error) {
            console.error('Erreur profil:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Changer de type de compte
    async switchType(req, res) {
        try {
            const { nouveau_type } = req.body;
            const user = demoUsers.find(u => u.id === req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            user.type_utilisateur = nouveau_type;

            res.json({
                message: 'Type de compte mis à jour',
                type_utilisateur: user.type_utilisateur
            });

        } catch (error) {
            console.error('Erreur changement type:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Inviter un locataire
    async inviterLocataire(req, res) {
        try {
            const { email, nom, prenoms } = req.body;

            // Simulation d'invitation
            console.log(`📧 Invitation envoyée à: ${email}`);

            res.json({
                message: 'Invitation envoyée avec succès',
                invitation: {
                    email,
                    nom,
                    prenoms,
                    token: 'demo_token_' + Date.now()
                }
            });

        } catch (error) {
            console.error('Erreur invitation locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Statistiques de connexions
    async getConnexionsStats(req, res) {
        try {
            // Simulation de statistiques
            res.json({
                total_connexions: 150,
                connexions_mois: 45,
                dernieres_connexions: [
                    { date: '2024-04-14', utilisateur: 'yessoufouzenabou46@gmail.com' },
                    { date: '2024-04-13', utilisateur: 'agossouroland@gmail.com' }
                ]
            });

        } catch (error) {
            console.error('Erreur statistiques:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // Lister les locataires
    async getLocataires(req, res) {
        try {
            const locataires = demoUsers.filter(u => u.type_utilisateur === 'locataire');

            res.json({
                locataires: locataires.map(l => ({
                    id: l.id,
                    nom: l.nom,
                    prenoms: l.prenoms,
                    email: l.email,
                    telephone: l.telephone
                }))
            });

        } catch (error) {
            console.error('Erreur locataires:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

module.exports = authControllerDemo;
