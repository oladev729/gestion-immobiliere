require('dotenv').config();
const db = require('./src/config/database');

// Vérifier si la nouvelle photo est dans la base de données
const checkNewPhoto = async () => {
    try {
        console.log('🔍 Vérification de la nouvelle photo uploadée...');
        
        // Chercher la photo avec le nom de fichier 1777383496319-109877686.jpg
        const result = await db.query(`
            SELECT * FROM photosbien 
            WHERE url_photobien LIKE '%1777383496319-109877686.jpg%'
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Photo trouvée dans la base de données:');
            result.rows.forEach(photo => {
                console.log(`  - ID: ${photo.id_photosbien}`);
                console.log(`  - Bien: ${photo.id_bien}`);
                console.log(`  - URL: ${photo.url_photobien}`);
                console.log(`  - Principale: ${photo.est_principale}`);
                console.log(`  - Date: ${photo.date_ajout}`);
            });
        } else {
            console.log('❌ Photo non trouvée dans la base de données');
            console.log('🔍 Recherche de toutes les photos récentes...');
            
            const recentPhotos = await db.query(`
                SELECT * FROM photosbien 
                ORDER BY date_ajout DESC 
                LIMIT 5
            `);
            
            console.log('📸 5 photos les plus récentes:');
            recentPhotos.rows.forEach(photo => {
                console.log(`  - ${photo.url_photobien} (${photo.date_ajout})`);
            });
        }
        
        // Vérifier les biens avec leurs photos
        const biensWithPhotos = await db.query(`
            SELECT b.id_bien, b.titre, COUNT(p.id_photosbien) as nb_photos
            FROM bien b
            LEFT JOIN photosbien p ON b.id_bien = p.id_bien
            GROUP BY b.id_bien, b.titre
            ORDER BY b.id_bien
        `);
        
        console.log('\n🏠 Biens et nombre de photos:');
        biensWithPhotos.rows.forEach(bien => {
            console.log(`  - Bien ${bien.id_bien}: ${bien.titre} (${bien.nb_photos} photos)`);
        });
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
};

checkNewPhoto();
