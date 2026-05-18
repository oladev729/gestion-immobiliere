const db = require('../config/database');

class Paiement {
    // ============================================================
    // CRÉER UN PAIEMENT POUR UN LOYER
    // ============================================================
    static async payerLoyer(paiementData) {
        const {
            numero_transaction,
            id_contact,
            id_loyer,
            id_mode_payment,
            montant,
            date_paiement,
            statut_paiement
        } = paiementData;

        // Générer un numéro de transaction si non fourni
        if (!numero_transaction) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            paiementData.numero_transaction = `PAY-${timestamp}-${random}`;
        }

        const query = `
            INSERT INTO payement (
                numero_transaction,
                id_contact,
                id_loyer,
                id_mode_payment,
                montant,
                date_paiement,
                date_echeance,
                statut_paiement
            ) VALUES ($1, $2, $3, $4, $5, $6, 
                (SELECT date_echeance FROM loyermensuel WHERE id_loyer = $3),
                $7)
            RETURNING *
        `;

        const values = [
            paiementData.numero_transaction,
            id_contact,
            id_loyer,
            id_mode_payment,
            montant,
            date_paiement || new Date(),
            statut_paiement || 'valide'
        ];

        const result = await db.query(query, values);
        
        // Si le paiement est valide, marquer le loyer comme payé
        if (statut_paiement === 'valide') {
            await db.query(
                'UPDATE loyermensuel SET statut = $2 WHERE id_loyer = $1',
                [id_loyer, 'paye']
            );
        }

        return result.rows[0];
    }

    // ============================================================
    // CRÉER UN PAIEMENT POUR UN DÉPÔT DE GARANTIE
    // ============================================================
    static async payerDepot(paiementData) {
        const {
            numero_transaction,
            id_contact,
            id_depot,
            id_mode_payment,
            montant,
            date_paiement,
            statut_paiement
        } = paiementData;

        if (!numero_transaction) {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            paiementData.numero_transaction = `DEP-${timestamp}-${random}`;
        }

        const query = `
            INSERT INTO payement (
                numero_transaction,
                id_contact,
                id_depot,
                id_mode_payment,
                montant,
                date_paiement,
                date_echeance,
                statut_paiement
            ) VALUES ($1, $2, $3, $4, $5, $6, 
                (SELECT date_versement FROM depotgarantie WHERE id_depot = $3),
                $7)
            RETURNING *
        `;

        const values = [
            paiementData.numero_transaction,
            id_contact,
            id_depot,
            id_mode_payment,
            montant,
            date_paiement || new Date(),
            statut_paiement || 'valide'
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES PAIEMENTS D'UN CONTRAT
    // ============================================================
    static async findByContrat(id_contact) {
        const query = `
            SELECT p.*, 
                   mp.libelle as mode_paiement_libelle,
                   l.mois_concerne as loyer_mois,
                   d.montant_depot_verse as depot_montant
            FROM payement p
            LEFT JOIN mode_paiement mp ON p.id_mode_payment = mp.id_mode
            LEFT JOIN loyermensuel l ON p.id_loyer = l.id_loyer
            LEFT JOIN depotgarantie d ON p.id_depot = d.id_depot
            WHERE p.id_contact = $1
            ORDER BY p.date_paiement DESC
        `;
        const result = await db.query(query, [id_contact]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES PAIEMENTS D'UN LOCATAIRE
    // ============================================================
    static async findByLocataire(id_locataire) {
        const query = `
            SELECT p.*, 
                   mp.libelle as mode_paiement_libelle,
                   c.numero_contrat,
                   b.titre as bien_titre
            FROM payement p
            JOIN contact c ON p.id_contact = c.id_contact
            JOIN bien b ON c.id_bien = b.id_bien
            LEFT JOIN mode_paiement mp ON p.id_mode_payment = mp.id_mode
            WHERE c.id_locataire = $1
            ORDER BY p.date_paiement DESC
        `;
        const result = await db.query(query, [id_locataire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UN PAIEMENT PAR SON ID
    // ============================================================
    static async findById(id_payment) {
        const query = `
            SELECT p.*, 
                   mp.libelle as mode_paiement_libelle
            FROM payement p
            LEFT JOIN mode_paiement mp ON p.id_mode_payment = mp.id_mode
            WHERE p.id_payment = $1
        `;
        const result = await db.query(query, [id_payment]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER LES PAIEMENTS PAR STATUT
    // ============================================================
    static async findByStatut(statut) {
        const query = `
            SELECT p.*, 
                   c.numero_contrat,
                   u.nom as locataire_nom,
                   u.prenoms as locataire_prenoms
            FROM payement p
            JOIN contact c ON p.id_contact = c.id_contact
            JOIN locataire l ON c.id_locataire = l.id_locataire
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE p.statut_paiement = $1
            ORDER BY p.date_echeance
        `;
        const result = await db.query(query, [statut]);
        return result.rows;
    }

    // ============================================================
    // METTRE À JOUR LE STATUT D'UN PAIEMENT
    // ============================================================
    // ============================================================
    // CRÉER UN ENREGISTREMENT DE PAIEMENT (GÉNÉRIQUE)
    // ============================================================
    static async create(data) {
        const {
            id_contact,
            id_loyer,
            montant,
            type_paiement,
            statut_paiement,
            numero_transaction,
            description,
            date_paiement
        } = data;

        const query = `
            INSERT INTO payement (
                id_contact,
                id_loyer,
                montant,
                statut_paiement,
                numero_transaction,
                date_paiement
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            id_contact,
            id_loyer || null,
            montant,
            statut_paiement || 'en_attente',
            numero_transaction || `FEDA-${Date.now()}`,
            date_paiement || new Date()
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR LA RÉFÉRENCE D'UN PAIEMENT
    // ============================================================
    static async updateReference(id_payment, reference) {
        const query = `
            UPDATE payement 
            SET numero_transaction = $2 
            WHERE id_payment = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_payment, reference]);
        return result.rows[0];
    }

    // ============================================================
    // MARQUER UN PAIEMENT COMME PAYÉ
    // ============================================================
    static async markAsPaid(numero_transaction, transactionId) {
        const query = `
            UPDATE payement 
            SET statut_paiement = 'valide',
                date_paiement = CURRENT_TIMESTAMP
            WHERE numero_transaction = $1 OR numero_transaction = $2
            RETURNING *
        `;
        const result = await db.query(query, [numero_transaction, transactionId]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN PAIEMENT PAR RÉFÉRENCE
    // ============================================================
    static async findByReference(reference) {
        const query = `
            SELECT * FROM payement 
            WHERE numero_transaction = $1
        `;
        const result = await db.query(query, [reference]);
        return result.rows[0];
    }
}

module.exports = Paiement;