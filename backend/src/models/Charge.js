const db = require('../config/database');

class Charge {
    // ============================================================
    // CRÉER UNE CHARGE
    // ============================================================
    static async create(chargeData) {
        try {
            const { 
                id_proprietaire, 
                id_locataire, 
                id_bien, 
                type_charge, 
                titre, 
                description, 
                montant, 
                date_echeance,
                periode_facture,
                reference_facture,
                notes
            } = chargeData;

            const query = `
                INSERT INTO charges (
                    id_proprietaire, id_locataire, id_bien, type_charge, titre, description,
                    montant, date_echeance, periode_facture, reference_facture, notes,
                    statut, date_creation, date_modification
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'impaye', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `;

            const values = [
                id_proprietaire, id_locataire, id_bien, type_charge, titre, description,
                montant, date_echeance, periode_facture, reference_facture, notes
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur création charge:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER LES CHARGES D'UN PROPRIÉTAIRE
    // ============================================================
    static async findByProprietaire(id_proprietaire) {
        try {
            const query = `
                SELECT c.*, 
                       u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms,
                       u_loc.email as locataire_email,
                       b.titre as bien_titre, b.adresse as bien_adresse
                FROM charges c
                LEFT JOIN utilisateur u_loc ON c.id_locataire = u_loc.id_utilisateur
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                WHERE c.id_proprietaire = $1
                ORDER BY c.date_creation DESC
            `;

            const result = await db.query(query, [id_proprietaire]);
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération charges propriétaire:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER LES CHARGES D'UN LOCATAIRE
    // ============================================================
    static async findByLocataire(id_locataire) {
        try {
            const query = `
                SELECT c.*, 
                       u_prop.nom as proprietaire_nom, u_prop.prenoms as proprietaire_prenoms,
                       u_prop.email as proprietaire_email,
                       b.titre as bien_titre, b.adresse as bien_adresse
                FROM charges c
                LEFT JOIN utilisateur u_prop ON c.id_proprietaire = u_prop.id_utilisateur
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                WHERE c.id_locataire = $1
                ORDER BY c.date_creation DESC
            `;

            const result = await db.query(query, [id_locataire]);
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération charges locataire:', error);
            throw error;
        }
    }

    // ============================================================
    // CALCULER LE SOLDE TOTAL DES CHARGES D'UN LOCATAIRE
    // ============================================================
    static async calculerSoldeLocataire(id_locataire) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as nombre_charges,
                    SUM(CASE WHEN statut = 'impaye' THEN montant ELSE 0 END) as total_impaye,
                    SUM(CASE WHEN statut = 'partiellement_paye' THEN (montant - montant_paye) ELSE 0 END) as total_partiellement_paye,
                    SUM(CASE WHEN statut = 'paye' THEN montant ELSE 0 END) as total_paye,
                    SUM(montant) as total_general,
                    SUM(montant - montant_paye) as solde_du
                FROM charges
                WHERE id_locataire = $1
            `;

            const result = await db.query(query, [id_locataire]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur calcul solde locataire:', error);
            throw error;
        }
    }

    // ============================================================
    // METTRE À JOUR LE STATUT D'UNE CHARGE
    // ============================================================
    static async updateStatut(id_charge, statut, montant_paye = null) {
        try {
            let query = `
                UPDATE charges 
                SET statut = $2, date_modification = CURRENT_TIMESTAMP
            `;

            let params = [id_charge, statut];

            if (montant_paye !== null) {
                query += `, montant_paye = $3`;
                if (statut === 'paye') {
                    query += `, date_paiement = CURRENT_TIMESTAMP`;
                }
                params.push(montant_paye);
            }

            query += ` WHERE id_charge = $1 RETURNING *`;
            params.unshift(id_charge);

            const result = await db.query(query, params);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur mise à jour statut charge:', error);
            throw error;
        }
    }

    // ============================================================
    // SUPPRIMER UNE CHARGE
    // ============================================================
    static async delete(id_charge) {
        try {
            const query = 'DELETE FROM charges WHERE id_charge = $1';
            const result = await db.query(query, [id_charge]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Erreur suppression charge:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER LES CHARGES IMPAYÉES POUR LES NOTIFICATIONS
    // ============================================================
    static async findChargesImpayees() {
        try {
            const query = `
                SELECT c.*, 
                       u_loc.email as locataire_email,
                       u_loc.nom as locataire_nom,
                       u_loc.prenoms as locataire_prenoms,
                       b.titre as bien_titre
                FROM charges c
                JOIN utilisateur u_loc ON c.id_locataire = u_loc.id_utilisateur
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                WHERE c.statut = 'impaye' 
                AND (c.date_echeance IS NULL OR c.date_echeance <= CURRENT_DATE)
                ORDER BY c.date_creation ASC
            `;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération charges impayées:', error);
            throw error;
        }
    }
}

module.exports = Charge;
