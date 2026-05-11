const db = require('../config/database');

class Alerte {
    // ============================================================
    // CRÉER UNE ALERTE
    // ============================================================
    static async create(alerteData) {
        try {
            const { 
                id_locataire, 
                id_proprietaire, 
                id_bien, 
                type_alerte, 
                titre, 
                description, 
                expediteur_type = 'locataire',
                statut = 'non_lu',
                date_echeance = null,
                statut_echeance = 'en_attente'
            } = alerteData;

            const query = `
                INSERT INTO alertes (
                    id_proprietaire, id_locataire, id_bien, type_alerte, titre, description,
                    date_echeance, statut, expediteur_type, statut_echeance,
                    date_creation
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                RETURNING *
            `;

            const values = [
                id_proprietaire, id_locataire, id_bien, type_alerte, titre, description,
                date_echeance, statut, expediteur_type, statut_echeance
            ];

            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Erreur création alerte:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER LES ALERTES FISCALES AVEC ÉCHÉANCE
    // ============================================================
    static async findAlertesFiscalesAvecEcheance() {
        try {
            const query = `
                SELECT a.*, 
                       u_loc.email as locataire_email,
                       u_loc.nom as locataire_nom,
                       u_loc.prenoms as locataire_prenoms,
                       b.titre as bien_titre
                FROM alertes a
                JOIN utilisateur u_loc ON a.id_locataire = u_loc.id_utilisateur
                LEFT JOIN bien b ON a.id_bien = b.id_bien
                WHERE a.type_alerte = 'fiscale' 
                AND a.date_echeance IS NOT NULL
                AND a.statut_echeance != 'expire'
                ORDER BY a.date_echeance ASC
            `;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Erreur récupération alertes fiscales avec échéance:', error);
            throw error;
        }
    }

    // ============================================================
    // METTRE À JOUR LES RAPPELS ENVOYÉS
    // ============================================================
    static async updateRappelsEnvoyes(id_alerte, rappels_envoyes) {
        try {
            const query = `
                UPDATE alertes 
                SET rappels_envoyes = $1, statut_echeance = 'rappel_envoye'
                WHERE id_alerte = $2
            `;
            
            await db.query(query, [JSON.stringify(rappels_envoyes), id_alerte]);
        } catch (error) {
            console.error('Erreur mise à jour rappels:', error);
            throw error;
        }
    }

    // ============================================================
    // MARQUER UNE ALERTE COMME EXPIRÉE
    // ============================================================
    static async marquerExpiree(id_alerte) {
        try {
            const query = `
                UPDATE alertes 
                SET statut_echeance = 'expire'
                WHERE id_alerte = $1
            `;
            
            await db.query(query, [id_alerte]);
        } catch (error) {
            console.error('Erreur marquage expiré:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER TOUTES LES ALERTES D'UN UTILISATEUR
    // ============================================================
    static async findByUtilisateur(id_utilisateur, type_utilisateur) {
        let query;
        let params;

        if (type_utilisateur === 'proprietaire') {
            query = `
                SELECT a.*, b.titre as bien_titre, 
                       u_loc.nom as locataire_nom, u_loc.prenoms as locataire_prenoms
                FROM alertes a
                LEFT JOIN bien b ON a.id_bien = b.id_bien
                LEFT JOIN locataire l ON a.id_locataire = l.id_locataire
                LEFT JOIN utilisateur u_loc ON l.id_utilisateur = u_loc.id_utilisateur
                WHERE a.id_proprietaire = $1
                ORDER BY a.date_creation DESC
            `;
            
            const proprietaireResult = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [id_utilisateur]
            );
            
            if (proprietaireResult.rows.length === 0) {
                return [];
            }
            
            params = [proprietaireResult.rows[0].id_proprietaire];
            
        } else if (type_utilisateur === 'locataire') {
            query = `
                SELECT a.*, b.titre as bien_titre, 
                       u_prop.nom as proprietaire_nom, u_prop.prenoms as proprietaire_prenoms
                FROM alertes a
                LEFT JOIN bien b ON a.id_bien = b.id_bien
                LEFT JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
                LEFT JOIN utilisateur u_prop ON p.id_utilisateur = u_prop.id_utilisateur
                WHERE a.id_locataire = $1
                ORDER BY a.date_creation DESC
            `;
            params = [id_utilisateur];
        } else {
            return [];
        }

        const result = await db.query(query, params);
        return result.rows;
    }
}

module.exports = Alerte;
