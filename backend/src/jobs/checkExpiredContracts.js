const db = require('../config/database');

/**
 * Vérifie les contrats expirés et les passe automatiquement en statut 'inactif'
 * Rend également les biens disponibles après la fin du contrat
 */
async function checkExpiredContracts() {
    try {
        console.log('🔍 Vérification des contrats expirés...');
        
        const today = new Date().toISOString().split('T')[0];
        
        // Récupérer les contrats actifs dont la date de fin est passée
        const query = `
            SELECT c.id_contact, c.id_bien, c.statut_contrat, c.date_fin
            FROM contact c
            WHERE c.statut_contrat = 'actif'
            AND c.date_fin < $1
        `;
        
        const result = await db.query(query, [today]);
        
        if (result.rows.length === 0) {
            console.log('✅ Aucun contrat expiré trouvé');
            return;
        }
        
        console.log(`📋 ${result.rows.length} contrat(s) expiré(s) trouvé(s)`);
        
        // Passer les contrats en statut 'inactif' et rendre les biens disponibles
        for (const contrat of result.rows) {
            try {
                // Mettre à jour le statut du contrat
                await db.query(
                    'UPDATE contact SET statut_contrat = $1 WHERE id_contact = $2',
                    ['inactif', contrat.id_contact]
                );
                
                // Rendre le bien disponible
                await db.query(
                    'UPDATE bien SET statut = $1 WHERE id_bien = $2',
                    ['disponible', contrat.id_bien]
                );
                
                console.log(`✅ Contrat #${contrat.id_contact} passé en inactif, bien #${contrat.id_bien} rendu disponible`);
                
            } catch (error) {
                console.error(`❌ Erreur lors du traitement du contrat #${contrat.id_contact}:`, error);
            }
        }
        
        console.log('✅ Vérification des contrats expirés terminée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des contrats expirés:', error);
    }
}

module.exports = {
    checkExpiredContracts
};
