const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // Connect to the default 'postgres' database
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
        database: 'postgres' // default DB to connect to
    });

    try {
        await client.connect();
        console.log('🔌 Connecté à PostgreSQL (base par défaut)...');
        
        // Check if database exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname='gestion_immobiliere'");
        if (res.rowCount === 0) {
            console.log("🔨 Création de la base de données 'gestion_immobiliere'...");
            await client.query("CREATE DATABASE gestion_immobiliere");
            console.log("✅ Base de données créée avec succès !");
        } else {
            console.log("ℹ️ La base de données 'gestion_immobiliere' existe déjà.");
        }
    } catch (err) {
        console.error('❌ Erreur lors de la création de la base de données :', err);
    } finally {
        await client.end();
    }
}

createDatabase();
