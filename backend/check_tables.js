const db = require('./src/config/database');

async function checkTables() {
    try {
        console.log('=== VÉRIFICATION DES TABLES ===\n');
        
        // Vérifier la table demander_visite
        console.log('Table demander_visite:');
        const result1 = await db.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'demander_visite\' ORDER BY ordinal_position');
        result1.rows.forEach(row => console.log('- ' + row.column_name));
        
        console.log('\nTable demande_inscription_visiteur:');
        const result2 = await db.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'demande_inscription_visiteur\' ORDER BY ordinal_position');
        result2.rows.forEach(row => console.log('- ' + row.column_name));
        
        // Vérifier s'il y a des données
        console.log('\n=== DONNÉES ACTUELLES ===');
        
        const demandesVisiteurs = await db.query('SELECT COUNT(*) as count FROM demande_inscription_visiteur');
        console.log('Demandes visiteurs:', demandesVisiteurs.rows[0].count);
        
        const demandesLocataires = await db.query('SELECT COUNT(*) as count FROM demander_visite');
        console.log('Demandes locataires:', demandesLocataires.rows[0].count);
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error.message);
        process.exit(1);
    }
}

checkTables();
