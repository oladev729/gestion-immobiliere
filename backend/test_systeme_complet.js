const axios = require('axios');

async function testSystemeComplet() {
    try {
        console.log('=== TEST SYSTÈME COMPLET DE DEMANDES DE VISITE ===\n');
        
        // 1. Connexion propriétaire
        console.log('1. Connexion propriétaire...');
        const loginResponse = await axios.post('http://127.0.0.1:5055/api/auth/login', {
            email: 'test_final@test.com',
            mot_de_passe: '123456'
        });
        
        const tokenProprietaire = loginResponse.data.token;
        console.log('   Propriétaire connecté');
        
        // 2. Créer un bien pour le propriétaire
        console.log('\n2. Création d\'un bien...');
        const bienResponse = await axios.post('http://127.0.0.1:5055/api/biens', {
            titre: 'Appartement Test',
            adresse: '123 Rue Test',
            ville: 'Ville Test',
            type_bien: 'appartement',
            surface: 50,
            nb_chambres: 2,
            loyer_mensuel: 800,
            charges: 100,
            description: 'Bien de test pour demandes'
        }, {
            headers: { 'Authorization': `Bearer ${tokenProprietaire}` }
        });
        
        const id_bien = bienResponse.data.id_bien;
        console.log(`   Bien créé avec ID: ${id_bien}`);
        
        // 3. Créer une demande de visiteur
        console.log('\n3. Création demande visiteur...');
        const demandeVisiteurResponse = await axios.post(`http://127.0.0.1:5055/api/visiteurs/demande-visite/${id_bien}`, {
            nom: 'Jean',
            prenoms: 'Visiteur',
            email: 'jean.visiteur@test.com',
            telephone: '0123456789',
            message: 'Je souhaite visiter cet appartement',
            date_visite: '2026-04-25'
        });
        
        const id_demande_visiteur = demandeVisiteurResponse.data.demande.id_demande;
        console.log(`   Demande visiteur créée avec ID: ${id_demande_visiteur}`);
        
        // 4. Vérifier que la demande apparaît dans la liste du propriétaire
        console.log('\n4. Vérification récupération demandes propriétaire...');
        const demandesResponse = await axios.get('http://127.0.0.1:5055/api/visiteurs/demandes', {
            headers: { 'Authorization': `Bearer ${tokenProprietaire}` }
        });
        
        console.log(`   Demandes récupérées: ${demandesResponse.data.length}`);
        const demandeVisiteurTrouvee = demandesResponse.data.find(d => d.id_demande === id_demande_visiteur);
        
        if (demandeVisiteurTrouvee) {
            console.log('   Demande visiteur trouvée dans la liste du propriétaire');
            console.log(`   Type demandeur: ${demandeVisiteurTrouvee.type_demandeur}`);
            console.log(`   Bien: ${demandeVisiteurTrouvee.bien_titre}`);
        } else {
            console.log('   Demande visiteur NON TROUVÉE dans la liste du propriétaire');
        }
        
        // 5. Tester la messagerie
        console.log('\n5. Test messagerie propriétaire -> visiteur...');
        try {
            const messageResponse = await axios.post('http://127.0.0.1:5055/api/messages/send', {
                id_destinataire: demandeVisiteurTrouvee.email,
                contenu: 'Bonjour, votre demande de visite a été reçue. Quand souhaitez-vous visiter ?',
                id_bien: id_bien
            }, {
                headers: { 'Authorization': `Bearer ${tokenProprietaire}` }
            });
            
            console.log('   Message envoyé avec succès');
        } catch (error) {
            console.log('   Erreur envoi message:', error.response?.data?.message || error.message);
        }
        
        // 6. Tester l'acceptation de la demande
        console.log('\n6. Test acceptation demande...');
        try {
            const acceptResponse = await axios.patch(`http://127.0.0.1:5055/api/demandes-visite/${id_demande_visiteur}/statut`, {
                statut: 'acceptee'
            }, {
                headers: { 'Authorization': `Bearer ${tokenProprietaire}` }
            });
            
            console.log('   Demande acceptée avec succès');
        } catch (error) {
            console.log('   Erreur acceptation demande:', error.response?.data?.message || error.message);
        }
        
        console.log('\n=== TEST TERMINÉ ===');
        
    } catch (error) {
        console.error('Erreur dans le test:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

testSystemeComplet();
