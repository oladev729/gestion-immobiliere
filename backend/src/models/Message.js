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
                       COALESCE(dv.nom, u_loc.nom) as visiteur_nom, 
                       COALESCE(dv.prenoms, u_loc.prenoms) as visiteur_prenoms, 
                       COALESCE(dv.email, u_loc.email) as visiteur_email,
                       b.titre as bien_titre
                FROM messages m
                LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur AND m.expediteur_type = 'utilisateur'
                LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur AND m.destinataire_type = 'utilisateur'
                LEFT JOIN demande_inscription_visiteur dv ON m.id_demande = dv.id_demande AND (m.expediteur_type = 'visiteur' OR m.destinataire_type = 'visiteur')
                LEFT JOIN demander_visite dr ON m.id_demande = dr.id_demande AND m.expediteur_type = 'utilisateur' AND m.destinataire_type = 'utilisateur'
                LEFT JOIN locataire l ON dr.id_locataire = l.id_locataire
                LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
                LEFT JOIN bien b ON m.id_bien = b.id_bien
                WHERE (
                    (m.id_expediteur = $1 AND m.id_destinataire = $2) OR 
                    (m.id_expediteur = $2 AND m.id_destinataire = $1) OR
                    (m.id_demande = $3 AND $3 IS NOT NULL)
                )
            `;
            
            let params = [userId1, userId2, id_demande];
            
            // Si c'est une conversation de visiteur pur (sans ID utilisateur)
            if (id_demande && (!userId1 || !userId2)) {
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

            if (id_bien && params.length >= 3) {
                query += ' AND m.id_bien = $4';
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
            console.log('--- getConversations pour userId:', userId);
            const query = `
                WITH all_conversations AS (
                    -- 1. Messages existants
                    SELECT 
                        m.id_demande,
                        m.id_bien,
                        CASE WHEN m.expediteur_type = 'visiteur' OR m.destinataire_type = 'visiteur' THEN 'visiteur' ELSE 'locataire' END as type_conv,
                        m.id_message, m.id_expediteur, m.id_destinataire, m.contenu, m.date_envoi, m.lu,
                        m.expediteur_type, m.destinataire_type
                    FROM messages m
                    WHERE m.id_expediteur = $1 OR m.id_destinataire = $1
                    
                    UNION ALL
                    
                    -- 2. Demandes de locataires sans messages encore
                    SELECT 
                        dv.id_demande, dv.id_bien, 'locataire' as type_conv,
                        NULL as id_message, NULL as id_expediteur, $1 as id_destinataire, 
                        'Nouvelle demande de visite' as contenu, dv.date_demande as date_envoi, true as lu,
                        'utilisateur' as expediteur_type, 'utilisateur' as destinataire_type
                    FROM demander_visite dv
                    JOIN bien b ON dv.id_bien = b.id_bien
                    JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
                    WHERE p.id_utilisateur = $1
                    AND NOT EXISTS (SELECT 1 FROM messages m2 WHERE m2.id_demande = dv.id_demande)

                    UNION ALL
                    
                    -- 3. Demandes de visiteurs sans messages encore
                    SELECT 
                        div.id_demande, div.id_bien, 'visiteur' as type_conv,
                        NULL as id_message, NULL as id_expediteur, $1 as id_destinataire, 
                        'Nouvelle demande de visite (Visiteur)' as contenu, div.date_demande as date_envoi, true as lu,
                        'visiteur' as expediteur_type, 'utilisateur' as destinataire_type
                    FROM demande_inscription_visiteur div
                    JOIN bien b ON div.id_bien = b.id_bien
                    JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
                    WHERE p.id_utilisateur = $1
                    AND NOT EXISTS (SELECT 1 FROM messages m2 WHERE m2.id_demande = div.id_demande)
                )
                SELECT DISTINCT ON (COALESCE(c.id_demande, 0), type_conv, COALESCE(c.id_bien, 0), 
                                   CASE WHEN c.id_demande IS NULL THEN LEAST(COALESCE(id_expediteur, 0), COALESCE(id_destinataire, 0)) ELSE 0 END)
                    c.*,
                    CASE 
                        WHEN type_conv = 'visiteur' THEN NULL
                        WHEN c.id_expediteur IS NOT NULL AND c.id_expediteur != $1 THEN c.id_expediteur
                        WHEN c.id_destinataire IS NOT NULL AND c.id_destinataire != $1 THEN c.id_destinataire
                        WHEN $1 = u_dem.id_utilisateur THEN u_prop.id_utilisateur
                        ELSE u_dem.id_utilisateur
                    END as autre_id,
                    COALESCE(
                        CASE 
                            WHEN type_conv = 'visiteur' THEN v.nom 
                            WHEN c.id_demande IS NOT NULL AND $1 = u_dem.id_utilisateur THEN u_prop.nom
                            WHEN c.id_demande IS NOT NULL THEN u_dem.nom
                            ELSE NULL
                        END,
                        u_exp.nom, 
                        u_dest.nom
                    ) as autre_nom,
                    COALESCE(
                        CASE 
                            WHEN type_conv = 'visiteur' THEN v.prenoms 
                            WHEN c.id_demande IS NOT NULL AND $1 = u_dem.id_utilisateur THEN u_prop.prenoms
                            WHEN c.id_demande IS NOT NULL THEN u_dem.prenoms
                            ELSE NULL
                        END,
                        u_exp.prenoms, 
                        u_dest.prenoms
                    ) as autre_prenoms,
                    COALESCE(
                        CASE 
                            WHEN type_conv = 'visiteur' THEN v.email 
                            WHEN c.id_demande IS NOT NULL AND $1 = u_dem.id_utilisateur THEN u_prop.email
                            WHEN c.id_demande IS NOT NULL THEN u_dem.email
                            ELSE NULL
                        END,
                        u_exp.email, 
                        u_dest.email
                    ) as autre_email,
                    b.titre as bien_titre,
                    type_conv as type_demandeur
                FROM all_conversations c
                LEFT JOIN utilisateur u_exp ON c.id_expediteur = u_exp.id_utilisateur AND c.id_expediteur != $1 AND c.expediteur_type = 'utilisateur'
                LEFT JOIN utilisateur u_dest ON c.id_destinataire = u_dest.id_utilisateur AND c.id_destinataire != $1 AND c.destinataire_type = 'utilisateur'
                LEFT JOIN demande_inscription_visiteur v ON c.id_demande = v.id_demande AND c.type_conv = 'visiteur'
                LEFT JOIN demander_visite dv3 ON c.id_demande = dv3.id_demande AND c.type_conv = 'locataire'
                LEFT JOIN locataire l3 ON dv3.id_locataire = l3.id_locataire
                LEFT JOIN utilisateur u_dem ON l3.id_utilisateur = u_dem.id_utilisateur
                LEFT JOIN proprietaire p3 ON dv3.id_proprietaire = p3.id_proprietaire
                LEFT JOIN utilisateur u_prop ON p3.id_utilisateur = u_prop.id_utilisateur
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                ORDER BY COALESCE(c.id_demande, 0), type_conv, COALESCE(c.id_bien, 0), 
                         CASE WHEN c.id_demande IS NULL THEN LEAST(COALESCE(c.id_expediteur, 0), COALESCE(c.id_destinataire, 0)) ELSE 0 END, 
                         date_envoi DESC
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
