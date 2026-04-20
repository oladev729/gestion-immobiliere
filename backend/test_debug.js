const Message = require('./src/models/Message');
const db = require('./src/config/database');

const email = 'adeori229@gmail.com';

console.log('=== DÉBOGAGE COMPLET POUR ===', email);

// 1. Vérifier si l'email existe dans les deux tables
Promise.all([
  db.query('SELECT id_utilisateur as id, email, nom, prenoms FROM utilisateur WHERE email = $1', [email]),
  db.query('SELECT id_demande as id, email, nom, prenoms FROM demande_inscription_visiteur WHERE email = $1', [email])
])
.then(([userResult, visitorResult]) => {
  console.log('\n1. Recherche dans table utilisateur:');
  if (userResult.rows.length > 0) {
    console.log('   Trouvé dans utilisateur:', userResult.rows[0]);
  } else {
    console.log('   Non trouvé dans utilisateur');
  }
  
  console.log('\n2. Recherche dans table visiteurs:');
  if (visitorResult.rows.length > 0) {
    console.log('   Trouvé dans visiteurs:', visitorResult.rows[0]);
  } else {
    console.log('   Non trouvé dans visiteurs');
  }
  
  // 3. Tester la fonction findByEmail
  console.log('\n3. Test Message.findByEmail():');
  return Message.findByEmail(email);
})
.then(user => {
  console.log('   Résultat findByEmail:', user);
  
  // 4. Simuler la logique du contrôleur
  console.log('\n4. Simulation logique contrôleur:');
  let destinataireId = email;
  
  if (email.includes('@')) {
    console.log('   - Email détecté, recherche utilisateur...');
    let foundUser = user;
    
    if (!foundUser) {
      console.log('   - Pas trouvé dans utilisateur, recherche visiteurs...');
      // Simuler recherche visiteurs...
    } else {
      console.log('   - Utilisateur trouvé, ID:', foundUser.id);
      console.log('   - Type d\'ID (utilisateur vs visiteur):', foundUser.id <= 10 ? 'Probablement id_utilisateur' : 'Probablement id_demande');
    }
    
    if (!foundUser) {
      console.log('   - ERREUR: Utilisateur non trouvé pour cet email');
    } else {
      console.log('   - Succès: DestinataireID =', foundUser.id);
    }
  }
  
  process.exit(0);
})
.catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
