require('dotenv').config();
const http = require('http');

// Test de récupération des photos d'un bien spécifique
const testBienPhotos = (bienId) => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJwcm9wcmlldGFpcmVAZXhhbXBsZS5jb20iLCJ0eXBlIjoicHJvcHJpZXRhaXJlIiwiaWF0IjoxNzc3MzgwMzU0LCJleHAiOjE3Nzc5ODUxNTR9.dAmd4J46Au31FAvBkfHVju1dY71Iqp4VQYjOjCu76TY';
    
    const options = {
        hostname: '127.0.0.1',
        port: 5055,
        path: `/api/biens/mes-biens`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
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
                console.log('✅ Réponse API reçue');
                
                if (jsonData.length === 0) {
                    console.log('❌ Aucun bien trouvé pour cet utilisateur');
                    console.log('🔍 Test avec un utilisateur qui a des biens...');
                    
                    // Test avec l'utilisateur propriétaire du bien 5
                    testWithOwner();
                } else {
                    console.log(`📊 ${jsonData.length} biens trouvés:`);
                    jsonData.forEach(bien => {
                        console.log(`  - Bien ${bien.id_bien}: ${bien.titre}`);
                        console.log(`    Photos: ${bien.photos ? bien.photos.length : 0}`);
                        if (bien.photos && bien.photos.length > 0) {
                            bien.photos.forEach((photo, idx) => {
                                console.log(`      ${idx + 1}. ${photo.url_photobien} (${photo.est_principale ? 'principale' : 'détail'})`);
                            });
                        }
                    });
                }
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

// Test avec le propriétaire réel du bien 5
const testWithOwner = () => {
    const ownerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiZW1haWwiOiJ5ZXNzb3Vmb3V6ZW5hYm91NDZAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NzM4MDM1NCwiZXhwIjoxNzc3OTg1MTU0fQ.test'; // Token pour l'utilisateur 4
    
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
        console.log(`📡 Status (propriétaire): ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log(`📊 ${jsonData.length} biens pour le propriétaire:`);
                
                jsonData.forEach(bien => {
                    console.log(`  - Bien ${bien.id_bien}: ${bien.titre}`);
                    console.log(`    Photos: ${bien.photos ? bien.photos.length : 0}`);
                    if (bien.photos && bien.photos.length > 0) {
                        bien.photos.forEach((photo, idx) => {
                            console.log(`      ${idx + 1}. ${photo.url_photobien} (${photo.est_principale ? 'principale' : 'détail'})`);
                            if (photo.url_photobien.includes('1777383496319-109877686.jpg')) {
                                console.log('          🎯 NOUVELLE PHOTO TROUVÉE !');
                            }
                        });
                    }
                });
            } catch (error) {
                console.log('❌ Erreur parsing JSON:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Erreur requête propriétaire:', error.message);
    });

    req.end();
};

console.log('🔍 Test de récupération des photos des biens');
console.log('===========================================');

testBienPhotos();
