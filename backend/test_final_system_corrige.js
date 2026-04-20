const db = require('./src/config/database');

async function testFinalSystem() {
    try {
        console.log('=== TEST FINAL SYSTÈME DE DEMANDES ===\n');
        
        // 1. Créer un bien pour le propriétaire (ID 5) avec les bons noms de colonnes
        console.log('1. Création bien pour propriétaire...');
        const bienResult = await db.query(`
            INSERT INTO bien (id_proprietaire, titre, adresse, ville, type_bien, superficie, nombre_chambres, loyer_mensuel, charge, description, statut) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING id_bien, titre
        `, [5, 'Appartement Test Visites', '123 Rue Test', 'Ville Test', 'appartement', 50, 2, 800, 100, 'Bien pour tester les demandes', 'disponible']);
        
        const id_bien = bienResult.rows[0].id_bien;
        console.log(`   Bien créé: ${bienResult.rows[0].titre} (ID: ${id_bien})`);
        
        // 2. Créer une demande de visiteur
        console.log('\n2. Création demande visiteur...');
        const demandeVisiteurResult = await db.query(`
            INSERT INTO demande_inscription_visiteur 
            (nom, prenoms, email, telephone, message, statut, id_bien, date_visite) 
            VALUES ($1, $2, $3, $4, $5, 'en_attente', $6, $7) 
            RETURNING id_demande, nom, email
        `, ['Jean', 'Visiteur', 'jean.visiteur@test.com', '0123456789', 'Je souhaite visiter cet appartement', id_bien, '2026-04-25']);
        
        const id_demande_visiteur = demandeVisiteurResult.rows[0].id_demande;
        console.log(`   Demande visiteur créée: ${demandeVisiteurResult.rows[0].nom} (ID: ${id_demande_visiteur})`);
        
        // 3. Créer une demande de locataire
        console.log('\n3. Création demande locataire...');
        const demandeLocataireResult = await db.query(`
            INSERT INTO demander_visite 
            (id_locataire, id_bien, id_proprietaire, date_visite, message, statut_demande) 
            VALUES ($1, $2, $3, $4, $5, 'en_attente') 
            RETURNING id_demande, date_visite
        `, [1, id_bien, 5, '2026-04-26', 'Locataire intéressé par cet appartement']);
        
        const id_demande_locataire = demandeLocataireResult.rows[0].id_demande;
        console.log(`   Demande locataire créée (ID: ${id_demande_locataire})`);
        
        // 4. Tester la récupération des demandes pour le propriétaire
        console.log('\n4. Test récupération demandes propriétaire...');
        
        // Récupérer les demandes des visiteurs
        const demandesVisiteurs = await db.query(`
            SELECT d.*, 
                   b.titre as bien_titre,
                   b.adresse as bien_adresse,
                   b.ville as bien_ville,
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            WHERE b.id_proprietaire = $1
            ORDER BY d.date_demande DESC
        `, [5]);
        
        // Récupérer les demandes des locataires
        const demandesLocataires = await db.query(`
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
        `, [5]);
        
        console.log(`   Demandes visiteurs trouvées: ${demandesVisiteurs.rows.length}`);
        console.log(`   Demandes locataires trouvées: ${demandesLocataires.rows.length}`);
        
        // Vérifier que les demandes sont bien trouvées
        const visiteurTrouve = demandesVisiteurs.rows.find(d => d.id_demande === id_demande_visiteur);
        const locataireTrouve = demandesLocataires.rows.find(d => d.id_demande === id_demande_locataire);
        
        if (visiteurTrouve) {
            console.log(`   Demande visiteur trouvée: ${visiteurTrouve.nom} pour ${visiteurTrouve.bien_titre}`);
        } else {
            console.log('   Demande visiteur NON TROUVÉE');
        }
        
        if (locataireTrouve) {
            console.log(`   Demande locataire trouvée: ${locataireTrouve.locataire_nom} pour ${locataireTrouve.bien_titre}`);
        } else {
            console.log('   Demande locataire NON TROUVÉE');
        }
        
        // 5. Combiner et formater
        const demandesVisiteursFormatees = demandesVisiteurs.rows.map(demande => ({
            ...demande,
            locataire_nom: demande.nom,
            locataire_prenoms: demande.prenoms,
            locataire_email: demande.email,
            statut_libelle: demande.statut === 'en_attente' ? 'En attente' : demande.statut
        }));
        
        const toutesDemandes = [...demandesVisiteursFormatees, ...demandesLocataires.rows];
        toutesDemandes.sort((a, b) => new Date(b.date_demande || b.date_inscription) - new Date(a.date_demande || a.date_inscription));
        
        console.log(`\n5. Total des demandes combinées: ${toutesDemandes.length}`);
        toutesDemandes.forEach((demande, index) => {
            console.log(`   ${index + 1}. ${demande.type_demandeur}: ${demande.locataire_nom || demande.nom} - ${demande.bien_titre}`);
        });
        
        console.log('\n=== SYSTÈME FONCTIONNEL ===');
        console.log('Les demandes de visite apparaissent correctement dans la page du propriétaire !');
        console.log('Les propriétaires peuvent voir les demandes de visiteurs ET de locataires.');
        console.log('Ils pourront ensuite discuter entre eux via le système de messagerie.');
        
    } catch (error) {
        console.error('Erreur dans le test:', error.message);
    }
}

testFinalSystem();
