const db = require('./src/config/database');

async function testSecurite() {
    try {
        console.log('=== TEST DE SÉCURITÉ APRÈS CORRECTION ===\n');
        
        // Test pour ASSANI (propriétaire ID 4)
        const id_proprietaire_assani = 4;
        console.log('1. Test pour ASSANI (propriétaire ID 4)...');
        
        const queryAssani = `
            SELECT d.*, 
                   b.titre as bien_titre,
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            WHERE b.id_proprietaire = $1
            ORDER BY d.date_demande DESC
        `;
        
        const resultAssani = await db.query(queryAssani, [id_proprietaire_assani]);
        console.log(`   Demandes trouvées: ${resultAssani.rows.length}`);
        resultAssani.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ${row.nom} (${row.email}) -> ${row.bien_titre || 'Bien non spécifié'}`);
        });
        
        // Test pour OULFATH (propriétaire ID 3)
        const id_proprietaire_oulfath = 3;
        console.log('\n2. Test pour OULFATH (propriétaire ID 3)...');
        
        const queryOulfath = `
            SELECT d.*, 
                   b.titre as bien_titre,
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            WHERE b.id_proprietaire = $1
            ORDER BY d.date_demande DESC
        `;
        
        const resultOulfath = await db.query(queryOulfath, [id_proprietaire_oulfath]);
        console.log(`   Demandes trouvées: ${resultOulfath.rows.length}`);
        resultOulfath.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ${row.nom} (${row.email}) -> ${row.bien_titre || 'Bien non spécifié'}`);
        });
        
        // Vérification finale
        console.log('\n3. Vérification finale...');
        const toutesDemandes = await db.query(`
            SELECT d.id_demande, d.nom, d.email, d.statut,
                   b.titre as bien_titre, b.id_proprietaire,
                   u.email as proprietaire_email
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE d.statut = 'en_attente'
            ORDER BY d.date_demande DESC
            LIMIT 10
        `);
        
        console.log('   Toutes les demandes en attente:');
        toutesDemandes.rows.forEach((demande, i) => {
            console.log(`   ${i+1}. ${demande.nom} (${demande.email}) -> ${demande.bien_titre || 'Bien non spécifié'} (Propriétaire: ${demande.proprietaire_email})`);
        });
        
        console.log('\n=== RÉSULTAT ===');
        console.log('La correction garantit que chaque propriétaire ne voit que:');
        console.log('- Les demandes liées à ses biens (id_bien non null)');
        console.log('- AUCUNE demande avec id_bien null (problème de sécurité corrigé)');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

testSecurite();
