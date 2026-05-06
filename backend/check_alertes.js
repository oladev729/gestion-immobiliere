const db = require('./src/config/database');

db.query('SELECT * FROM alertes ORDER BY date_creation DESC LIMIT 5')
  .then(result => {
    console.log('Dernières alertes créées:');
    result.rows.forEach((alerte, index) => {
      console.log(`Alerte ${index + 1}:`, {
        id: alerte.id_alerte,
        id_proprietaire: alerte.id_proprietaire,
        id_locataire: alerte.id_locataire,
        type_alerte: alerte.type_alerte,
        titre: alerte.titre,
        expediteur_type: alerte.expediteur_type,
        destinataire_type: alerte.destinataire_type,
        date_creation: alerte.date_creation
      });
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
