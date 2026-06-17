const db = require('./src/config/database');

async function checkTenantInvitations() {
    try {
        console.log('🔍 Vérification des invitations pour les locataires existants...');
        
        // Check tenant user ID 10 (ouche@gmail.com)
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
        
        // Check invitations in invitation_locataire table for this tenant
        const invitations = await db.query(`
            SELECT i.*,
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   u.nom as proprietaire_nom,
                   u.prenoms as proprietaire_prenoms,
                   u.email as proprietaire_email,
                   c.numero_contrat,
                   c.date_debut,
                   c.date_fin,
                   c.loyer_mensuel
            FROM invitation_locataire i
            LEFT JOIN bien b ON i.id_bien = b.id_bien
            LEFT JOIN utilisateur u ON i.id_proprietaire = u.id_utilisateur
            LEFT JOIN contact c ON i.id_contact = c.id_contact
            WHERE i.id_locataire = $1
            ORDER BY i.date_invitation DESC
        `, [tenant.id_locataire]);
        
        console.log(`\n📊 Invitations pour ce locataire: ${invitations.rows.length}`);
        invitations.rows.forEach((inv, i) => {
            console.log(`  ${i+1}. ID: ${inv.id_invitation}, Token: ${inv.token}, Statut: ${inv.statut}, Bien: ${inv.bien_titre}, Contrat: ${inv.numero_contrat}`);
        });
        
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

checkTenantInvitations();
