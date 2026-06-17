const db = require('./src/config/database');

async function fixOwnerUserLink() {
    try {
        console.log('🔧 Correction des liens propriétaire-utilisateur...');
        
        // Find owner with no user link
        const owner = await db.query(
            'SELECT * FROM proprietaire WHERE id_utilisateur IS NULL'
        );
        
        if (owner.rows.length === 0) {
            console.log('✅ Tous les propriétaires sont liés à des utilisateurs');
            process.exit(0);
        }
        
        for (const ownerData of owner.rows) {
            console.log(`\n👔 Propriétaire ID: ${ownerData.id_proprietaire} sans utilisateur lié`);
            
            // Try to find a user that might be linked to this owner
            // Since we don't have email in proprietaire table, we can't auto-link
            console.log(`   ⚠️ Impossible de lier automatiquement - pas d'email dans la table propriétaire`);
            console.log(`   💡 Ce propriétaire doit être lié manuellement ou supprimé`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

fixOwnerUserLink();
