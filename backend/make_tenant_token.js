require('dotenv').config();
const jwt = require('jsonwebtoken');

// Créer un token pour le locataire ouche@gmail.com (ID 10)
const createTenantToken = () => {
    const payload = {
        id: 10,
        email: 'ouche@gmail.com',
        type: 'locataire',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 jours
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);
    console.log('✅ Token locataire créé:');
    console.log(token);
    console.log('\n📋 Utilisation dans le navigateur:');
    console.log('localStorage.setItem("token", "' + token + '")');
    console.log('localStorage.setItem("user", JSON.stringify(' + JSON.stringify(payload) + '))');
    console.log('location.reload()');
    
    return token;
};

createTenantToken();
