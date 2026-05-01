require('dotenv').config();
const db = require('./src/config/database');

// Créer une conversation de test entre propriétaire 7 et locataire 2
const createTestConversation = async () => {
    try {
        console.log('🔧 Création d\'une conversation de test...');
        console.log('=======================================');
        
        // 1. Vérifier que les utilisateurs existent
        const users = await db.query(`
            SELECT id_utilisateur, email, type_utilisateur 
            FROM utilisateur 
            WHERE id_utilisateur IN (7, 2)
        `);
        
        console.log('👤 Utilisateurs trouvés:');
        users.rows.forEach(user => {
            console.log(`   - ${user.email} (ID: ${user.id_utilisateur}, Type: ${user.type_utilisateur})`);
        });
        
        if (users.rows.length < 2) {
            console.log('❌ Utilisaires manquants pour créer la conversation');
            return;
        }
        
        // 2. Trouver un bien commun ou utiliser le bien 5
        const bien = await db.query(`
            SELECT id_bien, titre, id_proprietaire 
            FROM bien 
            WHERE id_bien = 5
        `);
        
        if (bien.rows.length === 0) {
            console.log('❌ Bien 5 non trouvé');
            return;
        }
        
        console.log(`🏠 Bien sélectionné: ${bien.rows[0].titre} (ID: ${bien.rows[0].id_bien})`);
        
        // 3. Créer quelques messages de test
        const messages = [
            {
                id_expediteur: 7, // Propriétaire assaninazifatou
                id_destinataire: 2, // Locataire agossouroland
                contenu: 'Bonjour, je suis le propriétaire du bien. Seriez-vous intéressé ?',
                id_bien: 5
            },
            {
                id_expediteur: 2, // Locataire agossouroland
                id_destinataire: 7, // Propriétaire assaninazifatou
                contenu: 'Bonjour, oui je suis très intéressé par votre bien !',
                id_bien: 5
            },
            {
                id_expediteur: 7, // Propriétaire assaninazifatou
                id_destinataire: 2, // Locataire agossouroland
                contenu: 'Super ! Quand souhaitez-vous visiter le bien ?',
                id_bien: 5
            }
        ];
        
        console.log('\n💬 Création des messages de test...');
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            const result = await db.query(`
                INSERT INTO messages (id_expediteur, id_destinataire, contenu, id_bien, expediteur_type, destinataire_type, date_envoi, lu)
                VALUES ($1, $2, $3, $4, 'utilisateur', 'utilisateur', NOW() - INTERVAL '${(2-i) * 5} minutes', false)
                RETURNING id_message, id_expediteur, id_destinataire, contenu, date_envoi
            `, [msg.id_expediteur, msg.id_destinataire, msg.contenu, msg.id_bien]);
            
            const inserted = result.rows[0];
            console.log(`✅ Message ${i + 1} créé (ID: ${inserted.id_message}): ${inserted.contenu}`);
        }
        
        // 4. Vérifier que les messages sont bien créés
        const verification = await db.query(`
            SELECT m.*, 
                   u1.email as expediteur_email,
                   u2.email as destinataire_email,
                   b.titre as bien_titre
            FROM messages m
            LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur
            LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE (m.id_expediteur = 7 AND m.id_destinataire = 2) 
               OR (m.id_expediteur = 2 AND m.id_destinataire = 7)
            ORDER BY m.date_envoi ASC
        `);
        
        console.log(`\n📊 Conversation créée - ${verification.rows.length} messages:`);
        verification.rows.forEach((msg, idx) => {
            const direction = msg.id_expediteur === 7 ? '👨‍💼 Propriétaire' : '👤 Locataire';
            console.log(`\n${idx + 1}. ${direction}:`);
            console.log(`   📤 De: ${msg.expediteur_email}`);
            console.log(`   📥 À: ${msg.destinataire_email}`);
            console.log(`   💬: ${msg.contenu}`);
            console.log(`   🏠: ${msg.bien_titre}`);
            console.log(`   📅: ${msg.date_envoi}`);
        });
        
        // 5. Tester les routes API
        console.log('\n🌐 Test des routes API...');
        
        // Test conversations pour le propriétaire 7
        const ownerConvs = await db.query(`
            SELECT DISTINCT 
                CASE WHEN m.id_expediteur = 7 THEN m.id_destinataire ELSE m.id_expediteur END as autre_id,
                u.email as autre_email,
                b.titre as bien_titre,
                m.id_bien,
                MAX(m.date_envoi) as dernier_message,
                COUNT(*) as nb_messages
            FROM messages m
            LEFT JOIN utilisateur u ON (CASE WHEN m.id_expediteur = 7 THEN m.id_destinataire ELSE m.id_expediteur END) = u.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE m.id_expediteur = 7 OR m.id_destinataire = 7
            GROUP BY autre_id, u.email, b.titre, m.id_bien
            ORDER BY dernier_message DESC
        `);
        
        console.log(`📱 Conversations propriétaire 7: ${ownerConvs.rows.length}`);
        ownerConvs.rows.forEach(conv => {
            console.log(`   - Avec ${conv.autre_email} (${conv.nb_messages} messages, bien: ${conv.bien_titre})`);
        });
        
        // Test conversations pour le locataire 2
        const tenantConvs = await db.query(`
            SELECT DISTINCT 
                CASE WHEN m.id_expediteur = 2 THEN m.id_destinataire ELSE m.id_expediteur END as autre_id,
                u.email as autre_email,
                b.titre as bien_titre,
                m.id_bien,
                MAX(m.date_envoi) as dernier_message,
                COUNT(*) as nb_messages
            FROM messages m
            LEFT JOIN utilisateur u ON (CASE WHEN m.id_expediteur = 2 THEN m.id_destinataire ELSE m.id_expediteur END) = u.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE m.id_expediteur = 2 OR m.id_destinataire = 2
            GROUP BY autre_id, u.email, b.titre, m.id_bien
            ORDER BY dernier_message DESC
        `);
        
        console.log(`📱 Conversations locataire 2: ${tenantConvs.rows.length}`);
        tenantConvs.rows.forEach(conv => {
            console.log(`   - Avec ${conv.autre_email} (${conv.nb_messages} messages, bien: ${conv.bien_titre})`);
        });
        
        console.log('\n✅ Conversation de test créée avec succès !');
        console.log('🔄 Maintenant testez dans l\'interface:');
        console.log('   1. Connectez-vous en tant que propriétaire (assaninazifatou@gmail.com)');
        console.log('   2. Allez dans la messagerie');
        console.log('   3. Vous devriez voir la conversation avec agossouroland@gmail.com');
        console.log('   4. Connectez-vous en tant que locataire (agossouroland@gmail.com)');
        console.log('   5. Allez dans la messagerie');
        console.log('   6. Vous devriez voir la conversation avec assaninazifatou@gmail.com');
        
    } catch (error) {
        console.error('❌ Erreur création conversation:', error.message);
    }
};

// Exécuter la création
createTestConversation();
