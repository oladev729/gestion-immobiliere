require('dotenv').config();
const db = require('./src/config/database');

// Vérifier tous les utilisateurs et leurs types
const checkAllUsers = async () => {
    try {
        console.log('👤 Vérification de tous les utilisateurs...');
        console.log('=====================================');
        
        const users = await db.query(`
            SELECT u.id_utilisateur, u.email, u.type_utilisateur,
                   p.nom as proprietaire_nom, p.prenoms as proprietaire_prenoms,
                   l.nom as locataire_nom, l.prenoms as locataire_prenoms
            FROM utilisateur u
            LEFT JOIN proprietaire p ON u.id_utilisateur = p.id_utilisateur
            LEFT JOIN locataire l ON u.id_utilisateur = l.id_utilisateur
            ORDER BY u.id_utilisateur
        `);
        
        console.log(`📊 ${users.rows.length} utilisateurs trouvés:`);
        
        users.rows.forEach(user => {
            const role = user.type_utilisateur;
            const name = role === 'proprietaire' ? 
                `${user.proprietaire_prenoms} ${user.proprietaire_nom}` :
                role === 'locataire' ? 
                `${user.locataire_prenoms} ${user.locataire_nom}` :
                'Inconnu';
                
            console.log(`\n${user.id_utilisateur}. ${user.email}`);
            console.log(`   📋 Rôle: ${role}`);
            console.log(`   👤 Nom: ${name}`);
        });
        
        // Identifier le vrai locataire agossouroland
        const agossouroland = users.rows.find(u => u.email.includes('agossouroland'));
        if (agossouroland) {
            console.log(`\n✅ Agossouroland trouvé: ID ${agossouroland.id_utilisateur}, Type: ${agossouroland.type_utilisateur}`);
        } else {
            console.log('\n❌ Agossouroland non trouvé');
        }
        
        // Identifier le propriétaire assaninazifatou
        const assani = users.rows.find(u => u.email.includes('assaninazifatou'));
        if (assani) {
            console.log(`✅ Assaninazifatou trouvé: ID ${assani.id_utilisateur}, Type: ${assani.type_utilisateur}`);
        } else {
            console.log('❌ Assaninazifatou non trouvé');
        }
        
        // Créer une conversation avec les bons IDs
        if (agossouroland && assani) {
            console.log('\n🔧 Création d\'une conversation avec les bons IDs...');
            await createConversationBetweenUsers(assani.id_utilisateur, agossouroland.id_utilisateur);
        }
        
    } catch (error) {
        console.error('❌ Erreur vérification utilisateurs:', error.message);
    }
};

// Créer une conversation entre deux utilisateurs
const createConversationBetweenUsers = async (proprietaireId, locataireId) => {
    try {
        console.log(`💬 Création conversation: Propriétaire ${proprietaireId} ↔ Locataire ${locataireId}`);
        
        // Supprimer les anciens messages entre ces deux utilisateurs pour éviter les doublons
        await db.query(`
            DELETE FROM messages 
            WHERE (id_expediteur = $1 AND id_destinataire = $2) 
               OR (id_expediteur = $2 AND id_destinataire = $1)
        `, [proprietaireId, locataireId]);
        
        console.log('🧹 Anciens messages supprimés');
        
        // Créer de nouveaux messages
        const messages = [
            {
                id_expediteur: proprietaireId,
                id_destinataire: locataireId,
                contenu: 'Bonjour, je suis le propriétaire. Le bien est toujours disponible ?',
                id_bien: 5
            },
            {
                id_expediteur: locataireId,
                id_destinataire: proprietaireId,
                contenu: 'Bonjour oui, je suis très intéressé par ce bien !',
                id_bien: 5
            },
            {
                id_expediteur: proprietaireId,
                id_destinataire: locataireId,
                contenu: 'Super ! Quand pouvez-vous venir le visiter ?',
                id_bien: 5
            }
        ];
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            const result = await db.query(`
                INSERT INTO messages (id_expediteur, id_destinataire, contenu, id_bien, expediteur_type, destinataire_type, date_envoi, lu)
                VALUES ($1, $2, $3, $4, 'utilisateur', 'utilisateur', NOW() - INTERVAL '${(2-i) * 5} minutes', false)
                RETURNING id_message, id_expediteur, id_destinataire, contenu, date_envoi
            `, [msg.id_expediteur, msg.id_destinataire, msg.contenu, msg.id_bien]);
            
            const inserted = result.rows[0];
            console.log(`✅ Message ${i + 1} créé (ID: ${inserted.id_message}): ${inserted.contenu.substring(0, 50)}...`);
        }
        
        console.log('\n✅ Conversation créée avec succès !');
        console.log('🔄 Testez maintenant dans l\'interface:');
        
    } catch (error) {
        console.error('❌ Erreur création conversation:', error.message);
    }
};

checkAllUsers();
