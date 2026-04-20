const db = require('./src/config/database');

async function diagVisiteurs() {
    try {
        const result = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'demande_inscription_visiteur'
        `);
        console.log('Colonnes de demande_inscription_visiteur:');
        console.table(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

diagVisiteurs();
