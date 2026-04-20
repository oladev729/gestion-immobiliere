const db = require('./src/config/database');
const Message = require('./src/models/Message');

async function testSend() {
    try {
        console.log('Test envoi message rapide...');
        const result = await Message.create({
            id_expediteur: 1, // Supposons un ID proprio valide
            id_destinataire: null,
            contenu: 'Test réponse rapide',
            id_bien: 1, // Supposons un ID bien valide
            id_demande: 16, // L'ID de la demande test
            expediteur_type: 'utilisateur',
            destinataire_type: 'visiteur'
        });
        console.log('Succès:', result);
    } catch (error) {
        console.error('Erreur détaillée:', error);
    } finally {
        process.exit();
    }
}

testSend();
