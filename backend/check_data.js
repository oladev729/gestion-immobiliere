require('dotenv').config({ path: './backend/.env' });
const db = require('./src/config/database');

async function checkData() {
    try {
        console.log('=== Configuration de la base de données ===');
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_DATABASE:', process.env.DB_DATABASE);
        console.log('DB_PORT:', process.env.DB_PORT);
        console.log('\n=== Vérification des données dans la base de données ===\n');
        
        // Vérifier les utilisateurs
        const users = await db.query('SELECT id_utilisateur, email, type_utilisateur, statut FROM utilisateur');
        console.log(`📊 Utilisateurs: ${users.rows.length} enregistrements`);
        users.rows.forEach(u => console.log(`  - ${u.email} (${u.type_utilisateur}, ${u.statut})`));
        
        // Vérifier les biens
        const biens = await db.query('SELECT id_bien, titre, statut FROM bien');
        console.log(`\n📊 Biens: ${biens.rows.length} enregistrements`);
        biens.rows.forEach(b => console.log(`  - ${b.titre} (${b.statut})`));
        
        // Vérifier les contrats (contact)
        const contrats = await db.query('SELECT id_contact, numero_contrat, statut_contrat FROM contact');
        console.log(`\n📊 Contrats: ${contrats.rows.length} enregistrements`);
        contrats.rows.forEach(c => console.log(`  - ${c.numero_contrat} (${c.statut_contrat})`));
        
        // Vérifier les paiements
        const paiements = await db.query('SELECT id_payment, statut_paiement FROM payement');
        console.log(`\n📊 Paiements: ${paiements.rows.length} enregistrements`);
        paiements.rows.forEach(p => console.log(`  - Paiement ${p.id_payment} (${p.statut_paiement})`));
        
        // Vérifier les demandes de visite
        const visites = await db.query('SELECT id_demande, statut FROM demander_visite');
        console.log(`\n📊 Demandes de visite: ${visites.rows.length} enregistrements`);
        visites.rows.forEach(v => console.log(`  - Demande ${v.id_demande} (${v.statut})`));
        
        console.log('\n=== Vérification terminée ===');
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
    } finally {
        process.exit(0);
    }
}

checkData();
