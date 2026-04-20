const db = require('./src/config/database');

async function checkSerial() {
    try {
        const result = await db.query(`
            SELECT table_name, column_name, column_default
            FROM information_schema.columns
            WHERE table_name = 'messages' AND column_name = 'id_message'
        `);
        console.log('Colonne id_message:', result.rows[0]);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

checkSerial();
