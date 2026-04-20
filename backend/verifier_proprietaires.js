const db = require('./src/config/database');

async function verifierProprietaires() {
    try {
        console.log('=== VÉRIFICATION DES PROPRIÉTAIRES AVEC BIENS ET DEMANDES ===\n');
        
        // 1. Voir tous les propriétaires
        const proprietaires = await db.query(`
            SELECT u.id_utilisateur, u.email, p.id_proprietaire
            FROM utilisateur u
            LEFT JOIN proprietaire p ON u.id_utilisateur = p.id_utilisateur
            WHERE u.type_utilisateur = 'proprietaire'
            ORDER BY u.id_utilisateur
        `);
        
        console.log('Propriétaires trouvés:');
        proprietaires.rows.forEach(prop => {
            console.log(`   ID Utilisateur: ${prop.id_utilisateur}, ID Propriétaire: ${prop.id_proprietaire}, Email: ${prop.email}`);
        });
        
        // 2. Voir les biens par propriétaire
        console.log('\nBiens par propriétaire:');
        for (const prop of proprietaires.rows) {
            const biens = await db.query('SELECT id_bien, titre FROM bien WHERE id_proprietaire = $1', [prop.id_proprietaire]);
            if (biens.rows.length > 0) {
                console.log(`   Propriétaire ${prop.id_proprietaire} (${prop.email}):`);
                biens.rows.forEach(bien => {
                    console.log(`     - ${bien.titre} (ID: ${bien.id_bien})`);
                });
            }
        }
        
        // 3. Voir les demandes par type
        console.log('\nDemandes de visiteurs:');
        const demandesVisiteurs = await db.query(`
            SELECT di.id_demande, di.nom, di.email, b.titre, b.id_proprietaire
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            ORDER BY di.date_demande DESC
            LIMIT 5
        `);
        
        demandesVisiteurs.rows.forEach(demande => {
            console.log(`   - ${demande.nom} (${demande.email}) -> ${demande.titre || 'Bien non spécifié'} (Propriétaire: ${demande.id_proprietaire})`);
        });
        
        console.log('\nDemandes de locataires:');
        const demandesLocataires = await db.query(`
            SELECT dv.id_demande, u.nom, u.email, b.titre, dv.id_proprietaire
            FROM demander_visite dv
            LEFT JOIN utilisateur u ON dv.id_locataire = u.id_utilisateur
            LEFT JOIN bien b ON dv.id_bien = b.id_bien
            ORDER BY dv.date_demande DESC
            LIMIT 5
        `);
        
        demandesLocataires.rows.forEach(demande => {
            console.log(`   - ${demande.nom} (${demande.email}) -> ${demande.titre || 'Bien non spécifié'} (Propriétaire: ${demande.id_proprietaire})`);
        });
        
        // 4. Identifier le propriétaire qui a des demandes
        console.log('\n=== SYNTHÈSE ===');
        console.log('Le propriétaire connecté actuellement (ID 7) n\'a pas de biens.');
        console.log('Les demandes existantes sont probablement associées à d\'autres propriétaires.');
        
        // Trouver le propriétaire avec le plus de demandes
        const proprietairesAvecDemandes = new Set();
        [...demandesVisiteurs.rows, ...demandesLocataires.rows].forEach(d => {
            if (d.id_proprietaire) proprietairesAvecDemandes.add(d.id_proprietaire);
        });
        
        console.log('Propriétaires avec des demandes:', Array.from(proprietairesAvecDemandes));
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

verifierProprietaires();
