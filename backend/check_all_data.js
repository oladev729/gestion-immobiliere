require('dotenv').config({path: './.env'});
const db = require('./src/config/database');

async function check() {
    try {
        console.log('\n--- ALL LOYERMENSUEL ---');
        const loyers = await db.query(`SELECT * FROM loyermensuel`);
        console.log(JSON.stringify(loyers.rows, null, 2));

        console.log('\n--- ALL PAYEMENT ---');
        const payements = await db.query(`SELECT * FROM payement ORDER BY date_paiement DESC LIMIT 10`);
        console.log(JSON.stringify(payements.rows, null, 2));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
