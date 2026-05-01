require('dotenv').config();
const db = require('./src/config/database');

// Vérifier à qui appartient le bien 5
const checkBienOwner = async () => {
    try {
        console.log('🔍 Vérification du propriétaire du bien 5...');
        
        const result = await db.query(`
            SELECT b.id_bien, b.titre, b.id_proprietaire, u.email, u.id_utilisateur
            FROM bien b
            JOIN proprietaire p ON b.id_proprietaire = p.id_proprietaire
            JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
            WHERE b.id_bien = 5
        `);
        
        if (result.rows.length > 0) {
            const bien = result.rows[0];
            console.log('✅ Bien 5 trouvé:');
            console.log(`  - Titre: ${bien.titre}`);
            console.log(`  - ID Propriétaire: ${bien.id_proprietaire}`);
            console.log(`  - ID Utilisateur: ${bien.id_utilisateur}`);
            console.log(`  - Email: ${bien.email}`);
            
            // Créer un token pour ce propriétaire
            const jwt = require('jsonwebtoken');
            const payload = {
                id: bien.id_utilisateur,
                email: bien.email,
                type: 'proprietaire',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
            };
            
            const token = jwt.sign(payload, process.env.JWT_SECRET);
            console.log('\n✅ Token correct pour ce propriétaire:');
            console.log(token);
            console.log('\n📋 Utilisation dans le navigateur:');
            console.log('localStorage.setItem("token", "' + token + '")');
            console.log('localStorage.setItem("user", JSON.stringify(' + JSON.stringify(payload) + '))');
            
        } else {
            console.log('❌ Bien 5 non trouvé');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
};

checkBienOwner();
