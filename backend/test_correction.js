const db = require('./src/config/database');

async function testCorrection() {
    try {
        console.log('=== TEST DE LA CORRECTION ===\n');
        
        // Simuler la requête modifiée pour le propriétaire ID 4 (assaninazifatou@gmail.com)
        const id_proprietaire = 4;
        const email_proprietaire = 'assaninazifatou@gmail.com';
        
        console.log('1. Test requête modifiée pour les visiteurs...');
        
        const queryVisiteurs = `
            SELECT d.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            WHERE (b.id_proprietaire = $1 OR (b.id_proprietaire IS NULL AND d.email = $2))
            ORDER BY d.date_demande DESC
        `;
        
        const resultVisiteurs = await db.query(queryVisiteurs, [id_proprietaire, email_proprietaire]);
        
        console.log(`   Visiteurs trouvés: ${resultVisiteurs.rows.length}`);
        resultVisiteurs.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ${row.nom} ${row.prenoms} - ${row.bien_titre || 'Bien non spécifié'} (${row.email})`);
        });
        
        console.log('\n2. Vérification manuelle des demandes ASSANI...');
        const demandesAssani = await db.query(`
            SELECT d.*, b.titre, b.id_proprietaire
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            WHERE d.email ILIKE '%assani%' OR d.nom ILIKE '%ASSANI%'
            ORDER BY d.date_demande DESC
            LIMIT 5
        `);
        
        console.log('   Demandes ASSANI trouvées:');
        demandesAssani.rows.forEach((row, i) => {
            console.log(`   ${i+1}. ${row.nom} -> ${row.titre || 'Bien non spécifié'} (Propriétaire: ${row.id_proprietaire})`);
        });
        
        console.log('\n=== FIN DU TEST ===');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

testCorrection();
