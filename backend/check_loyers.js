require('dotenv').config({path: './.env'});
const db = require('./src/config/database');

async function check() {
    try {
        console.log('\n--- SAMPLE LOYERS IN LOYERMENSUEL ---');
        const loyers = await db.query(`
            SELECT * FROM loyermensuel LIMIT 10
        `);
        console.log(JSON.stringify(loyers.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
