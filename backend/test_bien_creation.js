const axios = require('axios');

async function testBienCreation() {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0X2ZpbmFsQHRlc3QuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NjUzNTA2MSwiZXhwIjoxNzc2NjIxNDYxfQ.7Y0U1M8n4O3x2J2X5w6r3t2F8n1C7q5Z6K8b3X9w';
        
        console.log('Test création bien...');
        const response = await axios.post('http://127.0.0.1:5055/api/biens', {
            titre: 'Appartement Test',
            adresse: '123 Rue Test',
            ville: 'Ville Test',
            type_bien: 'appartement',
            surface: 50,
            nb_chambres: 2,
            loyer_mensuel: 800,
            charges: 100,
            description: 'Bien de test pour demandes'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Réponse création bien:', response.data);
        console.log('ID du bien:', response.data.id_bien);
        
    } catch (error) {
        console.error('Erreur création bien:', error.response?.data || error.message);
    }
}

testBienCreation();
