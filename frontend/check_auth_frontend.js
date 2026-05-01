// Script de débogage pour l'authentification frontend

// Vérifier le token dans le localStorage
const checkToken = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Debug Auth Frontend');
    console.log('Token:', token ? token.substring(0, 50) + '...' : '❌ Non trouvé');
    console.log('User:', user ? JSON.parse(user).email : '❌ Non trouvé');
    console.log('Headers Authorization:', token ? `Bearer ${token.substring(0, 20)}...` : '❌ Non défini');
    
    return { token, user };
};

// Test d'une requête API
const testApiCall = async () => {
    const { token } = checkToken();
    
    if (!token) {
        console.log('❌ Pas de token - impossible de tester l\'API');
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:5055/api/biens', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Test API - Status:', response.status);
        console.log('📡 Test API - Headers:', response.headers);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Call réussi - Nombre de biens:', data.length);
        } else {
            const error = await response.json();
            console.log('❌ API Call erreur:', error);
        }
    } catch (error) {
        console.log('❌ Erreur réseau:', error.message);
    }
};

// Exécuter les tests
checkToken();
testApiCall();

console.log('\n📋 Instructions:');
console.log('1. Ouvrez la console du navigateur');
console.log('2. Connectez-vous en tant que propriétaire');
console.log('3. Essayez de modifier un bien');
console.log('4. Vérifiez les logs d\'authentification');
