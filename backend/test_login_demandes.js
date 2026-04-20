const axios = require('axios');

async function testLoginAndDemandes() {
    try {
        // 1. Se connecter pour obtenir un token valide
        console.log('1. Connexion en cours...');
        const loginResponse = await axios.post('http://127.0.0.1:5055/api/auth/login', {
            email: 'test_final@test.com',
            mot_de_passe: '123456'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Token obtenu:', token.substring(0, 50) + '...');
        
        // 2. Tester la récupération des demandes
        console.log('\n2. Test de récupération des demandes...');
        const demandesResponse = await axios.get('http://127.0.0.1:5055/api/visiteurs/demandes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Succès récupération demandes:');
        console.log('Nombre de demandes:', demandesResponse.data.length);
        console.log('Première demande:', demandesResponse.data[0] || 'Aucune');
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
        if (error.response?.data?.stack) {
            console.error('Stack:', error.response.data.stack);
        }
    }
}

testLoginAndDemandes();
