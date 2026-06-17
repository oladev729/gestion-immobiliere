const db = require('./src/config/database');

async function checkInvitations() {
    try {
        console.log('🔍 Vérification des invitations...');
        
        // Check the invitation_locataire table structure
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'invitation_locataire'
            )
        `);
        
        console.log('Table invitation_locataire existe:', tableExists.rows[0].exists);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ La table invitation_locataire n\'existe pas');
            process.exit(1);
        }
        
        // Check all invitations
        const allInvitations = await db.query(`
            SELECT i.*, d.nom, d.prenoms, d.email
            FROM invitation_locataire i
            LEFT JOIN demande_inscription_visiteur d ON i.id_demande = d.id_demande
            ORDER BY i.date_invitation DESC
        `);
        
        console.log(`\n📊 Total invitations dans la table: ${allInvitations.rows.length}`);
        allInvitations.rows.forEach((inv, i) => {
            console.log(`  ${i+1}. ID: ${inv.id_invitation}, Email: ${inv.email}, Statut: ${inv.statut}, Date: ${inv.date_invitation}`);
        });
        
        // Check tenant user ID 10 (ouche@gmail.com)
        const tenantUser = await db.query(`
            SELECT id_utilisateur, email FROM utilisateur WHERE id_utilisateur = 10
        `);
        
        if (tenantUser.rows.length > 0) {
            console.log(`\n👤 Utilisateur locataire: ID ${tenantUser.rows[0].id_utilisateur}, Email: ${tenantUser.rows[0].email}`);
            
            // Check invitations for this tenant's email
            const tenantInvitations = await db.query(`
                SELECT i.*, d.nom, d.prenoms, d.email
                FROM invitation_locataire i
                LEFT JOIN demande_inscription_visiteur d ON i.id_demande = d.id_demande
                WHERE d.email = $1
                ORDER BY i.date_invitation DESC
            `, [tenantUser.rows[0].email]);
            
            console.log(`\n📊 Invitations pour cet email: ${tenantInvitations.rows.length}`);
            tenantInvitations.rows.forEach((inv, i) => {
                console.log(`  ${i+1}. ID: ${inv.id_invitation}, Email: ${inv.email}, Statut: ${inv.statut}`);
            });
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkInvitations();
