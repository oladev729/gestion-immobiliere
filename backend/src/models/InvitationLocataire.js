const db = require('../config/database');
const crypto = require('crypto');

class InvitationLocataire {
    // ============================================================
    // GÉNÉRER UN TOKEN UNIQUE
    // ============================================================
    static generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // ============================================================
    // CRÉER UNE INVITATION (propriétaire)
    // ============================================================
    static async create(invitationData) {
        const { id_demande, id_proprietaire } = invitationData;
        const token = this.generateToken();

        const query = `
            INSERT INTO invitation_locataire (id_demande, id_proprietaire, token, statut)
            VALUES ($1, $2, $3, 'envoyee')
            RETURNING *
        `;

        const values = [id_demande, id_proprietaire, token];
        const result = await db.query(query, values);
        
        // Mettre à jour le statut de la demande
        await db.query(
            'UPDATE demande_inscription_visiteur SET statut = $2 WHERE id_demande = $1',
            [id_demande, 'invite']
        );

        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UNE INVITATION PAR TOKEN
    // ============================================================
    static async findByToken(token) {
        const query = `
            SELECT i.*, d.nom, d.prenoms, d.email, d.telephone
            FROM invitation_locataire i
            JOIN demande_inscription_visiteur d ON i.id_demande = d.id_demande
            WHERE i.token = $1
        `;
        const result = await db.query(query, [token]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES INVITATIONS D'UN PROPRIÉTAIRE
    // ============================================================
    static async findByProprietaire(id_proprietaire) {
        const query = `
            SELECT i.*, d.nom, d.prenoms, d.email, d.telephone, d.message
            FROM invitation_locataire i
            JOIN demande_inscription_visiteur d ON i.id_demande = d.id_demande
            WHERE i.id_proprietaire = $1
            ORDER BY i.date_invitation DESC
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows;
    }

    // ============================================================
    // VALIDER UNE INVITATION (token valide et non utilisé)
    // ============================================================
    static async validerToken(token) {
        const query = `
            SELECT * FROM invitation_locataire 
            WHERE token = $1 AND statut = 'envoyee'
        `;
        const result = await db.query(query, [token]);
        return result.rows[0];
    }

    // ============================================================
    // MARQUER UNE INVITATION COMME UTILISÉE
    // ============================================================
    static async marquerUtilisee(id_invitation) {
        const query = `
            UPDATE invitation_locataire 
            SET statut = 'utilisee', date_utilisation = CURRENT_TIMESTAMP
            WHERE id_invitation = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_invitation]);
        
        if (result.rows[0]) {
            // Mettre à jour la demande associée
            await db.query(
                'UPDATE demande_inscription_visiteur SET statut = $2 WHERE id_demande = $1',
                [result.rows[0].id_demande, 'converti']
            );
        }
        
        return result.rows[0];
    }

    // ============================================================
    // ANNULER UNE INVITATION (expirer)
    // ============================================================
    static async annuler(id_invitation) {
        const query = `
            UPDATE invitation_locataire 
            SET statut = 'expiree' 
            WHERE id_invitation = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_invitation]);
        return result.rows[0];
    }

    // ============================================================
    // STATISTIQUES DES INVITATIONS
    // ============================================================
    static async getStats(id_proprietaire = null) {
        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN statut = 'envoyee' THEN 1 END) as envoyees,
                COUNT(CASE WHEN statut = 'utilisee' THEN 1 END) as utilisees,
                COUNT(CASE WHEN statut = 'expiree' THEN 1 END) as expirees
            FROM invitation_locataire
        `;
        
        const values = [];
        
        if (id_proprietaire) {
            query += ` WHERE id_proprietaire = $1`;
            values.push(id_proprietaire);
        }

        const result = await db.query(query, values);
        return result.rows[0];
    }
}

module.exports = InvitationLocataire;