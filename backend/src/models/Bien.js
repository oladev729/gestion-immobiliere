const db = require('../config/database');

class Bien {
    // ============================================================
    // CRÉER UN BIEN
    // ============================================================
    static async create(bienData, id_proprietaire) {
        const { 
            titre, 
            description, 
            type_bien, 
            charge, 
            loyer_mensuel, 
            adresse, 
            ville,
            code_postal,
            superficie,
            nombre_pieces,
            nombre_chambres,
            meuble
        } = bienData;

        const query = `
            INSERT INTO bien (
                id_proprietaire, 
                titre, 
                description, 
                type_bien, 
                charge, 
                loyer_mensuel, 
                adresse, 
                ville,
                code_postal,
                superficie,
                nombre_pieces,
                nombre_chambres,
                meuble,
                statut
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;
        
        const values = [
            id_proprietaire,
            titre,
            description || null,
            type_bien,
            charge ? Number(charge) : 0,
            loyer_mensuel ? Number(loyer_mensuel) : null,
            adresse,
            ville,
            code_postal || null,
            superficie ? Number(superficie) : null,
            nombre_pieces ? Number(nombre_pieces) : null,
            nombre_chambres ? Number(nombre_chambres) : null,
            meuble || false,
            'disponible'
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER UN BIEN PAR SON ID
    // ============================================================
    static async findById(id_bien) {
        const query = `
            SELECT b.*, 
                   u.nom as proprietaire_nom, 
                   u.prenoms as proprietaire_prenoms,
                   u.telephone as proprietaire_telephone,
                   u.email as proprietaire_email
            FROM bien b
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE b.id_bien = $1
        `;
        const result = await db.query(query, [id_bien]);
        return result.rows[0];
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES BIENS D'UN PROPRIÉTAIRE
    // ============================================================
    static async findByProprietaire(id_proprietaire) {
        const query = `
            SELECT * FROM bien 
            WHERE id_proprietaire = $1 
            ORDER BY date_creation DESC
        `;
        const result = await db.query(query, [id_proprietaire]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER TOUS LES BIENS DISPONIBLES
    // ============================================================
    static async findAllDisponibles(filtres = {}) {
        let query = `
            SELECT b.*, 
                   u.nom as proprietaire_nom, 
                   u.prenoms as proprietaire_prenoms,
                   u.telephone as proprietaire_telephone
            FROM bien b
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE b.statut = 'disponible'
        `;
        
        const values = [];
        let paramIndex = 1;

        if (filtres.ville) {
            query += ` AND b.ville ILIKE $${paramIndex}`;
            values.push(`%${filtres.ville}%`);
            paramIndex++;
        }

        if (filtres.type_bien) {
            query += ` AND b.type_bien = $${paramIndex}`;
            values.push(filtres.type_bien);
            paramIndex++;
        }

        if (filtres.prix_max) {
            query += ` AND b.loyer_mensuel <= $${paramIndex}`;
            values.push(filtres.prix_max);
            paramIndex++;
        }

        query += ` ORDER BY b.date_creation DESC`;

        const result = await db.query(query, values);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER UN BIEN PAR SON ID
    // ============================================================
    static async findById(id_bien) {
        const query = `
            SELECT b.*, 
                   u.nom as proprietaire_nom, 
                   u.prenoms as proprietaire_prenoms,
                   u.email as proprietaire_email,
                   u.telephone as proprietaire_telephone
            FROM bien b
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE b.id_bien = $1
        `;
        const result = await db.query(query, [id_bien]);
        return result.rows[0];
    }

    // ============================================================
    // METTRE À JOUR UN BIEN
    // ============================================================
    static async update(id_bien, bienData) {
        const setClause = [];
        const values = [id_bien];
        let paramIndex = 2;
        const allowedColumns = [
            'titre', 'description', 'type_bien', 'charge', 'loyer_mensuel', 
            'adresse', 'ville', 'code_postal', 'superficie', 
            'nombre_pieces', 'nombre_chambres', 'meuble', 'statut'
        ];

        for (const [key, value] of Object.entries(bienData)) {
            if (value !== undefined && allowedColumns.includes(key)) {
                setClause.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (setClause.length === 0) {
            return await this.findById(id_bien);
        }

        const query = `
            UPDATE bien 
            SET ${setClause.join(', ')} 
            WHERE id_bien = $1 
            RETURNING *
        `;

        const result = await db.query(query, values);
        return result.rows[0];
    }

    // ============================================================
    // SUPPRIMER UN BIEN
    // ============================================================
    static async delete(id_bien) {
        const query = 'DELETE FROM bien WHERE id_bien = $1 RETURNING id_bien';
        const result = await db.query(query, [id_bien]);
        return result.rows[0];
    }

    // ============================================================
    // CHANGER LE STATUT D'UN BIEN
    // ============================================================
    static async changeStatut(id_bien, statut) {
        const validStatuts = ['disponible', 'loue', 'en_maintenance', 'retire'];
        
        if (!validStatuts.includes(statut)) {
            throw new Error('Statut invalide');
        }

        const query = `
            UPDATE bien 
            SET statut = $2 
            WHERE id_bien = $1 
            RETURNING *
        `;
        const result = await db.query(query, [id_bien, statut]);
        return result.rows[0];
    }

    // ============================================================
    // RECHERCHER DES BIENS
    // ============================================================
    static async search(term) {
        const query = `
            SELECT * FROM bien 
            WHERE titre ILIKE $1 OR description ILIKE $1
            ORDER BY date_creation DESC
        `;
        const result = await db.query(query, [`%${term}%`]);
        return result.rows;
    }

    // ============================================================
    // COMPTER LES BIENS PAR STATUT
    // ============================================================
    static async countByStatut(id_proprietaire = null) {
        let query = `
            SELECT statut, COUNT(*) as nombre
            FROM bien
        `;
        
        const values = [];
        
        if (id_proprietaire) {
            query += ` WHERE id_proprietaire = $1`;
            values.push(id_proprietaire);
        }
        
        query += ` GROUP BY statut`;

        const result = await db.query(query, values);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LES PHOTOS D'UN BIEN (avec tri par est_principale)
    // ============================================================
    static async getPhotos(id_bien) {
        const query = `
            SELECT id_photosbien, url_photobien, legende, est_principale, date_ajout 
            FROM photosbien 
            WHERE id_bien = $1 
            ORDER BY est_principale DESC, date_ajout ASC
        `;
        const result = await db.query(query, [id_bien]);
        return result.rows;
    }

    // ============================================================
    // RÉCUPÉRER LA PHOTO PRINCIPALE D'UN BIEN
    // ============================================================
    static async getPhotoPrincipale(id_bien) {
        const query = `
            SELECT url_photobien 
            FROM photosbien 
            WHERE id_bien = $1 
            ORDER BY est_principale DESC, date_ajout ASC 
            LIMIT 1
        `;
        const result = await db.query(query, [id_bien]);
        return result.rows[0]?.url_photobien || null;
    }

    // ============================================================
    // SUPPRIMER LES DÉPENDANCES D'UN BIEN
    // ============================================================
    static async deleteDependencies(id_bien) {
        await db.query('DELETE FROM demander_visite WHERE id_bien = $1', [id_bien]);
        await db.query('DELETE FROM problemes WHERE id_bien = $1', [id_bien]);
        await db.query('DELETE FROM photosbien WHERE id_bien = $1', [id_bien]);
        return true;
    }
}

module.exports = Bien;