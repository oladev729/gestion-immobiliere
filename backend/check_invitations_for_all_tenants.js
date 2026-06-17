const db = require('./src/config/database');

async function checkInvitationsForAllTenants() {
    try {
        console.log('🔍 Vérification des invitations pour tous les locataires...');
        
        // Get all tenants
        const tenants = await db.query(`
            SELECT l.id_locataire, l.id_utilisateur, u.email, u.nom, u.prenoms
            FROM locataire l
            JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
            ORDER BY l.id_locataire
        `);
        
        console.log(`📊 Total locataires: ${tenants.rows.length}`);
        
        // Check invitations for each tenant
        for (const tenant of tenants.rows) {
            console.log(`\n👤 Locataire: ${tenant.email} (ID: ${tenant.id_locataire})`);
            
            const invitations = await db.query(`
                SELECT i.*,
                       b.titre as bien_titre,
                       c.numero_contrat
                FROM invitation_locataire i
                LEFT JOIN bien b ON i.id_bien = b.id_bien
                LEFT JOIN contact c ON i.id_contact = c.id_contact
                WHERE i.id_locataire = $1
                ORDER BY i.date_invitation DESC
            `, [tenant.id_locataire]);
            
            console.log(`  📊 Invitations: ${invitations.rows.length}`);
            invitations.rows.forEach((inv, i) => {
                console.log(`    ${i+1}. ID: ${inv.id_invitation}, Statut: ${inv.statut}, Bien: ${inv.bien_titre}, Contrat: ${inv.numero_contrat}`);
            });
        }
        
        // Also check all invitations in the table
        const allInvitations = await db.query(`
            SELECT i.*,
                   b.titre as bien_titre,
                   c.numero_contrat
            FROM invitation_locataire i
            LEFT JOIN bien b ON i.id_bien = b.id_bien
            LEFT JOIN contact c ON i.id_contact = c.id_contact
            ORDER BY i.date_invitation DESC
        `);
        
        console.log(`\n📊 Toutes les invitations dans la table: ${allInvitations.rows.length}`);
        allInvitations.rows.forEach((inv, i) => {
            console.log(`  ${i+1}. ID: ${inv.id_invitation}, id_locataire: ${inv.id_locataire}, id_demande: ${inv.id_demande}, Statut: ${inv.statut}, Bien: ${inv.bien_titre}, Contrat: ${inv.numero_contrat}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkInvitationsForAllTenants();
