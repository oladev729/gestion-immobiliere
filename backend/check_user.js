const db = require('./src/config/database');

async function checkUser() {
    try {
        const result = await db.query('SELECT email, mot_de_passe FROM utilisateur WHERE email = $1', ['test_final@test.com']);
        
        if (result.rows.length > 0) {
            console.log('Utilisateur trouvé:');
            console.log('Email:', result.rows[0].email);
            console.log('Hash du mot de passe:', result.rows[0].mot_de_passe);
            console.log('Longueur du hash:', result.rows[0].mot_de_passe.length);
        } else {
            console.log('Utilisateur non trouvé');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

checkUser();
