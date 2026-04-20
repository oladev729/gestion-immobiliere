const db = require('../config/database');

async function createMessagesTable() {
    try {
        console.log('Création de la table messages...');
        
        // Création de la table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                id_expediteur INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
                id_destinataire INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
                id_bien INTEGER REFERENCES biens(id) ON DELETE SET NULL,
                contenu TEXT NOT NULL,
                date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                lu BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await db.query(createTableQuery);
        console.log('Table messages créée avec succès');
        
        // Création des index
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(id_expediteur)',
            'CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(id_destinataire)',
            'CREATE INDEX IF NOT EXISTS idx_messages_bien ON messages(id_bien)',
            'CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(LEAST(id_expediteur, id_destinataire), GREATEST(id_expediteur, id_destinataire), date_envoi)'
        ];
        
        for (const indexQuery of indexes) {
            await db.query(indexQuery);
        }
        console.log('Index créés avec succès');
        
        // Création du trigger pour updated_at
        const triggerFunction = `
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `;
        
        await db.query(triggerFunction);
        
        const triggerQuery = `
            DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
            CREATE TRIGGER update_messages_updated_at 
                BEFORE UPDATE ON messages 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column()
        `;
        
        await db.query(triggerQuery);
        console.log('Trigger créé avec succès');
        
        console.log('Table messages complètement initialisée');
        process.exit(0);
        
    } catch (error) {
        console.error('Erreur lors de la création de la table messages:', error);
        process.exit(1);
    }
}

createMessagesTable();
