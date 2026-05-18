require('dotenv').config({path: './.env'});
const db = require('./src/config/database');

async function check() {
    try {
        console.log('\n--- SAMPLE CONTRATS ---');
        const contrats = await db.query(`
            SELECT * FROM contact LIMIT 10
        `);
        console.log(JSON.stringify(contrats.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
