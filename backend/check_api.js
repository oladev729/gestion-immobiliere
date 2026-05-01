require('dotenv').config();
const http = require('http');

// Test d'API avec authentification
const testApiWithAuth = () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJwcm9wcmlldGFpcmVAZXhhbXBsZS5jb20iLCJ0eXBlIjoicHJvcHJpZXRhaXJlIiwiaWF0IjoxNzc3MzgwMzU0LCJleHAiOjE3Nzc5ODUxNTR9.dAmd4J46Au31FAvBkfHVju1dY71Iqp4VQYjOjCu76TY';
    
    const options = {
        hostname: '127.0.0.1',
        port: 5055,
        path: '/api/biens/mes-biens',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`📡 Status: ${res.statusCode}`);
        console.log(`📡 Headers:`, res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('✅ Réponse API:', jsonData);
                console.log(`📊 Nombre de biens: ${jsonData.length || 0}`);
            } catch (error) {
                console.log('📄 Réponse brute:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Erreur requête:', error.message);
    });

    req.end();
};

// Test sans authentification pour comparer
const testApiWithoutAuth = () => {
    const options = {
        hostname: '127.0.0.1',
        port: 5055,
        path: '/api/biens/disponibles',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`📡 Status (sans auth): ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('❌ Réponse sans auth:', jsonData);
            } catch (error) {
                console.log('📄 Réponse brute (sans auth):', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Erreur requête (sans auth):', error.message);
    });

    req.end();
};

console.log('🔍 Test API avec et sans authentification');
console.log('=====================================');

testApiWithoutAuth();

setTimeout(() => {
    console.log('\n');
    testApiWithAuth();
}, 1000);
