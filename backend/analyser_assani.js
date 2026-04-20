const db = require('./src/config/database');

async function analyserCompteAssani() {
    try {
        console.log('=== ANALYSE COMPTE ASSANI NAZIFATH ===\n');
        
        // 1. Chercher tous les utilisateurs avec "assani" ou "nazifath"
        console.log('1. Recherche des utilisateurs "assani" ou "nazifath"...');
        const utilisateurs = await db.query(`
            SELECT id_utilisateur, email, nom, prenoms, type_utilisateur, statut
            FROM utilisateur 
            WHERE email ILIKE '%assani%' OR email ILIKE '%nazifath%' 
               OR nom ILIKE '%assani%' OR prenoms ILIKE '%nazifath%'
        `);
        
        console.log('Utilisateurs trouvés:');
        utilisateurs.rows.forEach(user => {
            console.log(`   ID: ${user.id_utilisateur}, Email: ${user.email}, Nom: ${user.nom} ${user.prenoms}, Type: ${user.type_utilisateur}`);
        });
        
        // 2. Vérifier les entrées proprietaire pour ces utilisateurs
        console.log('\n2. Entrées proprietaire correspondantes...');
        for (const user of utilisateurs.rows) {
            const proprietaire = await db.query(`
                SELECT id_proprietaire 
                FROM proprietaire 
                WHERE id_utilisateur = $1
            `, [user.id_utilisateur]);
            
            if (proprietaire.rows.length > 0) {
                console.log(`   Utilisateur ${user.email} -> Propriétaire ID: ${proprietaire.rows[0].id_proprietaire}`);
                
                // 3. Vérifier les biens de ce propriétaire
                const biens = await db.query(`
                    SELECT id_bien, titre, statut 
                    FROM bien 
                    WHERE id_proprietaire = $1
                `, [proprietaire.rows[0].id_proprietaire]);
                
                console.log(`   Biens (${biens.rows.length}):`);
                biens.rows.forEach(bien => {
                    console.log(`     - ${bien.titre} (ID: ${bien.id_bien}, Statut: ${bien.statut})`);
                });
                
                // 4. Vérifier les demandes pour ces biens
                if (biens.rows.length > 0) {
                    const demandesVisiteurs = await db.query(`
                        SELECT di.id_demande, di.nom, di.email, di.statut, di.date_demande
                        FROM demande_inscription_visiteur di
                        WHERE di.id_bien IN (${biens.rows.map(b => b.id_bien).join(',')})
                        ORDER BY di.date_demande DESC
                    `);
                    
                    const demandesLocataires = await db.query(`
                        SELECT dv.id_demande, u.nom, u.email, dv.statut_demande, dv.date_demande
                        FROM demander_visite dv
                        LEFT JOIN utilisateur u ON dv.id_locataire = u.id_utilisateur
                        WHERE dv.id_bien IN (${biens.rows.map(b => b.id_bien).join(',')})
                        ORDER BY dv.date_demande DESC
                    `);
                    
                    console.log(`   Demandes visiteurs: ${demandesVisiteurs.rows.length}`);
                    demandesVisiteurs.rows.forEach(d => {
                        console.log(`     - ${d.nom} (${d.email}) - ${d.statut} - ${d.date_demande}`);
                    });
                    
                    console.log(`   Demandes locataires: ${demandesLocataires.rows.length}`);
                    demandesLocataires.rows.forEach(d => {
                        console.log(`     - ${d.nom} (${d.email}) - ${d.statut_demande} - ${d.date_demande}`);
                    });
                }
            } else {
                console.log(`   Utilisateur ${user.email} -> PAS d'entrée proprietaire`);
            }
        }
        
        // 5. Vérifier les logs de connexion récents
        console.log('\n3. Analyse des demandes existantes...');
        const toutesDemandesVisiteurs = await db.query(`
            SELECT di.*, b.titre as bien_titre, b.id_proprietaire
            FROM demande_inscription_visiteur di
            LEFT JOIN bien b ON di.id_bien = b.id_bien
            WHERE di.email ILIKE '%assani%' OR di.email ILIKE '%nazifath%'
               OR di.nom ILIKE '%assani%' OR di.prenoms ILIKE '%nazifath%'
            ORDER BY di.date_demande DESC
            LIMIT 10
        `);
        
        console.log('Demandes visiteurs avec noms "assani" ou "nazifath":');
        toutesDemandesVisiteurs.rows.forEach(d => {
            console.log(`   - ${d.nom} ${d.prenoms} (${d.email}) -> ${d.bien_titre || 'Bien non spécifié'} (Propriétaire: ${d.id_proprietaire})`);
        });
        
        console.log('\n=== FIN ANALYSE ===');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

analyserCompteAssani();
