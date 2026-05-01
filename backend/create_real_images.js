const fs = require('fs');
const path = require('path');

// Créer une image SVG simple qui peut servir de placeholder
const createSVGPlaceholder = (filename, text, color = '#4a90e2') => {
    const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="${color}"/>
        <text x="400" y="300" font-family="Arial" font-size="32" fill="white" text-anchor="middle">
            ${text}
        </text>
        <text x="400" y="350" font-family="Arial" font-size="20" fill="white" text-anchor="middle">
            Image placeholder
        </text>
    </svg>`;
    
    const filePath = path.join(__dirname, 'uploads', 'placeholders', filename);
    fs.writeFileSync(filePath, svg);
    console.log(`✅ Créé: ${filename}`);
};

// Créer les placeholders
const createAllPlaceholders = () => {
    const placeholdersDir = path.join(__dirname, 'uploads', 'placeholders');
    
    if (!fs.existsSync(placeholdersDir)) {
        fs.mkdirSync(placeholdersDir, { recursive: true });
    }
    
    createSVGPlaceholder('appartement.jpg', 'Appartement', '#3498db');
    createSVGPlaceholder('maison.jpg', 'Maison', '#2ecc71');
    createSVGPlaceholder('studio.jpg', 'Studio', '#e74c3c');
    createSVGPlaceholder('villa.jpg', 'Villa', '#f39c12');
    createSVGPlaceholder('default.jpg', 'Bien Immobilier', '#9b59b6');
    
    console.log('📁 Placeholders SVG créés dans:', placeholdersDir);
};

createAllPlaceholders();
