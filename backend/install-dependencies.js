const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installation des dépendances manquantes...');

// Vérifier si node_modules existe
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Création du dossier node_modules...');
    fs.mkdirSync(nodeModulesPath, { recursive: true });
}

// Installer les dépendances
exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ Erreur lors de l\'installation:', error);
        return;
    }
    
    console.log('✅ Dépendances installées avec succès!');
    console.log('📋 Output:', stdout);
    
    if (stderr) {
        console.log('⚠️  Warnings:', stderr);
    }
    
    console.log('🚀 Vous pouvez maintenant lancer: npm run dev');
});
