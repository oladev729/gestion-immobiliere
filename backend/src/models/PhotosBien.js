const db = require('../config/database');

class PhotosBien {
    // ============================================================
    // AJOUTER UNE PHOTO À UN BIEN
    // ============================================================
    static async add(id_bien, url_photobien, legende = null) {
        const query = `
            INSERT INTO photosbien (id_bien, url_photobien, legende)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await db.query(query, [id_bien, url_photobien, legende]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES PHOTOS D'UN BIEN
    // ============================================================
    static async findByBien(id_bien) {
        const query = `
            SELECT * FROM photosbien 
            WHERE id_bien = $1 
            ORDER BY date_ajout DESC
        `;
        const result = await db.query(query, [id_bien]);
        return result.rows;
    }

    // ============================================================
    // SUPPRIMER UNE PHOTO
    // ============================================================
    static async delete(id_photosbien) {
        const query = 'DELETE FROM photosbien WHERE id_photosbien = $1 RETURNING id_photosbien';
        const result = await db.query(query, [id_photosbien]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR LA LÉGENDE D'UNE PHOTO
    // ============================================================
    static async updateLegende(id_photosbien, legende) {
        const query = `
            UPDATE photosbien 
            SET legende = $2 
            WHERE id_photosbien = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_photosbien, legende]);
        return result.rows[0];
    }
}

module.exports = PhotosBien;