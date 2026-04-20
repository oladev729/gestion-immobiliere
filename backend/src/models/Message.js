const db = require('../config/database');

class Message {
    static async create(messageData) {
        try {
            const { 
                id_expediteur, 
                id_destinataire, 
                contenu, 
                id_bien, 
                expediteur_type = 'utilisateur', 
                destinataire_type = 'utilisateur',
                id_demande = null
            } = messageData;
            
            const toInt = (val) => {
                const p = parseInt(val);
                return isNaN(p) ? null : p;
            };

            const query = `
                INSERT INTO messages (id_expediteur, id_destinataire, contenu, id_bien, expediteur_type, destinataire_type, id_demande, date_envoi, lu)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false)
                RETURNING id_message, id_expediteur, id_destinataire, contenu, date_envoi, lu, id_bien, expediteur_type, destinataire_type, id_demande
            `;
            
            const result = await db.query(query, [
                toInt(id_expediteur), 
                toInt(id_destinataire), 
                contenu, 
                toInt(id_bien), 
                expediteur_type || 'utilisateur', 
                destinataire_type || 'utilisateur', 
                toInt(id_demande)
            ]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur création message:', error);
            throw error;
        }
    }

    static async getConversation(userId1, userId2, id_bien = null, id_demande = null) {
        try {
            let query = `
                SELECT m.*, 
                       u1.nom as expediteur_nom, u1.prenoms as expediteur_prenoms, u1.email as expediteur_email,
                       u2.nom as destinataire_nom, u2.prenoms as destinataire_prenoms, u2.email as destinataire_email,
                       dv.nom as visiteur_nom, dv.prenoms as visiteur_prenoms, dv.email as visiteur_email,
                       b.titre as bien_titre
                FROM messages m
                LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur AND m.expediteur_type = 'utilisateur'
                LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur AND m.destinataire_type = 'utilisateur'
                LEFT JOIN demande_inscription_visiteur dv ON m.id_demande = dv.id_demande
                LEFT JOIN bien b ON m.id_bien = b.id_bien
                WHERE (
                    (m.id_expediteur = $1 AND m.id_destinataire = $2) OR 
                    (m.id_expediteur = $2 AND m.id_destinataire = $1)
                )
            `;
            
            let params = [userId1, userId2];
            
            // Si un id_demande est fourni, on filtre prioritairement dessus
            if (id_demande) {
                query = `
                    SELECT m.*, 
                           u1.nom as expediteur_nom, u1.prenoms as expediteur_prenoms, u1.email as expediteur_email,
                           u2.nom as destinataire_nom, u2.prenoms as destinataire_prenoms, u2.email as destinataire_email,
                           dv.nom as visiteur_nom, dv.prenoms as visiteur_prenoms, dv.email as visiteur_email,
                           b.titre as bien_titre
                    FROM messages m
                    LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur AND m.expediteur_type = 'utilisateur'
                    LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur AND m.destinataire_type = 'utilisateur'
                    LEFT JOIN demande_inscription_visiteur dv ON m.id_demande = dv.id_demande
                    LEFT JOIN bien b ON m.id_bien = b.id_bien
                    WHERE m.id_demande = $1
                `;
                params = [id_demande];
            }
            
            if (id_bien) {
                query += ' AND m.id_bien = $3';
                params.push(id_bien);
            }
            
            query += ' ORDER BY m.date_envoi ASC';
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération conversation:', error);
            throw error;
        }
    }

    static async getConversations(userId) {
        try {
            const query = `
                SELECT DISTINCT ON (
                    CASE WHEN m.id_demande IS NOT NULL THEN m.id_demande ELSE LEAST(m.id_expediteur, m.id_destinataire) END,
                    CASE WHEN m.id_demande IS NOT NULL THEN 0 ELSE GREATEST(m.id_expediteur, m.id_destinataire) END,
                    m.id_bien
                )
                       m.id_message, m.id_expediteur, m.id_destinataire, m.contenu, m.date_envoi, m.lu, m.id_bien, m.id_demande,
                       m.expediteur_type, m.destinataire_type,
                       COALESCE(u1.nom, u2.nom, dv.nom) as autre_nom,
                       COALESCE(u1.prenoms, u2.prenoms, dv.prenoms) as autre_prenoms,
                       COALESCE(u1.email, u2.email, dv.email) as autre_email,
                       b.titre as bien_titre,
                       (SELECT COUNT(*) FROM messages m2 
                        WHERE (
                            (m2.id_expediteur = m.id_expediteur AND m2.id_destinataire = m.id_destinataire) OR 
                            (m2.id_expediteur = m.id_destinataire AND m2.id_destinataire = m.id_expediteur) OR
                            (m2.id_demande = m.id_demande AND m.id_demande IS NOT NULL)
                        )
                        AND m2.id_bien = m.id_bien
                        AND m2.lu = false
                        AND m2.id_destinataire = $1) as non_lus
                FROM messages m
                LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur AND m.id_expediteur != $1 AND m.expediteur_type = 'utilisateur'
                LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur AND m.id_destinataire != $1 AND m.destinataire_type = 'utilisateur'
                LEFT JOIN demande_inscription_visiteur dv ON m.id_demande = dv.id_demande
                LEFT JOIN bien b ON m.id_bien = b.id_bien
                WHERE (m.id_expediteur = $1 OR m.id_destinataire = $1)
                ORDER BY 
                    CASE WHEN m.id_demande IS NOT NULL THEN m.id_demande ELSE LEAST(m.id_expediteur, m.id_destinataire) END,
                    CASE WHEN m.id_demande IS NOT NULL THEN 0 ELSE GREATEST(m.id_expediteur, m.id_destinataire) END,
                    m.id_bien,
                    m.date_envoi DESC
            `;
            
            const result = await db.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération conversations:', error);
            throw error;
        }
    }

    static async markAsRead(messageId, userId) {
        try {
            const query = `
                UPDATE messages 
                SET lu = true 
                WHERE id_message = $1 AND id_destinataire = $2
                RETURNING *
            `;
            
            const result = await db.query(query, [messageId, userId]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur marquer comme lu:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const query = `
                SELECT u.id_utilisateur as id, u.email, u.nom, u.prenoms
                FROM utilisateur u
                WHERE u.email = $1
            `;
            
            const result = await db.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur recherche par email:', error);
            throw error;
        }
    }
}

module.exports = Message;
