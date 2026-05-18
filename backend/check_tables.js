require('dotenv').config({path: './.env'});
const db = require('./src/config/database');

async function check() {
    try {
        console.log('\n--- CHECK CHARGES TABLE STRUCTURE ---');
        const chargesCols = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'charges'
        `);
        console.log('Columns in charges table:', JSON.stringify(chargesCols.rows, null, 2));

        console.log('\n--- CHECK ALERTES TABLE STRUCTURE ---');
        const alertesCols = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'alertes'
        `);
        console.log('Columns in alertes table:', JSON.stringify(alertesCols.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
