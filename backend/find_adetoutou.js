const db = require('./src/config/database');

async function findAdetoutou() {
    try {
        const user = await db.query("SELECT * FROM utilisateur WHERE nom ILIKE '%Adetoutou%' OR prenoms ILIKE '%Adetoutou%'");
        console.table(user.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findAdetoutou();
