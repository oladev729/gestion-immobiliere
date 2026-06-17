const db = require('./src/config/database');

async function checkInvitationStructure() {
    try {
        console.log('🔍 Vérification de la structure de la table invitation_locataire...');
        
        // Check table structure
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'invitation_locataire' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Structure de la table invitation_locataire:');
        columns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Check existing data
        const data = await db.query('SELECT * FROM invitation_locataire LIMIT 5');
        console.log(`\n📊 Données existantes: ${data.rows.length} enregistrements`);
        data.rows.forEach((row, i) => {
            console.log(`  ${i+1}.`, row);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkInvitationStructure();
