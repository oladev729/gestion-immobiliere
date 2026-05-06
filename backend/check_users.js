const db = require('./src/config/database');

Promise.all([
  db.query('SELECT id_utilisateur, email FROM utilisateur WHERE id_utilisateur IN (4, 7)'),
  db.query('SELECT id_bien, id_proprietaire, titre FROM bien WHERE id_proprietaire IN (4, 7)')
]).then(([users, biens]) => {
  console.log('Utilisateurs:');
  users.rows.forEach(user => {
    console.log(`  ID ${user.id_utilisateur}: ${user.email}`);
  });
  
  console.log('\nBiens:');
  biens.rows.forEach(bien => {
    console.log(`  Bien ${bien.id_bien}: ${bien.titre} - Propriétaire ID ${bien.id_proprietaire}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
