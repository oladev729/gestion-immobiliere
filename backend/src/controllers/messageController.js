const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const nodemailer = require('nodemailer');

// Créer la table messages si elle n'existe pas
const initializeMessagesTable = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                id_expediteur INTEGER,
                id_destinataire INTEGER,
                id_bien INTEGER,
                id_demande INTEGER,
                contenu TEXT NOT NULL,
                expediteur_type VARCHAR(20) DEFAULT 'utilisateur',
                destinataire_type VARCHAR(20) DEFAULT 'utilisateur',
                date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                lu BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await db.query(createTableQuery);

        // Ajouter les colonnes si elles n'existent pas (cas d'une table déjà existante)
        const alterQueries = [
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS id_demande INTEGER",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS expediteur_type VARCHAR(20) DEFAULT 'utilisateur'",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS destinataire_type VARCHAR(20) DEFAULT 'utilisateur'"
        ];
        for (const alterQuery of alterQueries) {
            await db.query(alterQuery);
        }
        
        // Créer les index
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(id_expediteur)',
            'CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(id_destinataire)',
            'CREATE INDEX IF NOT EXISTS idx_messages_bien ON messages(id_bien)',
            'CREATE INDEX IF NOT EXISTS idx_messages_demande ON messages(id_demande)'
        ];
        
        for (const indexQuery of indexes) {
            await db.query(indexQuery);
        }
        
        console.log('Table messages initialisée avec succès');
    } catch (error) {
        console.error('Erreur initialisation table messages:', error);
    }
};

// Initialiser la table au démarrage
initializeMessagesTable();

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'gestion.immobilier@gmail.com',
        pass: process.env.EMAIL_PASS || 'votre_mot_de_passe'
    }
});

// Fonction pour envoyer un email de notification
const sendNotificationEmail = async (recipientEmail, senderName, messageContent, bienTitle = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'gestion.immobilier@gmail.com',
            to: recipientEmail,
            subject: 'Nouveau message concernant votre demande de visite',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
                        <h2>ImmoGest - Nouveau Message</h2>
                    </div>
                    <div style="padding: 20px; background-color: #f8f9fa;">
                        <p>Bonjour,</p>
                        <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong> concernant votre demande de visite${bienTitle ? ` pour le bien: "${bienTitle}"` : ''}.</p>
                        <div style="background-color: white; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
                            <p style="margin: 0; font-style: italic;">"${messageContent}"</p>
                        </div>
                        <p>Pour répondre à ce message, veuillez contacter le propriétaire directement.</p>
                        <p>Cordialement,<br>L'équipe ImmoGest</p>
                    </div>
                    <div style="background-color: #6c757d; color: white; padding: 10px; text-align: center; font-size: 12px;">
                        <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement à cet email.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email de notification envoyé à:', recipientEmail);
    } catch (error) {
        console.error('Erreur envoi email de notification:', error);
        // Ne pas bloquer l'envoi du message si l'email échoue
    }
};

const messageController = {
    // Envoyer un message
    async sendMessage(req, res) {
        try {
            const { id_destinataire, contenu, id_bien, id_demande, destinataire_type } = req.body;
            console.log('--- DEBUG SEND MESSAGE ---');
            console.log('Payload reçu:', req.body);
            console.log('User ID (req.user):', req.user?.id);
            
            const id_expediteur = req.user?.id || req.body.id_expediteur;
            const expediteur_type = req.user ? 'utilisateur' : 'visiteur';

            // Validation plus précise
            const hasRecipient = id_destinataire !== undefined && id_destinataire !== null && id_destinataire !== '';
            const hasDemande = id_demande !== undefined && id_demande !== null && id_demande !== '';
            const hasContent = contenu && contenu.trim().length > 0;

            if ((!hasRecipient && !hasDemande) || !hasContent) {
                console.log('Validation échouée details:', { 
                    hasRecipient, 
                    hasDemande, 
                    hasContent, 
                    id_destinataire, 
                    id_demande,
                    type_dest: typeof id_destinataire,
                    type_demande: typeof id_demande
                });
                return res.status(400).json({ 
                    message: 'Le destinataire et le contenu sont requis',
                    debug: { id_destinataire, id_demande, contenu }
                });
            }

            try {
                const message = await Message.create({
                    id_expediteur,
                    id_destinataire,
                    contenu,
                    id_bien,
                    id_demande,
                    expediteur_type,
                    destinataire_type: destinataire_type || 'utilisateur'
                });
                console.log('Message créé avec succès en DB:', message.id_message || message.id);
                
                res.status(201).json({
                    message: 'Message envoyé avec succès',
                    data: message
                });
            } catch (dbError) {
                console.error('Erreur SQL lors de l\'insertion du message:', dbError.message);
                console.error('Détails SQL:', dbError.detail || 'Pas de détails');
                throw dbError;
            }
        } catch (error) {
            console.error('Erreur globale sendMessage:', error);
            res.status(500).json({ 
                message: 'Erreur lors de l\'envoi du message',
                details: error.message,
                sqlDetail: error.detail
            });
        }
    },

    // Récupérer une conversation spécifique
    async getConversation(req, res) {
        try {
            const { userId } = req.params;
            const id_bien = req.query.id_bien;
            const id_demande = req.query.id_demande;
            
            // Si utilisateur connecté, on utilise son ID. Sinon on se base sur id_demande.
            const currentUserId = req.user?.id || id_demande;

            const messages = await Message.getConversation(
                currentUserId, 
                userId, 
                id_bien,
                id_demande // Passer l'id_demande ici
            );

            // Marquer les messages comme lus
            for (const message of messages) {
                if (message.id_destinataire === currentUserId && !message.lu) {
                    await Message.markAsRead(message.id, currentUserId);
                }
            }

            res.json(messages);
        } catch (error) {
            console.error('Erreur récupération conversation:', error);
            res.status(500).json({ 
                message: 'Erreur lors de la récupération de la conversation',
                error: error.message 
            });
        }
    },

    // Récupérer toutes les conversations de l'utilisateur
    async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const conversations = await Message.getConversations(userId);
            res.json(conversations);
        } catch (error) {
            console.error('Erreur récupération conversations:', error);
            res.status(500).json({ 
                message: 'Erreur lors de la récupération des conversations',
                error: error.message 
            });
        }
    },

    // Marquer un message comme lu
    async markAsRead(req, res) {
        try {
            const { messageId } = req.params;
            const userId = req.user.id;

            const message = await Message.markAsRead(messageId, userId);
            
            if (!message) {
                return res.status(404).json({ 
                    message: 'Message non trouvé' 
                });
            }

            res.json({
                message: 'Message marqué comme lu',
                data: message
            });
        } catch (error) {
            console.error('Erreur marquer comme lu:', error);
            res.status(500).json({ 
                message: 'Erreur lors du marquage comme lu',
                error: error.message 
            });
        }
    }
};

module.exports = messageController;
