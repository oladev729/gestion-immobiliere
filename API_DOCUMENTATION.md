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
```

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