const db = require('../config/database');
const bcrypt = require('bcryptjs');

class Utilisateur {
    // Trouver un utilisateur par email
    static async findByEmail(email) {
        const query = 'SELECT * FROM utilisateur WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    // Trouver un utilisateur par ID
    static async findById(id) {
        const query = 'SELECT id_utilisateur, nom, prenoms, email, telephone, type_utilisateur, statut FROM utilisateur WHERE id_utilisateur = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    // Créer un nouvel utilisateur
    static async create(userData) {
        try {
            const { nom, prenoms, email, telephone, mot_de_passe, type_utilisateur } = userData;
            
            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
            
            const query = `
                INSERT INTO utilisateur (nom, prenoms, email, telephone, mot_de_passe, type_utilisateur)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_utilisateur, nom, prenoms, email, type_utilisateur
            `;
            
            const values = [nom, prenoms, email, telephone, hashedPassword, type_utilisateur];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erreur SQL Utilisateur.create:', error.message);
            throw error;
        }
    }

    // Mettre à jour un utilisateur
    static async update(id, updates) {
        const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const query = `UPDATE utilisateur SET ${setClause} WHERE id_utilisateur = $1 RETURNING id_utilisateur, nom, prenoms, email, telephone, type_utilisateur`;
        const values = [id, ...Object.values(updates)];
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // Supprimer un utilisateur (désactiver plutôt)
    static async desactiver(id) {
        const query = 'UPDATE utilisateur SET statut = $2 WHERE id_utilisateur = $1 RETURNING id_utilisateur';
        const result = await db.query(query, [id, 'inactif']);
        return result.rows[0];
    }

    // Vérifier le mot de passe
    static async verifierMotDePasse(email, motDePasse) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        
        const valid = await bcrypt.compare(motDePasse, user.mot_de_passe);
        if (!valid) return null;
        
        return user;
    }
}

module.exports = Utilisateur;