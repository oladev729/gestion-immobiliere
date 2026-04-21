const db = require('../config/database');

class DemandeInscriptionVisiteur {
    // ============================================================
    // CRÉER UNE DEMANDE D'INSCRIPTION (visiteur)
    // ============================================================
    static async create(demandeData) {
        const { nom, prenoms, email, telephone, message, id_bien, date_visite_souhaitee, code_suivi } = demandeData;

        const query = `
            INSERT INTO demande_inscription_visiteur (nom, prenoms, email, telephone, message, id_bien, date_visite_souhaitee, statut, code_suivi)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'en_attente', $8)
            RETURNING *
        `;

        const values = [nom, prenoms, email, telephone || null, message || null, id_bien || null, date_visite_souhaitee || null, code_suivi || null];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Trouver toutes les demandes avec filtre optionnel
    static async findAll(statut = null) {
        try {
            let query = `
                SELECT 
                    di.*,
                    CASE 
                        WHEN di.statut = 'en_attente' THEN 'En attente'
                        WHEN di.statut = 'invite' THEN 'Invitée'
                        WHEN di.statut = 'traitee' THEN 'Traînée'
                        ELSE di.statut
                    END as statut_libelle
                FROM demande_inscription_visiteur di
                ORDER BY di.date_demande DESC
            `;
            
            let params = [];
            if (statut) {
                query = `
                    SELECT 
                        di.*,
                        CASE 
                            WHEN di.statut = 'en_attente' THEN 'En attente'
                            WHEN di.statut = 'invite' THEN 'Invitée'
                            WHEN di.statut = 'traitee' THEN 'Traînée'
                            ELSE di.statut
                        END as statut_libelle
                    FROM demande_inscription_visiteur di
                    WHERE di.statut = $1
                    ORDER BY di.date_demande DESC
                `;
                params = [statut];
            }
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Erreur findAll DemandeInscriptionVisiteur:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER TOUTES LES DEMANDES (admin/propriétaire)
    // ============================================================
    static async findAllAdmin(statut = null) {
        let query = `
            SELECT d.*, 
                   COUNT(i.id_invitation) as nb_invitations
            FROM demande_inscription_visiteur d
            LEFT JOIN invitation_locataire i ON d.id_demande = i.id_demande
        `;
        
        const values = [];
        
        if (statut) {
            query += ` WHERE d.statut = $1`;
            values.push(statut);
        }
        
        query += ` GROUP BY d.id_demande ORDER BY d.date_demande DESC`;
        
        const result = await db.query(query, values);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UNE DEMANDE PAR ID
    // ============================================================
    static async findById(id_demande) {
        const query = `
            SELECT d.*, 
                   i.id_invitation, i.token, i.statut as invitation_statut, i.date_invitation
            FROM demande_inscription_visiteur d
            LEFT JOIN invitation_locataire i ON d.id_demande = i.id_demande
            WHERE d.id_demande = $1
        `;
        const result = await db.query(query, [id_demande]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UNE DEMANDE PAR EMAIL
    // ============================================================
    static async findByEmail(email) {
        const query = 'SELECT * FROM demande_inscription_visiteur WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UNE DEMANDE PAR EMAIL ET CODE DE SUIVI
    // ============================================================
    static async findByCredentials(email, code_suivi) {
        const query = 'SELECT * FROM demande_inscription_visiteur WHERE email = $1 AND code_suivi = $2';
        const result = await db.query(query, [email, code_suivi]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR LE STATUT D'UNE DEMANDE
    // ============================================================
    static async updateStatut(id_demande, statut) {
        const validStatuts = ['en_attente', 'invite', 'converti'];
        if (!validStatuts.includes(statut)) {
            throw new Error('Statut invalide');
        }

        const query = `
            UPDATE demande_inscription_visiteur 
            SET statut = $2 
            WHERE id_demande = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_demande, statut]);
        return result.rows[0];
    }

    // ============================================================
    // SUPPRIMER UNE DEMANDE
    // ============================================================
    static async delete(id_demande) {
        const query = 'DELETE FROM demande_inscription_visiteur WHERE id_demande = $1 RETURNING id_demande';
        const result = await db.query(query, [id_demande]);
        return result.rows[0];
    }

    // ============================================================
    // STATISTIQUES DES DEMANDES
    // ============================================================
    static async getStats() {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente,
                COUNT(CASE WHEN statut = 'invite' THEN 1 END) as invites,
                COUNT(CASE WHEN statut = 'converti' THEN 1 END) as convertis
            FROM demande_inscription_visiteur
        `;
        const result = await db.query(query);
        return result.rows[0];
    }
}

module.exports = DemandeInscriptionVisiteur;