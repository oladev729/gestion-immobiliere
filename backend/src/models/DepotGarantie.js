const db = require('../config/database');

class DepotGarantie {
    // ============================================================
    // CRÉER UN DÉPÔT DE GARANTIE
    // ============================================================
    static async create(depotData) {
        const {
            id_contact,
            montant_depot_verse,
            date_versement,
            mode_versement,
            commentaire
        } = depotData;

        const query = `
            INSERT INTO depotgarantie (
                id_contact,
                montant_depot_verse,
                date_versement,
                mode_versement,
                commentaire
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            id_contact,
            montant_depot_verse,
            date_versement || new Date(),
            mode_versement || 'virement',
            commentaire || null
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LE DÉPÔT D'UN CONTRAT
    // ============================================================
    static async findByContrat(id_contact) {
        const query = 'SELECT * FROM depotgarantie WHERE id_contact = $1';
        const result = await db.query(query, [id_contact]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR UN DÉPÔT
    // ============================================================
    static async update(id_depot, depotData) {
        const setClause = [];
        const values = [id_depot];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(depotData)) {
            if (value !== undefined) {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        const query = `
            UPDATE depotgarantie 
            SET ${setClause.join(', ')} 
            WHERE id_depot = $1 
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // REMBOURSER UN DÉPÔT (fin de contrat)
    // ============================================================
    static async rembourser(id_depot, date_remboursement) {
        const query = `
            UPDATE depotgarantie 
            SET date_remboursement = $2,
                statut = 'rembourse'
            WHERE id_depot = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_depot, date_remboursement || new Date()]);
        return result.rows[0];
    }
}

module.exports = DepotGarantie;