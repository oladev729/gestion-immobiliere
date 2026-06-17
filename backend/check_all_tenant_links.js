const db = require('./src/config/database');

async function checkAllTenantLinks() {
    try {
        console.log('🔍 Vérification de tous les liens locataire-utilisateur...');
        
        // Get all tenants
        const tenants = await db.query('SELECT * FROM locataire ORDER BY id_locataire');
        console.log(`👤 Total locataires: ${tenants.rows.length}`);
        
        for (const tenant of tenants.rows) {
            console.log(`\n👤 Locataire ID: ${tenant.id_locataire}`);
            console.log(`   Email: ${tenant.email_invite}`);
            console.log(`   User ID: ${tenant.id_utilisateur}`);
            
            if (tenant.id_utilisateur) {
                // Check if user exists
                const user = await db.query('SELECT email FROM utilisateur WHERE id_utilisateur = $1', [tenant.id_utilisateur]);
                if (user.rows.length > 0) {
                    console.log(`   ✅ Lié à l'utilisateur: ${user.rows[0].email}`);
                } else {
                    console.log(`   ❌ User ID ${tenant.id_utilisateur} n'existe pas dans la table utilisateur`);
                }
            } else {
                // Check if user with same email exists
                const user = await db.query('SELECT id_utilisateur FROM utilisateur WHERE email = $1', [tenant.email_invite]);
                if (user.rows.length > 0) {
                    console.log(`   ⚠️ Non lié mais utilisateur existe: User ID ${user.rows[0].id_utilisateur}`);
                } else {
                    console.log(`   ❌ Aucun utilisateur trouvé avec cet email`);
                }
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkAllTenantLinks();
