const db = require('./src/config/database');

async function revertDueDate() {
    try {
        console.log('🔧 Rétablissement de la date d\'échéance au 5 du mois...');
        
        // Delete the existing incorrect due date for contract 2
        await db.query('DELETE FROM loyermensuel WHERE id_contact = 2 AND mois_concerne = $1', ['2026-06']);
        console.log('✅ Ancienne échéance supprimée');
        
        // Create the new due date with the correct date (5th of June)
        const dateEcheance = new Date();
        dateEcheance.setDate(5); // 5 du mois
        
        const result = await db.query(`
            INSERT INTO loyermensuel (
                id_contact,
                mois_concerne,
                montant_loyer,
                montant_charge,
                date_echeance,
                statut
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [2, '2026-06', 150000, 0, dateEcheance, 'en_attente']);
        
        console.log('✅ Nouvelle échéance créée:', {
            id_loyer: result.rows[0].id_loyer,
            date_echeance: result.rows[0].date_echeance,
            statut: result.rows[0].statut
        });
        
        console.log('\n✅ Rétablissement terminé avec succès');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

revertDueDate();
