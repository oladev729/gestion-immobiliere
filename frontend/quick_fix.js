// Script de connexion rapide pour le bon propriétaire
// Copiez-collez dans la console (F12) et tapez "allow pasting"

console.log('🔧 Connexion automatique au bon propriétaire...');

// 1. Nettoyer le localStorage
localStorage.clear();

// 2. Définir le bon token et utilisateur
const correctToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJhc3NhbmluYXppZmF0b3VAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NzM4ODI4NSwiZXhwIjoxNzc3OTkzMDg1fQ.QMc9Aj1m2P33X6_N0bzvm6LHA4diqKfZeZPfPrftnE0";
const correctUser = {
    "id": 7,
    "email": "assaninazifatou@gmail.com",
    "type": "proprietaire",
    "iat": 1777388285,
    "exp": 1777993085
};

// 3. Sauvegarder dans localStorage
localStorage.setItem("token", correctToken);
localStorage.setItem("user", JSON.stringify(correctUser));

console.log('✅ Connexion établie:');
console.log('  - Email:', correctUser.email);
console.log('  - ID:', correctUser.id);
console.log('  - Type:', correctUser.type);

// 4. Recharger la page
console.log('🔄 Rechargement de la page...');
setTimeout(() => {
    location.reload();
}, 1000);
