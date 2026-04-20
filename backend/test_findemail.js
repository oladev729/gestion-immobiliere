const Message = require('./src/models/Message');

const email = 'adeori229@gmail.com';

console.log('Test recherche email:', email);

// Test findByEmail
Message.findByEmail(email)
  .then(user => {
    console.log('Résultat findByEmail:');
    if (user) {
      console.log('Trouvé:', user);
    } else {
      console.log('Non trouvé dans table utilisateur - normal pour un visiteur');
      
      // Test recherche dans table visiteurs
      const db = require('./src/config/database');
      return db.query('SELECT id_demande as id, email, nom, prenoms FROM demande_inscription_visiteur WHERE email = $1', [email]);
    }
  })
  .then(result => {
    if (result && result.rows) {
      console.log('Résultat recherche visiteurs:');
      if (result.rows.length > 0) {
        console.log('Trouvé:', result.rows[0]);
      } else {
        console.log('Non trouvé');
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
