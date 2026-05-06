const db = require('./src/config/database');

async function setupTables() {
    try {
        console.log('🔨 Création des tables de base...');
        
        // Table biens
        await db.query(`
            CREATE TABLE IF NOT EXISTS biens (
                id_bien SERIAL PRIMARY KEY,
                id_proprietaire INTEGER NOT NULL,
                titre VARCHAR(255) NOT NULL,
                description TEXT,
                adresse TEXT,
                type_bien VARCHAR(50),
                superficie DECIMAL,
                nb_pieces INTEGER,
                prix_loyer DECIMAL,
                prix_caution DECIMAL,
                statut VARCHAR(20) DEFAULT 'disponible',
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Table alertes
        await db.query(`
            CREATE TABLE IF NOT EXISTS alertes (
                id_alerte SERIAL PRIMARY KEY,
                id_proprietaire INTEGER NOT NULL,
                type_alerte VARCHAR(50) NOT NULL,
                titre VARCHAR(255) NOT NULL,
                description TEXT,
                date_echeance DATE NOT NULL,
                priorite VARCHAR(20) DEFAULT 'moyenne',
                id_bien INTEGER REFERENCES biens(id_bien) ON DELETE SET NULL,
                periodicite VARCHAR(20) DEFAULT 'ponctuelle',
                statut VARCHAR(20) DEFAULT 'en_attente',
                date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tables créées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        process.exit(0);
    }
}

setupTables();
