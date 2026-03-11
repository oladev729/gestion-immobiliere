# API Documentation - Gestion Immobilière

##  INFORMATIONS GÉNÉRALES

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
```

---

##  ROUTES D'AUTHENTIFICATION

### 1. INSCRIPTION
Crée un nouveau compte utilisateur.

**Endpoint :** `POST /auth/register`

**Exemple Propriétaire :**
```json
{
    "nom": "yessoufou",
    "prenoms": "Zenabou",
    "email": "yessoufouzenabou46@gmail.com",
    "telephone": "0158868731",
    "mot_de_passe": "123456",
    "type_utilisateur": "proprietaire",
    "adresse_fiscale": "Dakar, Sénégal"
}
```

**Réponse :**
```json
{
    "message": "Inscription réussie",
    "token": "eyJhbGciOiJIUzI1NiIs...", // Token valable 24h
    "user": {
        "id_utilisateur": 15,
        "nom": "yessoufou",
        "prenoms": "Zenabou",
        "email": "yessoufouzenabou46@gmail.com",
        "type_utilisateur": "proprietaire"
    }
}
```

**Exemple Locataire :**
```json
{
    "nom": "agossou",
    "prenoms": "Roland",
    "email": "agossouroland@gmail.com", 
    "telephone": "0146121212",
    "mot_de_passe": "agossou12",  
    "type_utilisateur": "locataire"
}
```

---

### 2. CONNEXION
Connecte un utilisateur existant.

**Endpoint :** `POST /auth/login`

**Exemple Propriétaire :**
```json
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
```

**Réponse :**
```json
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
```

### 3. DOUBLE COMPTE
Permet à un utilisateur d'avoir deux rôles avec le même email.

**Endpoint :** `POST /auth/login`

**Première tentative (sans confirmation) :**
```json
{
    "email": "oulfathishola@gmail.com",
    "mot_de_passe": "oulfath@12",
    "type_souhaite": "proprietaire"
}
```

**Réponse (demande de confirmation) :**
```json
{
    "message": "Vous êtes déjà inscrit en tant que locataire. Voulez-vous vraiment vous connecter en tant que proprietaire ?",
    "confirmation_requise": true,
    "type_actuel": "locataire",
    "type_demande": "proprietaire"
}
```

**Seconde tentative (avec confirmation) :**
```json
{
    "email": "oulfathishola@gmail.com",
    "mot_de_passe": "oulfath@12",
    "type_souhaite": "proprietaire",
    "confirmation": true
}
```

---

### 4. PROFIL UTILISATEUR
Obtenir les informations de l'utilisateur connecté.

**Endpoint :** `GET /auth/profile`

**Headers requis :**
```json
{
    "Authorization": "Bearer VOTRE_TOKEN_ICI"
}
```

**Réponse :**
```json
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
```

---

### 5. INVITATION LOCATAIRE
Permet d'inviter quelqu'un à créer un compte.

**Endpoint :** `POST /auth/inviter-locataire`

**Headers requis :**
```json
{
    "Authorization": "Bearer VOTRE_TOKEN_ICI",
    "Content-Type": "application/json"
}
```

**Body :**
```json
{
    "email": "agossouroland@gmail.com",
    "nom": "agossou",
    "prenoms": "Roland",
    "type_souhaite": "proprietaire"
}
```

**Réponse :**
```json
{
    "message": "Invitation envoyée avec succès",
    "token_dev": "eyJhbGciOiJIUzI1NiIs...", // Token à utiliser pour confirmer
    "type_invitation": "proprietaire",
    "note": "Double compte en tant que proprietaire."
}
```

---

### 6. CONFIRMER INVITATION
Confirme une invitation et crée le compte.

**Endpoint :** `POST /auth/confirmer-invitation`

**Body :**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...", // Le token_dev reçu de l'invitation
    "mot_de_passe": "agossou12",
    "telephone": "0146121212"
}
```

**Réponse (double compte créé) :**
```json
{
    "message": "✅ Double compte créé ! Vous avez maintenant deux comptes (locataire et proprietaire) avec le même email.",
    "token": "eyJhbGciOiJIUzI1NiIs...", // Votre token de connexion
    "user": {
        "id_utilisateur": 16,
        "nom": "agossou",
        "prenoms": "Roland",
        "email": "agossouroland@gmail.com",
        "type_utilisateur": "proprietaire"
    },
    "double_compte": true
}
### 7. MOT DE PASSE OUBLIÉ
Demander un lien de réinitialisation de mot de passe.

**Endpoint :** `POST /auth/forgot-password`

**Body :**
```json
{
    "email": "yessoufouzenabou46@gmail.com"
}
```

**Réponse :**
```json
{
    "message": "Email de réinitialisation envoyé",
    "reset_token_dev": "d7b32508919dbd39151fe8ccbce67....."//Votre Token dev ici 
}
```

---

### 8. RÉINITIALISER MOT DE PASSE
Changer le mot de passe avec le token reçu.

**Endpoint :** `POST /auth/reset-password`

**Body :**
```json
{
    "token": "d7b32508919dbd39151fe8ccbce67e......",//Votre token ici 
    "nouveau_mot_de_passe": "ola"
}
```

**Réponse :**
```json
{
    "message": "Mot de passe réinitialisé avec succès"
}
````

---

## 👥 COMPTES DE TEST DISPONIBLES

| ID | Nom | Email | Type | Mot de passe |
|----|-----|-------|------|--------------|
| 15 | yessoufou Zenabou | `yessoufouzenabou46@gmail.com` | proprietaire | `123456` |
| 5 | agossou Roland | `agossouroland@gmail.com` | locataire | `agossou12` |
| 13 | Oulfath Ishola | `oulfathishola@gmail.com` | locataire | `oulfath@12` |
| 16 | Oulfath Ishola | `oulfathishola@gmail.com` | proprietaire | `oulfath@12` |

---

## 📊 CODES D'ERREUR HTTP

| Code | Signification |
|------|---------------|
| **200** | Succès |
| **201** | Créé avec succès |
| **400** | Requête invalide (données manquantes) |
| **401** | Non authentifié (token manquant/invalide) |
| **403** | Accès interdit (rôle insuffisant) |
| **404** | Ressource non trouvée |
| **409** | Conflit (double compte, email existant) |
| **500** | Erreur serveur |

---

## NOTES IMPORTANTES

- Les tokens expirent après **24h**. Si un token ne fonctionne plus, refaites un login.
- Pour les routes protégées, **toujours inclure** le header `Authorization: Bearer VOTRE_TOKEN`
- Les mots de passe des comptes de test sont **pour développement uniquement**
//Création de Biens
//Connexion en tant que proprietaire
POST http://localhost:5000/api/auth/login
Content-Type: application/json
{
    "email": "yessoufouzenabou46@gmail.com",
    "mot_de_passe": "123456"
}
**Reponse**
{
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6....",//Votre token à copier
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
POST http://localhost:5000/api/biens
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
    **Body**(1er Exemple bIENS Appartements)
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
**Reponse**
{
    "message": "Bien créé avec succès",
    "bien": {
        "id_bien": 2, //copier lid (du premier Bien crée)
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
//creer un autre Bien (Bien Maison)
**Body**
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
//Reponse
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
// Lister mes Biens 
GET http://localhost:5000/api/biens/mes-biens
Headers:
    Authorization: Bearer TON_TOKEN (Votre token que vous aviez copier)
**Reponse**
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

//Voir un bien spécifique (GET /api/biens/:id)
GET http://localhost:5000/api/biens/1
//(Remplace 1 par l'ID du bien que tu veux voir)
//Modifier un Biens
PUT http://localhost:5000/api/biens/2
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**
{
    "loyer_mensuel": 210000,
    "description": "Appartement rénové avec clim",
    "meuble": true
}
**Réponse**
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
// CHANGER LE STATUT D'UN BIEN (PATCH /api/biens/:id/statut)
PATCH http://localhost:5000/api/biens/2/statut
Headers:
    Authorization: Bearer TON_TOKEN
    Content-Type: application/json
**Body**
{
    "statut": "loue"
}
**Réponse**
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
//VOIR LES BIENS DISPONIBLES (PUBLIC - sans token)
GET http://localhost:5000/api/biens/disponibles
**Réponse**
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
// Biens Disponibles avec Filtres 
GET http://localhost:5000/api/biens/disponibles?ville=Dakar&type_bien=appartement&prix_max=250000

// RECHERCHER DES BIENS (GET /api/biens/search)
GET http://localhost:5000/api/biens/search?q=appartement

// STATISTIQUES DES BIENS (GET /api/biens/stats)*
GET http://localhost:5000/api/biens/stats
Headers:
    Authorization: Bearer TON_TOKEN
**Réponse**
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
// SUPPRIMER UN BIEN (DELETE /api/biens/:id)
DELETE http://localhost:5000/api/biens/3
Headers:
    Authorization: Bearer TON_TOKEN
//Réponse
{
    "message": "Bien supprimé avec succès"
}

