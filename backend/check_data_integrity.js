const db = require('./src/config/database');

async function checkDataIntegrity() {
    try {
        console.log('🔍 Vérification de l\'intégrité des données...');
        
        // Check users
        const users = await db.query('SELECT id_utilisateur, email FROM utilisateur ORDER BY id_utilisateur');
        console.log(`👤 Total utilisateurs: ${users.rows.length}`);
        users.rows.forEach((u, i) => {
            console.log(`  ${i+1}. ID: ${u.id_utilisateur}, Email: ${u.email}`);
        });
        
        // Check properties (biens)
        const biens = await db.query('SELECT id_bien, titre, statut, id_proprietaire FROM bien ORDER BY id_bien');
        console.log(`\n🏠 Total biens: ${biens.rows.length}`);
        biens.rows.forEach((b, i) => {
            console.log(`  ${i+1}. ID: ${b.id_bien}, Titre: ${b.titre}, Statut: ${b.statut}, Propriétaire: ${b.id_proprietaire}`);
        });
        
        // Check contracts (contact)
        const contrats = await db.query('SELECT id_contact, numero_contrat, statut_contrat, id_locataire, id_bien FROM contact ORDER BY id_contact');
        console.log(`\n📄 Total contrats: ${contrats.rows.length}`);
        contrats.rows.forEach((c, i) => {
            console.log(`  ${i+1}. ID: ${c.id_contact}, Numéro: ${c.numero_contrat}, Statut: ${c.statut_contrat}, Locataire: ${c.id_locataire}, Bien: ${c.id_bien}`);
        });
        
        // Check tenants (locataire)
        const locataires = await db.query('SELECT id_locataire, id_utilisateur, email_invite FROM locataire ORDER BY id_locataire');
        console.log(`\n🔑 Total locataires: ${locataires.rows.length}`);
        locataires.rows.forEach((l, i) => {
            console.log(`  ${i+1}. ID: ${l.id_locataire}, User ID: ${l.id_utilisateur}, Email: ${l.email_invite}`);
        });
        
        // Check owners (proprietaire)
        const proprietaires = await db.query('SELECT id_proprietaire, id_utilisateur FROM proprietaire ORDER BY id_proprietaire');
        console.log(`\n👔 Total propriétaires: ${proprietaires.rows.length}`);
        proprietaires.rows.forEach((p, i) => {
            console.log(`  ${i+1}. ID: ${p.id_proprietaire}, User ID: ${p.id_utilisateur}`);
        });
        
        // Check invitations
        const invitations = await db.query('SELECT id_invitation, id_locataire, id_proprietaire, statut FROM invitation_locataire ORDER BY id_invitation');
        console.log(`\n📧 Total invitations: ${invitations.rows.length}`);
        invitations.rows.forEach((inv, i) => {
            console.log(`  ${i+1}. ID: ${inv.id_invitation}, Locataire: ${inv.id_locataire}, Propriétaire: ${inv.id_proprietaire}, Statut: ${inv.statut}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkDataIntegrity();
