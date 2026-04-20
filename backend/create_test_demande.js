const axios = require('axios');

async function createTestDemande() {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0X2ZpbmFsQHRlc3QuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NjUzNTA2MSwiZXhwIjoxNzc2NjIxNDYxfQ.7Y0U1M8n4O3x2J2X5w6r3t2F8n1C7q5Z6K8b3X9w';
        
        console.log('Création d\'une demande de visiteur de test...');
        const response = await axios.post('http://127.0.0.1:5055/api/visiteurs/inscription', {
            nom: 'Test',
            prenoms: 'Visiteur',
            email: 'testvisiteur@test.com',
            telephone: '0123456789',
            message: 'Demande de test'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Demande créée:', response.data);
        
    } catch (error) {
        console.error('❌ Erreur création demande:', error.response?.data || error.message);
    }
}

createTestDemande();
