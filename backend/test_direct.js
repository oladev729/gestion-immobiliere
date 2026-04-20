const db = require('./src/config/database');

const testDirect = async () => {
  try {
    console.log('=== TEST DIRECT DE LA LOGIQUE ===');
    
    const email = 'adeori229@gmail.com';
    console.log('Test avec email:', email);
    
    // 1. Vérifier si l'email existe dans les deux tables
    const [userResult, visitorResult] = await Promise.all([
      db.query('SELECT id_utilisateur as id, email, nom, prenoms FROM utilisateur WHERE email = $1', [email]),
      db.query('SELECT id_demande as id, email, nom, prenoms FROM demande_inscription_visiteur WHERE email = $1', [email])
    ]);
    
    console.log('\n1. Résultat table utilisateur:');
    if (userResult.rows.length > 0) {
      console.log('   Trouvé:', userResult.rows[0]);
    } else {
      console.log('   Non trouvé');
    }
    
    console.log('\n2. Résultat table visiteurs:');
    if (visitorResult.rows.length > 0) {
      console.log('   Trouvé:', visitorResult.rows[0]);
    } else {
      console.log('   Non trouvé');
    }
    
    // 3. Simuler la logique du contrôleur
    let user = null;
    if (userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else if (visitorResult.rows.length > 0) {
      user = visitorResult.rows[0];
    }
    
    console.log('\n3. Résultat final:');
    if (user) {
      console.log('   Utilisateur trouvé:', user);
      console.log('   ID à utiliser:', user.id);
      
      // 4. Tester l'insertion du message
      const messageData = {
        id_expediteur: 1, // ID d'un propriétaire
        id_destinataire: user.id,
        contenu: 'Message test direct',
        id_bien: 1
      };
      
      console.log('\n4. Insertion message avec:', messageData);
      
      const insertResult = await db.query(
        'INSERT INTO messages (id_expediteur, id_destinataire, contenu, id_bien, date_envoi, lu) VALUES ($1, $2, $3, $4, NOW(), false) RETURNING id_message, id_expediteur, id_destinataire, contenu, date_envoi, lu, id_bien',
        [messageData.id_expediteur, messageData.id_destinataire, messageData.contenu, messageData.id_bien]
      );
      
      console.log('   Message inséré:', insertResult.rows[0]);
      
    } else {
      console.log('   ERREUR: Utilisateur non trouvé pour cet email');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

testDirect();
