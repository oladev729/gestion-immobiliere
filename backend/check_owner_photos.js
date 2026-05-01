require('dotenv').config();
const http = require('http');

// Test avec le vrai propriétaire du bien 5
const testOwnerPhotos = () => {
    const ownerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJ5ZXNzb3Vmb3V6ZW5hYm91NDZAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NzM4ODAxOSwiZXhwIjoxNzc3OTkyODE5fQ.qTikbmRg5qnHX04aVHapjXNzmRScYHkFWI8AMUTfkC0';
    
    const options = {
        hostname: '127.0.0.1',
        port: 5055,
        path: '/api/biens/mes-biens',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ownerToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`📡 Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(`📊 ${jsonData.length} biens trouvés pour le propriétaire:`);
                
                jsonData.forEach(bien => {
                    console.log(`\n🏠 Bien ${bien.id_bien}: ${bien.titre}`);
                    console.log(`   Photos: ${bien.photos ? bien.photos.length : 0}`);
                    
                    if (bien.photos && bien.photos.length > 0) {
                        bien.photos.forEach((photo, idx) => {
                            console.log(`     ${idx + 1}. ${photo.url_photobien}`);
                            if (photo.url_photobien.includes('1777383496319-109877686.jpg')) {
                                console.log('          🎯 NOUVELLE PHOTO TROUVÉE !');
                            }
                            
                            // Test d'accès direct à l'image
                            testImageAccess(photo.url_photobien);
                        });
                    }
                });
            } catch (error) {
                console.log('❌ Erreur parsing JSON:', error.message);
                console.log('📄 Réponse brute:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Erreur requête:', error.message);
    });

    req.end();
};

// Test d'accès direct à une image
const testImageAccess = (imageUrl) => {
    const options = {
        hostname: '127.0.0.1',
        port: 5055,
        path: imageUrl,
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log(`     ✅ Image accessible: ${imageUrl}`);
        } else {
            console.log(`     ❌ Image non accessible: ${imageUrl} (${res.statusCode})`);
        }
    });

    req.on('error', (error) => {
        console.log(`     ❌ Erreur image ${imageUrl}: ${error.message}`);
    });

    req.end();
};

console.log('🔍 Test des photos du propriétaire réel');
console.log('======================================');

testOwnerPhotos();
