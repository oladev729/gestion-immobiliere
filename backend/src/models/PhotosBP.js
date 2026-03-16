const db = require('../config/database');

class PhotosBP {
    // ============================================================
    // AJOUTER UNE PHOTO À UN PROBLÈME
    // ============================================================
    static async add(id_probleme, url_photosbp, description = null) {
        const query = `
            INSERT INTO photosbp (id_probleme, url_photosbp, description)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [id_probleme, url_photosbp, description]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES PHOTOS D'UN PROBLÈME
    // ============================================================
    static async findByProbleme(id_probleme) {
        const query = `
            SELECT * FROM photosbp 
            WHERE id_probleme = $1 
            ORDER BY date_ajout DESC
        `;
        const result = await db.query(query, [id_probleme]);
        return result.rows;
    }

    // ============================================================
    // SUPPRIMER UNE PHOTO
    // ============================================================
    static async delete(id_photosbp) {
        const query = 'DELETE FROM photosbp WHERE id_photosbp = $1 RETURNING id_photosbp';
        const result = await db.query(query, [id_photosbp]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR LA DESCRIPTION D'UNE PHOTO
    // ============================================================
    static async updateDescription(id_photosbp, description) {
        const query = `
            UPDATE photosbp 
            SET description = $2 
            WHERE id_photosbp = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_photosbp, description]);
        return result.rows[0];
    }
}

module.exports = PhotosBP;