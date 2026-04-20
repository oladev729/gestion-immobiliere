const db = require('./src/config/database');

async function analyserErreurFiltrage() {
    try {
        console.log('=== ANALYSE CRITIQUE DE L ERREUR DE FILTRAGE ===\n');
        
        // 1. Vérifier la demande spécifique d'ASSANI
        console.log('1. Recherche des demandes d ASSANI...');
        const demandesAssani = await db.query(`
            SELECT di.id_demande, di.nom, di.prenoms, di.email, di.statut, di.date_demande,
                   b.titre as bien_titre, b.id_proprietaire as bien_proprietaire_id,
                   u.email as proprietaire_email
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE di.email ILIKE '%assani%' OR di.nom ILIKE '%ASSANI%'
            ORDER BY di.date_demande DESC
            LIMIT 5
        `);
        
        console.log('Demandes ASSANI trouvées:');
        demandesAssani.rows.forEach((demande, i) => {
            console.log(`   ${i+1}. ID: ${demande.id_demande}`);
            console.log(`      Demande: ${demande.nom} ${demande.prenoms} (${demande.email})`);
            console.log(`      Bien: ${demande.bien_titre || 'Non spécifié'}`);
            console.log(`      Propriétaire du bien: ID ${demande.bien_proprietaire_id}, Email: ${demande.proprietaire_email || 'Non trouvé'}`);
            console.log(`      Statut: ${demande.statut}`);
            console.log('');
        });
        
        // 2. Vérifier les comptes propriétaires concernés
        console.log('2. Comptes propriétaires concernés...');
        
        // Propriétaire ASSANI (assaninazifatou@gmail.com)
        const proprietaireAssani = await db.query(`
            SELECT u.id_utilisateur, u.email, p.id_proprietaire
            FROM utilisateur u
            JOIN proprietaire p ON u.id_utilisateur = p.id_utilisateur
            WHERE u.email = 'assaninazifatou@gmail.com'
        `);
        
        console.log('   Propriétaire ASSANI:');
        proprietaireAssani.rows.forEach(p => {
            console.log(`      ID Utilisateur: ${p.id_utilisateur}, ID Propriétaire: ${p.id_proprietaire}, Email: ${p.email}`);
        });
        
        // Propriétaire OULFATH (oulfathishola@gmail.com)
        const proprietaireOulfath = await db.query(`
            SELECT u.id_utilisateur, u.email, p.id_proprietaire
            FROM utilisateur u
            JOIN proprietaire p ON u.id_utilisateur = p.id_utilisateur
            WHERE u.email = 'oulfathishola@gmail.com'
        `);
        
        console.log('   Propriétaire OULFATH:');
        proprietaireOulfath.rows.forEach(p => {
            console.log(`      ID Utilisateur: ${p.id_utilisateur}, ID Propriétaire: ${p.id_proprietaire}, Email: ${p.email}`);
        });
        
        // 3. Vérifier les biens de chaque propriétaire
        console.log('\n3. Biens par propriétaire...');
        
        if (proprietaireAssani.rows.length > 0) {
            const biensAssani = await db.query(`
                SELECT id_bien, titre, statut 
                FROM bien 
                WHERE id_proprietaire = $1
            `, [proprietaireAssani.rows[0].id_proprietaire]);
            
            console.log(`   Biens d'ASSANI (${proprietaireAssani.rows[0].id_proprietaire}):`);
            biensAssani.rows.forEach(bien => {
                console.log(`      - ${bien.titre} (ID: ${bien.id_bien}, Statut: ${bien.statut})`);
            });
        }
        
        if (proprietaireOulfath.rows.length > 0) {
            const biensOulfath = await db.query(`
                SELECT id_bien, titre, statut 
                FROM bien 
                WHERE id_proprietaire = $1
            `, [proprietaireOulfath.rows[0].id_proprietaire]);
            
            console.log(`   Biens d'OULFATH (${proprietaireOulfath.rows[0].id_proprietaire}):`);
            biensOulfath.rows.forEach(bien => {
                console.log(`      - ${bien.titre} (ID: ${bien.id_bien}, Statut: ${bien.statut})`);
            });
        }
        
        // 4. Simulation de la requête de récupération pour chaque propriétaire
        console.log('\n4. Simulation des requêtes de récupération...');
        
        // Pour ASSANI
        if (proprietaireAssani.rows.length > 0) {
            console.log('   Requête pour ASSANI (ID: ' + proprietaireAssani.rows[0].id_proprietaire + '):');
            const emailAssani = proprietaireAssani.rows[0].email;
            const queryAssani = `
                SELECT d.*, 
                       b.titre as bien_titre,
                       'visiteur' as type_demandeur
                FROM demande_inscription_visiteur d
                LEFT JOIN bien b ON d.id_bien = b.id_bien
                WHERE (b.id_proprietaire = $1 OR (b.id_proprietaire IS NULL AND d.email = $2))
                ORDER BY d.date_demande DESC
            `;
            
            const resultAssani = await db.query(queryAssani, [proprietaireAssani.rows[0].id_proprietaire, emailAssani]);
            console.log(`      Demandes trouvées: ${resultAssani.rows.length}`);
            resultAssani.rows.forEach(d => {
                console.log(`        - ${d.nom} (${d.email}) -> ${d.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        // Pour OULFATH
        if (proprietaireOulfath.rows.length > 0) {
            console.log('   Requête pour OULFATH (ID: ' + proprietaireOulfath.rows[0].id_proprietaire + '):');
            const emailOulfath = proprietaireOulfath.rows[0].email;
            const queryOulfath = `
                SELECT d.*, 
                       b.titre as bien_titre,
                       'visiteur' as type_demandeur
                FROM demande_inscription_visiteur d
                LEFT JOIN bien b ON d.id_bien = b.id_bien
                WHERE (b.id_proprietaire = $1 OR (b.id_proprietaire IS NULL AND d.email = $2))
                ORDER BY d.date_demande DESC
            `;
            
            const resultOulfath = await db.query(queryOulfath, [proprietaireOulfath.rows[0].id_proprietaire, emailOulfath]);
            console.log(`      Demandes trouvées: ${resultOulfath.rows.length}`);
            resultOulfath.rows.forEach(d => {
                console.log(`        - ${d.nom} (${d.email}) -> ${d.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        console.log('\n=== FIN ANALYSE ===');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

analyserErreurFiltrage();
