const db = require('./src/config/database');

db.query('SELECT column_name FROM information_schema.columns WHERE table_name = \'contact\' ORDER BY ordinal_position')
    .then(result => {
        console.log('Colonnes de la table contact:');
        result.rows.forEach(row => console.log(row.column_name));
    })
    .catch(err => console.error('Erreur:', err.message))
    .finally(() => process.exit(0));
