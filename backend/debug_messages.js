const db = require('./src/config/database');

async function debugTable() {
    try {
        console.log('--- DIAGNOSTIC TABLE MESSAGES ---');
        
        // 1. Colonnes
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'messages'
        `);
        console.log('Colonnes:', columns.rows);

        // 2. Contraintes de clé étrangère
        const fk = await db.query(`
            SELECT
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='messages';
        `);
        console.log('Clés étrangères existantes:', fk.rows);

        // 3. Test d'insertion brute pour simuler l'erreur exacte
        console.log('Tentative d\'insertion test (Propriétaire vers Visiteur)...');
        // On simule ce que ferait VisitRequests.jsx : proprio ID=1, visiteur id_demande=16
        // id_destinataire est null car visiteur
        try {
            await db.query(`
                INSERT INTO messages (id_expediteur, id_destinataire, contenu, id_bien, id_demande, expediteur_type, destinataire_type)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [1, null, 'Test diagnostic', 1, 16, 'utilisateur', 'visiteur']);
            console.log('L\'insertion brute a REUSSI.');
        } catch (e) {
            console.error('L\'insertion brute a ECHOUE:', e.message, e.detail);
        }

    } catch (error) {
        console.error('Erreur diagnostic:', error);
    } finally {
        process.exit();
    }
}

debugTable();
