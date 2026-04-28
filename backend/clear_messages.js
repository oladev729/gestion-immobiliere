const db = require('./src/config/database');

async function clearMessages() {
    try {
        console.log('🧹 Nettoyage des conversations (table messages)...');
        await db.query("DELETE FROM messages");
        console.log('✅ Tous les messages ont été supprimés.');
        
        // Optionnel: On peut aussi réinitialiser les demandes de visite si besoin, 
        // mais l'utilisateur a spécifiquement demandé les conversations.
        
        console.log('🚀 Vous repartez sur une base propre pour la messagerie.');
    } catch (err) {
        console.error('❌ Erreur lors du nettoyage:', err);
    } finally {
        process.exit();
    }
}

clearMessages();
