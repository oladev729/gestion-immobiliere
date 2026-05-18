require('dotenv').config({path: './.env'});
const db = require('./src/config/database');

async function check() {
    try {
        console.log('\n--- SAMPLE PAIEMENTS ---');
        const paiements = await db.query(`
            SELECT * FROM payement ORDER BY date_paiement DESC LIMIT 10
        `);
        console.log(JSON.stringify(paiements.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
