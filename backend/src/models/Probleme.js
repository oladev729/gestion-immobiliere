const db = require('../config/database');

class Probleme {
    // ============================================================
    // CRÉER UN SIGNALEMENT DE PROBLÈME (par le locataire)
    // ============================================================
    static async create(problemeData) {
        const {
            id_locataire,
            id_bien,
            titre,
            description,
            categorie,
            priorite
        } = problemeData;

        const query = `
            INSERT INTO problemes (
                id_locataire,
                id_bien,
                titre,
                description,
                categorie,
                priorite,
                statut_probleme,
                date_signalement
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, DEFAULT)
            RETURNING *
        `;

        const values = [
            id_locataire,
            id_bien,
            titre,
            description,
            categorie,
            priorite || 'moyenne',
            'ouvert'
        ];

        const result = await db.query(query, values);
        
        // Créer une notification pour le propriétaire
        await db.query(
            `INSERT INTO notification (id_utilisateur, titre, message, type)
             SELECT u.id_utilisateur, 
                    'Nouveau problème signalé',
                    'Un problème a été signalé pour votre bien: ' || b.titre,
                    'probleme'
             FROM proprietaire p
             JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
             JOIN bien b ON b.id_proprietaire = p.id_proprietaire
             WHERE b.id_bien = $1`,
            [id_bien]
        );

        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES PROBLÈMES D'UN BIEN
    // ============================================================
    static async findByBien(id_bien) {
        const query = `
            SELECT p.*, 
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms,
                   u.email as locataire_email,
                   u.telephone as locataire_telephone
            FROM problemes p
            JOIN locataire l ON p.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE p.id_bien = $1
            ORDER BY p.date_signalement DESC
        `;
        const result = await db.query(query, [id_bien]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES PROBLÈMES D'UN LOCATAIRE
    // ============================================================
    static async findByLocataire(id_locataire) {
        const query = `
            SELECT p.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville
            FROM problemes p
            JOIN bien b ON p.id_bien = b.id_bien
            WHERE p.id_locataire = $1
            ORDER BY p.date_signalement DESC
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES PROBLÈMES D'UN PROPRIÉTAIRE
    // ============================================================
    static async findByProprietaire(id_proprietaire) {
        const query = `
            SELECT p.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms
            FROM problemes p
            JOIN bien b ON p.id_bien = b.id_bien
            JOIN locataire l ON p.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE b.id_proprietaire = $1
            ORDER BY p.date_signalement DESC
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UN PROBLÈME PAR SON ID
    // ============================================================
    static async findById(id_probleme) {
        const query = `
            SELECT p.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms,
                   u.email as locataire_email,
                   u.telephone as locataire_telephone
            FROM problemes p
            JOIN bien b ON p.id_bien = b.id_bien
            JOIN locataire l ON p.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE p.id_probleme = $1
        `;
        const result = await db.query(query, [id_probleme]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR LE STATUT D'UN PROBLÈME
    // ============================================================
    static async updateStatut(id_probleme, statut) {
        let query = `
            UPDATE problemes 
            SET statut_probleme = $2
        `;
        
        const values = [id_probleme, statut];
        
        if (statut === 'resolu') {
            query = `
                UPDATE problemes 
                SET statut_probleme = $2,
                    date_resolution = CURRENT_TIMESTAMP
            `;
        }
        
        query += ` WHERE id_probleme = $1 RETURNING *`;
        
        const result = await db.query(query, values);

        if (result.rows[0]) {
            // Notifier le locataire du changement de statut
            await db.query(
                `INSERT INTO notification (id_utilisateur, titre, message, type)
                 SELECT l.id_utilisateur,
                        'Statut du problème mis à jour',
                        'Votre problème est maintenant: ' || $2,
                        'probleme'
                 FROM problemes p
                 JOIN locataire l ON p.id_locataire = l.id_locataire
                 WHERE p.id_probleme = $1`,
                [id_probleme, statut]
            );
        }

        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES PROBLÈMES PAR STATUT
    // ============================================================
    static async findByStatut(statut, id_proprietaire = null) {
        let query = `
            SELECT p.*, 
                   b.titre as bien_titre,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms
            FROM problemes p
            JOIN bien b ON p.id_bien = b.id_bien
            JOIN locataire l ON p.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE p.statut_probleme = $1
        `;
        
        const values = [statut];
        let paramIndex = 2;
        
        if (id_proprietaire) {
            query += ` AND b.id_proprietaire = $${paramIndex}`;
            values.push(id_proprietaire);
        }
        
        query += ` ORDER BY p.date_signalement DESC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    // ============================================================
    // STATISTIQUES DES PROBLÈMES
    // ============================================================
    static async getStats(id_proprietaire = null) {
        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN statut_probleme = 'ouvert' THEN 1 END) as ouverts,
                COUNT(CASE WHEN statut_probleme = 'en_cours' THEN 1 END) as en_cours,
                COUNT(CASE WHEN statut_probleme = 'resolu' THEN 1 END) as resolus,
                COUNT(CASE WHEN statut_probleme = 'ferme' THEN 1 END) as fermes,
                COUNT(CASE WHEN priorite = 'urgente' THEN 1 END) as urgentes,
                COUNT(CASE WHEN priorite = 'haute' THEN 1 END) as hautes,
                COUNT(CASE WHEN priorite = 'moyenne' THEN 1 END) as moyennes,
                COUNT(CASE WHEN priorite = 'basse' THEN 1 END) as basses
            FROM problemes p
        `;
        
        const values = [];
        
        if (id_proprietaire) {
            query = query.replace('FROM problemes p', 
                'FROM problemes p JOIN bien b ON p.id_bien = b.id_bien WHERE b.id_proprietaire = $1');
            values.push(id_proprietaire);
        }

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = Probleme;