const db = require('../config/database');

class Locataire {
    // ============================================================
    // CRÉER UN LOCATAIRE (après inscription ou invitation)
    // ============================================================
    static async create(locataireData) {
        const {
            id_utilisateur,
            date_invitation,
            compte_confirme,
            token_invitation,
            date_confirmation,
            email_invite,
            date_expiration_token,
            statut_invitation,
            date_naissance,
            piece_identite
        } = locataireData;

        const query = `
            INSERT INTO locataire (
                id_utilisateur,
                date_invitation,
                compte_confirme,
                token_invitation,
                date_confirmation,
                email_invite,
                date_expiration_token,
                statut_invitation,
                date_naissance,
                piece_identite
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            id_utilisateur || null,
            date_invitation || new Date(),
            compte_confirme || false,
            token_invitation || null,
            date_confirmation || null,
            email_invite,
            date_expiration_token || null,
            statut_invitation || 'en_attente',
            date_naissance || null,
            piece_identite || null
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN LOCATAIRE PAR ID UTILISATEUR
    // ============================================================
    static async findByIdUtilisateur(id_utilisateur) {
        const query = `
            SELECT l.*, u.nom, u.prenoms, u.email, u.telephone
            FROM locataire l
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE l.id_utilisateur = $1
        `;
        const result = await db.query(query, [id_utilisateur]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN LOCATAIRE PAR ID LOCATAIRE
    // ============================================================
    static async findById(id_locataire) {
        const query = `
            SELECT l.*, u.nom, u.prenoms, u.email, u.telephone
            FROM locataire l
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE l.id_locataire = $1
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN LOCATAIRE PAR EMAIL
    // ============================================================
    static async findByEmail(email) {
        const query = `
            SELECT l.*, u.nom, u.prenoms, u.email, u.telephone
            FROM locataire l
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE u.email = $1
        `;
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR UN LOCATAIRE
    // ============================================================
    static async update(id_locataire, locataireData) {
        const setClause = [];
        const values = [id_locataire];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(locataireData)) {
            if (value !== undefined && key !== 'id_locataire') {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        const query = `
            UPDATE locataire 
            SET ${setClause.join(', ')} 
            WHERE id_locataire = $1 
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // CONFIRMER LE COMPTE D'UN LOCATAIRE (après invitation)
    // ============================================================
    static async confirmerCompte(id_locataire, id_utilisateur) {
        const query = `
            UPDATE locataire 
            SET id_utilisateur = $2,
                compte_confirme = true,
                date_confirmation = CURRENT_TIMESTAMP,
                statut_invitation = 'accepte'
            WHERE id_locataire = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_locataire, id_utilisateur]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES INVITATIONS EN ATTENTE
    // ============================================================
    static async findInvitationsEnAttente() {
        const query = `
            SELECT * FROM locataire 
            WHERE statut_invitation = 'en_attente' 
            AND id_utilisateur IS NULL
            ORDER BY date_invitation DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UNE INVITATION PAR TOKEN
    // ============================================================
    static async findByToken(token_invitation) {
        const query = `
            SELECT * FROM locataire 
            WHERE token_invitation = $1 
            AND statut_invitation = 'en_attente'
        `;
        const result = await db.query(query, [token_invitation]);
        return result.rows[0];
    }

    // ============================================================
    // VALIDER UN TOKEN D'INVITATION
    // ============================================================
    static async validerToken(token_invitation) {
        const query = `
            SELECT * FROM locataire 
            WHERE token_invitation = $1 
            AND statut_invitation = 'en_attente'
            AND date_expiration_token > NOW()
        `;
        const result = await db.query(query, [token_invitation]);
        return result.rows[0];
    }

    // ============================================================
    // SUPPRIMER UN LOCATAIRE
    // ============================================================
    static async delete(id_locataire) {
        const query = 'DELETE FROM locataire WHERE id_locataire = $1 RETURNING id_locataire';
        const result = await db.query(query, [id_locataire]);
        return result.rows[0];
    }
}

module.exports = Locataire;