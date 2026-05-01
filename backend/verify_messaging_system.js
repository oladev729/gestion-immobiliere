require('dotenv').config();
const http = require('http');

// Test complet du système de messagerie
const testMessagingSystem = async () => {
    console.log('🔧 Test complet du système de messagerie');
    console.log('=====================================');
    
    // Token propriétaire (assaninazifatou@gmail.com - ID 7)
    const ownerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJhc3NhbmluYXppZmF0b3VAZ21haWwuY29tIiwidHlwZSI6InByb3ByaWV0YWlyZSIsImlhdCI6MTc3NzM4ODI4NSwiZXhwIjoxNzc3OTkzMDg1fQ.QMc9Aj1m2P33X6_N0bzvm6LHA4diqKfZeZPfPrftnE0';
    
    // Token locataire (ouche@gmail.com - ID 10)
    const tenantToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoib3VjaGVAZ21haWwuY29tIiwidHlwZSI6ImxvY2F0YWlyZSIsImlhdCI6MTc3NzQwMTI2NCwiZXhwIjoxNzc4MDA2MDY0fQ.ZlCRXPPUVqYgaWrjE2xSp1o28k074QeUikyXZ9eNLPk';
    
    // 1. Test API conversations propriétaire
    console.log('\n📨 Test API conversations propriétaire...');
    await testAPI('/api/messages/conversations', ownerToken, 'Propriétaire 7');
    
    // 2. Test API conversations locataire
    console.log('\n📨 Test API conversations locataire...');
    await testAPI('/api/messages/conversations', tenantToken, 'Locataire 10');
    
    // 3. Test envoi message propriétaire → locataire
    console.log('\n📤 Test envoi message propriétaire → locataire...');
    await sendMessage(ownerToken, {
        id_destinataire: 10,
        contenu: 'Test message propriétaire vers locataire - ' + new Date().toLocaleTimeString(),
        id_bien: 5
    });
    
    // 4. Test envoi message locataire → propriétaire
    console.log('\n📤 Test envoi message locataire → propriétaire...');
    await sendMessage(tenantToken, {
        id_destinataire: 7,
        contenu: 'Test message locataire vers propriétaire - ' + new Date().toLocaleTimeString(),
        id_bien: 5
    });
    
    // 5. Test récupération conversation spécifique
    console.log('\n📥 Test récupération conversation propriétaire ↔ locataire...');
    await testAPI('/api/messages/conversation/10?id_bien=5', ownerToken, 'Propriétaire vers Locataire');
    
    console.log('\n📥 Test récupération conversation locataire ↔ propriétaire...');
    await testAPI('/api/messages/conversation/7?id_bien=5', tenantToken, 'Locataire vers Propriétaire');
    
    // 6. Vérifier les messages dans la base de données
    console.log('\n🔍 Vérification finale des messages en base...');
    await checkMessagesInDB();
};

// Test API générique
const testAPI = (endpoint, token, description) => {
    return new Promise((resolve) => {
        console.log(`   📡 ${description}: ${endpoint}`);
        
        const options = {
            hostname: '127.0.0.1',
            port: 5055,
            path: endpoint,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`   📡 Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`   ✅ ${description} - ${result.length || result.data?.length || 0} éléments`);
                    
                    if (result.length > 0) {
                        console.log(`   📋 Premier élément:`, Object.keys(result[0]));
                        if (result[0].id_conversation || result[0].id_message) {
                            console.log(`   🎯 ID trouvé: ${result[0].id_conversation || result[0].id_message}`);
                        }
                    }
                } catch (error) {
                    console.log(`   ❌ Erreur parsing: ${error.message}`);
                    console.log(`   📄 Réponse brute: ${data.substring(0, 200)}...`);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Erreur requête: ${error.message}`);
            resolve();
        });

        req.end();
    });
};

// Envoyer un message
const sendMessage = (token, messageData) => {
    return new Promise((resolve) => {
        console.log(`   📝 Envoi: ${messageData.contenu.substring(0, 50)}...`);
        
        const options = {
            hostname: '127.0.0.1',
            port: 5055,
            path: '/api/messages/send',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`   📡 Status: ${res.statusCode}`);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`   ✅ Message envoyé: ${result.message}`);
                } catch (error) {
                    console.log(`   ❌ Erreur envoi: ${error.message}`);
                    console.log(`   📄 Réponse: ${data}`);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Erreur requête: ${error.message}`);
            resolve();
        });

        req.write(JSON.stringify(messageData));
        req.end();
    });
};

// Vérifier les messages en base
const checkMessagesInDB = async () => {
    const { Pool } = require('pg');
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: 'gestion_immobiliere',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
    });
    
    try {
        const result = await pool.query(`
            SELECT m.*, 
                   u1.email as expediteur_email,
                   u2.email as destinataire_email,
                   b.titre as bien_titre
            FROM messages m
            LEFT JOIN utilisateur u1 ON m.id_expediteur = u1.id_utilisateur
            LEFT JOIN utilisateur u2 ON m.id_destinataire = u2.id_utilisateur
            LEFT JOIN bien b ON m.id_bien = b.id_bien
            WHERE (m.id_expediteur = 7 AND m.id_destinataire = 10) 
               OR (m.id_expediteur = 10 AND m.id_destinataire = 7)
            ORDER BY m.date_envoi DESC
            LIMIT 5
        `);
        
        console.log(`   📊 ${result.rows.length} messages entre propriétaire 7 et locataire 10:`);
        result.rows.forEach((msg, idx) => {
            const direction = msg.id_expediteur === 7 ? '👨‍💼→' : '👤←';
            console.log(`   ${idx + 1}. ${direction} ${msg.contenu.substring(0, 40)}... (${msg.date_envoi})`);
        });
        
    } catch (error) {
        console.log(`   ❌ Erreur BDD: ${error.message}`);
    } finally {
        await pool.end();
    }
};

// Exécuter le test
testMessagingSystem();
