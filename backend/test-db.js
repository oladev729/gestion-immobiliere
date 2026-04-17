const { Client } = require('pg');
require('dotenv').config();

async function test() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Test insertion
        const q = 'INSERT INTO utilisateur (nom, prenoms, email, mot_de_passe, type_utilisateur) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const res = await client.query(q, ['Test2', 'User2', 'test_final2@test.com', 'hash', 'proprietaire']);
        console.log('USER SUCCESS:', res.rows[0]);

        const q2 = 'INSERT INTO proprietaire (id_utilisateur, adresse_fiscale) VALUES ($1, $2) RETURNING *';
        const res2 = await client.query(q2, [res.rows[0].id_utilisateur, 'Adresse Test']);
        console.log('PROPRIETAIRE SUCCESS:', res2.rows[0]);

    } catch (err) {
        console.error('ERROR DETECTED:');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('Detail:', err.detail);
        console.error('Hint:', err.hint);
        if (err.where) console.error('Where:', err.where);
    } finally {
        await client.end();
    }
}

test();
