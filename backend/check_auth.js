require('dotenv').config();
const jwt = require('jsonwebtoken');

// Vérifier le token JWT
const checkToken = (token) => {
    try {
        if (!token) {
            console.log('❌ Token manquant');
            return false;
        }

        console.log('🔍 Token reçu:', token.substring(0, 50) + '...');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token valide:', decoded);
        return true;
    } catch (error) {
        console.log('❌ Erreur token:', error.message);
        return false;
    }
};

// Test avec un token valide
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJwcm9wcmlldGFpcmVAZXhhbXBsZS5jb20iLCJ0eXBlIjoicHJvcHJpZXRhaXJlIiwiaWF0IjoxNzc3MzgwMzU0LCJleHAiOjE3Nzc5ODUxNTR9.dAmd4J46Au31FAvBkfHVju1dY71Iqp4VQYjOjCu76TY';

console.log('🔐 Vérification du token JWT');
console.log('Secret JWT:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini');

checkToken(testToken);

console.log('\n📋 Instructions:');
console.log('1. Vérifiez que le token est bien envoyé depuis le frontend');
console.log('2. Vérifiez que le localStorage contient le token');
console.log('3. Vérifiez que le JWT_SECRET est le même frontend/backend');
