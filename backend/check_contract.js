const db = require('./src/config/database');

async function checkContract() {
    try {
        // Check if tenant (user ID 10) has active contract for bien ID 9
        const result = await db.query(`
            SELECT c.*, b.titre as bien_titre, l.id_locataire, l.id_utilisateur
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN locataire l ON c.id_locataire = l.id_locataire
            WHERE b.id_bien = 9 AND l.id_utilisateur = 10 AND c.statut_contrat = 'actif'
        `);
        
        console.log('Contrats actifs pour locataire 10 et bien 9:');
        if (result.rows.length === 0) {
            console.log('Aucun contrat actif trouvé');
        } else {
            result.rows.forEach(c => {
                console.log(`ID contrat: ${c.id_contact}, Bien: ${c.bien_titre}, Locataire ID: ${c.id_locataire}`);
            });
        }
        
        // Also check all contracts for this tenant
        const allContracts = await db.query(`
            SELECT c.*, b.titre as bien_titre
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            JOIN locataire l ON c.id_locataire = l.id_locataire
            WHERE l.id_utilisateur = 10
        `);
        
        console.log('\nTous les contrats du locataire 10:');
        allContracts.rows.forEach(c => {
            console.log(`ID contrat: ${c.id_contact}, Bien: ${c.bien_titre} (ID: ${c.id_bien}), Statut: ${c.statut_contrat}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

checkContract();
