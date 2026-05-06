const db = require('./src/config/database');

async function createAlertesTable() {
    try {
        console.log('🔍 Vérification de la table alertes...');
        
        // Vérifier si la table existe
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'alertes'
            );
        `;
        
        const tableExists = await db.query(checkTableQuery);
        console.log('📋 Table alertes existe:', tableExists.rows[0].exists);
        
        if (!tableExists.rows[0].exists) {
            console.log('🔨 Création de la table alertes...');
            
            const createTableQuery = `
                CREATE TABLE alertes (
                    id_alerte SERIAL PRIMARY KEY,
                    id_proprietaire INTEGER NOT NULL,
                    type_alerte VARCHAR(50) NOT NULL CHECK (type_alerte IN ('fiscale', 'maintenance', 'contrat', 'autre')),
                    titre VARCHAR(255) NOT NULL,
                    description TEXT,
                    date_echeance DATE NOT NULL,
                    priorite VARCHAR(20) NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute', 'urgente')),
                    id_bien INTEGER REFERENCES biens(id_bien) ON DELETE SET NULL,
                    periodicite VARCHAR(20) DEFAULT 'ponctuelle' CHECK (periodicite IN ('ponctuelle', 'mensuelle', 'trimestrielle', 'semestrielle', 'annuelle')),
                    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'traitee', 'annulee')),
                    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    date_traitement TIMESTAMP,
                    date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            
            await db.query(createTableQuery);
            console.log('✅ Table alertes créée avec succès');
            
            // Créer des index pour optimiser les performances
            const createIndexesQuery = `
                CREATE INDEX idx_alertes_proprietaire ON alertes(id_proprietaire);
                CREATE INDEX idx_alertes_statut ON alertes(statut);
                CREATE INDEX idx_alertes_echeance ON alertes(date_echeance);
                CREATE INDEX idx_alertes_type ON alertes(type_alerte);
                CREATE INDEX idx_alertes_priorite ON alertes(priorite);
            `;
            
            await db.query(createIndexesQuery);
            console.log('✅ Index créés avec succès');
            
        } else {
            console.log('✅ Table alertes existe déjà');
        }
        
        // Vérifier la structure de la table
        const describeQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'alertes'
            ORDER BY ordinal_position;
        `;
        
        const structure = await db.query(describeQuery);
        console.log('📋 Structure de la table alertes:');
        structure.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable}) ${col.column_default || ''}`);
        });
        
        console.log('🎉 Vérification de la table alertes terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création/vérification de la table alertes:', error);
    } finally {
        process.exit(0);
    }
}

createAlertesTable();
