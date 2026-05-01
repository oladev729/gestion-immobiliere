require('dotenv').config();
const jwt = require('jsonwebtoken');

// Créer un token de test valide
const createTestToken = () => {
    const payload = {
        id: 1,
        email: 'proprietaire@example.com',
        type: 'proprietaire',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 jours
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);
    console.log('✅ Token de test créé:');
    console.log(token);
    console.log('\n📋 Utilisation:');
    console.log('localStorage.setItem("token", "' + token + '")');
    console.log('localStorage.setItem("user", JSON.stringify(' + JSON.stringify(payload) + '))');
    
    return token;
};

// Tester le token créé
const testCreatedToken = () => {
    const token = createTestToken();
    
    console.log('\n🔍 Test du token créé:');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token valide:', decoded);
    } catch (error) {
        console.log('❌ Erreur:', error.message);
    }
};

testCreatedToken();
