const db = require('./src/config/database');

async function checkAlertesForTenant() {
    try {
        console.log('🔍 Vérification des alertes pour le locataire...');
        
        // Get tenant info for user ID 10
        const tenantInfo = await db.query(`
            SELECT l.id_locataire, l.id_utilisateur, u.email
            FROM locataire l
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            WHERE l.id_utilisateur = 10
        `);
        
        if (tenantInfo.rows.length === 0) {
            console.log('❌ Locataire non trouvé pour user ID 10');
            process.exit(1);
        }
        
        const tenant = tenantInfo.rows[0];
        console.log(`👤 Locataire: ID ${tenant.id_locataire}, User ID ${tenant.id_utilisateur}, Email: ${tenant.email}`);
        
        // Check alertes for this tenant
        const alertes = await db.query(`
            SELECT a.*, b.titre as bien_titre
            FROM alertes a
            LEFT JOIN bien b ON a.id_bien = b.id_bien
            WHERE a.id_locataire = $1
            ORDER BY a.date_creation DESC
        `, [tenant.id_locataire]);
        
        console.log(`\n📊 Alertes pour ce locataire: ${alertes.rows.length}`);
        alertes.rows.forEach((alerte, i) => {
            console.log(`  ${i+1}. ID: ${alerte.id_alerte}, Titre: ${alerte.titre}, Type: ${alerte.type_alerte}, Expediteur: ${alerte.expediteur_type}, Destinataire: ${alerte.destinataire_type}`);
        });
        
        // Also check alertes where destinataire_type = 'locataire'
        const alertesForLocataires = await db.query(`
            SELECT a.*, b.titre as bien_titre
            FROM alertes a
            LEFT JOIN bien b ON a.id_bien = b.id_bien
            WHERE a.destinataire_type = 'locataire'
            ORDER BY a.date_creation DESC
        `);
        
        console.log(`\n📊 Alertes avec destinataire_type='locataire': ${alertesForLocataires.rows.length}`);
        alertesForLocataires.rows.forEach((alerte, i) => {
            console.log(`  ${i+1}. ID: ${alerte.id_alerte}, Titre: ${alerte.titre}, Type: ${alerte.type_alerte}, id_locataire: ${alerte.id_locataire}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkAlertesForTenant();
