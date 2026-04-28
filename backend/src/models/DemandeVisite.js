const db = require('../config/database');

class DemandeVisite {
    // ============================================================
    // CRÉER UNE DEMANDE DE VISITE (par le locataire)
    // ============================================================
    static async create(demandeData) {
        const {
            id_locataire,
            id_bien,
            id_proprietaire,
            date_visite,
            message
        } = demandeData;

        const query = `
            INSERT INTO demander_visite (
                id_locataire,
                id_bien,
                id_proprietaire,
                date_visite,
                date_demande,
                message,
                statut_demande
            ) VALUES ($1, $2, $3, $4, DEFAULT, $5, $6)
            RETURNING *
        `;

        const values = [
            id_locataire,
            id_bien,
            id_proprietaire,
            date_visite,
            message || null,
            'en_attente'
        ];

        const result = await db.query(query, values);
        
        // Créer une notification pour le propriétaire
        await db.query(
            `INSERT INTO notification (id_utilisateur, titre, message, type)
             SELECT u.id_utilisateur, 
                    'Nouvelle demande de visite',
                    'Un locataire souhaite visiter votre bien: ' || b.titre,
                    'visite'
             FROM proprietaire p
             JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
             JOIN bien b ON b.id_proprietaire = p.id_proprietaire
             WHERE p.id_proprietaire = $1 AND b.id_bien = $2`,
            [id_proprietaire, id_bien]
        );

        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES DEMANDES REÇUES (pour un propriétaire)
    // ============================================================
    static async findDemandesRecues(id_proprietaire) {
        const query = `
            SELECT d.id_demande, d.id_bien, d.date_visite, d.date_demande, d.message, d.statut_demande,
                   b.titre as bien_titre, b.adresse as bien_adresse, b.ville as bien_ville,
                   u.nom as locataire_nom, u.prenoms as locataire_prenoms, u.email as locataire_email, u.telephone as locataire_telephone,
                   u.id_utilisateur as id_utilisateur,
                   'locataire' as type_demandeur
            FROM demander_visite d
            JOIN bien b ON d.id_bien = b.id_bien
            JOIN locataire l ON d.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE d.id_proprietaire = $1
            
            UNION ALL
            
            SELECT dv.id_demande, dv.id_bien, dv.date_visite_souhaitee as date_visite, dv.date_demande, dv.message, dv.statut as statut_demande,
                   b.titre as bien_titre, b.adresse as bien_adresse, b.ville as bien_ville,
                   dv.nom as locataire_nom, dv.prenoms as locataire_prenoms, dv.email as locataire_email, dv.telephone as locataire_telephone,
                   NULL::integer as id_utilisateur,
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur dv
            JOIN bien b ON dv.id_bien = b.id_bien
            WHERE b.id_proprietaire = $1
            
            ORDER BY date_demande DESC
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER MES DEMANDES (pour un locataire)
    // ============================================================
    static async findMesDemandes(id_locataire) {
        const query = `
            SELECT d.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   u.nom as proprietaire_nom,
                   u.prenoms as proprietaire_prenoms
            FROM demander_visite d
            JOIN bien b ON d.id_bien = b.id_bien
            JOIN proprietaire p ON d.id_proprietaire = p.id_proprietaire
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE d.id_locataire = $1
            ORDER BY d.date_demande DESC
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UNE DEMANDE PAR SON ID (gère visiteurs et locataires)
    // ============================================================
    static async findById(id_demande) {
        // D'abord chercher dans les demandes de locataires
        const queryLocataire = `
            SELECT d.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   ul.nom as locataire_nom,
                   ul.prenoms as locataire_prenoms,
                   ul.email as locataire_email,
                   ul.telephone as locataire_telephone,
                   up.nom as proprietaire_nom,
                   up.prenoms as proprietaire_prenoms,
                   'locataire' as type_demandeur
            FROM demander_visite d
            JOIN bien b ON d.id_bien = b.id_bien
            JOIN locataire l ON d.id_locataire = l.id_locataire
            JOIN utilisateur ul ON l.id_utilisateur = ul.id_utilisateur
            JOIN proprietaire p ON d.id_proprietaire = p.id_proprietaire
            JOIN utilisateur up ON p.id_utilisateur = up.id_utilisateur
            WHERE d.id_demande = $1
        `;
        
        let result = await db.query(queryLocataire, [id_demande]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        
        // Si pas trouvé, chercher dans les demandes de visiteurs
        const queryVisiteur = `
            SELECT dv.*,
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   dv.nom as locataire_nom,
                   dv.prenoms as locataire_prenoms,
                   dv.email as locataire_email,
                   dv.telephone as locataire_telephone,
                   u.nom as proprietaire_nom,
                   u.prenoms as proprietaire_prenoms,
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur dv
            LEFT JOIN bien b ON dv.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE dv.id_demande = $1
        `;
        
        result = await db.query(queryVisiteur, [id_demande]);
        return result.rows[0] || null;
    }

    // ============================================================
    // ACCEPTER UNE DEMANDE DE VISITE
    // ============================================================
    static async accepter(id_demande) {
        const query = `
            UPDATE demander_visite 
            SET statut_demande = 'acceptee',
                date_reponse = CURRENT_TIMESTAMP
            WHERE id_demande = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_demande]);
        
        if (result.rows[0]) {
            // Notifier le locataire
            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 SELECT l.id_utilisateur,
                        'Demande de visite acceptée',
                        'Votre demande de visite a été acceptée',
                        'visite'
                 FROM demander_visite d
                 JOIN locataire l ON d.id_locataire = l.id_locataire
                 WHERE d.id_demande = $1`,
                [id_demande]
            );
        }

        return result.rows[0];
    }

    // ============================================================
    // REFUSER UNE DEMANDE DE VISITE
    // ============================================================
    static async refuser(id_demande) {
        const query = `
            UPDATE demander_visite 
            SET statut_demande = 'refusee',
                date_reponse = CURRENT_TIMESTAMP
            WHERE id_demande = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_demande]);

        if (result.rows[0]) {
            // Notifier le locataire
            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 SELECT l.id_utilisateur,
                        'Demande de visite refusée',
                        'Votre demande de visite a été refusée',
                        'visite'
                 FROM demander_visite d
                 JOIN locataire l ON d.id_locataire = l.id_locataire
                 WHERE d.id_demande = $1`,
                [id_demande]
            );
        }

        return result.rows[0];
    }

    // ============================================================
    // ANNULER UNE DEMANDE (par le locataire)
    // ============================================================
    static async annuler(id_demande) {
        const query = `
            UPDATE demander_visite 
            SET statut_demande = 'annulee',
                date_reponse = CURRENT_TIMESTAMP
            WHERE id_demande = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_demande]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES DEMANDES EN ATTENTE
    // ============================================================
    static async findEnAttente(id_proprietaire = null) {
        let query = `
            SELECT d.*, 
                   b.titre as bien_titre,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms
            FROM demander_visite d
            JOIN bien b ON d.id_bien = b.id_bien
            JOIN locataire l ON d.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE d.statut_demande = 'en_attente'
        `;
        
        const values = [];
        
        if (id_proprietaire) {
            query += ` AND d.id_proprietaire = $1`;
            values.push(id_proprietaire);
        }
        
        query += ` ORDER BY d.date_demande`;

        const result = await db.query(query, values);
        return result.rows;
    }

    // ============================================================
    // STATISTIQUES DES DEMANDES
    // ============================================================
    static async getStats(id_proprietaire = null) {
        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN statut_demande = 'en_attente' THEN 1 END) as en_attente,
                COUNT(CASE WHEN statut_demande = 'acceptee' THEN 1 END) as acceptees,
                COUNT(CASE WHEN statut_demande = 'refusee' THEN 1 END) as refusees,
                COUNT(CASE WHEN statut_demande = 'annulee' THEN 1 END) as annulees
            FROM demander_visite
        `;
        
        const values = [];
        
        if (id_proprietaire) {
            query = query.replace('FROM demander_visite', 
                'FROM demander_visite WHERE id_proprietaire = $1');
            values.push(id_proprietaire);
        }

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = DemandeVisite;