const db = require('../config/database');

class LoyerMensuel {
    // ============================================================
    // CRÉER UN LOYER MENSUEL
    // ============================================================
    static async create(loyerData) {
        const {
            id_contact,
            mois_concerne,
            montant_loyer,
            montant_charge,
            date_echeance,
            statut
        } = loyerData;

        const query = `
            INSERT INTO loyermensuel (
                id_contact,
                mois_concerne,
                montant_loyer,
                montant_charge,
                date_echeance,
                statut
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            id_contact,
            mois_concerne,
            montant_loyer,
            montant_charge || 0,
            date_echeance,
            statut || 'en_attente'
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // CRÉER TOUS LES LOYERS D'UN CONTRAT (pour 12 mois)
    // ============================================================
    static async genererEcheances(contrat) {
        const {
            id_contact,
            date_debut,
            date_fin,
            loyer_mensuel,
            charge
        } = contrat;

        const loyers = [];
        let currentDate = new Date(date_debut);
        const endDate = new Date(date_fin);

        while (currentDate <= endDate) {
            const mois = currentDate.toISOString().slice(0, 7); // YYYY-MM
            
            const loyer = await this.create({
                id_contact,
                mois_concerne: mois,
                montant_loyer: loyer_mensuel,
                montant_charge: charge,
                date_echeance: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5), // 5 du mois
                statut: 'en_attente'
            });
            
            loyers.push(loyer);
            
            // Mois suivant
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        return loyers;
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES LOYERS D'UN CONTRAT
    // ============================================================
    static async findByContrat(id_contact) {
        const query = `
            SELECT * FROM loyermensuel 
            WHERE id_contact = $1 
            ORDER BY mois_concerne
        `;
        const result = await db.query(query, [id_contact]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UN LOYER PAR ID
    // ============================================================
    static async findById(id_loyer) {
        const query = 'SELECT * FROM loyermensuel WHERE id_loyer = $1';
        const result = await db.query(query, [id_loyer]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR UN LOYER
    // ============================================================
    static async update(id_loyer, loyerData) {
        const setClause = [];
        const values = [id_loyer];
        let paramIndex = 2;

        for (const [key, value] of Object.entries(loyerData)) {
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
            UPDATE loyermensuel 
            SET ${setClause.join(', ')} 
            WHERE id_loyer = $1 
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // MARQUER UN LOYER COMME PAYÉ
    // ============================================================
    static async marquerPaye(id_loyer) {
        const query = `
            UPDATE loyermensuel 
            SET statut = 'paye' 
            WHERE id_loyer = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_loyer]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES LOYERS IMPAYÉS
    // ============================================================
    static async findImpayes() {
        const query = `
            SELECT l.*,
                   c.id_locataire,
                   c.id_bien,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms,
                   u.email as locataire_email
            FROM loyermensuel l
            JOIN contact c ON l.id_contact = c.id_contact
            JOIN locataire l2 ON c.id_locataire = l2.id_locataire
            JOIN utilisateur u ON l2.id_utilisateur = u.id_utilisateur
            WHERE l.statut = 'impaye' AND l.date_echeance < CURRENT_DATE
            ORDER BY l.date_echeance
        `;
        const result = await db.query(query);
        return result.rows;
    }

    // ============================================================
    // GÉNÉRER LES ÉCHÉANCES MENSUELLES POUR TOUS LES CONTRATS ACTIFS
    // ============================================================
    static async genererEcheancesMensuelles() {
        try {
            // Récupérer tous les contrats actifs
            const contratsActifs = await db.query(`
                SELECT c.*, b.id_proprietaire
                FROM contact c
                JOIN bien b ON c.id_bien = b.id_bien
                WHERE c.statut_contrat = 'actif'
                AND c.date_fin > CURRENT_DATE
            `);

            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
            const echeancesCreees = [];

            for (const contrat of contratsActifs.rows) {
                // Vérifier si l'échéance du mois courant existe déjà
                const existingEcheance = await db.query(`
                    SELECT * FROM loyermensuel
                    WHERE id_contact = $1 AND mois_concerne = $2
                `, [contrat.id_contact, currentMonth]);

                if (existingEcheance.rows.length === 0) {
                    // Créer l'échéance du mois courant
                    const dateEcheance = new Date();
                    dateEcheance.setDate(5); // 5 du mois

                    const nouveauLoyer = await this.create({
                        id_contact: contrat.id_contact,
                        mois_concerne: currentMonth,
                        montant_loyer: contrat.loyer_mensuel,
                        montant_charge: contrat.charge || 0,
                        date_echeance: dateEcheance,
                        statut: 'en_attente'
                    });

                    echeancesCreees.push(nouveauLoyer);
                    console.log(`✅ Échéance créée pour contrat ${contrat.id_contact} - mois ${currentMonth}`);
                }
            }

            return echeancesCreees;
        } catch (error) {
            console.error('Erreur génération échéances mensuelles:', error);
            throw error;
        }
    }

    // ============================================================
    // RÉCUPÉRER LES ÉCHÉANCES À POUR UN PROPRIÉTAIRE
    // ============================================================
    static async findImpayesByProprietaire(id_proprietaire) {
        const query = `
            SELECT l.*,
                   c.id_contact,
                   c.id_locataire,
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms,
                   u.email as locataire_email,
                   u.telephone as locataire_telephone
            FROM loyermensuel l
            JOIN contact c ON l.id_contact = c.id_contact
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN locataire l2 ON c.id_locataire = l2.id_locataire
            LEFT JOIN utilisateur u ON l2.id_utilisateur = u.id_utilisateur
            WHERE b.id_proprietaire = $1
            AND l.statut IN ('en_attente', 'impaye')
            AND l.date_echeance <= CURRENT_DATE + INTERVAL '7 days'
            ORDER BY l.date_echeance ASC
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES ÉCHÉANCES APPROCHANTES POUR UN LOCATAIRE
    // ============================================================
    static async findEcheancesProches(id_locataire) {
        const query = `
            SELECT l.*,
                   c.numero_contrat,
                   b.titre as bien_titre,
                   b.loyer_mensuel as contrat_loyer
            FROM loyermensuel l
            JOIN contact c ON l.id_contact = c.id_contact
            JOIN bien b ON c.id_bien = b.id_bien
            WHERE c.id_locataire = $1
            AND l.statut IN ('en_attente', 'impaye')
            AND l.date_echeance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
            ORDER BY l.date_echeance ASC
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows;
    }
}

module.exports = LoyerMensuel;