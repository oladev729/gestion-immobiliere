const db = require('./src/config/database');
async function checkTable() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'demande_inscription_visiteur'
    `);
    console.log('Columns in demande_inscription_visiteur:');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking table:', err);
    process.exit(1);
  }
}
checkTable();
