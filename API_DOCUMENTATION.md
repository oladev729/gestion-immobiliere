# API Documentation - Gestion Immobilière

## INFORMATIONS GÉNÉRALES

| Information | Détail |
|------------|--------|
| **Base URL** | `http://localhost:5000/api` |
| **Format** | JSON |
| **Authentification** | Bearer Token (JWT) - expire après 24h |

**Headers pour routes protégées :**
```json
{
    "Authorization": "Bearer VOTRE_TOKEN_ICI",
    "Content-Type": "application/json"
}

ROUTES D'AUTHENTIFICATION
1. INSCRIPTION
Crée un nouveau compte utilisateur.

Endpoint : POST /auth/register

Exemple Propriétaire :

json
{
    "nom": "yessoufou",
    "prenoms": "Zenabou",
    "email": "yessoufouzenabou46@gmail.com",
    "telephone": "0158868731",
    "mot_de_passe": "123456",
    "type_utilisateur": "proprietaire",
    "adresse_fiscale": "Dakar, Sénégal"
}
Réponse :

json
{
    "message": "Inscription réussie",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id_utilisateur": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "type_utilisateur": "proprietaire"
    }
}
Exemple Locataire :

json
{
    "nom": "agossou",
    "prenoms": "Roland",
    "email": "agossouroland@gmail.com", 
    "telephone": "0146121212",
    "mot_de_passe": "agossou12",  
    "type_utilisateur": "locataire"
}
2. CONNEXION
Connecte un utilisateur existant.

Endpoint : POST /auth/login

Exemple Propriétaire :

json
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
Réponse :

json
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "telephone": "0158868731",
        "type": "proprietaire",
        "roleInfo": {
            "id_proprietaire": 4
        },
        "derniere_connexion": "2026-03-06T22:34:52.791Z"
    }
}
3. DOUBLE COMPTE
Permet à un utilisateur d'avoir deux rôles avec le même email.

Endpoint : POST /auth/login

Première tentative (sans confirmation) :

json
{
    "email": "oulfathishola@gmail.com",
    "mot_de_passe": "oulfath@12",
    "type_souhaite": "proprietaire"
}
Réponse (demande de confirmation) :

json
{
    "message": "Vous êtes déjà inscrit en tant que locataire. Voulez-vous vraiment vous connecter en tant que proprietaire ?",
    "confirmation_requise": true,
    "type_actuel": "locataire",
    "type_demande": "proprietaire"
}
Seconde tentative (avec confirmation) :

json
{
    "email": "oulfathishola@gmail.com",
    "mot_de_passe": "oulfath@12",
    "type_souhaite": "proprietaire",
    "confirmation": true
}
4. PROFIL UTILISATEUR
Obtenir les informations de l'utilisateur connecté.

Endpoint : GET /auth/profile

Headers requis :

json
{
    "Authorization": "Bearer VOTRE_TOKEN_ICI"
}
Réponse :

json
{
    "user": {
        "id_utilisateur": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "telephone": "0158868731",
        "type_utilisateur": "proprietaire",
        "statut": "actif"
    }
}
5. INVITATION LOCATAIRE
Permet d'inviter quelqu'un à créer un compte.

Endpoint : POST /auth/inviter-locataire

Headers requis :

json
{
    "Authorization": "Bearer VOTRE_TOKEN_ICI",
    "Content-Type": "application/json"
}
Body :

json
{
    "email": "agossouroland@gmail.com",
    "nom": "agossou",
    "prenoms": "Roland",
    "type_souhaite": "proprietaire"
}
Réponse :

json
{
    "message": "Invitation envoyée avec succès",
    "token_dev": "eyJhbGciOiJIUzI1NiIs...",
    "type_invitation": "proprietaire",
    "note": "Double compte en tant que proprietaire."
}
6. CONFIRMER INVITATION
Confirme une invitation et crée le compte.

Endpoint : POST /auth/confirmer-invitation

Body :

json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "mot_de_passe": "agossou12",
    "telephone": "0146121212"
}
Réponse (double compte créé) :

json
{
    "message": "✅ Double compte créé ! Vous avez maintenant deux comptes (locataire et proprietaire) avec le même email.",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id_utilisateur": 16,
        "nom": "agossou",
        "prenoms": "Roland",
        "email": "agossouroland@gmail.com",
        "type_utilisateur": "proprietaire"
    },
    "double_compte": true
}
7. MOT DE PASSE OUBLIÉ
Demander un lien de réinitialisation de mot de passe.

Endpoint : POST /auth/forgot-password

Body :

json
{
    "email": "yessoufouzenabou46@gmail.com"
}
Réponse :

json
{
    "message": "Email de réinitialisation envoyé",
    "reset_token_dev": "d7b32508919dbd39151fe8ccbce67....."
}
8. RÉINITIALISER MOT DE PASSE
Changer le mot de passe avec le token reçu.

Endpoint : POST /auth/reset-password

Body :

json
{
    "token": "d7b32508919dbd39151fe8ccbce67e......",
    "nouveau_mot_de_passe": "ola"
}
Réponse :

json
{
    "message": "Mot de passe réinitialisé avec succès"
}
👥 COMPTES DE TEST DISPONIBLES
ID	Nom	Email	Type	Mot de passe
15	yessoufou Zenabou	yessoufouzenabou46@gmail.com	proprietaire	123456
5	agossou Roland	agossouroland@gmail.com	locataire	agossou12
13	Oulfath Ishola	oulfathishola@gmail.com	locataire	oulfath@12
16	Oulfath Ishola	oulfathishola@gmail.com	proprietaire	oulfath@12
📊 CODES D'ERREUR HTTP
Code	Signification
200	Succès
201	Créé avec succès
400	Requête invalide (données manquantes)
401	Non authentifié (token manquant/invalide)
403	Accès interdit (rôle insuffisant)
404	Ressource non trouvée
409	Conflit (double compte, email existant)
500	Erreur serveur
NOTES IMPORTANTES
Les tokens expirent après 24h. Si un token ne fonctionne plus, refaites un login.

Pour les routes protégées, toujours inclure le header Authorization: Bearer VOTRE_TOKEN

Les mots de passe des comptes de test sont pour développement uniquement

🏠 CRÉATION DE BIENS
Connexion en tant que proprietaire
text
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
Réponse

json
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6....",
    "user": {
        "id": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "telephone": "0158868731",
        "type": "proprietaire",
        "roleInfo": {
            "id_proprietaire": 4
        },
        "derniere_connexion": "2026-03-11T14:01:34.944Z"
    }
}
Créer un bien (Appartement)
text
POST http://localhost:5000/api/biens
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
Body

json
{
    "titre": "Bel Appartement F3 au centre-ville",
    "description": "Appartement lumineux avec vue dégagée, proche commodités",
    "type_bien": "appartement",
    "charge": 50000,
    "loyer_mensuel": 200000,
    "adresse": "Rue 10, Médina",
    "ville": "Dakar",
    "code_postal": "BP 1234",
    "superficie": 85.5,
    "nombre_pieces": 3,
    "nombre_chambres": 2,
    "meuble": true
}
Réponse

json
{
    "message": "Bien créé avec succès",
    "bien": {
        "id_bien": 2,
        "id_proprietaire": 4,
        "titre": "Bel Appartement F3 au centre-ville",
        "description": "Appartement lumineux avec vue dégagée, proche commodités",
        "type_bien": "appartement",
        "charge": "50000.00",
        "statut": "disponible",
        "loyer_mensuel": "200000.00",
        "adresse": "Rue 10, Médina",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:03:18.039Z",
        "code_postal": "BP 1234",
        "superficie": 85.5,
        "nombre_pieces": 3,
        "nombre_chambres": 2,
        "meuble": true
    }
}
Créer un bien (Maison)
text
POST http://localhost:5000/api/biens
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
Body

json
{
    "titre": "Maison avec jardin",
    "description": "Maison de 4 pièces avec grand jardin",
    "type_bien": "maison",
    "loyer_mensuel": 350000,
    "adresse": "Route de Ouakam",
    "ville": "Dakar",
    "superficie": 150,
    "nombre_pieces": 4,
    "nombre_chambres": 3
}
Réponse

json
{
    "message": "Bien créé avec succès",
    "bien": {
        "id_bien": 3,
        "id_proprietaire": 4,
        "titre": "Maison avec jardin",
        "description": "Maison de 4 pièces avec grand jardin",
        "type_bien": "maison",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "350000.00",
        "adresse": "Route de Ouakam",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:09:46.383Z",
        "code_postal": null,
        "superficie": 150,
        "nombre_pieces": 4,
        "nombre_chambres": 3,
        "meuble": false
    }
}
Lister mes biens
text
GET http://localhost:5000/api/biens/mes-biens
Headers:
    Authorization: Bearer TON_TOKEN
Réponse

json
[
    {
        "id_bien": 3,
        "id_proprietaire": 4,
        "titre": "Maison avec jardin",
        "description": "Maison de 4 pièces avec grand jardin",
        "type_bien": "maison",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "350000.00",
        "adresse": "Route de Ouakam",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:09:46.383Z",
        "code_postal": null,
        "superficie": 150,
        "nombre_pieces": 4,
        "nombre_chambres": 3,
        "meuble": false,
        "photos": []
    },
    {
        "id_bien": 2,
        "id_proprietaire": 4,
        "titre": "Bel Appartement F3 au centre-ville",
        "description": "Appartement lumineux avec vue dégagée, proche commodités",
        "type_bien": "appartement",
        "charge": "50000.00",
        "statut": "disponible",
        "loyer_mensuel": "200000.00",
        "adresse": "Rue 10, Médina",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:03:18.039Z",
        "code_postal": "BP 1234",
        "superficie": 85.5,
        "nombre_pieces": 3,
        "nombre_chambres": 2,
        "meuble": true,
        "photos": []
    }
]
Voir un bien spécifique
text
GET http://localhost:5000/api/biens/1
Modifier un bien
text
PUT http://localhost:5000/api/biens/2
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
Body

json
{
    "loyer_mensuel": 210000,
    "description": "Appartement rénové avec clim",
    "meuble": true
}
Réponse

json
{
    "message": "Bien mis à jour avec succès",
    "bien": {
        "id_bien": 2,
        "id_proprietaire": 4,
        "titre": "Bel Appartement F3 au centre-ville",
        "description": "Appartement rénové avec clim",
        "type_bien": "appartement",
        "charge": "50000.00",
        "statut": "disponible",
        "loyer_mensuel": "210000.00",
        "adresse": "Rue 10, Médina",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:03:18.039Z",
        "code_postal": "BP 1234",
        "superficie": 85.5,
        "nombre_pieces": 3,
        "nombre_chambres": 2,
        "meuble": true
    }
}
Changer le statut d'un bien
text
PATCH http://localhost:5000/api/biens/2/statut
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
Body

json
{
    "statut": "loue"
}
Réponse

json
{
    "message": "Statut mis à jour avec succès",
    "bien": {
        "id_bien": 2,
        "id_proprietaire": 4,
        "titre": "Bel Appartement F3 au centre-ville",
        "description": "Appartement rénové avec clim",
        "type_bien": "appartement",
        "charge": "50000.00",
        "statut": "loue",
        "loyer_mensuel": "210000.00",
        "adresse": "Rue 10, Médina",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:03:18.039Z",
        "code_postal": "BP 1234",
        "superficie": 85.5,
        "nombre_pieces": 3,
        "nombre_chambres": 2,
        "meuble": true
    }
}
Voir les biens disponibles
text
GET http://localhost:5000/api/biens/disponibles
Réponse

json
[
    {
        "id_bien": 3,
        "id_proprietaire": 4,
        "titre": "Maison avec jardin",
        "description": "Maison de 4 pièces avec grand jardin",
        "type_bien": "maison",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "350000.00",
        "adresse": "Route de Ouakam",
        "ville": "Dakar",
        "date_creation": "2026-03-11T14:09:46.383Z",
        "code_postal": null,
        "superficie": 150,
        "nombre_pieces": 4,
        "nombre_chambres": 3,
        "meuble": false,
        "proprietaire_nom": "yessoufou",
        "proprietaire_prenoms": "Zenabou",
        "proprietaire_telephone": "0158868731",
        "photo_principale": null
    }
]
Biens disponibles avec filtres
text
GET http://localhost:5000/api/biens/disponibles?ville=Dakar&type_bien=appartement&prix_max=250000
Rechercher des biens
text
GET http://localhost:5000/api/biens/search?q=appartement
Statistiques des biens
text
GET http://localhost:5000/api/biens/stats
Headers:
    Authorization: Bearer TON_TOKEN
Réponse

json
[
    {
        "statut": "disponible",
        "nombre": "1"
    },
    {
        "statut": "loue",
        "nombre": "1"
    }
]
Supprimer un bien
text
DELETE http://localhost:5000/api/biens/3
Headers:
    Authorization: Bearer TON_TOKEN
Réponse

json
{
    "message": "Bien supprimé avec succès"
}
📄 CRÉATION DE CONTRATS
Connexion en tant que proprietaire
text
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
Réponse

json
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6....",
    "user": {
        "id": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "telephone": "0158868731",
        "type": "proprietaire",
        "roleInfo": {
            "id_proprietaire": 4
        },
        "derniere_connexion": "2026-03-12T10:15:05.280Z"
    }
}
Vérifier les biens disponibles
text
GET http://localhost:5000/api/biens/disponibles
Réponse

json
[
    {
        "id_bien": 6,
        "id_proprietaire": 4,
        "titre": "New appartement F2 au centre ville",
        "description": "Appartement avec clim",
        "type_bien": "appartement",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "150000.00",
        "adresse": "Rue 345",
        "ville": "Dakar",
        "date_creation": "2026-03-12T11:42:08.434Z",
        "code_postal": null,
        "superficie": 80,
        "nombre_pieces": 3,
        "nombre_chambres": 2,
        "meuble": false,
        "proprietaire_nom": "yessoufou",
        "proprietaire_prenoms": "Zenabou",
        "proprietaire_telephone": "0158868731",
        "photo_principale": null
    }
]
Note : L'ID du bien à louer est id_bien = 6

Récupérer l'ID d'un locataire
text
id_locataire = 9 (correspond à agossouroland@gmail.com)
Créer un contrat
text
POST http://localhost:5000/api/contrats
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
Body

json
{
    "id_locataire": 9,
    "id_bien": 6,
    "date_debut": "2026-04-01",
    "date_fin": "2027-03-31",
    "loyer_mensuel": 150000,
    "charge": 30000,
    "nb_mois_depot_guarantie": 2,
    "montant_depot_guarantie_attendu": 300000,
    "date_signature": "2026-03-15"
}
Réponse

json
{
    "message": "Contrat créé avec succès",
    "contrat": {
        "id_contact": 5,
        "numero_contrat": "CT-2026-0004",
        "id_locataire": 9,
        "id_bien": 6,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T17:20:41.918Z"
    }
}
Vérifier que le bien est passé en "loué"
text
GET http://localhost:5000/api/biens/6
Réponse

json
{
    "id_bien": 6,
    "id_proprietaire": 4,
    "titre": "New appartement F2 au centre ville",
    "description": "Appartement avec clim",
    "type_bien": "appartement",
    "charge": "0.00",
    "statut": "loue",
    "loyer_mensuel": "150000.00",
    "adresse": "Rue 345",
    "ville": "Dakar",
    "date_creation": "2026-03-12T11:42:08.434Z",
    "code_postal": null,
    "superficie": 80,
    "nombre_pieces": 3,
    "nombre_chambres": 2,
    "meuble": false,
    "proprietaire_nom": "yessoufou",
    "proprietaire_prenoms": "Zenabou",
    "proprietaire_email": "yessoufouzenabou46@gmail.com",
    "proprietaire_telephone": "0158868731",
    "photos": []
}
Lister mes contrats (propriétaire)
text
GET http://localhost:5000/api/contrats/mes-contrats
Headers:
    Authorization: Bearer TON_TOKEN
Réponse

json
[
    {
        "id_contact": 5,
        "numero_contrat": "CT-2026-0004",
        "id_locataire": 9,
        "id_bien": 6,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T17:20:41.918Z",
        "bien_titre": "New appartement F2 au centre ville",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    },
    {
        "id_contact": 4,
        "numero_contrat": "CT-2026-0003",
        "id_locataire": 9,
        "id_bien": 9,
        "date_debut": "2026-04-30T23:00:00.000Z",
        "date_fin": "2027-07-30T23:00:00.000Z",
        "loyer_mensuel": "250000.00",
        "charge": "50000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "500000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-04-14T23:00:00.000Z",
        "date_creation": "2026-03-12T13:23:28.135Z",
        "bien_titre": "Maison de ville rénovée",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    },
    {
        "id_contact": 3,
        "numero_contrat": "CT-2026-0002",
        "id_locataire": 8,
        "id_bien": 10,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T13:14:29.070Z",
        "bien_titre": "Studio mublé centre-ville",
        "locataire_nom": "Oulfath",
        "locataire_prenoms": "Ishola"
    },
    {
        "id_contact": 2,
        "numero_contrat": "CT-2026-0001",
        "id_locataire": 9,
        "id_bien": 5,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T11:20:10.748Z",
        "bien_titre": "Appartement Test Disponible",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    }
]
Voir un contrat spécifique
text
GET http://localhost:5000/api/contrats/1
Headers: Authorization: Bearer TON_TOKEN
Réponse

json
{
    "id_contact": 4,
    "numero_contrat": "CT-2026-0003",
    "id_locataire": 9,
    "id_bien": 9,
    "date_debut": "2026-04-30T23:00:00.000Z",
    "date_fin": "2027-07-30T23:00:00.000Z",
    "loyer_mensuel": "250000.00",
    "charge": "50000.00",
    "nb_mois_depot_guarantie": 2,
    "montant_depot_guarantie_attendu": "500000.00",
    "statut_contrat": "actif",
    "date_signature": "2026-04-14T23:00:00.000Z",
    "date_creation": "2026-03-12T13:23:28.135Z",
    "id_proprietaire": 4,
    "bien_titre": "Maison de ville rénovée",
    "bien_adresse": "12 Av.Steinmetz,Missèbo",
    "bien_ville": "Cotonou",
    "locataire_nom": "agossou",
    "locataire_prenoms": "Roland",
    "locataire_email": "agossouroland@gmail.com",
    "locataire_telephone": "0146121212"
}
Voir les contrats actifs
text
GET http://localhost:5000/api/contrats/actifs
Headers: Authorization: Bearer TON_TOKEN
Réponse

json
[
    {
        "id_contact": 5,
        "numero_contrat": "CT-2026-0004",
        "id_locataire": 9,
        "id_bien": 6,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T17:20:41.918Z",
        "bien_titre": "New appartement F2 au centre ville",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    },
    {
        "id_contact": 4,
        "numero_contrat": "CT-2026-0003",
        "id_locataire": 9,
        "id_bien": 9,
        "date_debut": "2026-04-30T23:00:00.000Z",
        "date_fin": "2027-07-30T23:00:00.000Z",
        "loyer_mensuel": "250000.00",
        "charge": "50000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "500000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-04-14T23:00:00.000Z",
        "date_creation": "2026-03-12T13:23:28.135Z",
        "bien_titre": "Maison de ville rénovée",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    },
    {
        "id_contact": 3,
        "numero_contrat": "CT-2026-0002",
        "id_locataire": 8,
        "id_bien": 10,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T13:14:29.070Z",
        "bien_titre": "Studio mublé centre-ville",
        "locataire_nom": "Oulfath",
        "locataire_prenoms": "Ishola"
    },
    {
        "id_contact": 2,
        "numero_contrat": "CT-2026-0001",
        "id_locataire": 9,
        "id_bien": 5,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-12T11:20:10.748Z",
        "bien_titre": "Appartement Test Disponible",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    }
]
Voir les contrats expirant bientôt
text
GET http://localhost:5000/api/contrats/expirants?jours=60
Headers: Authorization: Bearer TON_TOKEN
Modifier un contrat
text
PUT http://localhost:5000/api/contrats/4
Headers: Authorization: Bearer TON_TOKEN
Content-Type: application/json
Body

json
{
    "loyer_mensuel": 230000,
    "charge": 35000
}
Réponse

json
{
    "message": "Contrat mis à jour avec succès",
    "contrat": {
        "id_contact": 4,
        "numero_contrat": "CT-2026-0003",
        "id_locataire": 9,
        "id_bien": 9,
        "date_debut": "2026-04-30T23:00:00.000Z",
        "date_fin": "2027-07-30T23:00:00.000Z",
        "loyer_mensuel": "230000.00",
        "charge": "35000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "500000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-04-14T23:00:00.000Z",
        "date_creation": "2026-03-12T13:23:28.135Z"
    }
}
Terminer un contrat
text
PATCH http://localhost:5000/api/contrats/4/terminer
Headers: Authorization: Bearer TON_TOKEN
Réponse

json
{
    "message": "Contrat terminé avec succès",
    "contrat": {
        "id_contact": 4,
        "numero_contrat": "CT-2026-0003",
        "id_locataire": 9,
        "id_bien": 9,
        "date_debut": "2026-04-30T23:00:00.000Z",
        "date_fin": "2027-07-30T23:00:00.000Z",
        "loyer_mensuel": "230000.00",
        "charge": "35000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "500000.00",
        "statut_contrat": "termine",
        "date_signature": "2026-04-14T23:00:00.000Z",
        "date_creation": "2026-03-12T13:23:28.135Z"
    }
}

//Tests des paiements
 **Connectez-vous en tant que proprietaire
 POST http://localhost:5000/api/auth/login
Content-Type: application/json

**Body**
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
**Réponse**
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5c....",//Votre token à copiez vous aurez besoin
    "user": {
        "id": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "telephone": "0158868731",
        "type": "proprietaire",
        "roleInfo": {
            "id_proprietaire": 4
        },
        "derniere_connexion": "2026-03-14T12:49:10.293Z"
    }
}

//Vérifier les biens disponibles
GET http://localhost:5000/api/biens/disponibles
**Réponse**
[
    {
        "id_bien": 9,
        "id_proprietaire": 4,
        "titre": "Maison de ville rénovée",
        "description": "Immeuble 2 niveaux,120m,séjour avec cour intérieure,2 chambres...",
        "type_bien": "maison",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "220000.00",
        "adresse": "12 Av.Steinmetz,Missèbo",
        "ville": "Cotonou",
        "date_creation": "2026-03-12T12:24:30.003Z",
        "code_postal": null,
        "superficie": 120,
        "nombre_pieces": 4,
        "nombre_chambres": 2,
        "meuble": false,
        "proprietaire_nom": "yessoufou",
        "proprietaire_prenoms": "Zenabou",
        "proprietaire_telephone": "0158868731",
        "photo_principale": null
    }
]
//choisis un bien (EX: 9)
//Récupere l'id d'un locataire EX=9 
//Créer un contrat

POST http://localhost:5000/api/contrats
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**

{
    "id_locataire": 9,
    "id_bien": 9,
    "date_debut": "2026-04-01",
    "date_fin": "2027-03-31",
    "loyer_mensuel": 150000,
    "charge": 30000,
    "nb_mois_depot_guarantie": 2,
    "montant_depot_guarantie_attendu": 300000,
    "date_signature": "2026-03-15"
}
**Réponse**
{
    "message": "Contrat créé avec succès",
    "contrat": {
        "id_contact": 6,
        "numero_contrat": "CT-2026-0005",
        "id_locataire": 9,
        "id_bien": 9,
        "date_debut": "2026-03-31T23:00:00.000Z",
        "date_fin": "2027-03-30T23:00:00.000Z",
        "loyer_mensuel": "150000.00",
        "charge": "30000.00",
        "nb_mois_depot_guarantie": 2,
        "montant_depot_guarantie_attendu": "300000.00",
        "statut_contrat": "actif",
        "date_signature": "2026-03-14T23:00:00.000Z",
        "date_creation": "2026-03-14T13:07:15.577Z"
    }
}
//Note l'id_contrat Ex=6
//Génerer les échéances du contrat
POST http://localhost:5000/api/paiements/contrat/6/echeances
Headers:
    Authorization: Bearer TON_TOKEN
//Remplace le 6 par id_contrat
**Réponse**
{
    "message": "Échéances générées avec succès",
    "loyers": [
        {
            "id_loyer": 4,
            "id_contact": 6,
            "mois_concerne": "2026-03",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-04-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 5,
            "id_contact": 6,
            "mois_concerne": "2026-04",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-05-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 6,
            "id_contact": 6,
            "mois_concerne": "2026-05",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-06-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 7,
            "id_contact": 6,
            "mois_concerne": "2026-06",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-07-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 8,
            "id_contact": 6,
            "mois_concerne": "2026-07",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-08-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 9,
            "id_contact": 6,
            "mois_concerne": "2026-08",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-09-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 10,
            "id_contact": 6,
            "mois_concerne": "2026-09",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-10-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 11,
            "id_contact": 6,
            "mois_concerne": "2026-10",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-11-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 12,
            "id_contact": 6,
            "mois_concerne": "2026-11",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2026-12-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 13,
            "id_contact": 6,
            "mois_concerne": "2026-12",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2027-01-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 14,
            "id_contact": 6,
            "mois_concerne": "2027-01",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2027-02-04T23:00:00.000Z",
            "statut": "en_attente"
        },
        {
            "id_loyer": 15,
            "id_contact": 6,
            "mois_concerne": "2027-02",
            "montant_loyer": "150000.00",
            "montant_charge": "30000.00",
            "date_echeance": "2027-03-04T23:00:00.000Z",
            "statut": "en_attente"
        }
    ]
}
//Payer un depot de garantie
POST http://localhost:5000/api/paiements/depot
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**
{
    "id_contact": 6,
    "id_mode_payment": 1,
    "montant": 300000,
    "mode_versement": "virement"
}
**Réponse**
{
    "message": "Dépôt de garantie effectué avec succès",
    "depot": {
        "id_depot": 2,
        "id_contact": 6,
        "montant_depot_verse": "300000.00",
        "date_versement": "2026-03-13T23:00:00.000Z",
        "mode_versement": "virement",
        "commentaire": null
    },
    "paiement": {
        "id_payment": 3,
        "numero_transaction": "DEP-1773494246236-933",
        "id_contact": 6,
        "id_loyer": null,
        "id_depot": 2,
        "id_mode_payment": 1,
        "montant_depot": null,
        "montant": "300000.00",
        "date_paiement": "2026-03-14T13:17:26.236Z",
        "date_echeance": "2026-03-13T23:00:00.000Z",
        "statut_paiement": "valide"
    }
}
//Réuperer l'id d'un loyer
GET http://localhost:5000/api/paiements/contrat/6/loyers
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse**
[
    {
        "id_loyer": 4,
        "id_contact": 6,
        "mois_concerne": "2026-03",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-04-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 5,
        "id_contact": 6,
        "mois_concerne": "2026-04",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-05-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 6,
        "id_contact": 6,
        "mois_concerne": "2026-05",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-06-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 7,
        "id_contact": 6,
        "mois_concerne": "2026-06",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-07-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 8,
        "id_contact": 6,
        "mois_concerne": "2026-07",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-08-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 9,
        "id_contact": 6,
        "mois_concerne": "2026-08",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-09-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 10,
        "id_contact": 6,
        "mois_concerne": "2026-09",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-10-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 11,
        "id_contact": 6,
        "mois_concerne": "2026-10",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-11-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 12,
        "id_contact": 6,
        "mois_concerne": "2026-11",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-12-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 13,
        "id_contact": 6,
        "mois_concerne": "2026-12",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2027-01-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 14,
        "id_contact": 6,
        "mois_concerne": "2027-01",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2027-02-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 15,
        "id_contact": 6,
        "mois_concerne": "2027-02",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2027-03-04T23:00:00.000Z",
        "statut": "en_attente"
    }
]
//Choisis un id_loyer (EX: 4)
//Effectuer un paiement
POST http://localhost:5000/api/paiements/loyer
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**
{
    "id_loyer": 4, //(l'id _loyer que vous avez choisi)
    "id_mode_payment": 1,
    "montant": 150000
}
**Réponse**
{
    "message": "Paiement effectué avec succès",
    "paiement": {
        "id_payment": 4,
        "numero_transaction": "PAY-1773494873544-466",
        "id_contact": 6,
        "id_loyer": 4,
        "id_depot": null,
        "id_mode_payment": 1,
        "montant_depot": null,
        "montant": "150000.00",
        "date_paiement": "2026-03-14T13:27:53.544Z",
        "date_echeance": "2026-04-04T23:00:00.000Z",
        "statut_paiement": "valide"
    }
}
//Voir les Paiements d'un contrat
GET http://localhost:5000/api/paiements/contrat/6
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse**
[
    {
        "id_payment": 4,
        "numero_transaction": "PAY-1773494873544-466",
        "id_contact": 6,
        "id_loyer": 4,
        "id_depot": null,
        "id_mode_payment": 1,
        "montant_depot": null,
        "montant": "150000.00",
        "date_paiement": "2026-03-14T13:27:53.544Z",
        "date_echeance": "2026-04-04T23:00:00.000Z",
        "statut_paiement": "valide",
        "mode_paiement_libelle": "carte_bancaire",
        "loyer_mois": "2026-03",
        "depot_montant": null
    },
    {
        "id_payment": 3,
        "numero_transaction": "DEP-1773494246236-933",
        "id_contact": 6,
        "id_loyer": null,
        "id_depot": 2,
        "id_mode_payment": 1,
        "montant_depot": null,
        "montant": "300000.00",
        "date_paiement": "2026-03-14T13:17:26.236Z",
        "date_echeance": "2026-03-13T23:00:00.000Z",
        "statut_paiement": "valide",
        "mode_paiement_libelle": "carte_bancaire",
        "loyer_mois": null,
        "depot_montant": "300000.00"
    }
]
//Voir les loyer d'un contrat
GET http://localhost:5000/api/paiements/contrat/6/loyers
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse**
[
    {
        "id_loyer": 4,
        "id_contact": 6,
        "mois_concerne": "2026-03",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-04-04T23:00:00.000Z",
        "statut": "paye"
    },
    {
        "id_loyer": 5,
        "id_contact": 6,
        "mois_concerne": "2026-04",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-05-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 6,
        "id_contact": 6,
        "mois_concerne": "2026-05",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-06-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 7,
        "id_contact": 6,
        "mois_concerne": "2026-06",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-07-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 8,
        "id_contact": 6,
        "mois_concerne": "2026-07",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-08-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 9,
        "id_contact": 6,
        "mois_concerne": "2026-08",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-09-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 10,
        "id_contact": 6,
        "mois_concerne": "2026-09",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-10-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 11,
        "id_contact": 6,
        "mois_concerne": "2026-10",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-11-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 12,
        "id_contact": 6,
        "mois_concerne": "2026-11",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2026-12-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 13,
        "id_contact": 6,
        "mois_concerne": "2026-12",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2027-01-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 14,
        "id_contact": 6,
        "mois_concerne": "2027-01",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2027-02-04T23:00:00.000Z",
        "statut": "en_attente"
    },
    {
        "id_loyer": 15,
        "id_contact": 6,
        "mois_concerne": "2027-02",
        "montant_loyer": "150000.00",
        "montant_charge": "30000.00",
        "date_echeance": "2027-03-04T23:00:00.000Z",
        "statut": "en_attente"
    }
]
//test en tant que locataire
**Connecte toi en tant que locataire
POST http://localhost:5000/api/auth/login
{
    "email": "agossouroland@gmail.com",
    "mot_de_passe": "agossou12"
}
**Réponse**
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6I...", //Copie votre token
    "user": {
        "id": 5,
        "nom": "agossou",
        "prenoms": "Roland",
        "email": "agossouroland@gmail.com",
        "telephone": "0146121212",
        "type": "locataire",
        "derniere_connexion": "2026-03-14T13:35:40.933Z"
    }
}
//Voir mes paiements
GET http://localhost:5000/api/paiements/mes-paiements
Headers:
    Authorization: Bearer TON_TOKEN_LOCATAIRE
**Réponse**
Tous tes paiements (en tant que locataire).

//Voir les impayés
GET http://localhost:5000/api/paiements/impayes
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse**
Liste des loyers en retard.

//Statistiques des Paiements
GET http://localhost:5000/api/paiements/stats
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse **  
{
    "stats": {
        "total_paiements": "2",
        "paiements_valides": "2",
        "paiements_echoues": "0",
        "montant_total": "450000.00"
    },
    "impayes": "0"
}

//Tester les demandes de visite
//Connectez-vous en tant que locataire
POST http://localhost:5000/api/auth/login
Content-Type: application/json
**Body**
{
    "email": "agossouroland@gmail.com",
    "mot_de_passe": "agossou12"
}
**Reponse**
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV....",//Votre token à copié
    "user": {
        "id": 16,
        "nom": "agossou",
        "prenoms": "Roland",
        "email": "agossouroland@gmail.com",
        "telephone": "0146121212",
        "type": "proprietaire",
        "roleInfo": {
            "id_proprietaire": 5
        },
        "derniere_connexion": "2026-03-15T15:10:50.909Z"
    }
}
// LISTER LES BIENS DISPONIBLES (pour savoir quel bien visiter)
GET http://localhost:5000/api/biens/6
**Réponse**
{
    "id_bien": 6,
    "id_proprietaire": 4,
    "titre": "New appartement F2 au centre ville",
    "description": "Appartement avec clim",
    "type_bien": "appartement",
    "charge": "0.00",
    "statut": "loue",
    "loyer_mensuel": "150000.00",
    "adresse": "Rue 345",
    "ville": "Dakar",
    "date_creation": "2026-03-12T11:42:08.434Z",
    "code_postal": null,
    "superficie": 80,
    "nombre_pieces": 3,
    "nombre_chambres": 2,
    "meuble": false,
    "proprietaire_nom": "yessoufou",
    "proprietaire_prenoms": "Zenabou",
    "proprietaire_email": "yessoufouzenabou46@gmail.com",
    "proprietaire_telephone": "0158868731",
    "photos": []
}

 CRÉER UNE DEMANDE DE VISITE (en tant que locataire)

POST http://localhost:5000/api/demandes-visite
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**
{
    "id_bien": 6,
    "date_visite_souhaitee": "2026-03-20T14:30:00",
    "message": "Je suis intéressé par ce bien. Puis-je visiter samedi après-midi ?"
}

//Demande de visite par le locataire
POST http://localhost:5000/api/demandes-visite
Headers:
    Authorization: Bearer TON_TOKEN_LOCATAIRE
    Content-Type: application/json

{
    "id_bien": 6,
    "date_visite": "2026-03-20T14:30:00",
    "message": "Je souhaite visiter ce bien"
}
**Réponse**
{
    "message": "Demande de visite créée avec succès",
    "demande": {
        "id_demande": 4,
        "id_locataire": 9,
        "id_bien": 6,
        "id_proprietaire": 4,
        "date_demande": "2026-03-14T23:00:00.000Z",
        "date_visite": "2026-03-20T13:30:00.000Z",
        "message": "Je souhaite visiter ce bien",
        "statut_demande": "en_attente",
        "date_reponse": null
    }
}

// VOIR MES DEMANDES (en tant que locataire)

GET http://localhost:5000/api/demandes-visite/mes-demandes
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse**
[
    {
        "id_demande": 4,
        "id_locataire": 9,
        "id_bien": 6,
        "id_proprietaire": 4,
        "date_demande": "2026-03-14T23:00:00.000Z",
        "date_visite": "2026-03-20T13:30:00.000Z",
        "message": "Je souhaite visiter ce bien",
        "statut_demande": "en_attente",
        "date_reponse": null,
        "bien_titre": "New appartement F2 au centre ville",
        "bien_adresse": "Rue 345",
        "bien_ville": "Dakar",
        "proprietaire_nom": "yessoufou",
        "proprietaire_prenoms": "Zenabou"
    }
]

//CONNEXION EN TANT QUE PROPRIÉTAIRE (pour répondre aux demandes)
POST http://localhost:5000/api/auth/login
Content-Type: application/json
**Body**
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
**Reponse**
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....", //Copier votre token
    "user": {
        "id": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "telephone": "0158868731",
        "type": "proprietaire",
        "roleInfo": {
            "id_proprietaire": 4
        },
        "derniere_connexion": "2026-03-15T23:08:19.283Z"
    }
}

// VOIR LES DEMANDES REÇUES (en tant que propriétaire) 

GET http://localhost:5000/api/demandes-visite/demandes-recues
Headers:
    Authorization: Bearer TON_TOKEN_PROPRIETAIRE

**Reponse**
[
    {
        "id_demande": 4,
        "id_locataire": 9,
        "id_bien": 6,
        "id_proprietaire": 4,
        "date_demande": "2026-03-14T23:00:00.000Z",
        "date_visite": "2026-03-20T13:30:00.000Z",
        "message": "Je souhaite visiter ce bien",
        "statut_demande": "en_attente",
        "date_reponse": null,
        "bien_titre": "New appartement F2 au centre ville",
        "bien_adresse": "Rue 345",
        "bien_ville": "Dakar",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland",
        "locataire_email": "agossouroland@gmail.com",
        "locataire_telephone": "0146121212"
    }
]
//VOIR LES DEMANDES EN ATTENTE (pour les deux rôles)
GET http://localhost:5000/api/demandes-visite/en-attente
Headers:
    Authorization: Bearer TON_TOKEN_PROPRIETAIRE
**reponse**
Seules les demandes avec statut "en_attente".

//ACCEPTER UNE DEMANDE (en tant que propriétaire)
PATCH http://localhost:5000/api/demandes-visite/4/accepter
Headers:
    Authorization: Bearer TON_TOKEN_PROPRIETAIRE

//Remplace 1 par l'ID de la demande à accepter) EX: 4
**Reponse**
{
    "message": "Demande acceptée avec succès",
    "demande": {
        "id_demande": 4,
        "id_locataire": 9,
        "id_bien": 6,
        "id_proprietaire": 4,
        "date_demande": "2026-03-14T23:00:00.000Z",
        "date_visite": "2026-03-20T13:30:00.000Z",
        "message": "Je souhaite visiter ce bien",
        "statut_demande": "acceptee",
        "date_reponse": "2026-03-15T23:19:27.018Z"
    }
}
//REFUSER UNE DEMANDE (en tant que propriétaire)
PATCH http://localhost:5000/api/demandes-visite/1/refuser
Headers:
    Authorization: Bearer TON_TOKEN_PROPRIETAIRE

//Connecte-toi en tat que locaaire
POST http://localhost:5000/api/auth/login
{
    "email": "agossouroland@gmail.com",
    "mot_de_passe": "agossou12"
}
**Reponse**
//Copie le token reçue

//// CRÉER UNE NOUVELLE DEMANDE (pour tester l'annulation)
POST http://localhost:5000/api/demandes-visite
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**
{
    "id_bien": 5,
    "date_visite_souhaitee": "2026-03-20T14:30:00",
    "message": "Je suis intéressé par ce bien. Puis-je visiter samedi après-midi ?"
}   
**Reponse**
{
    "message": "Demande de visite créée avec succès",
    "demande": {
        "id_demande": 5,
        "id_locataire": 9,
        "id_bien": 5,
        "id_proprietaire": 4,
        "date_demande": "2026-03-15T23:00:00.000Z",
        "date_visite": "2026-03-25T14:00:00.000Z",
        "message": "Deuxième demande de visite",
        "statut_demande": "en_attente",
        "date_reponse": null
    }
}

//Annule la demande
PATCH http://localhost:5000/api/demandes-visite/5/annuler
Headers:
    Authorization: Bearer TON_TOKEN_LOCATAIRE
**Réponse**
{
    "message": "Demande annulée avec succès",
    "demande": {
        "id_demande": 5,
        "id_locataire": 9,
        "id_bien": 5,
        "id_proprietaire": 4,
        "date_demande": "2026-03-15T23:00:00.000Z",
        "date_visite": "2026-03-25T14:00:00.000Z",
        "message": "Deuxième demande de visite",
        "statut_demande": "annulee",
        "date_reponse": "2026-03-16T00:04:11.247Z"
    }
}
// STATISTIQUES DES DEMANDES (pour les deux rôles)
//Reuete en tant que loataire
GET http://localhost:5000/api/demandes-visite/stats
Headers:
    Authorization: Bearer TON_TOKEN_LOCATAIRE
**Reponse**
{
    "total": "0",
    "en_attente": "0",
    "acceptees": "0",
    "refusees": "0",
    "annulees": "0"
}

//connection en tant que proprietaire
POST http://localhost:5000/api/auth/login
{
    "email": "yessoufouzenaou46@gmail.com",
    "mot_de_passe": "123456"
}
**Reponse**
//copier le token

GET http://localhost:5000/api/demandes-visite/stats
Headers:
    Authorization: Bearer TON_TOKEN_PROPRIETAIRE

**Reponse**
{
    "total": "2",
    "en_attente": "0",
    "acceptees": "1",
    "refusees": "0",
    "annulees": "1"
}

//Test pour les problemes
//Connection entant que locataire
POST http://localhost:5000/api/auth/login
{
    "email": "agossouroland@gmail.com",
    "mot_de_passe": "agossou12"
}
**Reponse**
//copie le token recçue
//Créée un petit signalement
POST http://localhost:5000/api/problemes
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json

{
    "id_bien": 6,
    "titre": "Fuite d'eau dans la cuisine",
    "description": "Le robinet fuit depuis 2 jours, l'eau coule sans arrêt",
    "categorie": "plomberie",
    "priorite": "haute"
}
**Reponse**
{
    "message": "Problème signalé avec succès",
    "probleme": {
        "id_probleme": 1,
        "id_locataire": 9,
        "id_bien": 6,
        "titre": "Test problème",
        "description": "Description du test",
        "categorie": "plomberie",
        "priorite": "moyenne",
        "statut_probleme": "ouvert",
        "date_signalement": "2026-03-15T23:00:00.000Z",
        "date_resolution": null
    }
}
//CRÉER UN SECOND SIGNALEMENT (autre catégorie)
POST http://localhost:5000/api/problemes
{
    "id_bien": 6,
    "titre": "Panne de courant",
    "description": "Les plombs sautent régulièrement",
    "categorie": "electricite",
    "priorite": "urgente"
}
**Reponse**
Note le id_probleme (EX: 2)

//VOIR MES SIGNALEMENTS (locataire)
GET http://localhost:5000/api/problemes/mes-problemes
Headers: Authorization: Bearer TON_TOKEN

// CONNEXION EN TANT QUE PROPRIÉTAIRE
POST http://localhost:5000/api/auth/login
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
**Reponse**
copie le nouveau token
//Voir les signalements reçus
GET http://localhost:5000/api/problemes/problemes-recus
Headers: Authorization: Bearer TON_TOKEN_PROPRIETAIRE
**Reponse**
[
    {
        "id_probleme": 1,
        "id_locataire": 9,
        "id_bien": 6,
        "titre": "Test problème",
        "description": "Description du test",
        "categorie": "plomberie",
        "priorite": "moyenne",
        "statut_probleme": "ouvert",
        "date_signalement": "2026-03-15T23:00:00.000Z",
        "date_resolution": null,
        "bien_titre": "New appartement F2 au centre ville",
        "bien_adresse": "Rue 345",
        "bien_ville": "Dakar",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    },
    {
        "id_probleme": 2,
        "id_locataire": 9,
        "id_bien": 6,
        "titre": "Panne de courant",
        "description": "Les plombs sautent régulièrement",
        "categorie": "electricite",
        "priorite": "urgente",
        "statut_probleme": "ouvert",
        "date_signalement": "2026-03-15T23:00:00.000Z",
        "date_resolution": null,
        "bien_titre": "New appartement F2 au centre ville",
        "bien_adresse": "Rue 345",
        "bien_ville": "Dakar",
        "locataire_nom": "agossou",
        "locataire_prenoms": "Roland"
    }
]
//VOIR LES SIGNALEMENTS D'UN BIEN SPÉCIFIQUE
GET http://localhost:5000/api/problemes/bien/6
Headers: Authorization: Bearer TON_TOKEN_PROPRIETAIRE
//VOIR LES SIGNALEMENTS PAR STATUT
**Statut Ouvert
GET http://localhost:5000/api/problemes/statut/ouvert
Headers: Authorization: Bearer TON_TOKEN_PROPRIETAIRE

**Statut en_Cours
GET http://localhost:5000/api/problemes/statut/en_cours

//METTRE À JOUR LE STATUT D'UN SIGNALEMENT
PATCH http://localhost:5000/api/problemes/1/statut
Headers:
    Authorization: Bearer TON_TOKEN_PROPRIETAIRE
    Content-Type: application/json

{
    "statut": "en_cours"
}

//STATISTIQUES DES SIGNALEMENTS
GET http://localhost:5000/api/problemes/stats
Headers: Authorization: Bearer TON_TOKEN_PROPRIETAIRE

**Reponse**
{
    "total": "2",
    "ouverts": "0",
    "en_cours": "1",
    "resolus": "1",
    "fermes": "0",
    "urgentes": "1",
    "hautes": "0",
    "moyennes": "1",
    "basses": "0"
}
//Test pour photo Biens
//Connection en tant que proprietaire
POST http://localhost:5000/api/auth/login
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
**Reponse**
copier votre token reçue
//Créer un bien si cest pas déja fait
POST http://localhost:5000/api/biens
Headers: Authorization: Bearer TON_TOKEN
{
    "titre": "Appartement avec photos",
    "type_bien": "appartement",
    "loyer_mensuel": 200000,
    "adresse": "Rue des photos",
    "ville": "Dakar"
}
**Reponse**
{
    "message": "Bien créé avec succès",
    "bien": {
        "id_bien": 11,
        "id_proprietaire": 4,
        "titre": "Appartement avec photos",
        "description": null,
        "type_bien": "appartement",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "200000.00",
        "adresse": "Rue des photos",
        "ville": "Dakar",
        "date_creation": "2026-03-16T13:23:07.458Z",
        "code_postal": null,
        "superficie": null,
        "nombre_pieces": null,
        "nombre_chambres": null,
        "meuble": false
    }
}

//Ajouter des photos au bien
POST http://localhost:5000/api/biens/10/photos
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json

{
    "url_photobien": "https://exemple.com/photo1.jpg",
    "legende": "Façade de l'immeuble"
}
**Reponse**
{
    "message": "Photo ajoutée avec succès",
    "photo": {
        "id_photosbien": 1,
        "id_bien": 10,
        "url_photobien": "https://exemple.com/photo1.jpg",
        "legende": "Façade de l'immeuble",
        "date_ajout": "2026-03-16T13:27:29.947Z"
    }
}
//Ajouter une deuxieme photo
POST http://localhost:5000/api/biens/10/photos
{
    "url_photobien": "https://exemple.com/photo2.jpg",
    "legende": "Salon"
}
//Recuperer les photo du Bien
GET http://localhost:5000/api/biens/10/photos
Headers: Authorization: Bearer TON_TOKEN

**Reponse**
Listes des photos
//Voir le bien ave ses pphotos
GET http://localhost:5000/api/biens/10
**Reponse**
{
    "id_bien": 10,
    "id_proprietaire": 4,
    "titre": "Studio mublé centre-ville",
    "description": "Studio de 32m, au 2e étage,salle d'eau avec douche,balcon.Immeublesécurisé,wifi fibre inclus.Idéal étudiant ou jeune pro",
    "type_bien": "studio",
    "charge": "0.00",
    "statut": "loue",
    "loyer_mensuel": "195.00",
    "adresse": "Immeuble Baobab,Blvd St-Michel",
    "ville": "Cotonou",
    "date_creation": "2026-03-12T12:37:13.791Z",
    "code_postal": null,
    "superficie": 32,
    "nombre_pieces": 2,
    "nombre_chambres": 1,
    "meuble": false,
    "proprietaire_nom": "yessoufou",
    "proprietaire_prenoms": "Zenabou",
    "proprietaire_email": "yessoufouzenabou46@gmail.com",
    "proprietaire_telephone": "0158868731",
    "photos": [
        {
            "url_photobien": "https://exemple.com/photo1.jpg",
            "legende": "Façade de l'immeuble"
        },
        {
            "url_photobien": "https://exemple.com/photo2.jpg",
            "legende": "Salon"
        }
    ]
}
//Vérifier que les photos apparaissent dans la liste des biens
GET http://localhost:5000/api/biens/mes-biens
Headers: Authorization: Bearer TON_TOKEN
**Reponse**
Chaque bien doit avoir son tableau phoos
//Tester l'accès public
GET http://localhost:5000/api/biens/disponibles
**Reponse**
[
    {
        "id_bien": 11,
        "id_proprietaire": 4,
        "titre": "Appartement avec photos",
        "description": null,
        "type_bien": "appartement",
        "charge": "0.00",
        "statut": "disponible",
        "loyer_mensuel": "200000.00",
        "adresse": "Rue des photos",
        "ville": "Dakar",
        "date_creation": "2026-03-16T13:23:07.458Z",
        "code_postal": null,
        "superficie": null,
        "nombre_pieces": null,
        "nombre_chambres": null,
        "meuble": false,
        "proprietaire_nom": "yessoufou",
        "proprietaire_prenoms": "Zenabou",
        "proprietaire_telephone": "0158868731",
        "photo_principale": null
    }
]
//Connecte toi en tant que locataire
POST http://localhost:5000/api/auth/login
{
    "email": "agossouroland@gmail.com",
    "mot_de_passe": "agossou12"
}
**Reponse**
copie votre token
//Créer un probleme si pas déja fait
//Note l'id_probleme Ex: 1
//Ajoute une photo au probleme
POST http://localhost:5000/api/photos/probleme/1
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json

{
    "url_photosbp": "https://exemple.com/fuite.jpg",
    "description": "Photo de la fuite sous l'évier"
}
**Reponse**
{
    "message": "Photo ajoutée avec succès",
    "photo": {
        "id_photosbp": 1,
        "id_probleme": 1,
        "url_photosbp": "https://exemple.com/fuite.jpg",
        "description": "Photo de la fuite sous l'évier",
        "date_ajout": "2026-03-16T14:04:04.246Z"
    }
}
//Ajouter une deuxieme photo
POST http://localhost:5000/api/photos/probleme/1
{
    "url_photosbp": "https://exemple.com/fuite2.jpg",
    "description": "Vue rapprochée du robinet"
}
//Récuperer les photos du problemes
GET http://localhost:5000/api/photos/probleme/1
Headers: Authorization: Bearer TON_TOKEN

//Connecte -toi en tan que proprietaire
POST http://localhost:5000/api/auth/login
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
**Reponse**
copie votre token
//Le proprietaire peut aussi voir les photos
GET http://localhost:5000/api/photos/probleme/1
Headers: Authorization: Bearer TON_TOKEN_PROPRIETAIRE
**Reponse**
Meme photos
//Mettre à jours la description dune photo
PATCH http://localhost:5000/api/photos/1
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json

{
    "description": "Fuite d'eau importante - urgence"
}
//Supprimer une photo
DELETE http://localhost:5000/api/photos/1
Headers: Authorization: Bearer TON_TOKEN
**Reponse**
{
    "message": "Photo supprimée avec succès"
}













