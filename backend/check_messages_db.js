require('dotenv').config();
const db = require('./src/config/database');

// Vérifier les messages dans la base de données
const checkMessagesInDB = async () => {
    try {
        console.log('🔍 Vérification des messages dans la base de données...');
        console.log('===========================================');
        
        // 1. Vérifier tous les messages
        const allMessages = await db.query(`
            SELECT m.*, 
                   u1.email as expediteur_email,
                   u2.email as destinataire_email,
                   b.titre as bien_titre
            FROM messages m
            LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur
            LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            ORDER BY m.date_envoi DESC
            LIMIT 10
        `);
        
        console.log(`📊 ${allMessages.rows.length} messages trouvés:`);
        
        allMessages.rows.forEach((msg, idx) => {
            console.log(`\n${idx + 1}. Message ID: ${msg.id}`);
            console.log(`   📤 Expéditeur: ${msg.expediteur_email || 'ID ' + msg.id_expediteur} (ID: ${msg.id_expediteur})`);
            console.log(`   📥 Destinataire: ${msg.destinataire_email || 'ID ' + msg.id_destinataire} (ID: ${msg.id_destinataire})`);
            console.log(`   🏠 Bien: ${msg.bien_titre || 'N/A'} (ID: ${msg.id_bien})`);
            console.log(`   💬 Contenu: ${msg.contenu}`);
            console.log(`   📅 Date: ${msg.date_envoi}`);
            console.log(`   👁️ Lu: ${msg.lu ? 'Oui' : 'Non'}`);
        });
        
        // 2. Vérifier spécifiquement les messages impliquant le propriétaire 7 (assaninazifatou)
        const ownerMessages = await db.query(`
            SELECT m.*, 
                   u1.email as expediteur_email,
                   u2.email as destinataire_email,
                   b.titre as bien_titre
            FROM messages m
            LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur
            LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE m.id_expediteur = 7 OR m.id_destinataire = 7
            ORDER BY m.date_envoi DESC
        `);
        
        console.log(`\n🏠 Messages du propriétaire assaninazifatou (ID 7):`);
        console.log(`📊 ${ownerMessages.rows.length} messages trouvés:`);
        
        ownerMessages.rows.forEach((msg, idx) => {
            const direction = msg.id_expediteur === 7 ? '📤 ENVOYÉ' : '📥 REÇU';
            console.log(`\n${idx + 1}. ${direction} - ID: ${msg.id}`);
            console.log(`   📤 De: ${msg.expediteur_email || 'ID ' + msg.id_expediteur}`);
            console.log(`   📥 À: ${msg.destinataire_email || 'ID ' + msg.id_destinataire}`);
            console.log(`   💬: ${msg.contenu}`);
            console.log(`   🏠: ${msg.bien_titre || 'N/A'}`);
        });
        
        // 3. Vérifier les conversations pour le locataire 2 (agossouroland)
        const tenantConversations = await db.query(`
            SELECT DISTINCT 
                m.id_expediteur,
                m.id_destinataire,
                u1.email as expediteur_email,
                u2.email as destinataire_email,
                b.titre as bien_titre,
                m.id_bien,
                MAX(m.date_envoi) as dernier_message,
                COUNT(*) as nb_messages
            FROM messages m
            LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur
            LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE m.id_expediteur = 2 OR m.id_destinataire = 2
            GROUP BY m.id_expediteur, m.id_destinataire, u1.email, u2.email, b.titre, m.id_bien
            ORDER BY dernier_message DESC
        `);
        
        console.log(`\n👤 Conversations du locataire agossouroland (ID 2):`);
        console.log(`📊 ${tenantConversations.rows.length} conversations trouvées:`);
        
        tenantConversations.rows.forEach((conv, idx) => {
            console.log(`\n${idx + 1}. Conversation:`);
            console.log(`   📤 ${conv.expediteur_email || 'ID ' + conv.id_expediteur} ↔ 📥 ${conv.destinataire_email || 'ID ' + conv.id_destinataire}`);
            console.log(`   🏠 Bien: ${conv.bien_titre || 'N/A'} (ID: ${conv.id_bien})`);
            console.log(`   💬 ${conv.nb_messages} messages`);
            console.log(`   📅 Dernier: ${conv.dernier_message}`);
        });
        
        // 4. Vérifier la structure de la table conversations (si elle existe)
        try {
            const convTable = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'conversations'
                ORDER BY ordinal_position
            `);
            
            if (convTable.rows.length > 0) {
                console.log(`\n📋 Structure de la table conversations:`);
                convTable.rows.forEach(col => {
                    console.log(`   - ${col.column_name}: ${col.data_type}`);
                });
                
                // Vérifier les données dans la table conversations
                const convData = await db.query('SELECT * FROM conversations LIMIT 5');
                console.log(`\n📊 Données dans conversations: ${convData.rows.length} lignes`);
                convData.rows.forEach(row => {
                    console.log(`   ID: ${row.id_conversation}, Propriétaire: ${row.id_proprietaire}, Locataire: ${row.id_locataire}`);
                });
            }
        } catch (error) {
            console.log('\nℹ️  Table conversations non trouvée (normal si utilise les messages directs)');
        }
        
    } catch (error) {
        console.error('❌ Erreur vérification messages:', error.message);
    }
};

checkMessagesInDB();
