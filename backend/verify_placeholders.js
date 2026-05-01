const http = require('http');
const fs = require('fs');

// Test d'accès aux placeholders
const testPlaceholderAccess = () => {
    const options = {
        hostname: '127.0.0.1',
        port: 5055,
        path: '/api/uploads/placeholders/default.svg',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`📡 Status: ${res.statusCode}`);
        console.log(`📡 Content-Type: ${res.headers['content-type']}`);
        
        if (res.statusCode === 200) {
            console.log('✅ Placeholder accessible via API');
        } else {
            console.log('❌ Placeholder non accessible');
        }
        
        res.on('data', (chunk) => {
            // Ne pas afficher le contenu SVG
        });
        
        res.on('end', () => {
            console.log('📄 Fin de la réponse');
        });
    });

    req.on('error', (error) => {
        console.log('❌ Erreur requête:', error.message);
    });

    req.end();
};

// Vérifier si les fichiers existent
const checkFilesExist = () => {
    const placeholderDir = './uploads/placeholders';
    
    console.log('🔍 Vérification des fichiers placeholders:');
    
    try {
        const files = fs.readdirSync(placeholderDir);
        files.forEach(file => {
            const filePath = `${placeholderDir}/${file}`;
            const stats = fs.statSync(filePath);
            console.log(`✅ ${file} (${stats.size} bytes)`);
        });
    } catch (error) {
        console.log('❌ Erreur lecture dossier:', error.message);
    }
};

console.log('🔍 Test des placeholders ImmoGest');
console.log('================================');

checkFilesExist();
console.log();
testPlaceholderAccess();
