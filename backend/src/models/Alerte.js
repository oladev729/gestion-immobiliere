const db = require('../config/database');

class Alerte {
    // ============================================================
    // CRÉER UNE ALERTE
    // ============================================================
    static async create(alerteData) {
        const {
            id_proprietaire,
            id_locataire,
            id_bien,
            type_alerte,
            titre,
            description,
            date_echeance,
            priorite,
            periodicite,
            statut,
            expediteur_type,
            destinataire_type
        } = alerteData;

        const query = `
            INSERT INTO alertes (
                id_proprietaire, id_locataire, id_bien, type_alerte, titre, description,
                date_echeance, priorite, periodicite, statut, expediteur_type, destinataire_type,
                date_creation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const values = [
            id_proprietaire, id_locataire, id_bien, type_alerte, titre, description,
            date_echeance, priorite, periodicite, statut || 'en_attente', expediteur_type, destinataire_type
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER TOUTES LES ALERTES D'UN UTILISATEUR
    // ============================================================
    static async findByUtilisateur(id_utilisateur, type_utilisateur) {
        let query;
        let params;

        if (type_utilisateur === 'proprietaire') {
            // Pour le propriétaire : récupérer l'ID propriétaire d'abord
            query = `
                SELECT a.*, b.titre as bien_titre, 
                       u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms
                FROM alertes a
                LEFT JOIN bien b ON a.id_bien = b.id_bien
                LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
                LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
                WHERE a.id_proprietaire = $1
                ORDER BY a.date_creation DESC, a.priorite DESC
            `;
            
            // Récupérer l'ID propriétaire depuis l'ID utilisateur
            const proprietaireResult = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [id_utilisateur]
            );
            
            if (proprietaireResult.rows.length === 0) {
                return [];
            }
            
            params = [proprietaireResult.rows[0].id_proprietaire];
            
        } else if (type_utilisateur === 'locataire') {
            // Pour le locataire
            query = `
                SELECT a.*, b.titre as bien_titre, 
                       u_prop.nom as proprietaire_nom, u_prop.prenoms as proprietaire_prenoms
                FROM alertes a
                LEFT JOIN bien b ON a.id_bien = b.id_bien
                LEFT JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
                LEFT JOIN utilisateur u_prop ON p.id_utilisateur = u_prop.id_utilisateur
                WHERE a.id_locataire = $1 AND a.destinataire_type = 'locataire'
                ORDER BY a.date_creation DESC, a.priorite DESC
            `;
            params = [id_utilisateur];
        } else {
            return [];
        }

        const result = await db.query(query, params);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UNE ALERTE PAR SON ID
    // ============================================================
    static async findById(id_alerte) {
        const query = `
            SELECT a.*, b.titre as bien_titre,
                   u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms,
                   u_prop.nom as proprietaire_nom, u_prop.prenoms as proprietaire_prenoms
            FROM alertes a
            LEFT JOIN bien b ON a.id_bien = b.id_bien
            LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
            LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
            LEFT JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u_prop ON p.id_utilisateur = u_prop.id_utilisateur
            WHERE a.id_alerte = $1
        `;
        const result = await db.query(query, [id_alerte]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR LE STATUT D'UNE ALERTE
    // ============================================================
    static async updateStatut(id_alerte, statut) {
        const query = `
            UPDATE alertes 
            SET statut = $2 
            WHERE id_alerte = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_alerte, statut]);
        return result.rows[0];
    }

    // ============================================================
    // SUPPRIMER UNE ALERTE
    // ============================================================
    static async delete(id_alerte) {
        const query = 'DELETE FROM alertes WHERE id_alerte = $1 RETURNING *';
        const result = await db.query(query, [id_alerte]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES ALERTES PAR TYPE
    // ============================================================
    static async findByType(id_proprietaire, type_alerte) {
        const query = `
            SELECT a.*, b.titre as bien_titre,
                   u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms
            FROM alertes a
            LEFT JOIN bien b ON a.id_bien = b.id_bien
            LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
            LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
            WHERE a.id_proprietaire = $1 AND a.type_alerte = $2
            ORDER BY a.date_creation DESC
        `;
        const result = await db.query(query, [id_proprietaire, type_alerte]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES ALERTES AUTOMATIQUES (PAIEMENTS)
    // ============================================================
    static async findAlertesAutomatiques(id_locataire) {
        const query = `
            SELECT a.*, b.titre as bien_titre,
                   u_prop.nom as proprietaire_nom, u_prop.prenoms as proprietaire_prenoms
            FROM alertes a
            LEFT JOIN bien b ON a.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u_prop ON p.id_utilisateur = u_prop.id_utilisateur
            WHERE a.id_locataire = $1 
              AND a.type_alerte = 'paiement'
              AND a.expediteur_type = 'systeme'
            ORDER BY a.date_creation DESC
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES ALERTES PAR STATUT
    // ============================================================
    static async findByStatut(id_proprietaire, statut) {
        const query = `
            SELECT a.*, b.titre as bien_titre,
                   u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms
            FROM alertes a
            LEFT JOIN bien b ON a.id_bien = b.id_bien
            LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
            LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
            WHERE a.id_proprietaire = $1 AND a.statut = $2
            ORDER BY a.date_creation DESC
        `;
        const result = await db.query(query, [id_proprietaire, statut]);
        return result.rows;
    }

    // ============================================================
    // COMPTER LES ALERTES PAR TYPE ET STATUT
    // ============================================================
    static async countByTypeAndStatut(id_proprietaire, type_alerte, statut) {
        const query = `
            SELECT COUNT(*) as count
            FROM alertes 
            WHERE id_proprietaire = $1 AND type_alerte = $2 AND statut = $3
        `;
        const result = await db.query(query, [id_proprietaire, type_alerte, statut]);
        return result.rows[0].count;
    }
}

module.exports = Alerte;
