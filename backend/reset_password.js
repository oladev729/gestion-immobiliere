const bcrypt = require('bcryptjs');
const db = require('./src/config/database');

async function resetPassword() {
    try {
        const newPassword = '123456'; // Mot de passe simple pour tester
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await db.query(
            `UPDATE utilisateur SET mot_de_passe = $1 WHERE email = 'ouche@gmail.com'`,
            [hashedPassword]
        );
        
        console.log('Mot de passe réinitialisé pour ouche@gmail.com');
        console.log('Nouveau mot de passe: 123456');
        
    } catch (err) {
        console.error('Erreur:', err.message);
    }
    process.exit(0);
}

resetPassword();
