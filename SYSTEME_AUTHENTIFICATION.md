# 🔐 **SYSTÈME D'AUTHENTIFICATION COMPLET**

## 📋 **Vue d'ensemble**

Votre application utilise un système d'authentification **JWT (JSON Web Tokens)** avec gestion des rôles et support de double compte.

---

## 🔧 **Fichiers principaux**

### 📁 **Middleware d'authentification**
`backend/src/middleware/auth.js`

### 📁 **Contrôleur d'authentification**  
`backend/src/controllers/authController.js`

### 📁 **Routes d'authentification**
`backend/src/routes/authRoutes.js`

---

## 🔑 **Système JWT (JSON Web Tokens)**

### **Configuration**
```javascript
// .env
JWT_SECRET=votre_cle_secrete_ici
JWT_EXPIRES_IN=24h
```

### **Génération du token**
```javascript
const token = jwt.sign(
    { 
        id: user.id_utilisateur, 
        email: user.email, 
        type: user.type_utilisateur 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

### **Vérification du token**
```javascript
jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
        return res.status(403).json({ 
            message: 'Token invalide ou expiré.' 
        });
    }
    req.user = user;
    next();
});
```

---

## 🛡️ **Middleware d'authentification**

### **`authenticateToken`** - Vérification du token
```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ 
            message: 'Token non fourni. Veuillez vous authentifier.' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Token invalide ou expiré.' 
            });
        }
        
        req.user = user; // Attache l'utilisateur à la requête
        next();
    });
};
```

### **`authorize`** - Autorisation par rôle
```javascript
const authorize = (...types) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentification requise.' 
            });
        }

        if (!types.includes(req.user.type)) {
            return res.status(403).json({ 
                message: `Accès non autorisé. Rôle requis : ${types.join(' ou ')}` 
            });
        }

        next();
    };
};
```

---

## 🎭 **Gestion des rôles**

### **Types d'utilisateurs**
- **`proprietaire`** : Gère les biens et les contrats
- **`locataire`** : Loue les biens et signale des problèmes
- **`admin`** : Administration système (si ajouté)

### **Utilisation dans les routes**
```javascript
// Route protégée pour propriétaires uniquement
router.get('/mes-biens', authenticateToken, authorize('proprietaire'), bienController.mesBiens);

// Route pour propriétaires et locataires
router.get('/mon-profil', authenticateToken, authorize('proprietaire', 'locataire'), userController.getProfile);
```

---

## 🔄 **Support de double compte**

### **Fonctionnalité clé**
Un utilisateur peut avoir **deux comptes** avec le même email :
- Un compte **propriétaire**
- Un compte **locataire**

### **Connexion avec type souhaité**
```javascript
// Dans la requête de connexion
{
    "email": "user@example.com",
    "mot_de_passe": "password123",
    "type_souhaite": "locataire",  // Optionnel
    "confirmation": true           // Pour confirmer le changement
}
```

### **Logique de connexion**
1. **Vérification normale** → Connexion si type correspond
2. **Type différent demandé** → Demande de confirmation
3. **Confirmation acceptée** → Recherche du compte du type souhaité
4. **Création si nécessaire** → Invitation à créer le compte manquant

---

## 📊 **Structure des données utilisateur**

### **Token JWT contient**
```json
{
    "id": 123,
    "email": "user@example.com", 
    "type": "proprietaire",
    "iat": 1640995200,
    "exp": 1641081600
}
```

### **Utilisateur attaché à la requête**
```javascript
req.user = {
    id: 123,
    email: "user@example.com",
    type: "proprietaire"
}
```

---

## 🔧 **Fonctionnalités complètes**

### **1. Inscription**
```javascript
POST /api/auth/register
{
    "nom": "Dupont",
    "prenoms": "Jean",
    "email": "jean@dupont.com",
    "telephone": "0123456789",
    "mot_de_passe": "password123",
    "type_utilisateur": "proprietaire",
    "adresse_fiscale": "123 rue de la Paix"
}
```

### **2. Connexion**
```javascript
POST /api/auth/login
{
    "email": "jean@dupont.com",
    "mot_de_passe": "password123",
    "type_souhaite": "locataire"  // Optionnel
}
```

### **3. Mot de passe oublié**
```javascript
POST /api/auth/forgot-password
{
    "email": "jean@dupont.com"
}
```

### **4. Réinitialisation mot de passe**
```javascript
POST /api/auth/reset-password
{
    "token": "reset_token_here",
    "nouveau_mot_de_passe": "newpassword123"
}
```

### **5. Profil**
```javascript
GET /api/auth/profile          // Obtenir le profil
PUT /api/auth/profile          // Mettre à jour le profil
```

### **6. Invitation locataire**
```javascript
POST /api/auth/inviter-locataire
{
    "email": "locataire@email.com",
    "nom": "Martin",
    "prenoms": "Sophie",
    "type_souhaite": "locataire"
}
```

---

## 🛡️ **Sécurité**

### **Hashage des mots de passe**
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
```

### **Token de réinitialisation**
```javascript
const resetToken = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
```

### **Logs de debugging**
```javascript
console.log(' Auth Debug - Headers:', Object.keys(req.headers));
console.log(' Auth Debug - Authorization Header:', authHeader);
console.log(' Auth Debug - Token extrait:', token ? token.substring(0, 50) + '...' : 'null');
console.log(' Auth Debug - JWT Secret:', process.env.JWT_SECRET ? 'Défini' : 'Non défini');
```

---

## 🚀 **Utilisation dans le frontend**

### **Configuration Axios**
```javascript
// Dans api.js ou similaire
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5055/api'
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur pour gérer les erreurs 401/403
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

### **Stockage du token**
```javascript
// Après connexion
localStorage.setItem('token', response.data.token);

// Avant les requêtes API
const token = localStorage.getItem('token');
if (token) {
    config.headers.Authorization = `Bearer ${token}`;
}
```

---

## 📋 **Comptes de test**

### **Propriétaire**
- **Email**: `yessoufouzenabou46@gmail.com`
- **Mot de passe**: `123456`
- **Type**: `proprietaire`

### **Locataire**
- **Email**: `agossouroland@gmail.com`
- **Mot de passe**: `agossou12`
- **Type**: `locataire`

---

## ⚠️ **Points d'attention pour votre binôme**

### **1. Variables d'environnement**
Assurez-vous que le `.env` contient :
```env
JWT_SECRET=votre_cle_secrete_tres_longue_et_complexe
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_immobiliere
```

### **2. Port du backend**
Le backend tourne sur le port **5055** (pas 5000)

### **3. Format du token**
Le token doit être envoyé avec le préfixe **Bearer** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **4. Debugging**
Les logs détaillés sont activés dans le middleware pour faciliter le debugging.

---

## 🎯 **Résumé technique**

- **Système**: JWT (JSON Web Tokens)
- **Validité**: 24 heures
- **Rôles**: propriétaire, locataire
- **Support**: Double compte avec même email
- **Sécurité**: Bcrypt + Crypto
- **Backend**: Express.js middleware
- **Frontend**: Axios avec intercepteurs

---

**🎯 Votre système d'authentification est complet et sécurisé !**
