const db = require('./src/config/database');

async function checkUser4Messages() {
    try {
        console.log('--- Messages impliquant Oulfath (User 4) ---');
        const msgs = await db.query(`
            SELECT m.*, b.titre as bien_titre, dv.id_locataire as demande_locataire
            FROM messages m
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            LEFT JOIN demander_visite dv ON m.id_demande = dv.id_demande
            WHERE m.id_expediteur = 4 OR m.id_destinataire = 4
        `);
        console.table(msgs.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkUser4Messages();
