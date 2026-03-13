const db = require('../config/database');

class Contrat {
    // ============================================================
    // CRÉER UN CONTRAT
    // ============================================================
    static async create(contratData) {
        const {
            numero_contrat,
            id_locataire,
            id_bien,
            date_debut,
            date_fin,
            loyer_mensuel,
            charge,
            nb_mois_depot_guarantie,
            montant_depot_guarantie_attendu,
            date_signature
        } = contratData;

        // Vérifier que le bien est disponible
        const bien = await db.query(
            'SELECT statut FROM bien WHERE id_bien = $1',
            [id_bien]
        );

        if (bien.rows.length === 0) {
            throw new Error('Bien non trouvé');
        }

        if (bien.rows[0].statut !== 'disponible') {
            throw new Error('Le bien n\'est pas disponible pour la location');
        }

        const query = `
            INSERT INTO contact (
                numero_contrat,
                id_locataire,
                id_bien,
                date_debut,
                date_fin,
                loyer_mensuel,
                charge,
                nb_mois_depot_guarantie,
                montant_depot_guarantie_attendu,
                date_signature,
                statut_contrat
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            numero_contrat,
            id_locataire,
            id_bien,
            date_debut,
            date_fin,
            loyer_mensuel,
            charge || 0,
            nb_mois_depot_guarantie || 1,
            montant_depot_guarantie_attendu,
            date_signature || new Date(),
            'actif'
        ];

        const result = await db.query(query, values);
        
        // Mettre à jour le statut du bien à "loue"
        await db.query(
            'UPDATE bien SET statut = $2 WHERE id_bien = $1',
            [id_bien, 'loue']
        );

        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES CONTRATS D'UN LOCATAIRE
    // ============================================================
    static async findByLocataire(id_locataire) {
        const query = `
            SELECT c.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            WHERE c.id_locataire = $1
            ORDER BY c.date_creation DESC
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES CONTRATS D'UN PROPRIÉTAIRE
    // ============================================================
    static async findByProprietaire(id_proprietaire) {
        const query = `
            SELECT c.*, 
                   b.titre as bien_titre,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN locataire l ON c.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE b.id_proprietaire = $1
            ORDER BY c.date_creation DESC
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UN CONTRAT PAR SON ID
    // ============================================================
  static async findById(id_contrat) {
    const query = `
        SELECT c.*, 
               b.id_proprietaire,
               b.titre as bien_titre,
               b.adresse as bien_adresse,
               b.ville as bien_ville,
               u.nom as locataire_nom,
               u.prenoms as locataire_prenoms,
               u.email as locataire_email,
               u.telephone as locataire_telephone
        FROM contact c
        JOIN bien b ON c.id_bien = b.id_bien
        JOIN locataire l ON c.id_locataire = l.id_locataire
        JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
        WHERE c.id_contact = $1
    `;
    const result = await db.query(query, [id_contrat]);
    return result.rows[0];
}

    // ============================================================
    // RÉCUPÉRER UN CONTRAT PAR SON NUMÉRO
    // ============================================================
    static async findByNumero(numero_contrat) {
        const query = 'SELECT * FROM contact WHERE numero_contrat = $1';
        const result = await db.query(query, [numero_contrat]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR UN CONTRAT
    // ============================================================
    static async update(id_contrat, contratData) {
        const setClause = [];
        const values = [id_contrat];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(contratData)) {
            if (value !== undefined && key !== 'id_contrat') {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        const query = `
            UPDATE contact 
            SET ${setClause.join(', ')} 
            WHERE id_contact = $1 
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // TERMINER UN CONTRAT (changer statut)
    // ============================================================
    static async terminer(id_contrat) {
        // Récupérer l'id_bien avant de terminer le contrat
        const contrat = await db.query(
            'SELECT id_bien FROM contact WHERE id_contact = $1',
            [id_contrat]
        );

        if (contrat.rows.length === 0) {
            throw new Error('Contrat non trouvé');
        }

        const id_bien = contrat.rows[0].id_bien;

        // Mettre à jour le statut du contrat
        const query = `
            UPDATE contact 
            SET statut_contrat = 'termine' 
            WHERE id_contact = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_contrat]);

        // Remettre le bien disponible
        await db.query(
            'UPDATE bien SET statut = $2 WHERE id_bien = $1',
            [id_bien, 'disponible']
        );

        return result.rows[0];
    }

    // ============================================================
    // RÉSILIER UN CONTRAT
    // ============================================================
    static async resilier(id_contrat) {
        const contrat = await db.query(
            'SELECT id_bien FROM contact WHERE id_contact = $1',
            [id_contrat]
        );

        if (contrat.rows.length === 0) {
            throw new Error('Contrat non trouvé');
        }

        const id_bien = contrat.rows[0].id_bien;

        const query = `
            UPDATE contact 
            SET statut_contrat = 'resilie' 
            WHERE id_contact = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_contrat]);

        await db.query(
            'UPDATE bien SET statut = $2 WHERE id_bien = $1',
            [id_bien, 'disponible']
        );

        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES CONTRATS ACTIFS
    // ============================================================
    static async findActifs() {
        const query = `
            SELECT c.*, 
                   b.titre as bien_titre,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN locataire l ON c.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE c.statut_contrat = 'actif'
            ORDER BY c.date_creation DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    // ============================================================
    // VÉRIFIER LES CONTRATS QUI VONT BIENTÔT EXPIRE
    // ============================================================
    static async findExpirantDans(jours = 30) {
        const query = `
            SELECT c.*, 
                   b.titre as bien_titre,
                   u.email as locataire_email
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN locataire l ON c.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE c.statut_contrat = 'actif'
              AND c.date_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer
            ORDER BY c.date_fin
        `;
        const result = await db.query(query, [jours]);
        return result.rows;
    }

    // ============================================================
    // COMPTER LES CONTRATS PAR STATUT
    // ============================================================
    static async countByStatut(id_proprietaire = null) {
        let query = `
            SELECT c.statut_contrat, COUNT(*) as nombre
            FROM contact c
        `;
        
        const values = [];
        
        if (id_proprietaire) {
            query += ` JOIN bien b ON c.id_bien = b.id_bien
                       WHERE b.id_proprietaire = $1`;
            values.push(id_proprietaire);
        }
        
        query += ` GROUP BY c.statut_contrat`;

        const result = await db.query(query, values);
        return result.rows;
    }
}

module.exports = Contrat;