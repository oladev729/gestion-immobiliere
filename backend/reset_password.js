const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function resetPassword() {
    try {
        const hashedPassword = await bcrypt.hash('123456', 10);
        console.log('Nouveau hash:', hashedPassword);
        
        await db.query('UPDATE utilisateur SET mot_de_passe = $1 WHERE email = $2', [hashedPassword, 'test_final@test.com']);
        console.log('Mot de passe réinitialisé pour test_final@test.com');
        
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

resetPassword();
