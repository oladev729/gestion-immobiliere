const db = require('../config/database');

class Notification {
    // ============================================================
    // CRÉER UNE NOTIFICATION
    // ============================================================
    static async create(notificationData) {
        const {
            id_utilisateur,
            titre,
            message,
            type
        } = notificationData;

        const query = `
            INSERT INTO notification (id_utilisateur, titre, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const values = [
            id_utilisateur,
            titre,
            message,
            type
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES NOTIFICATIONS D'UN UTILISATEUR
    // ============================================================
    static async findByUser(id_utilisateur, limit = 20) {
        const query = `
            SELECT * FROM notification 
            WHERE id_utilisateur = $1 
            ORDER BY date_envoi DESC 
            LIMIT $2
        `;
        const result = await db.query(query, [id_utilisateur, limit]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES NOTIFICATIONS NON LUES D'UN UTILISATEUR
    // ============================================================
    static async findNonLues(id_utilisateur) {
        const query = `
            SELECT * FROM notification 
            WHERE id_utilisateur = $1 AND lu = false 
            ORDER BY date_envoi DESC
        `;
        const result = await db.query(query, [id_utilisateur]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UNE NOTIFICATION PAR ID
    // ============================================================
    static async findById(id_notification) {
        const query = 'SELECT * FROM notification WHERE id_notification = $1';
        const result = await db.query(query, [id_notification]);
        return result.rows[0];
    }

    // ============================================================
    // MARQUER UNE NOTIFICATION COMME LUE
    // ============================================================
    static async marquerCommeLue(id_notification) {
        const query = `
            UPDATE notification 
            SET lu = true, date_lecture = CURRENT_TIMESTAMP
            WHERE id_notification = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_notification]);
        return result.rows[0];
    }

    // ============================================================
    // MARQUER TOUTES LES NOTIFICATIONS D'UN UTILISATEUR COMME LUES
    // ============================================================
    static async marquerToutCommeLu(id_utilisateur) {
        const query = `
            UPDATE notification 
            SET lu = true, date_lecture = CURRENT_TIMESTAMP
            WHERE id_utilisateur = $1 AND lu = false
            RETURNING *
        `;
        const result = await db.query(query, [id_utilisateur]);
        return result.rows;
    }

    // ============================================================
    // COMPTER LES NOTIFICATIONS NON LUES D'UN UTILISATEUR
    // ============================================================
    static async countNonLues(id_utilisateur) {
        const query = `
            SELECT COUNT(*) as total_non_lues
            FROM notification
            WHERE id_utilisateur = $1 AND lu = false
        `;
        const result = await db.query(query, [id_utilisateur]);
        return parseInt(result.rows[0].total_non_lues);
    }

    // ============================================================
    // SUPPRIMER UNE NOTIFICATION
    // ============================================================
    static async delete(id_notification) {
        const query = 'DELETE FROM notification WHERE id_notification = $1 RETURNING id_notification';
        const result = await db.query(query, [id_notification]);
        return result.rows[0];
    }

    // ============================================================
    // SUPPRIMER TOUTES LES NOTIFICATIONS D'UN UTILISATEUR
    // ============================================================
    static async deleteAllByUser(id_utilisateur) {
        const query = 'DELETE FROM notification WHERE id_utilisateur = $1 RETURNING id_notification';
        const result = await db.query(query, [id_utilisateur]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES NOTIFICATIONS PAR TYPE
    // ============================================================
    static async findByType(id_utilisateur, type) {
        const query = `
            SELECT * FROM notification 
            WHERE id_utilisateur = $1 AND type = $2 
            ORDER BY date_envoi DESC
        `;
        const result = await db.query(query, [id_utilisateur, type]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES DERNIÈRES NOTIFICATIONS (tous utilisateurs)
    // ============================================================
    static async getRecentes(limit = 50) {
        const query = `
            SELECT n.*, u.nom, u.prenoms, u.email
            FROM notification n
            JOIN utilisateur u ON n.id_utilisateur = u.id_utilisateur
            ORDER BY n.date_envoi DESC
            LIMIT $1
        `;
        const result = await db.query(query, [limit]);
        return result.rows;
    }
}

module.exports = Notification;