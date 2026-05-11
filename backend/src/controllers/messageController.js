const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const nodemailer = require('nodemailer');

// ============================================================
// DIAGNOSTIC DES CONVERSATIONS PROPRIÉTAIRE
// ============================================================
const diagnosticConversationsProprietaire = async (req, res) => {
    try {
        console.log('🔍 Diagnostic des conversations pour le propriétaire ID 7');
        
        const proprietaireId = 7; // Nazifath
        
        // 1. Voir toutes les conversations que le backend retourne pour ce propriétaire
        const conversationsQuery = `
            SELECT 
                c.id_message,
                c.id_expediteur,
                exp.email as expediteur_email,
                c.id_destinataire,
                dest.email as destinataire_email,
                c.id_bien,
                b.titre as bien_titre,
                b.adresse as bien_adresse,
                c.contenu,
                c.date_envoi,
                c.lu,
                LEAST(COALESCE(c.id_expediteur, 0), COALESCE(c.id_destinataire, 0)) as user1,
                GREATEST(COALESCE(c.id_expediteur, 0), COALESCE(c.id_destinataire, 0)) as user2
            FROM messages c
            JOIN utilisateur exp ON c.id_expediteur = exp.id_utilisateur
            JOIN utilisateur dest ON c.id_destinataire = dest.id_utilisateur
            LEFT JOIN bien b ON c.id_bien = b.id_bien
            WHERE (c.id_expediteur = $1 OR c.id_destinataire = $1)
            ORDER BY c.date_envoi DESC
        `;
        
        const conversationsResult = await db.query(conversationsQuery, [proprietaireId]);
        console.log(`📨 Conversations brutes pour propriétaire ${proprietaireId}:`, conversationsResult.rows.length);
        
        // 2. Simuler le regroupement comme dans le backend
        const groupedConversations = {};
        conversationsResult.rows.forEach(conv => {
            const autreId = conv.id_expediteur === proprietaireId ? conv.id_destinataire : conv.id_expediteur;
            const bienId = conv.id_bien || 'sans_bien';
            const groupKey = `${autreId}_${bienId}`;
            
            if (!groupedConversations[groupKey] || new Date(conv.date_envoi) > new Date(groupedConversations[groupKey].date_envoi)) {
                groupedConversations[groupKey] = {
                    ...conv,
                    autre_id: autreId,
                    group_key: groupKey,
                    nombre_messages: 1
                };
            } else {
                groupedConversations[groupKey].nombre_messages++;
            }
        });
        
        const finalConversations = Object.values(groupedConversations);
        
        const diagnostic = {
            proprietaire_id: proprietaireId,
            total_messages_bruts: conversationsResult.rows.length,
            conversations_groupées: finalConversations,
            nombre_final_conversations: finalConversations.length,
            biens_concernes: [...new Set(finalConversations.map(c => c.id_bien))].filter(id => id !== 'sans_bien'),
            probleme_identifie: finalConversations.length < 3 ? 'MOINS_DE_3_CONVERSATIONS' : 'OK',
            recommandation: finalConversations.length < 3 ? 
                'Le propriétaire devrait voir 3 conversations (une par bien)' : 
                'Normal - le propriétaire voit toutes ses conversations'
        };
        
        console.log('🎯 Diagnostic propriétaire:', diagnostic);
        
        res.json(diagnostic);
        
    } catch (error) {
        console.error('❌ Erreur diagnostic propriétaire:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ============================================================
// DIAGNOSTIC DES MESSAGES ENTRE AYATH ET NAZIFATH
// ============================================================
const diagnosticMessagesAyathNazifath = async (req, res) => {
    try {
        console.log('🔍 Diagnostic des messages entre Ayath et Nazifath');
        
        // 1. Trouver Ayath (OUCHE Ayath)
        const ayathQuery = `
            SELECT id_utilisateur, email, nom, prenoms
            FROM utilisateur 
            WHERE prenoms ILIKE '%ayath%' OR email ILIKE '%ouche%'
        `;
        
        const ayathResult = await db.query(ayathQuery);
        console.log('👥 Utilisateur Ayath trouvé:', ayathResult.rows);
        
        if (ayathResult.rows.length === 0) {
            return res.json({ message: 'Utilisateur Ayath non trouvé', users: [] });
        }
        
        const ayath_user = ayathResult.rows[0];
        const ayath_id = ayath_user.id_utilisateur;
        
        // 2. Trouver le propriétaire avec qui Ayath communique
        const proprietaireQuery = `
            SELECT DISTINCT u.id_utilisateur, u.email, u.nom, u.prenoms
            FROM utilisateur u
            JOIN messages m ON (u.id_utilisateur = m.id_expediteur OR u.id_utilisateur = m.id_destinataire)
            WHERE (m.id_expediteur = $1 OR m.id_destinataire = $1)
            AND u.id_utilisateur != $1
            AND u.id_utilisateur IN (
                SELECT p.id_utilisateur 
                FROM proprietaire p 
                JOIN bien b ON p.id_proprietaire = b.id_proprietaire
                JOIN contact c ON b.id_bien = c.id_bien
                WHERE c.id_locataire IN (
                    SELECT l.id_locataire 
                    FROM locataire l 
                    WHERE l.id_utilisateur = $1
                )
            )
            LIMIT 1
        `;
        
        const proprietaireResult = await db.query(proprietaireQuery, [ayath_id]);
        console.log('👥 Propriétaire trouvé:', proprietaireResult.rows);
        
        if (proprietaireResult.rows.length === 0) {
            return res.json({ 
                message: 'Aucun propriétaire trouvé pour Ayath', 
                ayath_user: ayath_user 
            });
        }
        
        const nazifath_user = proprietaireResult.rows[0];
        const nazifath_id = nazifath_user.id_utilisateur;
        
        // 2. Voir tous les messages entre eux
        const messagesQuery = `
            SELECT 
                m.id_message,
                m.id_expediteur,
                exp.email as expediteur_email,
                m.id_destinataire,
                dest.email as destinataire_email,
                m.id_bien,
                b.titre as bien_titre,
                b.adresse as bien_adresse,
                m.contenu,
                m.date_envoi,
                m.lu
            FROM messages m
            JOIN utilisateur exp ON m.id_expediteur = exp.id_utilisateur
            JOIN utilisateur dest ON m.id_destinataire = dest.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE (m.id_expediteur = $1 AND m.id_destinataire = $2)
               OR (m.id_expediteur = $2 AND m.id_destinataire = $1)
            ORDER BY m.date_envoi DESC
        `;
        
        const messagesResult = await db.query(messagesQuery, [ayath_id, nazifath_id]);
        console.log(`📨 Messages trouvés: ${messagesResult.rows.length}`);
        
        // 3. Regrouper par bien
        const biensConcernes = {};
        messagesResult.rows.forEach(msg => {
            const bienKey = msg.id_bien || 'sans_bien';
            if (!biensConcernes[bienKey]) {
                biensConcernes[bienKey] = {
                    id_bien: msg.id_bien,
                    bien_titre: msg.bien_titre,
                    bien_adresse: msg.bien_adresse,
                    messages: [],
                    nombre_messages: 0
                };
            }
            biensConcernes[bienKey].messages.push(msg);
            biensConcernes[bienKey].nombre_messages++;
        });
        
        // 4. Diagnostic du problème
        const diagnostic = {
            utilisateurs: {
                ayath: ayath_user,
                nazifath: nazifath_user
            },
            total_messages: messagesResult.rows.length,
            biens_concernes: Object.values(biensConcernes),
            probleme_identifie: Object.keys(biensConcernes).length > 1 ? 'PLUSIEURS_BIENS' : 'UN_SEUL_BIEN',
            recommandation: Object.keys(biensConcernes).length > 1 ? 
                'Le système devrait afficher plusieurs discussions (une par bien)' : 
                'Normal - une seule discussion'
        };
        
        console.log('🎯 Diagnostic complet:', diagnostic);
        
        res.json(diagnostic);
        
    } catch (error) {
        console.error('❌ Erreur diagnostic:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

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

// Placer les fonctions de diagnostic avant la déclaration de l'objet
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
            console.log('🔍 getConversation appelée');
            console.log('📋 Params:', req.params);
            console.log('📋 Query:', req.query);
            console.log('👤 User authentifié:', req.user);
            
            const { userId } = req.params;
            const { demandeId } = req.params; // Pour la route /conversation/demande/:demandeId
            const id_bien = req.query.id_bien;
            const id_demande = req.query.id_demande || demandeId; // Priorité au query, puis au params
            
            console.log('🎯 Paramètres extraits:', { userId, demandeId, id_bien, id_demande });
            
            // Pour une route par demandeId, on utilise uniquement l'id_demande
            let messages;
            if (demandeId) {
                console.log('🎯 Recherche des messages par demandeId uniquement:', demandeId);
                console.log('🔍 Vérification directe dans la table messages...');
                
                // Test direct pour voir si des messages existent avec cet id_demande
                const testQuery = 'SELECT COUNT(*) as count FROM messages WHERE id_demande = $1';
                const testResult = await db.query(testQuery, [demandeId]);
                console.log(`📊 Nombre de messages trouvés pour demandeId ${demandeId}:`, testResult.rows[0].count);
                
                messages = await Message.getConversation(
                    null, 
                    null, 
                    id_bien,
                    demandeId // Passer seulement l'id_demande
                );
                
                console.log('📥 Messages récupérés par getConversation:', messages.length);
            } else {
                // Route normale par utilisateur
                const currentUserId = req.user?.id;
                messages = await Message.getConversation(
                    currentUserId, 
                    userId, 
                    id_bien,
                    id_demande
                );
            }

            // Marquer les messages comme lus
            const currentUserId = req.user?.id;
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
    },

    // Exporter les fonctions de diagnostic
    diagnosticConversationsProprietaire,
    diagnosticMessagesAyathNazifath
};

// ============================================================
// DIAGNOSTIC DIRECT POUR PROPRIÉTAIRE
// ============================================================
const diagnosticDirectProprietaire = async (req, res) => {
    try {
        console.log('🔍 Diagnostic direct pour le propriétaire ID 7');
        
        const proprietaireId = 7; // Nazifath
        
        // Utiliser directement la méthode getConversations du modèle
        const Message = require('../models/Message');
        const conversations = await Message.getConversations(proprietaireId);
        
        console.log(`📊 Résultat direct de getConversations pour propriétaire ${proprietaireId}:`, conversations.length, 'conversations');
        
        conversations.forEach((conv, index) => {
            console.log(`💬 Conversation ${index + 1}:`, {
                id_message: conv.id_message,
                id_expediteur: conv.id_expediteur,
                id_destinataire: conv.id_destinataire,
                id_bien: conv.id_bien,
                bien_titre: conv.bien_titre,
                contenu: conv.contenu?.substring(0, 50) + '...',
                date_envoi: conv.date_envoi
            });
        });
        
        res.json({
            proprietaire_id: proprietaireId,
            nombre_conversations: conversations.length,
            conversations: conversations,
            probleme_identifie: conversations.length === 0 ? 'AUCUNE_CONVERSATION' : 'CONVERSATIONS_TROUVEES'
        });
        
    } catch (error) {
        console.error('❌ Erreur diagnostic direct propriétaire:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Ajouter la fonction de diagnostic à l'objet messageController existant
messageController.diagnosticDirectProprietaire = diagnosticDirectProprietaire;

module.exports = messageController;
