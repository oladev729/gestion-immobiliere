const fs = require('fs');
const path = require('path');

// Créer des images placeholder simples
const createPlaceholderImages = () => {
    const placeholdersDir = path.join(__dirname, 'uploads', 'placeholders');
    
    // Images placeholder pour différents types de biens
    const placeholders = [
        { name: 'appartement.jpg', description: 'Appartement moderne' },
        { name: 'maison.jpg', description: 'Maison familiale' },
        { name: 'studio.jpg', description: 'Studio cosy' },
        { name: 'villa.jpg', description: 'Villa de luxe' },
        { name: 'default.jpg', description: 'Bien immobilier' }
    ];
    
    placeholders.forEach(placeholder => {
        const filePath = path.join(placeholdersDir, placeholder.name);
        
        // Créer un fichier texte simple comme placeholder
        const content = `Placeholder: ${placeholder.description}\nTaille: 800x600\nType: Image placeholder`;
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Créé: ${placeholder.name}`);
    });
    
    console.log('📁 Images placeholder créées dans:', placeholdersDir);
};

// Mettre à jour le contrôleur pour utiliser les placeholders
const updateBienController = () => {
    const controllerPath = path.join(__dirname, 'src', 'controllers', 'bienController.js');
    
    console.log('📝 Pour utiliser les images placeholder, ajoutez ce code dans bienController.js:');
    console.log(`
// Au début du fichier
const path = require('path');

// Fonction pour obtenir l'URL de l'image placeholder
const getPlaceholderUrl = (type = 'default') => {
    return \`/api/uploads/placeholders/\${type}.jpg\`;
};

// Dans la méthode getBiensDisponibles, ajouter:
if (!bien.photo_principale) {
    bien.photo_principale = getPlaceholderUrl('appartement');
}

// Dans la méthode getBiensByProprietaire, ajouter:
bien.photos = bien.photos.length > 0 ? bien.photos : [{
    url_photobien: getPlaceholderUrl('default'),
    legende: 'Image placeholder'
}];
    `);
};

// Exécuter
createPlaceholderImages();
updateBienController();

console.log('\n🎯 Instructions:');
console.log('1. Redémarrez le serveur backend');
console.log('2. Les images placeholder seront utilisées automatiquement');
console.log('3. Upload de vraies images remplacera les placeholders');
