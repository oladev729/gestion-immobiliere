/**
 * Script d'initialisation et de mise à jour de la base de données
 * Pour la base de données existante 'gestion_immobiliere'
 * 
 * Usage: node setup_database.js
 */

const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'gestion_immobiliere', // Nom de la BDD existante
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

console.log('🔧 Configuration de la base de données:');
console.log(`   - Hôte: ${pool.options.host}`);
console.log(`   - Port: ${pool.options.port}`);
console.log(`   - Base: ${pool.options.database}`);
console.log(`   - Utilisateur: ${pool.options.user}`);

// Fonction pour exécuter une requête
async function executeQuery(query, description = '') {
    try {
        console.log(`\n📋 ${description}`);
        console.log(`   Requête: ${query.substring(0, 100)}...`);
        
        const result = await pool.query(query);
        console.log(`   ✅ Succès: ${result.rowCount || result.rows.length} lignes affectées`);
        return result;
    } catch (error) {
        if (error.code === '42P07') {
            console.log(`   ⚠️  Déjà existant: ${description}`);
            return null;
        }
        console.error(`   ❌ Erreur: ${error.message}`);
        throw error;
    }
}

// Script principal
async function setupDatabase() {
    console.log('\n🚀 Démarrage de l\'initialisation/mise à jour de la base de données...');
    console.log('=' .repeat(70));

    try {
        // 1. Vérifier la connexion
        console.log('\n1️⃣ Vérification de la connexion à la base de données...');
        const connectionTest = await pool.query('SELECT NOW() as current_time, current_database() as database');
        console.log(`   ✅ Connecté à: ${connectionTest.rows[0].database}`);
        console.log(`   ⏰ Heure serveur: ${connectionTest.rows[0].current_time}`);

        // 2. Créer les tables si elles n'existent pas
        console.log('\n2️⃣ Création des tables...');
        
        // Table utilisateur
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS utilisateur (
                id_utilisateur SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                type_utilisateur VARCHAR(50) CHECK (type_utilisateur IN ('proprietaire', 'locataire', 'admin')) NOT NULL,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                est_actif BOOLEAN DEFAULT true
            )
        `, 'Table utilisateur');

        // Table proprietaire
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS proprietaire (
                id_proprietaire SERIAL PRIMARY KEY,
                id_utilisateur INTEGER UNIQUE REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
                nom VARCHAR(100) NOT NULL,
                prenoms VARCHAR(200) NOT NULL,
                telephone VARCHAR(20),
                date_naissance DATE,
                adresse TEXT,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table proprietaire');

        // Table locataire
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS locataire (
                id_locataire SERIAL PRIMARY KEY,
                id_utilisateur INTEGER UNIQUE REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
                nom VARCHAR(100) NOT NULL,
                prenoms VARCHAR(200) NOT NULL,
                telephone VARCHAR(20),
                date_naissance DATE,
                adresse TEXT,
                revenu_mensuel DECIMAL(10,2),
                emploi VARCHAR(100),
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table locataire');

        // Table bien
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS bien (
                id_bien SERIAL PRIMARY KEY,
                id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire) ON DELETE CASCADE,
                titre VARCHAR(255) NOT NULL,
                description TEXT,
                type_bien VARCHAR(50) CHECK (type_bien IN ('appartement', 'maison', 'studio', 'villa', 'duplex', 'chambre')) NOT NULL,
                charge DECIMAL(10,2) DEFAULT 0,
                loyer_mensuel DECIMAL(10,2) NOT NULL,
                adresse TEXT NOT NULL,
                ville VARCHAR(100) NOT NULL,
                code_postal VARCHAR(20),
                superficie DECIMAL(8,2) NOT NULL,
                nombre_pieces INTEGER NOT NULL,
                nombre_chambres INTEGER,
                meuble BOOLEAN DEFAULT false,
                statut VARCHAR(20) CHECK (statut IN ('disponible', 'loué', 'en_maintenance', 'indisponible')) DEFAULT 'disponible',
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table bien');

        // Table photosbien
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS photosbien (
                id_photosbien SERIAL PRIMARY KEY,
                id_bien INTEGER REFERENCES bien(id_bien) ON DELETE CASCADE,
                url_photobien TEXT NOT NULL,
                legende VARCHAR(255),
                est_principale BOOLEAN DEFAULT false,
                date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table photosbien');

        // Table contrat
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS contrat (
                id_contrat SERIAL PRIMARY KEY,
                id_bien INTEGER REFERENCES bien(id_bien) ON DELETE CASCADE,
                id_locataire INTEGER REFERENCES locataire(id_locataire) ON DELETE CASCADE,
                date_debut DATE NOT NULL,
                date_fin DATE NOT NULL,
                montant_loyer DECIMAL(10,2) NOT NULL,
                montant_charge DECIMAL(10,2) DEFAULT 0,
                frequence_paiement VARCHAR(20) DEFAULT 'mensuel',
                statut VARCHAR(20) CHECK (statut IN ('actif', 'terminé', 'résilié', 'en_attente')) DEFAULT 'en_attente',
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table contrat');

        // Table paiement
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS paiement (
                id_paiement SERIAL PRIMARY KEY,
                id_contrat INTEGER REFERENCES contrat(id_contrat) ON DELETE CASCADE,
                montant DECIMAL(10,2) NOT NULL,
                date_paiement DATE NOT NULL,
                date_effet DATE,
                methode_paiement VARCHAR(50) CHECK (methode_paiement IN ('espèces', 'virement', 'chèque', 'mobile_money')) NOT NULL,
                statut VARCHAR(20) CHECK (statut IN ('payé', 'en_attente', 'en_retard', 'annulé')) DEFAULT 'en_attente',
                reference_paiement VARCHAR(100),
                notes TEXT,
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table paiement');

        // Table probleme
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS probleme (
                id_probleme SERIAL PRIMARY KEY,
                id_bien INTEGER REFERENCES bien(id_bien) ON DELETE CASCADE,
                id_locataire INTEGER REFERENCES locataire(id_locataire) ON DELETE CASCADE,
                titre VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                type_probleme VARCHAR(50) CHECK (type_probleme IN ('plomberie', 'électricité', 'chauffage', 'structure', 'sécurité', 'autre')) NOT NULL,
                urgence VARCHAR(20) CHECK (urgence IN ('basse', 'moyenne', 'haute', 'critique')) DEFAULT 'moyenne',
                statut VARCHAR(20) CHECK (statut IN ('signalé', 'en_cours', 'résolu', 'annulé')) DEFAULT 'signalé',
                date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_resolution TIMESTAMP
            )
        `, 'Table probleme');

        // Table photos_probleme
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS photos_probleme (
                id_photosbp SERIAL PRIMARY KEY,
                id_probleme INTEGER REFERENCES probleme(id_probleme) ON DELETE CASCADE,
                url_photosbp TEXT NOT NULL,
                legende VARCHAR(255),
                date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, 'Table photos_probleme');

        // Table notification
        await executeQuery(`
            CREATE TABLE IF NOT EXISTS notification (
                id_notification SERIAL PRIMARY KEY,
                id_destinataire INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
                titre VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type_notification VARCHAR(50) CHECK (type_notification IN ('paiement', 'contrat', 'probleme', 'maintenance', 'système')) NOT NULL,
                statut VARCHAR(20) CHECK (statut IN ('non_lue', 'lue', 'archivée')) DEFAULT 'non_lue',
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_lecture TIMESTAMP
            )
        `, 'Table notification');

        // 3. Créer les index
        console.log('\n3️⃣ Création des index...');
        
        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_utilisateur_email ON utilisateur(email)
        `, 'Index email utilisateur');

        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_bien_proprietaire ON bien(id_proprietaire)
        `, 'Index bien propriétaire');

        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_bien_statut ON bien(statut)
        `, 'Index bien statut');

        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_photosbien_bien ON photosbien(id_bien)
        `, 'Index photos bien');

        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_contrat_locataire ON contrat(id_locataire)
        `, 'Index contrat locataire');

        await executeQuery(`
            CREATE INDEX IF NOT EXISTS idx_notification_destinataire ON notification(id_destinataire)
        `, 'Index notification destinataire');

        // 4. Insérer les données de test si la base est vide
        console.log('\n4️⃣ Vérification et insertion des données de test...');
        
        const userCount = await pool.query('SELECT COUNT(*) as count FROM utilisateur');
        
        if (parseInt(userCount.rows[0].count) === 0) {
            console.log('   📝 Insertion des données de test...');
            
            // Utilisateurs de test
            await executeQuery(`
                INSERT INTO utilisateur (email, password_hash, type_utilisateur) VALUES
                ('yessoufouzenabou46@gmail.com', '$2b$10$YourHashedPasswordHere', 'proprietaire'),
                ('agossouroland@gmail.com', '$2b$10$YourHashedPasswordHere', 'locataire'),
                ('assaninazifatou@gmail.com', '$2b$10$YourHashedPasswordHere', 'proprietaire')
            `, 'Utilisateurs de test');

            // Récupérer les IDs des utilisateurs
            const users = await pool.query('SELECT id_utilisateur, email FROM utilisateur');
            const proprietaire1 = users.rows.find(u => u.email === 'yessoufouzenabou46@gmail.com');
            const locataire1 = users.rows.find(u => u.email === 'agossouroland@gmail.com');
            const proprietaire2 = users.rows.find(u => u.email === 'assaninazifatou@gmail.com');

            // Propriétaires
            await executeQuery(`
                INSERT INTO proprietaire (id_utilisateur, nom, prenoms, telephone) VALUES
                (${proprietaire1.id_utilisateur}, 'ISHOLA', 'Oulfath', '0159815842'),
                (${proprietaire2.id_utilisateur}, 'ASSANI', 'Nazifatou', '0141995528')
            `, 'Propriétaires de test');

            // Locataires
            await executeQuery(`
                INSERT INTO locataire (id_utilisateur, nom, prenoms, telephone, revenu_mensuel) VALUES
                (${locataire1.id_utilisateur}, 'AGOSSOU', 'Roland', '0123456789', 150000)
            `, 'Locataires de test');

            console.log('   ✅ Données de test insérées');
        } else {
            console.log(`   ℹ️  ${userCount.rows[0].count} utilisateurs déjà existants - Pas d\'insertion de test`);
        }

        // 5. Vérification finale
        console.log('\n5️⃣ Vérification finale de la structure...');
        
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('   📋 Tables créées:');
        tables.rows.forEach(table => {
            console.log(`      - ${table.table_name}`);
        });

        console.log('\n🎉 Base de données initialisée/mise à jour avec succès !');
        console.log('=' .repeat(70));

    } catch (error) {
        console.error('\n❌ Erreur lors de l\'initialisation:', error.message);
        console.error('Détails:', error);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('\n🔌 Connexion à la base de données fermée');
    }
}

// Exécuter le script
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };
