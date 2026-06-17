const db = require('./src/config/database');

async function cleanAlertesData() {
    try {
        console.log('🔧 Nettoyage des données alertes...');
        
        // Check current id_locataire values in alertes
        const alertesResult = await db.query('SELECT DISTINCT id_locataire FROM alertes WHERE id_locataire IS NOT NULL');
        console.log('Valeurs id_locataire actuelles dans alertes:', alertesResult.rows.map(r => r.id_locataire));
        
        // Check valid id_locataire values in locataire table
        const locatairesResult = await db.query('SELECT id_locataire FROM locataire');
        const validLocataireIds = locatairesResult.rows.map(r => r.id_locataire);
        console.log('ID locataires valides:', validLocataireIds);
        
        // Find invalid id_locataire values
        const invalidIds = alertesResult.rows
            .map(r => r.id_locataire)
            .filter(id => !validLocataireIds.includes(id));
        
        console.log('ID locataires invalides dans alertes:', invalidIds);
        
        if (invalidIds.length > 0) {
            // Update invalid id_locataire to NULL or valid values
            for (const invalidId of invalidIds) {
                await db.query('UPDATE alertes SET id_locataire = NULL WHERE id_locataire = $1', [invalidId]);
                console.log(`✅ Mis à jour: id_locataire ${invalidId} -> NULL`);
            }
        }
        
        // Now fix the foreign key constraints
        console.log('\n🔧 Correction des contraintes de clé étrangère...');
        
        // Fix id_bien foreign key
        await db.query('ALTER TABLE alertes DROP CONSTRAINT IF EXISTS alertes_id_bien_fkey');
        await db.query('ALTER TABLE alertes ADD CONSTRAINT alertes_id_bien_fkey FOREIGN KEY (id_bien) REFERENCES bien(id_bien)');
        console.log('✅ Contrainte id_bien corrigée');
        
        // Fix id_locataire foreign key
        await db.query('ALTER TABLE alertes DROP CONSTRAINT IF EXISTS alertes_id_locataire_fkey');
        await db.query('ALTER TABLE alertes ADD CONSTRAINT alertes_id_locataire_fkey FOREIGN KEY (id_locataire) REFERENCES locataire(id_locataire)');
        console.log('✅ Contrainte id_locataire corrigée');
        
        console.log('\n✅ Nettoyage et correction terminés avec succès');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

cleanAlertesData();
