require('dotenv').config();
const db = require('./src/config/database');

// Vérifier la structure de la base de données
const checkDBStructure = async () => {
    try {
        console.log('🔍 Vérification structure base de données...');
        console.log('=======================================');
        
        // 1. Structure table utilisateur
        const userTable = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'utilisateur'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Table utilisateur:');
        userTable.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // 2. Structure table proprietaire
        const proprietaireTable = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'proprietaire'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Table proprietaire:');
        proprietaireTable.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // 3. Structure table locataire
        const locataireTable = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'locataire'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Table locataire:');
        locataireTable.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // 4. Vérifier les utilisateurs existants
        const users = await db.query(`
            SELECT * FROM utilisateur ORDER BY id_utilisateur
        `);
        
        console.log(`\n👤 Utilisateurs existants (${users.rows.length}):`);
        users.rows.forEach(user => {
            console.log(`   ID ${user.id_utilisateur}: ${user.email} (${user.type_utilisateur})`);
        });
        
        // 5. Chercher agossouroland et assaninazifatou
        const agossouroland = users.rows.find(u => u.email && u.email.includes('agossouroland'));
        const assani = users.rows.find(u => u.email && u.email.includes('assaninazifatou'));
        
        console.log('\n🎯 Utilisateurs cibles:');
        if (agossouroland) {
            console.log(`✅ Agossouroland: ID ${agossouroland.id_utilisateur}, Type: ${agossouroland.type_utilisateur}`);
        } else {
            console.log('❌ Agossouroland non trouvé');
            
            // Chercher des emails similaires
            const similar = users.rows.filter(u => u.email && (u.email.includes('agossou') || u.email.includes('roland')));
            if (similar.length > 0) {
                console.log('🔍 Emails similaires trouvés:');
                similar.forEach(u => console.log(`   - ${u.email} (ID: ${u.id_utilisateur})`));
            }
        }
        
        if (assani) {
            console.log(`✅ Assaninazifatou: ID ${assani.id_utilisateur}, Type: ${assani.type_utilisateur}`);
        } else {
            console.log('❌ Assaninazifatou non trouvé');
            
            // Chercher des emails similaires
            const similar = users.rows.filter(u => u.email && (u.email.includes('assani') || u.email.includes('nazifatou')));
            if (similar.length > 0) {
                console.log('🔍 Emails similaires trouvés:');
                similar.forEach(u => console.log(`   - ${u.email} (ID: ${u.id_utilisateur})`));
            }
        }
        
        // 6. Si on a les deux utilisateurs, créer une conversation
        if (agossouroland && assani) {
            console.log('\n🔧 Création conversation entre les deux utilisateurs...');
            await createConversation(agossouroland.id_utilisateur, assani.id_utilisateur);
        }
        
    } catch (error) {
        console.error('❌ Erreur vérification structure:', error.message);
    }
};

// Créer une conversation
const createConversation = async (user1Id, user2Id) => {
    try {
        console.log(`💬 Création conversation: User ${user1Id} ↔ User ${user2Id}`);
        
        // Supprimer anciens messages
        await db.query(`
            DELETE FROM messages 
            WHERE (id_expediteur = $1 AND id_destinataire = $2) 
               OR (id_expediteur = $2 AND id_destinataire = $1)
        `, [user1Id, user2Id]);
        
        // Créer nouveaux messages
        const messages = [
            {
                id_expediteur: user2Id, // assani
                id_destinataire: user1Id, // agossouroland
                contenu: 'Bonjour, je suis intéressé par votre bien',
                id_bien: 5
            },
            {
                id_expediteur: user1Id, // agossouroland
                id_destinataire: user2Id, // assani
                contenu: 'Bonjour, merci pour votre intérêt !',
                id_bien: 5
            }
        ];
        
        for (const msg of messages) {
            await db.query(`
                INSERT INTO messages (id_expediteur, id_destinataire, contenu, id_bien, expediteur_type, destinataire_type, date_envoi, lu)
                VALUES ($1, $2, $3, $4, 'utilisateur', 'utilisateur', NOW() - INTERVAL '5 minutes', false)
            `, [msg.id_expediteur, msg.id_destinataire, msg.contenu, msg.id_bien]);
        }
        
        console.log('✅ Conversation créée !');
        
    } catch (error) {
        console.error('❌ Erreur création conversation:', error.message);
    }
};

checkDBStructure();
