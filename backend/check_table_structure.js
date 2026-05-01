require('dotenv').config();
const db = require('./src/config/database');

// Vérifier la structure de la table photosbien
const checkTableStructure = async () => {
    try {
        console.log('🔍 Vérification de la structure de la table photosbien...');
        
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'photosbien'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Structure de la table photosbien:');
        result.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // Vérifier si la colonne est_principale existe
        const hasEstPrincipale = result.rows.some(col => col.column_name === 'est_principale');
        
        if (!hasEstPrincipale) {
            console.log('\n❌ La colonne est_principale n\'existe pas');
            console.log('🔧 Correction nécessaire dans photoRoutes.js');
        } else {
            console.log('\n✅ La colonne est_principale existe');
        }
        
        // Vérifier les photos existantes
        const photosResult = await db.query('SELECT * FROM photosbien LIMIT 5');
        console.log(`\n📸 Photos existantes: ${photosResult.rows.length}`);
        photosResult.rows.forEach(photo => {
            console.log(`  - ID: ${photo.id_photosbien}, Bien: ${photo.id_bien}, URL: ${photo.url_photobien}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
};

// Corriger la route photo si nécessaire
const suggestFix = () => {
    console.log('\n🔧 Solution suggérée:');
    console.log('1. Modifier photoRoutes.js pour ne pas utiliser est_principale');
    console.log('2. Ou ajouter la colonne est_principale à la table');
    console.log('3. Utiliser uniquement url_photobien et legende');
};

checkTableStructure().then(suggestFix);
