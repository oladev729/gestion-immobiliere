const db = require('./src/config/database');

async function verifierDerniereDemande() {
    try {
        console.log('=== VÉRIFICATION DE LA DERNIÈRE DEMANDE ===\n');
        
        // 1. Récupérer la toute dernière demande
        console.log('1. Recherche de la dernière demande créée...');
        const derniereDemande = await db.query(`
            SELECT 
                di.*,
                b.titre as bien_titre, b.id_bien, b.id_proprietaire,
                u.email as proprietaire_email
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            LEFT JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            LEFT JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            ORDER BY di.date_demande DESC
            LIMIT 1
        `);
        
        if (derniereDemande.rows.length === 0) {
            console.log('Aucune demande trouvée');
            return;
        }
        
        const demande = derniereDemande.rows[0];
        console.log('Dernière demande trouvée:');
        console.log(`   ID: ${demande.id_demande}`);
        console.log(`   Nom: ${demande.nom} ${demande.prenoms}`);
        console.log(`   Email: ${demande.email}`);
        console.log(`   Bien: ${demande.bien_titre || 'Non spécifié'} (ID: ${demande.id_bien})`);
        console.log(`   Propriétaire: ${demande.proprietaire_email || 'Non associé'} (ID: ${demande.id_proprietaire})`);
        console.log(`   Statut: ${demande.statut}`);
        console.log(`   Date: ${demande.date_demande}`);
        
        // 2. Vérifier si elle est bien associée à un propriétaire
        console.log('\n2. Vérification de l\'association...');
        if (demande.id_bien && demande.id_proprietaire) {
            console.log('?? La demande est correctement associée à un bien et un propriétaire');
            
            // 3. Tester si elle apparaît dans les requêtes filtrées
            console.log('\n3. Test de visibilité pour le propriétaire concerné...');
            
            const testVisibilite = await db.query(`
                SELECT 
                    di.*,
                    b.titre as bien_titre,
                    'visiteur' as type_demandeur
                FROM demande_inscription_visiteur di
                LEFT JOIN bien b ON di.id_bien = b.id_bien
                WHERE di.statut = 'en_attente' AND b.id_proprietaire = $1
                ORDER BY di.date_demande DESC
            `, [demande.id_proprietaire]);
            
            console.log(`   Demandes trouvées pour ce propriétaire: ${testVisibilite.rows.length}`);
            
            const trouvee = testVisibilite.rows.find(d => d.id_demande === demande.id_demande);
            if (trouvee) {
                console.log('?? La demande EST visible dans les requêtes filtrées');
                console.log('   Le problème vient probablement du frontend (rafraîchissement, cache, etc.)');
            } else {
                console.log('?? La demande N\'EST PAS visible dans les requêtes filtrées');
                console.log('   Il y a un problème dans la logique de filtrage');
            }
            
        } else {
            console.log('?? La demande n\'est PAS associée à un bien (id_bien null)');
            console.log('   C\'est pourquoi elle n\'apparaît chez aucun propriétaire');
            console.log('   Elle a été créée avec l\'ancienne méthode');
        }
        
        // 4. Vérifier les logs du serveur pour cette demande
        console.log('\n4. Vérification des logs récents...');
        console.log('   Vérifiez les logs du serveur pour voir les appels API récents');
        console.log('   Cherchez "Nouvelle demande de visite pour bien" dans les logs');
        
        // 5. Donner la solution
        console.log('\n=== SOLUTION ===');
        if (!demande.id_bien) {
            console.log('?? La demande a été créée avec l\'ancienne méthode');
            console.log('?? Solution: Utiliser l\'endpoint POST /api/visiteurs/demande-visite/:id_bien');
            console.log('?? Cet endpoint lie la demande au bien spécifique');
        } else {
            console.log('?? La demande est correctement créée mais pas visible côté frontend');
            console.log('?? Solutions possibles:');
            console.log('   1. Rafraîchir la page du propriétaire');
            console.log('   2. Vider le cache du navigateur');
            console.log('   3. Vérifier les erreurs JavaScript dans la console');
            console.log('   4. Vérifier que le bon propriétaire est connecté');
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

verifierDerniereDemande();
