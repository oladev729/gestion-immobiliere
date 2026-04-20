const axios = require('axios');

const testWithAuth = async () => {
  try {
    console.log('=== TEST AVEC AUTHENTIFICATION ===');
    
    // 1. Se connecter pour obtenir un token
    console.log('1. Connexion...');
    const loginResponse = await axios.post('http://127.0.0.1:5055/api/auth/login', {
      email: 'yessoufouzenabou46@gmail.com',
      mot_de_passe: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtenu:', token.substring(0, 20) + '...');
    
    // 2. Envoyer un message avec le token
    console.log('2. Envoi du message...');
    const messageData = {
      id_destinataire: 'adeori229@gmail.com',
      contenu: 'Message test avec authentification',
      id_bien: 1
    };

    const response = await axios.post('http://127.0.0.1:5055/api/messages/send', messageData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('SUCCÈS - Message envoyé:', response.data);
    
  } catch (error) {
    console.error('ERREUR - Détails:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Message:', error.message);
    }
  }
};

testWithAuth();
