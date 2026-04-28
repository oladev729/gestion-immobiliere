const db = require('./src/config/database');

async function findNabilath() {
    try {
        const user = await db.query("SELECT * FROM utilisateur WHERE nom ILIKE '%Nabilath%' OR prenoms ILIKE '%Nabilath%'");
        console.log('--- Utilisateur Nabilath ---');
        console.table(user.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findNabilath();
