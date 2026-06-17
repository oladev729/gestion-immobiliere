const db = require('./src/config/database');

async function autoFixLinks() {
    try {
        console.log('🔧 Vérification et correction automatique des liens...');
        
        // Fix tenant-user links
        console.log('\n🔍 Vérification des liens locataire-utilisateur...');
        const tenants = await db.query('SELECT * FROM locataire WHERE id_utilisateur IS NULL');
        
        for (const tenant of tenants.rows) {
            const user = await db.query('SELECT id_utilisateur FROM utilisateur WHERE email = $1', [tenant.email_invite]);
            if (user.rows.length > 0) {
                await db.query(
                    'UPDATE locataire SET id_utilisateur = $1 WHERE id_locataire = $2',
                    [user.rows[0].id_utilisateur, tenant.id_locataire]
                );
                console.log(`✅ Locataire ${tenant.email_invite} lié à l'utilisateur ID ${user.rows[0].id_utilisateur}`);
            }
        }
        
        // Check for orphaned owners (no user link)
        console.log('\n🔍 Vérification des propriétaires orphelins...');
        const orphanedOwners = await db.query('SELECT * FROM proprietaire WHERE id_utilisateur IS NULL');
        
        for (const owner of orphanedOwners.rows) {
            // Check if this owner is referenced in other tables
            const charges = await db.query('SELECT COUNT(*) as count FROM charges WHERE id_proprietaire = $1', [owner.id_proprietaire]);
            const biens = await db.query('SELECT COUNT(*) as count FROM bien WHERE id_proprietaire = $1', [owner.id_proprietaire]);
            
            if (parseInt(charges.rows[0].count) === 0 && parseInt(biens.rows[0].count) === 0) {
                // Safe to delete
                await db.query('DELETE FROM proprietaire WHERE id_proprietaire = $1', [owner.id_proprietaire]);
                console.log(`✅ Propriétaire orphelin ID ${owner.id_proprietaire} supprimé (pas de références)`);
            } else {
                console.log(`⚠️ Propriétaire orphelin ID ${owner.id_proprietaire} conservé (référencé dans charges ou biens)`);
            }
        }
        
        console.log('\n✅ Vérification et correction terminées');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

autoFixLinks();
