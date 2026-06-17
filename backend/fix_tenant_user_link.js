const db = require('./src/config/database');

async function fixTenantUserLink() {
    try {
        console.log('🔧 Correction des liens locataire-utilisateur...');
        
        // Check tenant with email ouche@gmail.com
        const tenant = await db.query(
            'SELECT * FROM locataire WHERE email_invite = $1',
            ['ouche@gmail.com']
        );
        
        if (tenant.rows.length === 0) {
            console.log('❌ Locataire non trouvé pour ouche@gmail.com');
            process.exit(1);
        }
        
        const tenantData = tenant.rows[0];
        console.log(`👤 Locataire trouvé: ID ${tenantData.id_locataire}, Email: ${tenantData.email_invite}, User ID actuel: ${tenantData.id_utilisateur}`);
        
        // Find user with email ouche@gmail.com
        const user = await db.query(
            'SELECT * FROM utilisateur WHERE email = $1',
            ['ouche@gmail.com']
        );
        
        if (user.rows.length === 0) {
            console.log('❌ Utilisateur non trouvé pour ouche@gmail.com');
            process.exit(1);
        }
        
        const userData = user.rows[0];
        console.log(`👤 Utilisateur trouvé: ID ${userData.id_utilisateur}, Email: ${userData.email}`);
        
        // Update tenant to link to user
        await db.query(
            'UPDATE locataire SET id_utilisateur = $1 WHERE id_locataire = $2',
            [userData.id_utilisateur, tenantData.id_locataire]
        );
        
        console.log('✅ Lien locataire-utilisateur corrigé avec succès');
        
        // Verify the fix
        const updatedTenant = await db.query(
            'SELECT * FROM locataire WHERE id_locataire = $1',
            [tenantData.id_locataire]
        );
        
        console.log(`👤 Locataire mis à jour: ID ${updatedTenant.rows[0].id_locataire}, User ID: ${updatedTenant.rows[0].id_utilisateur}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

fixTenantUserLink();
