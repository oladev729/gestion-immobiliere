const db = require('./src/config/database');

async function analyserNouvelleDemande() {
    try {
        console.log('=== ANALYSE DE LA NOUVELLE DEMANDE ===\n');
        
        // 1. Récupérer toutes les demandes récentes
        console.log('1. Demandes récentes créées...');
        const recentesDemandes = await db.query(`
            SELECT 
                di.id_demande, di.nom, di.prenoms, di.email, di.statut, di.date_demande,
                b.titre as bien_titre, b.id_proprietaire,
                u.email as proprietaire_email
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            ORDER BY di.date_demande DESC
            LIMIT 10
        `);
        
        console.log('Demandes récentes:');
        recentesDemandes.rows.forEach((demande, i) => {
            console.log(`   ${i+1}. ID: ${demande.id_demande}`);
            console.log(`      Demande: ${demande.nom} ${demande.prenoms} (${demande.email})`);
            console.log(`      Bien: ${demande.bien_titre || 'Non spécifié'} (ID propriétaire: ${demande.id_proprietaire})`);
            console.log(`      Propriétaire: ${demande.proprietaire_email || 'Non associé'}`);
            console.log(`      Date: ${demande.date_demande}`);
            console.log('');
        });
        
        // 2. Vérifier les comptes propriétaires actifs
        console.log('2. Comptes propriétaires actifs...');
        const proprietaires = await db.query(`
            SELECT u.id_utilisateur, u.email, p.id_proprietaire
            FROM utilisateur u
            JOIN proprietaire p ON u.id_utilisateur = p.id_utilisateur
            WHERE u.type_utilisateur = 'proprietaire'
            ORDER BY u.id_utilisateur
        `);
        
        console.log('Propriétaires actifs:');
        proprietaires.rows.forEach(prop => {
            console.log(`   ID Utilisateur: ${prop.id_utilisateur}, ID Propriétaire: ${prop.id_proprietaire}, Email: ${prop.email}`);
        });
        
        // 3. Simulation des requêtes pour chaque propriétaire
        console.log('\n3. Simulation des requêtes filtrées...');
        
        for (const proprietaire of proprietaires.rows) {
            console.log(`\n   Test pour ${proprietaire.email} (ID: ${proprietaire.id_proprietaire}):`);
            
            // Requête getDemandesEnAttente (page inviter visiteur)
            const demandesEnAttente = await db.query(`
                SELECT 
                    di.*,
                    b.titre as bien_titre,
                    'visiteur' as type_demandeur
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                ORDER BY di.date_demande DESC
            `, [proprietaire.id_proprietaire]);
            
            console.log(`      Demandes en attente: ${demandesEnAttente.rows.length}`);
            demandesEnAttente.rows.forEach(d => {
                console.log(`        - ${d.nom} (${d.email}) -> ${d.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        // 4. Identifier les demandes avec id_bien null
        console.log('\n4. Demandes avec id_bien null (problématiques)...');
        const demandesNull = await db.query(`
            SELECT di.id_demande, di.nom, di.email, di.date_demande
            FROM demande_inscription_visiteur di
            WHERE di.id_bien IS NULL AND di.statut = 'en_attente'
            ORDER BY di.date_demande DESC
            LIMIT 5
        `);
        
        console.log(`Demandes sans bien associé: ${demandesNull.rows.length}`);
        demandesNull.rows.forEach(d => {
            console.log(`   - ${d.nom} (${d.email}) - ${d.date_demande}`);
        });
        
        console.log('\n=== CONCLUSION ===');
        
        if (recentesDemandes.rows.length > 0) {
            const derniereDemande = recentesDemandes.rows[0];
            if (derniereDemande.id_proprietaire) {
                console.log('?? La nouvelle demande est correctement associée à un propriétaire');
                console.log('?? Elle devrait apparaître uniquement chez ce propriétaire');
            } else {
                console.log('?? La nouvelle demande n\'est PAS associée à un propriétaire (id_bien null)');
                console.log('?? C\'est pourquoi elle apparaît chez tout le monde');
                console.log('?? Solution: Utiliser la nouvelle méthode demandeVisiteBien pour créer les demandes');
            }
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

analyserNouvelleDemande();
