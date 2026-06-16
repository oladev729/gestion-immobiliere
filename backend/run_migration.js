const db = require('./src/config/database');
const fs = require('fs');

async function runMigration() {
    try {
        console.log('Exécution de la migration add_contrat_texte.sql...');
        
        const sql = fs.readFileSync('C:/Users/PC/Desktop/gestion-immobiliere/backend/database/add_contrat_texte.sql', 'utf8');
        
        // Diviser le SQL en instructions individuelles
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Exécution:', statement.substring(0, 50) + '...');
                await db.query(statement);
            }
        }
        
        console.log('✅ Migration terminée avec succès');
        
        // Vérifier les colonnes
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contact' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nColonnes de la table contact après migration:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error.message);
    } finally {
        process.exit(0);
    }
}

runMigration();
