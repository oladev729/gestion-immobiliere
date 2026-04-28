const db = require('./src/config/database');

async function checkUser13() {
    try {
        const user = await db.query("SELECT id_utilisateur, email, type_utilisateur FROM utilisateur WHERE id_utilisateur = 13");
        console.table(user.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser13();
