const db = require('../config/database');

class Quittance {
    static async create(paiementData) {
        try {
            const { 
                id_paiement, 
                id_locataire, 
                id_proprietaire, 
                id_bien, 
                type_quittance, // 'loyer', 'charge', 'depot'
                periode, 
                montant, 
                date_paiement,
                reference_paiement 
            } = paiementData;
            
            const query = `
                INSERT INTO quittance (
                    id_paiement, id_locataire, id_proprietaire, id_bien, 
                    type_quittance, periode, montant, date_paiement, 
                    reference_paiement, date_generation, statut
                ) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, 'valide')
                RETURNING *
            `;
            
            const result = await db.query(query, [
                id_paiement, id_locataire, id_proprietaire, id_bien,
                type_quittance, periode, montant, date_paiement,
                reference_paiement
            ]);
            
            return result.rows[0];
        } catch (error) {
            console.error('Erreur création quittance:', error);
            throw error;
        }
    }

    static async findByLocataire(id_locataire) {
        try {
            const query = `
                SELECT q.*, 
                       u.nom as locataire_nom, u.prenoms as locataire_prenoms,
                       u.email as locataire_email,
                       p.nom as proprietaire_nom, p.prenoms as proprietaire_prenoms,
                       b.titre as bien_titre, b.adresse as bien_adresse
                FROM quittance q
                JOIN utilisateur u ON q.id_locataire = u.id_utilisateur
                JOIN proprietaire prop ON q.id_proprietaire = prop.id_proprietaire
                JOIN utilisateur p ON prop.id_utilisateur = p.id_utilisateur
                LEFT JOIN bien b ON q.id_bien = b.id_bien
                WHERE q.id_locataire = $1
                ORDER BY q.date_generation DESC
            `;
            
            const result = await db.query(query, [id_locataire]);
            return result.rows;
        } catch (error) {
            console.error('Erreur recherche quittances locataire:', error);
            throw error;
        }
    }

    static async findByProprietaire(id_proprietaire) {
        try {
            const query = `
                SELECT q.*, 
                       u.nom as locataire_nom, u.prenoms as locataire_prenoms,
                       u.email as locataire_email,
                       p.nom as proprietaire_nom, p.prenoms as proprietaire_prenoms,
                       b.titre as bien_titre, b.adresse as bien_adresse
                FROM quittance q
                JOIN utilisateur u ON q.id_locataire = u.id_utilisateur
                JOIN proprietaire prop ON q.id_proprietaire = prop.id_proprietaire
                JOIN utilisateur p ON prop.id_utilisateur = p.id_utilisateur
                LEFT JOIN bien b ON q.id_bien = b.id_bien
                WHERE q.id_proprietaire = $1
                ORDER BY q.date_generation DESC
            `;
            
            const result = await db.query(query, [id_proprietaire]);
            return result.rows;
        } catch (error) {
            console.error('Erreur recherche quittances propriétaire:', error);
            throw error;
        }
    }

    static async findById(id_quittance) {
        try {
            const query = `
                SELECT q.*, 
                       u.nom as locataire_nom, u.prenoms as locataire_prenoms,
                       u.email as locataire_email,
                       p.nom as proprietaire_nom, p.prenoms as proprietaire_prenoms,
                       b.titre as bien_titre, b.adresse as bien_adresse
                FROM quittance q
                JOIN utilisateur u ON q.id_locataire = u.id_utilisateur
                JOIN proprietaire prop ON q.id_proprietaire = prop.id_proprietaire
                JOIN utilisateur p ON prop.id_utilisateur = p.id_utilisateur
                LEFT JOIN bien b ON q.id_bien = b.id_bien
                WHERE q.id_quittance = $1
            `;
            
            const result = await db.query(query, [id_quittance]);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur recherche quittance par ID:', error);
            throw error;
        }
    }

    static async generateReference() {
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            
            // Compter le nombre de quittances ce mois
            const countQuery = `
                SELECT COUNT(*) as count 
                FROM quittance 
                WHERE EXTRACT(YEAR FROM date_generation) = $1 
                AND EXTRACT(MONTH FROM date_generation) = $2
            `;
            
            const countResult = await db.query(countQuery, [year, month]);
            const count = parseInt(countResult.rows[0].count) + 1;
            
            return `Q${year}${month}${String(count).padStart(4, '0')}`;
        } catch (error) {
            console.error('Erreur génération référence:', error);
            throw error;
        }
    }
}

module.exports = Quittance;
