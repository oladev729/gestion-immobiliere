const axios = require('axios');

async function testDemandes() {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJhc3NhbmluYXppZmF0b3VAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NjUzNTA2MSwiZXhwIjoxNzc2NjIxNDYxfQ.7Y0U1M8n4O3x2J2X5w6r3t2F8n1C7q5Z6K8b3X9w';
        
        console.log('Test de récupération des demandes...');
        
        const response = await axios.get('http://127.0.0.1:5055/api/visiteurs/demandes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Succès:', response.data);
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

testDemandes();
