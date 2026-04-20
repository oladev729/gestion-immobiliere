const db = require('./src/config/database');

async function testRequetes() {
    try {
        console.log('=== TEST DES REQUÊTES ===\n');
        
        const id_proprietaire = 7; // ID du propriétaire connecté
        
        // 1. Tester la requête des visiteurs
        console.log('1. Test requête visiteurs...');
        try {
            const resultVisiteurs = await db.query(`
                SELECT d.*, 
                       b.titre as bien_titre,
                       b.adresse as bien_adresse,
                       b.ville as bien_ville,
                       'visiteur' as type_demandeur
                FROM demande_inscription_visiteur d
                LEFT JOIN bien b ON d.id_bien = b.id_bien
                WHERE b.id_proprietaire = $1
                ORDER BY d.date_demande DESC
            `, [id_proprietaire]);
            
            console.log(`   Visiteurs trouvés: ${resultVisiteurs.rows.length}`);
            resultVisiteurs.rows.forEach((row, i) => {
                console.log(`   ${i+1}. ${row.nom} - ${row.bien_titre || 'Bien non spécifié'}`);
            });
        } catch (error) {
            console.error('   Erreur requête visiteurs:', error.message);
        }
        
        // 2. Tester la requête des locataires
        console.log('\n2. Test requête locataires...');
        try {
            const resultLocataires = await db.query(`
                SELECT 
                    dv.*,
                    u.nom as locataire_nom,
                    u.prenoms as locataire_prenoms,
                    u.email as locataire_email,
                    b.titre as bien_titre,
                    b.adresse as bien_adresse,
                    b.ville as bien_ville,
                    'locataire' as type_demandeur
                FROM demander_visite dv
                LEFT JOIN utilisateur u ON dv.id_locataire = u.id_utilisateur
                LEFT JOIN bien b ON dv.id_bien = b.id_bien
                WHERE dv.id_proprietaire = $1
                ORDER BY dv.date_demande DESC
            `, [id_proprietaire]);
            
            console.log(`   Locataires trouvés: ${resultLocataires.rows.length}`);
            resultLocataires.rows.forEach((row, i) => {
                console.log(`   ${i+1}. ${row.locataire_nom} - ${row.bien_titre || 'Bien non spécifié'}`);
            });
        } catch (error) {
            console.error('   Erreur requête locataires:', error.message);
        }
        
        // 3. Vérifier les biens du propriétaire
        console.log('\n3. Biens du propriétaire...');
        const biens = await db.query('SELECT id_bien, titre FROM bien WHERE id_proprietaire = $1', [id_proprietaire]);
        console.log(`   Biens trouvés: ${biens.rows.length}`);
        biens.rows.forEach(bien => {
            console.log(`   - ${bien.titre} (ID: ${bien.id_bien})`);
        });
        
        console.log('\n=== FIN DU TEST ===');
        
    } catch (error) {
        console.error('Erreur générale:', error.message);
    }
}

testRequetes();
