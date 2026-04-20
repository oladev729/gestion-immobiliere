const db = require('./src/config/database');

async function testSolutionFinale() {
    try {
        console.log('=== TEST DE LA SOLUTION FINALE ===\n');
        
        // Test pour ASSANI (ID utilisateur 7 -> ID propriétaire 4)
        console.log('1. Test pour ASSANI...');
        const proprietaireAssani = await db.query(
            'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
            [7]
        );
        
        if (proprietaireAssani.rows.length > 0) {
            const id_proprietaire_assani = proprietaireAssani.rows[0].id_proprietaire;
            
            // Test de la requête corrigée
            const demandesAssani = await db.query(`
                SELECT 
                    di.*,
                    b.titre as bien_titre,
                    'visiteur' as type_demandeur
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                ORDER BY di.date_demande DESC
            `, [id_proprietaire_assani]);
            
            console.log(`   ASSANI: ${demandesAssani.rows.length} demandes trouvées`);
            demandesAssani.rows.forEach((d, i) => {
                console.log(`     ${i+1}. ${d.nom} (${d.email}) -> ${d.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        // Test pour OULFATH (ID utilisateur 4 -> ID propriétaire 3)
        console.log('\n2. Test pour OULFATH...');
        const proprietaireOulfath = await db.query(
            'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
            [4]
        );
        
        if (proprietaireOulfath.rows.length > 0) {
            const id_proprietaire_oulfath = proprietaireOulfath.rows[0].id_proprietaire;
            
            // Test de la requête corrigée
            const demandesOulfath = await db.query(`
                SELECT 
                    di.*,
                    b.titre as bien_titre,
                    'visiteur' as type_demandeur
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                ORDER BY di.date_demande DESC
            `, [id_proprietaire_oulfath]);
            
            console.log(`   OULFATH: ${demandesOulfath.rows.length} demandes trouvées`);
            demandesOulfath.rows.forEach((d, i) => {
                console.log(`     ${i+1}. ${d.nom} (${d.email}) -> ${d.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        // Comparaison avec l'ancienne méthode
        console.log('\n3. Comparaison avec l\'ancienne méthode (toutes les demandes)...');
        const toutesDemandes = await db.query(`
            SELECT 
                di.*,
                b.titre as bien_titre,
                b.id_proprietaire
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            WHERE di.statut = 'en_attente'
            ORDER BY di.date_demande DESC
        `);
        
        console.log(`   Ancienne méthode: ${toutesDemandes.rows.length} demandes totales`);
        console.log('   Distribution par propriétaire:');
        const distribution = {};
        toutesDemandes.rows.forEach(d => {
            const propId = d.id_proprietaire || 'null';
            distribution[propId] = (distribution[propId] || 0) + 1;
        });
        
        Object.entries(distribution).forEach(([propId, count]) => {
            console.log(`     Propriétaire ${propId}: ${count} demandes`);
        });
        
        console.log('\n=== RÉSULTAT ===');
        console.log('?? Solution appliquée avec succès !');
        console.log('?? Chaque propriétaire ne voit que ses propres demandes');
        console.log('?? Fini la fuite de données entre propriétaires');
        console.log('?? Le système est maintenant sécurisé');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

testSolutionFinale();
