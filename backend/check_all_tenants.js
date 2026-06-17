const db = require('./src/config/database');

async function checkAllTenants() {
    try {
        console.log('🔍 Vérification de tous les locataires...');
        
        const tenants = await db.query(`
            SELECT l.id_locataire, l.id_utilisateur, u.email, u.nom, u.prenoms
            FROM locataire l
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            ORDER BY l.id_locataire
        `);
        
        console.log(`📊 Total locataires: ${tenants.rows.length}`);
        tenants.rows.forEach((tenant, i) => {
            console.log(`  ${i+1}. ID Locataire: ${tenant.id_locataire}, ID User: ${tenant.id_utilisateur}, Email: ${tenant.email}, Nom: ${tenant.nom} ${tenant.prenoms}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkAllTenants();
