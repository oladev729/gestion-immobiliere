const db = require('./src/config/database');

const email = 'adeori229@gmail.com';

db.query('SELECT id_demande as id, email, nom, prenoms FROM demande_inscription_visiteur WHERE email = $1', [email])
  .then(res => {
    console.log('Résultat recherche pour', email + ':');
    if (res.rows.length > 0) {
      console.log('Trouvé:', res.rows[0]);
    } else {
      console.log('Non trouvé');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
