const db = require('./src/config/database');

async function fixAyath() {
    try {
        const user = await db.query("SELECT id_utilisateur, email FROM utilisateur WHERE email = 'ayath@gmail.com'");
        if (user.rows.length > 0) {
            const id = user.rows[0].id_utilisateur;
            const email = user.rows[0].email;
            
            console.log(`🔧 Création forcée du profil locataire pour Ayath (ID: ${id})...`);
            await db.query(
                "INSERT INTO locataire (id_utilisateur, compte_confirme, email_invite) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                [id, true, email]
            );
            console.log('✅ Profil créé avec succès.');
        } else {
            console.log('❌ Utilisateur ayath@gmail.com non trouvé.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

fixAyath();
