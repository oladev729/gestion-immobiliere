// Script de débogage pour le frontend
// Copiez-collez ce code dans la console du navigateur (F12)

console.log('🔍 Débogage Frontend ImmoGest');
console.log('==============================');

// 1. Vérifier l'utilisateur connecté
const user = JSON.parse(localStorage.getItem('user') || 'null');
const token = localStorage.getItem('token');

console.log('👤 Utilisateur connecté:');
console.log('  - ID:', user?.id);
console.log('  - Email:', user?.email);
console.log('  - Type:', user?.type);
console.log('🔑 Token:', token ? token.substring(0, 50) + '...' : '❌ Non défini');

// 2. Vérifier si c'est le bon propriétaire
if (user?.email === 'assaninazifatou@gmail.com') {
    console.log('✅ Bon propriétaire connecté !');
} else {
    console.log('❌ Mauvais propriétaire !');
    console.log('🔧 Solution :');
    console.log('localStorage.setItem("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJhc3NhbmluYXppZmF0b3VAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NzM4ODI4NSwiZXhwIjoxNzc3OTkzMDg1fQ.QMc9Aj1m2P33X6_N0bzvm6LHA4diqKfZeZPfPrftnE0")');
    console.log('localStorage.setItem("user", JSON.stringify({"id":7,"email":"assaninazifatou@gmail.com","type":"proprietaire","iat":1777388285,"exp":1777993085}))');
    console.log('location.reload()');
}

// 3. Tester l'appel API direct
const testApiCall = async () => {
    try {
        const response = await fetch('http://127.0.0.1:5055/api/biens/mes-biens', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const biens = await response.json();
            console.log(`📊 ${biens.length} biens trouvés:`);
            
            biens.forEach(bien => {
                console.log(`🏠 Bien ${bien.id_bien}: ${bien.titre}`);
                console.log(`   Photos: ${bien.photos ? bien.photos.length : 0}`);
                
                if (bien.photos && bien.photos.length > 0) {
                    bien.photos.forEach((photo, idx) => {
                        console.log(`     ${idx + 1}. ${photo.url_photobien}`);
                        if (photo.url_photobien.includes('1777383496319-109877686.jpg')) {
                            console.log('          🎯 NOUVELLE PHOTO TROUVÉE !');
                        }
                    });
                }
            });
        } else {
            console.log('❌ Erreur API:', response.status);
            const error = await response.json();
            console.log('Message:', error.message);
        }
    } catch (error) {
        console.log('❌ Erreur réseau:', error.message);
    }
};

// 4. Tester l'accès aux images
const testImageAccess = (imageUrl) => {
    const img = new Image();
    img.onload = () => console.log(`✅ Image accessible: ${imageUrl}`);
    img.onerror = () => console.log(`❌ Image non accessible: ${imageUrl}`);
    img.src = `http://127.0.0.1:5055${imageUrl}`;
};

console.log('\n🧪 Tests en cours...');
testApiCall().then(() => {
    console.log('\n🖼️ Test d\'accès à la nouvelle image:');
    testImageAccess('/uploads/1777383496319-109877686.jpg');
});

// 5. Vérifier si React a bien rechargé les données
console.log('\n🔄 Si les images n\'apparaissent pas:');
console.log('1. Rafraîchissez la page (F5)');
console.log('2. Vérifiez le cache du navigateur');
console.log('3. Essayez de naviguer vers une autre page puis revenir');
console.log('4. Vérifiez les erreurs dans la console');
