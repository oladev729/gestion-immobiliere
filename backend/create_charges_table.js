const db = require('./src/config/database');

async function createChargesTable() {
  try {
    console.log('=== CRÉATION DE LA TABLE CHARGES ===');
    
    // Vérifier si la table existe déjà
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'charges'
      )
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ La table charges existe déjà');
      return;
    }
    
    // Créer la table charges
    const createTableQuery = `
      CREATE TABLE charges (
        id_charge SERIAL PRIMARY KEY,
        id_proprietaire INTEGER NOT NULL REFERENCES proprietaire(id_proprietaire),
        id_locataire INTEGER REFERENCES locataire(id_locataire),
        id_bien INTEGER REFERENCES bien(id_bien),
        titre VARCHAR(255) NOT NULL,
        description TEXT,
        montant DECIMAL(10,2) NOT NULL,
        type VARCHAR(50) DEFAULT 'divers',
        date_echeance DATE NOT NULL,
        date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        statut VARCHAR(20) DEFAULT 'en_attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableQuery);
    console.log('✅ Table charges créée avec succès');
    
    // Créer quelques charges de test
    const insertTestQuery = `
      INSERT INTO charges (id_proprietaire, id_locataire, id_bien, titre, description, montant, type, date_echeance, statut)
      VALUES 
        (7, 1, 3, 'Charges communes Janvier', 'Charges de copropriété pour janvier', 150.00, 'copropriete', '2026-01-31', 'en_attente'),
        (7, 2, 5, 'Électricité Décembre', 'Consommation électrique décembre', 85.50, 'energie', '2026-01-15', 'en_attente'),
        (7, 2, 10, 'Eau Décembre', 'Consommation eau décembre', 45.00, 'eau', '2026-01-10', 'payee')
    `;
    
    await db.query(insertTestQuery);
    console.log('✅ Données de test insérées dans la table charges');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table charges:', error);
  } finally {
    await db.end();
  }
}

createChargesTable();
