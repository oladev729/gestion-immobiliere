const db = require('./src/config/database');

async function checkSchema() {
    try {
        console.log('Vérification du schéma de la table contact...');
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contact' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nColonnes de la table contact:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
        
        // Vérifier si les colonnes nécessaires existent
        const requiredColumns = ['texte_contrat', 'clauses_personnalisees', 'texte_personnalise', 'version_contrat', 'date_modification_texte'];
        const existingColumns = result.rows.map(r => r.column_name);
        
        console.log('\nVérification des colonnes requises:');
        requiredColumns.forEach(col => {
            const exists = existingColumns.includes(col);
            console.log(`${exists ? '✓' : '✗'} ${col}`);
        });
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        process.exit(0);
    }
}

checkSchema();
