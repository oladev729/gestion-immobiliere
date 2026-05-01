require('dotenv').config();
const http = require('http');

// Test de la messagerie entre propriétaire et locataire
const testMessaging = () => {
    console.log('🔧 Test du système de messagerie');
    console.log('================================');
    
    // Token propriétaire (assaninazifatou@gmail.com - ID 7)
    const ownerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJhc3NhbmluYXppZmF0b3VAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NzM4ODI4NSwiZXhwIjoxNzc3OTkzMDg1fQ.QMc9Aj1m2P33X6_N0bzvm6LHA4diqKfZeZPfPrftnE0';
    
    // Token locataire (agossouroland@gmail.com - ID 2)
    const tenantToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZ29zc291cm9sYW5kQGdtYWlsLmNvbSIsInR5cGUiOiJsb2NhdGFpcmUiLCJpYXQiOjE3Nzcz4ODI4NSwiZXhwIjoxNzc3OTkzMDg1fQ.test'; // À générer
    
    // 1. Test récupération conversations propriétaire
    const testOwnerConversations = () => {
        console.log('\n📨 Test conversations propriétaire...');
        
        const options = {
            hostname: '127.0.0.1',
            port: 5055,
            path: '/api/messages/conversations',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ownerToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`📡 Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const conversations = JSON.parse(data);
                    console.log(`📊 ${conversations.length} conversations trouvées`);
                    
                    if (conversations.length > 0) {
                        console.log('📋 Première conversation:');
                        const conv = conversations[0];
                        console.log(`   - ID: ${conv.id_conversation || conv.id}`);
                        console.log(`   - Bien: ${conv.bien_titre}`);
                        console.log(`   - Expéditeur: ${conv.id_expediteur}`);
                        console.log(`   - Destinataire: ${conv.id_destinataire}`);
                        console.log(`   - Dernier message: ${conv.dernier_message}`);
                        
                        // Test envoi de message
                        testSendMessage(conv);
                    } else {
                        console.log('❌ Aucune conversation trouvée');
                        console.log('🔧 Créons une conversation de test...');
                        createTestConversation();
                    }
                } catch (error) {
                    console.log('❌ Erreur parsing JSON:', error.message);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Erreur requête:', error.message);
        });

        req.end();
    };
    
    // 2. Test envoi de message
    const testSendMessage = (conversation) => {
        console.log('\n📤 Test envoi de message...');
        
        const messageData = {
            id_destinataire: conversation.id_expediteur === 7 ? conversation.id_destinataire : conversation.id_expediteur,
            contenu: 'Message de test du propriétaire - ' + new Date().toLocaleTimeString(),
            id_bien: conversation.id_bien
        };
        
        console.log('📝 Message à envoyer:', messageData);
        
        const options = {
            hostname: '127.0.0.1',
            port: 5055,
            path: '/api/messages/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ownerToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`📡 Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('✅ Message envoyé avec succès:', result.message);
                    console.log('📋 ID message:', result.data?.id);
                    
                    // Test récupération des messages de la conversation
                    testGetMessages(conversation);
                } catch (error) {
                    console.log('❌ Erreur parsing réponse:', error.message);
                    console.log('📄 Réponse brute:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Erreur envoi message:', error.message);
        });

        req.write(JSON.stringify(messageData));
        req.end();
    };
    
    // 3. Test récupération messages
    const testGetMessages = (conversation) => {
        console.log('\n📥 Test récupération messages...');
        
        const otherUserId = conversation.id_expediteur === 7 ? conversation.id_destinataire : conversation.id_expediteur;
        const url = `/api/messages/conversation/${otherUserId}?id_bien=${conversation.id_bien}`;
        
        console.log(`🔍 URL: ${url}`);
        
        const options = {
            hostname: '127.0.0.1',
            port: 5055,
            path: url,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ownerToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`📡 Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const messages = JSON.parse(data);
                    console.log(`📊 ${messages.length} messages récupérés`);
                    
                    messages.forEach((msg, idx) => {
                        console.log(`   ${idx + 1}. [${msg.expediteur_type}] ${msg.contenu} (${new Date(msg.date_envoi).toLocaleTimeString()})`);
                    });
                    
                    console.log('\n✅ Test de messagerie terminé avec succès !');
                } catch (error) {
                    console.log('❌ Erreur parsing messages:', error.message);
                    console.log('📄 Réponse brute:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Erreur récupération messages:', error.message);
        });

        req.end();
    };
    
    // 4. Créer une conversation de test
    const createTestConversation = () => {
        console.log('🔧 Création d\'une conversation de test...');
        
        const messageData = {
            id_destinataire: 2, // ID locataire
            contenu: 'Bonjour, je suis intéressé par votre bien - Message de test',
            id_bien: 5 // Bien 5
        };
        
        const options = {
            hostname: '127.0.0.1',
            port: 5055,
            path: '/api/messages/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ownerToken}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`📡 Status création: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('✅ Conversation de test créée:', result.message);
                    console.log('🔄 Relancez le test pour vérifier les conversations');
                } catch (error) {
                    console.log('❌ Erreur création conversation:', error.message);
                    console.log('📄 Réponse brute:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Erreur création conversation:', error.message);
        });

        req.write(JSON.stringify(messageData));
        req.end();
    };
    
    // Démarrer les tests
    testOwnerConversations();
};

// Exécuter le test
console.log('🚀 Démarrage du test de messagerie...');
testMessaging();
