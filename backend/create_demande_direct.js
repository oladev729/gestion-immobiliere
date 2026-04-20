const db = require('./src/config/database');

async function createTestDemande() {
    try {
        console.log('Création d\'une demande de visiteur de test directement en base...');
        
        // Créer d'abord un bien pour le propriétaire
        const bienResult = await db.query(`
            INSERT INTO bien (id_proprietaire, titre, adresse, ville, statut) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id_bien
        `, [5, 'Bien Test', 'Adresse Test', 'Ville Test', 'disponible']);
        
        const id_bien = bienResult.rows[0].id_bien;
        console.log('Bien créé avec ID:', id_bien);
        
        // Créer la demande de visiteur
        const demandeResult = await db.query(`
            INSERT INTO demande_inscription_visiteur 
            (nom, prenoms, email, telephone, message, statut, id_bien, date_demande) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) 
            RETURNING *
        `, ['Test', 'Visiteur', 'testvisiteur@test.com', '0123456789', 'Demande de test', 'en_attente', id_bien]);
        
        console.log('✅ Demande créée:', demandeResult.rows[0]);
        
        // Tester la récupération
        console.log('\nTest de récupération des demandes...');
        const demandesResult = await db.query(`
            SELECT d.*, 
                   'visiteur' as type_demandeur
            FROM demande_inscription_visiteur d
            LEFT JOIN bien b ON d.id_bien = b.id_bien
            WHERE b.id_proprietaire = $1
            ORDER BY d.date_demande DESC
        `, [5]);
        
        console.log('✅ Demandes récupérées:', demandesResult.rows.length);
        console.log('Première demande:', demandesResult.rows[0]);
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

createTestDemande();
