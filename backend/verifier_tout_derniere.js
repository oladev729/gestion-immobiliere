const db = require('./src/config/database');

async function verifierToutDerniere() {
    try {
        console.log('=== VÉRIFICATION DE LA TOUTE DERNIÈRE DEMANDE ===\n');
        
        // 1. Récupérer les 3 dernières demandes pour voir l'évolution
        console.log('1. Les 3 dernières demandes créées...');
        const dernieresDemandes = await db.query(`
            SELECT 
                di.id_demande, di.nom, di.prenoms, di.email, di.statut, di.date_demande,
                b.titre as bien_titre, b.id_bien, b.id_proprietaire,
                u.email as proprietaire_email
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            ORDER BY di.date_demande DESC
            LIMIT 3
        `);
        
        console.log('Dernières demandes:');
        dernieresDemandes.rows.forEach((demande, i) => {
            console.log(`   ${i+1}. ID: ${demande.id_demande}`);
            console.log(`      Nom: ${demande.nom} ${demande.prenoms}`);
            console.log(`      Email: ${demande.email}`);
            console.log(`      Bien: ${demande.bien_titre || 'Non spécifié'} (ID: ${demande.id_bien})`);
            console.log(`      Propriétaire: ${demande.proprietaire_email || 'Non associé'} (ID: ${demande.id_proprietaire})`);
            console.log(`      Date: ${demande.date_demande}`);
            console.log('');
        });
        
        // 2. Vérifier les logs du serveur pour voir les appels récents
        console.log('2. Analyse des logs du serveur...');
        console.log('   Vérifiez si vous voyez "Nouvelle demande de visite pour bien" dans les logs');
        console.log('   Si vous voyez "Nouvelle demande d\'inscription reçue", c\'est l\'ancien endpoint');
        
        // 3. Si la dernière demande a un id_bien, tester sa visibilité
        const derniereDemande = dernieresDemandes.rows[0];
        if (derniereDemande.id_bien && derniereDemande.id_proprietaire) {
            console.log('3. Test de visibilité pour la demande avec bien...');
            
            const testVisibilite = await db.query(`
                SELECT 
                    di.*,
                    b.titre as bien_titre,
                    'visiteur' as type_demandeur
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                ORDER BY di.date_demande DESC
            `, [derniereDemande.id_proprietaire]);
            
            console.log(`   Demandes pour le propriétaire ${derniereDemande.proprietaire_email}: ${testVisibilite.rows.length}`);
            
            const trouvee = testVisibilite.rows.find(d => d.id_demande === derniereDemande.id_demande);
            if (trouvee) {
                console.log('   ?? La demande EST trouvée dans les requêtes filtrées');
                console.log('   ?? Problème probablement côté frontend (rafraîchissement, cache, etc.)');
            } else {
                console.log('   ?? La demande N\'EST PAS trouvée dans les requêtes filtrées');
                console.log('   ?? Il y a un problème dans la logique de filtrage');
            }
        }
        
        // 4. Vérifier les biens disponibles
        console.log('\n4. Biens disponibles pour tester...');
        const biens = await db.query(`
            SELECT b.id_bien, b.titre, b.id_proprietaire, u.email as proprietaire_email
            FROM bien b
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            ORDER BY b.id_proprietaire, b.id_bien
            LIMIT 10
        `);
        
        console.log('Biens disponibles:');
        biens.rows.forEach(bien => {
            console.log(`   - Bien ID ${bien.id_bien}: "${bien.titre}" (Propriétaire: ${bien.proprietaire_email})`);
        });
        
        // 5. Donner la solution exacte
        console.log('\n=== DIAGNOSTIC FINAL ===');
        
        if (derniereDemande.id_bien) {
            console.log('?? La dernière demande A un bien associé');
            console.log('?? Si elle n\'apparaît pas, le problème est:');
            console.log('   1. Mauvais propriétaire connecté');
            console.log('   2. Cache du navigateur');
            console.log('   3. Erreur JavaScript frontend');
            console.log('   4. La page n\'a pas été rafraîchie');
        } else {
            console.log('?? La dernière demande N\'a PAS de bien associé');
            console.log('?? Vous utilisez encore l\'ancien endpoint');
            console.log('?? Solution: Changez l\'URL de l\'appel API');
        }
        
        console.log('\n=== ACTION IMMÉDIATE ===');
        console.log('1. Vérifiez les logs du serveur ci-dessus');
        console.log('2. Si vous voyez "Nouvelle demande de visite pour bien", alors le nouvel endpoint est utilisé');
        console.log('3. Sinon, changez l\'URL de l\'appel API vers /api/visiteurs/demande-visite/[id_bien]');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

verifierToutDerniere();
