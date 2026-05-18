require('dotenv').config({path: './.env'});
const db = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function fix() {
    try {
        console.log('🛠️ Creating quittance table if it doesn\'t exist...');
        const sqlPath = path.join(__dirname, 'database', 'create_quittance_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sql);
        console.log('✅ Quittance table successfully created/verified!');

        console.log('🛠️ Fixing database: Linking recent payment to April 2026 rent schedule and marking it paid...');
        
        // 1. Update rent schedule (id_loyer = 1, Avril 2026) to 'paye'
        await db.query(`UPDATE loyermensuel SET statut = 'paye' WHERE id_loyer = 1`);
        console.log('✅ Updated loyermensuel (Avril 2026) to paye');

        // 2. Link payment 19 to id_loyer = 1 and set status to 'valide'
        await db.query(`UPDATE payement SET id_loyer = 1, statut_paiement = 'valide' WHERE id_payment = 19`);
        console.log('✅ Updated payement 19: id_loyer = 1, statut_paiement = valide');

        // 3. Generate a quittance for payment 19
        const checkQuittance = await db.query(`SELECT id_quittance FROM quittance WHERE id_paiement = 19`);
        if (checkQuittance.rows.length === 0) {
            // Get all context info
            const resPaiement = await db.query(`
                SELECT p.id_payment, p.montant, p.numero_transaction, p.date_paiement, p.id_loyer,
                       lm.mois_concerne, lm.id_contact, 
                       c.id_locataire, b.id_proprietaire, c.id_bien,
                       l.id_utilisateur as locataire_id_utilisateur,
                       prop.id_utilisateur as proprietaire_id_utilisateur
                FROM payement p
                LEFT JOIN loyermensuel lm ON p.id_loyer = lm.id_loyer
                LEFT JOIN contact c ON p.id_contact = c.id_contact
                LEFT JOIN locataire l ON c.id_locataire = l.id_locataire
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                LEFT JOIN proprietaire prop ON b.id_proprietaire = prop.id_proprietaire
                WHERE p.id_payment = 19
            `);
            if (resPaiement.rows.length > 0) {
                const p = resPaiement.rows[0];
                await db.query(`
                    INSERT INTO quittance (
                        id_paiement, id_locataire, id_proprietaire, id_bien,
                        type_quittance, periode, montant, date_paiement, reference_paiement
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                    p.id_payment, p.locataire_id_utilisateur, p.proprietaire_id_utilisateur, p.id_bien,
                    'loyer', p.mois_concerne, p.montant, p.date_paiement || new Date(), p.numero_transaction
                ]);
                console.log('✅ Auto-generated quittance for payment 19');
            }
        }

        console.log('🎉 Fix completed successfully!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error during fix:', e);
        process.exit(1);
    }
}

fix();
