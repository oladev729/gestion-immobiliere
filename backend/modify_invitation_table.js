const db = require('./src/config/database');

async function modifyInvitationTable() {
    try {
        console.log('🔧 Modification de la table invitation_locataire...');
        
        // Add new columns if they don't exist
        try {
            await db.query(`
                ALTER TABLE invitation_locataire 
                ADD COLUMN IF NOT EXISTS id_locataire INTEGER
            `);
            console.log('✅ Colonne id_locataire ajoutée');
        } catch (err) {
            console.log('⚠️ Colonne id_locataire existe déjà ou erreur:', err.message);
        }
        
        try {
            await db.query(`
                ALTER TABLE invitation_locataire 
                ADD COLUMN IF NOT EXISTS id_contact INTEGER
            `);
            console.log('✅ Colonne id_contact ajoutée');
        } catch (err) {
            console.log('⚠️ Colonne id_contact existe déjà ou erreur:', err.message);
        }
        
        try {
            await db.query(`
                ALTER TABLE invitation_locataire 
                ADD COLUMN IF NOT EXISTS id_bien INTEGER
            `);
            console.log('✅ Colonne id_bien ajoutée');
        } catch (err) {
            console.log('⚠️ Colonne id_bien existe déjà ou erreur:', err.message);
        }
        
        // Add foreign key constraints
        try {
            await db.query(`
                ALTER TABLE invitation_locataire 
                ADD CONSTRAINT fk_invitation_locataire 
                FOREIGN KEY (id_locataire) REFERENCES locataire(id_locataire)
            `);
            console.log('✅ Contrainte fk_invitation_locataire ajoutée');
        } catch (err) {
            console.log('⚠️ Contrainte fk_invitation_locataire existe déjà ou erreur:', err.message);
        }
        
        try {
            await db.query(`
                ALTER TABLE invitation_locataire 
                ADD CONSTRAINT fk_invitation_contact 
                FOREIGN KEY (id_contact) REFERENCES contact(id_contact)
            `);
            console.log('✅ Contrainte fk_invitation_contact ajoutée');
        } catch (err) {
            console.log('⚠️ Contrainte fk_invitation_contact existe déjà ou erreur:', err.message);
        }
        
        try {
            await db.query(`
                ALTER TABLE invitation_locataire 
                ADD CONSTRAINT fk_invitation_bien 
                FOREIGN KEY (id_bien) REFERENCES bien(id_bien)
            `);
            console.log('✅ Contrainte fk_invitation_bien ajoutée');
        } catch (err) {
            console.log('⚠️ Contrainte fk_invitation_bien existe déjà ou erreur:', err.message);
        }
        
        console.log('\n✅ Modification de la table terminée avec succès');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

modifyInvitationTable();
