 // test-utilisateur.js
const Utilisateur = require('./src/models/Utilisateur');

async function test() {
    try {
        console.log('🚀 Début du test du modèle Utilisateur...\n');

        // 1. Créer un utilisateur
        console.log('📝 Création d\'un utilisateur...');
        const newUser = await Utilisateur.create({
            nom: 'Test',
            prenoms: 'User',
            email: 'test@email.com',
            telephone: '771234567',
            mot_de_passe: 'password123',
            type_utilisateur: 'locataire'
        });
        console.log('✅ Utilisateur créé:', newUser, '\n');

        // 2. Trouver par email
        console.log('🔍 Recherche par email...');
        const found = await Utilisateur.findByEmail('test@email.com');
        console.log('✅ Utilisateur trouvé:', found, '\n');

        // 3. Trouver par ID
        console.log('🔍 Recherche par ID...');
        const foundById = await Utilisateur.findById(newUser.id_utilisateur);
        console.log('✅ Utilisateur trouvé par ID:', foundById, '\n');

        // 4. Vérifier mot de passe (correct)
        console.log('🔐 Vérification mot de passe correct...');
        const validCorrect = await Utilisateur.verifierMotDePasse('test@email.com', 'password123');
        console.log('✅ Mot de passe correct:', validCorrect ? 'Valide' : 'Invalide', '\n');

        // 5. Vérifier mot de passe (incorrect)
        console.log('🔐 Vérification mot de passe incorrect...');
        const validIncorrect = await Utilisateur.verifierMotDePasse('test@email.com', 'wrongpassword');
        console.log('✅ Mot de passe incorrect:', validIncorrect ? 'Valide' : 'Invalide (normal)', '\n');

        // 6. Mettre à jour l'utilisateur
        console.log('✏️ Mise à jour de l\'utilisateur...');
        const updated = await Utilisateur.update(newUser.id_utilisateur, {
            telephone: '778889999',
            prenoms: 'User Updated'
        });
        console.log('✅ Utilisateur mis à jour:', updated, '\n');

        // 7. Désactiver l'utilisateur
        console.log('⛔ Désactivation de l\'utilisateur...');
        const desactive = await Utilisateur.desactiver(newUser.id_utilisateur);
        console.log('✅ Utilisateur désactivé:', desactive, '\n');

        console.log('🎉 Tous les tests ont réussi !');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

test();