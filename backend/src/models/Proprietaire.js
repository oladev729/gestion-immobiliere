const db = require('../config/database');

class Proprietaire {
    // ============================================================
    // CRÉER UN PROPRIÉTAIRE
    // ============================================================
    static async create(proprietaireData) {
        const {
            id_utilisateur,
            adresse_fiscale
        } = proprietaireData;

        const query = `
            INSERT INTO proprietaire (id_utilisateur, adresse_fiscale)
            VALUES ($1, $2)
            RETURNING *
        `;

        const values = [id_utilisateur, adresse_fiscale || null];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN PROPRIÉTAIRE PAR ID UTILISATEUR
    // ============================================================
    static async findByIdUtilisateur(id_utilisateur) {
        const query = `
            SELECT p.*, u.nom, u.prenoms, u.email, u.telephone
            FROM proprietaire p
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE p.id_utilisateur = $1
        `;
        const result = await db.query(query, [id_utilisateur]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN PROPRIÉTAIRE PAR ID PROPRIÉTAIRE
    // ============================================================
    static async findById(id_proprietaire) {
        const query = `
            SELECT p.*, u.nom, u.prenoms, u.email, u.telephone
            FROM proprietaire p
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE p.id_proprietaire = $1
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES PROPRIÉTAIRES
    // ============================================================
    static async findAll() {
        const query = `
            SELECT p.*, u.nom, u.prenoms, u.email, u.telephone
            FROM proprietaire p
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            ORDER BY u.date_inscription DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    // ============================================================
    // METTRE À JOUR UN PROPRIÉTAIRE
    // ============================================================
    static async update(id_proprietaire, proprietaireData) {
        const setClause = [];
        const values = [id_proprietaire];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(proprietaireData)) {
            if (value !== undefined && key !== 'id_proprietaire') {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        const query = `
            UPDATE proprietaire 
            SET ${setClause.join(', ')} 
            WHERE id_proprietaire = $1 
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // COMPTER LE NOMBRE DE BIENS PAR PROPRIÉTAIRE
    // ============================================================
    static async countBiens(id_proprietaire) {
        const query = `
            SELECT COUNT(*) as total_biens
            FROM bien
            WHERE id_proprietaire = $1
        `;
        const result = await db.query(query, [id_proprietaire]);
        return parseInt(result.rows[0].total_biens);
    }

    // ============================================================
    // COMPTER LE NOMBRE DE CONTRATS ACTIFS PAR PROPRIÉTAIRE
    // ============================================================
    static async countContratsActifs(id_proprietaire) {
        const query = `
            SELECT COUNT(*) as total_contrats
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            WHERE b.id_proprietaire = $1 AND c.statut_contrat = 'actif'
        `;
        const result = await db.query(query, [id_proprietaire]);
        return parseInt(result.rows[0].total_contrats);
    }

    // ============================================================
    // SUPPRIMER UN PROPRIÉTAIRE
    // ============================================================
    static async delete(id_proprietaire) {
        const query = 'DELETE FROM proprietaire WHERE id_proprietaire = $1 RETURNING id_proprietaire';
        const result = await db.query(query, [id_proprietaire]);
        return result.rows[0];
    }
}

module.exports = Proprietaire;