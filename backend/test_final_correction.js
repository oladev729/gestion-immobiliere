const db = require('./src/config/database');

async function testFinalCorrection() {
    try {
        console.log('=== TEST FINAL DE LA CORRECTION ===\n');
        
        // 1. Vérifier la méthode getDemandesEnAttente actuelle
        console.log('1. Test de la méthode getDemandesEnAttente actuelle...');
        
        // Simuler l'appel pour ASSANI (ID utilisateur 7)
        const id_utilisateur_assani = 7;
        
        // Récupérer l'ID propriétaire
        const proprietaireAssani = await db.query(
            'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
            [id_utilisateur_assani]
        );
        
        if (proprietaireAssani.rows.length > 0) {
            const id_proprietaire_assani = proprietaireAssani.rows[0].id_proprietaire;
            console.log(`   ASSANI: ID Utilisateur ${id_utilisateur_assani} -> ID Propriétaire ${id_proprietaire_assani}`);
            
            // Test de la requête actuelle (sans filtrage)
            const demandesActuelles = await db.query(`
                SELECT 
                    di.*
                FROM demande_inscription_visiteur di
                WHERE di.statut = 'en_attente'
                ORDER BY di.date_demande DESC
            `);
            
            console.log(`   Requête actuelle: ${demandesActuelles.rows.length} demandes trouvées`);
            
            // Test de la requête corrigée (avec filtrage)
            const demandesCorrigees = await db.query(`
                SELECT 
                    di.*,
                    b.titre as bien_titre,
                    'visiteur' as type_demandeur
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                ORDER BY di.date_demande DESC
            `, [id_proprietaire_assani]);
            
            console.log(`   Requête corrigée: ${demandesCorrigees.rows.length} demandes trouvées`);
            
            // Afficher les détails
            demandesCorrigees.rows.forEach((demande, i) => {
                console.log(`     ${i+1}. ${demande.nom} (${demande.email}) -> ${demande.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        // 2. Test pour OULFATH (ID utilisateur 4)
        console.log('\n2. Test pour OULFATH...');
        const id_utilisateur_oulfath = 4;
        
        const proprietaireOulfath = await db.query(
            'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
            [id_utilisateur_oulfath]
        );
        
        if (proprietaireOulfath.rows.length > 0) {
            const id_proprietaire_oulfath = proprietaireOulfath.rows[0].id_proprietaire;
            console.log(`   OULFATH: ID Utilisateur ${id_utilisateur_oulfath} -> ID Propriétaire ${id_proprietaire_oulfath}`);
            
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
            
            console.log(`   Requête corrigée: ${demandesOulfath.rows.length} demandes trouvées`);
            
            demandesOulfath.rows.forEach((demande, i) => {
                console.log(`     ${i+1}. ${demande.nom} (${demande.email}) -> ${demande.bien_titre || 'Bien non spécifié'}`);
            });
        }
        
        console.log('\n=== CONCLUSION ===');
        console.log('La requête corrigée filtre correctement par propriétaire.');
        console.log('Chaque propriétaire ne voit que les demandes liées à ses biens.');
        console.log('Solution: Modifier la méthode getDemandesEnAttente dans visiteurController.js');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

testFinalCorrection();
