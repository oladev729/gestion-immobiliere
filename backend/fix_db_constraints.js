const db = require('./src/config/database');

async function fixConstraints() {
    try {
        console.log('Vérification des contraintes de la table messages...');
        
        // Liste des colonnes
        const columns = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages'
        `);
        console.log('Colonnes actuelles:', columns.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

        // Supprimer les contraintes de clé étrangère sur id_expediteur et id_destinataire
        // car les visiteurs n'ont pas d'ID utilisateur.
        const dropConstraints = `
            DO $$ 
            BEGIN 
                -- Pour id_expediteur
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_id_expediteur_fkey') THEN
                    ALTER TABLE messages DROP CONSTRAINT messages_id_expediteur_fkey;
                END IF;
                -- Pour id_destinataire
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_id_destinataire_fkey') THEN
                    ALTER TABLE messages DROP CONSTRAINT messages_id_destinataire_fkey;
                END IF;
            END $$;
        `;
        
        await db.query(dropConstraints);
        console.log('Contraintes de clé étrangère supprimées (si elles existaient).');

        // S'assurer que les nouvelles colonnes sont bien là et acceptent NULL
        await db.query(`
            ALTER TABLE messages 
            ALTER COLUMN id_expediteur DROP NOT NULL,
            ALTER COLUMN id_destinataire DROP NOT NULL
        `);
        console.log('Colonnes id_expediteur et id_destinataire mises à jour (NULL autorisé).');

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        process.exit();
    }
}

fixConstraints();
