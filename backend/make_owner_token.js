require('dotenv').config();
const jwt = require('jsonwebtoken');

// Créer un token pour l'utilisateur 4 (propriétaire du bien 5)
const createOwnerToken = () => {
    const payload = {
        id: 4,
        email: 'yessoufouzenabou46@gmail.com',
        type: 'proprietaire',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 jours
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);
    console.log('✅ Token propriétaire créé:');
    console.log(token);
    console.log('\n📋 Utilisation:');
    console.log('localStorage.setItem("token", "' + token + '")');
    console.log('localStorage.setItem("user", JSON.stringify(' + JSON.stringify(payload) + '))');
    
    return token;
};

createOwnerToken();
