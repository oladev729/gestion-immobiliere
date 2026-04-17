const axios = require('axios');

async function verify() {
    const baseURL = 'http://127.0.0.1:5055/api';
    
    // 1. Connexion (on suppose qu'un utilisateur existe déjà d'après nos tests précédents)
    let token;
    try {
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'testreg@test.com',
            mot_de_passe: 'password123'
        });
        token = loginRes.data.token;
        console.log('✅ Connecté');
    } catch (e) {
        console.log('⚠️ Erreur connexion (compte testreg@test.com existe-t-1 ?):', e.message);
        return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Récupérer un bien du propriétaire
    try {
        const biensRes = await axios.get(`${baseURL}/biens/mes-biens`, config);
        if (biensRes.data.length === 0) {
            console.log('ℹ️ Aucun bien trouvé pour le test.');
            return;
        }
        const bienId = biensRes.data[0].id_bien;
        console.log(`ℹ️ Test sur le bien ID: ${bienId}`);

        // 3. Tenter un changement manuel vers 'loue' -> Devrait échouer (400)
        try {
            await axios.patch(`${baseURL}/biens/${bienId}/statut`, { statut: 'loue' }, config);
            console.log('❌ ÉCHEC : Le changement manuel vers "loue" a été accepté alors qu\'il devrait être bloqué.');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log('✅ SUCCÈS : Le changement manuel vers "loue" a été correctement bloqué.');
                console.log('Message reçu:', e.response.data.message);
            } else {
                console.log('❓ Autre erreur lors du test de blocage:', e.message);
            }
        }

    } catch (e) {
        console.error('❌ Erreur lors du test:', e.message);
    }
}

verify();
