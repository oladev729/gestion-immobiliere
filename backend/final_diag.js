const db = require('./src/config/database');

async function diagnostic() {
    try {
        const result = await db.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'messages'
            ORDER BY ordinal_position
        `);
        console.log('STRUCTURE TABLE MESSAGES:');
        console.table(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

diagnostic();
