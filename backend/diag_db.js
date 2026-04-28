require('dotenv').config({path: './.env'});
const db = require('./src/config/database');

async function check() {
    try {
        console.log('\n--- STRUCTURE UTILISATEUR ---');
        const userCols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'utilisateur'");
        console.log(JSON.stringify(userCols.rows, null, 2));

        console.log('\n--- NAZIFATOU DETAILS ---');
        const nazDetails = await db.query("SELECT * FROM utilisateur WHERE nom ILIKE '%Nazifatou%' OR nom ILIKE '%ASSANI%'");
        console.log(JSON.stringify(nazDetails.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
