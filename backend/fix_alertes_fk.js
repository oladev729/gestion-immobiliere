const db = require('./src/config/database');

async function fixAlertesFK() {
    try {
        console.log('🔧 Correction de la contrainte de clé étrangère alertes_id_bien_fkey...');
        
        // Drop the existing foreign key constraint
        await db.query(`
            ALTER TABLE alertes 
            DROP CONSTRAINT IF EXISTS alertes_id_bien_fkey
        `);
        console.log('✅ Contrainte existante supprimée');
        
        // Add the correct foreign key constraint referencing bien table
        await db.query(`
            ALTER TABLE alertes 
            ADD CONSTRAINT alertes_id_bien_fkey 
            FOREIGN KEY (id_bien) REFERENCES bien(id_bien)
        `);
        console.log('✅ Nouvelle contrainte ajoutée (référence bien.id_bien)');
        
        // Also fix id_locataire foreign key if needed
        await db.query(`
            ALTER TABLE alertes 
            DROP CONSTRAINT IF EXISTS alertes_id_locataire_fkey
        `);
        console.log('✅ Contrainte id_locataire supprimée');
        
        await db.query(`
            ALTER TABLE alertes 
            ADD CONSTRAINT alertes_id_locataire_fkey 
            FOREIGN KEY (id_locataire) REFERENCES locataire(id_locataire)
        `);
        console.log('✅ Nouvelle contrainte id_locataire ajoutée (référence locataire.id_locataire)');
        
        console.log('\n✅ Toutes les contraintes ont été corrigées avec succès');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur lors de la correction:', err);
        process.exit(1);
    }
}

fixAlertesFK();
