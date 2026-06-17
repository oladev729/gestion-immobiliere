const db = require('./src/config/database');

async function checkLoyerMensuel() {
    try {
        console.log('🔍 Vérification des échéances de loyer mensuel...');
        
        // Check the loyermensuel table structure
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'loyermensuel'
            )
        `);
        
        console.log('Table loyermensuel existe:', tableExists.rows[0].exists);
        
        if (!tableExists.rows[0].exists) {
            console.log('❌ La table loyermensuel n\'existe pas');
            process.exit(1);
        }
        
        // Check contract CT-2026-0002
        const contractResult = await db.query(`
            SELECT c.*, b.titre as bien_titre
            FROM contact c
            JOIN bien b ON c.id_bien = b.id_bien
            WHERE c.numero_contrat = 'CT-2026-0002'
        `);
        
        if (contractResult.rows.length === 0) {
            console.log('❌ Contrat CT-2026-0002 non trouvé');
        } else {
            const contract = contractResult.rows[0];
            console.log('✅ Contrat trouvé:', {
                id_contact: contract.id_contact,
                numero_contrat: contract.numero_contrat,
                bien_titre: contract.bien_titre,
                statut_contrat: contract.statut_contrat,
                date_debut: contract.date_debut,
                date_fin: contract.date_fin
            });
            
            // Check due dates for this contract
            const loyerResult = await db.query(`
                SELECT * FROM loyermensuel 
                WHERE id_contact = $1 
                ORDER BY date_echeance DESC
            `, [contract.id_contact]);
            
            console.log(`\n📊 Échéances pour ce contrat: ${loyerResult.rows.length}`);
            loyerResult.rows.forEach((l, i) => {
                console.log(`  ${i+1}. Date: ${l.date_echeance}, Montant: ${l.montant}, Statut: ${l.statut}`);
            });
        }
        
        // Check all due dates in the table
        const allLoyerResult = await db.query('SELECT * FROM loyermensuel ORDER BY date_echeance DESC LIMIT 10');
        console.log(`\n📊 Total échéances dans la table: ${allLoyerResult.rows.length} (affichage des 10 dernières)`);
        allLoyerResult.rows.forEach((l, i) => {
            console.log(`  ${i+1}. Contact ID: ${l.id_contact}, Date: ${l.date_echeance}, Montant: ${l.montant}, Statut: ${l.statut}`);
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }
}

checkLoyerMensuel();
