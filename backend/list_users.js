const db = require('./src/config/database');

async function listUsers() {
    try {
        const users = await db.query("SELECT id_utilisateur, email, type_utilisateur FROM utilisateur");
        console.log('--- Tous les Utilisateurs ---');
        console.table(users.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listUsers();
