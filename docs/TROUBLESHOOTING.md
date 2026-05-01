# 🔧 Guide de Dépannage - ImmoGest

## 🚨 Problèmes Courants

### 1. ❌ "Token non fourni. Veuillez vous authentifier."

#### **Cause**
Le token JWT n'est pas envoyé depuis le frontend ou est invalide.

#### **Solutions**

##### **Étape 1: Vérifier le token dans le navigateur**
```javascript
// Ouvrir la console du navigateur (F12)
localStorage.getItem('token')
localStorage.getItem('user')
```

##### **Étape 2: Vérifier les logs du backend**
```bash
# Les logs montrent maintenant les détails d'authentification
🔍 Auth Debug - Headers: [liste des headers]
🔍 Auth Debug - Authorization Header: Bearer xxxxx...
🔍 Auth Debug - Token extrait: xxxxx...
🔍 Auth Debug - JWT Secret: Défini/Non défini
```

##### **Étape 3: Reconnectez-vous**
1. **Déconnectez-vous** de l'application
2. **Videz le cache** du navigateur
3. **Reconnectez-vous** avec vos identifiants

##### **Étape 4: Vérifier l'environnement**
```bash
# Backend
cd backend
node check_auth.js

# Frontend (dans la console)
# Exécuter le contenu de check_auth_frontend.js
```

---

### 2. 🖼️ Images des biens non affichées

#### **Cause**
Le dossier `uploads/` a été supprimé lors du nettoyage.

#### **Solutions**

##### **Étape 1: Recréer le dossier uploads**
```bash
# Le dossier a été recréé automatiquement
backend/uploads/
├── placeholders/
│   ├── appartement.jpg
│   ├── maison.jpg
│   ├── studio.jpg
│   ├── villa.jpg
│   └── default.jpg
```

##### **Étape 2: Redémarrer le serveur backend**
```bash
cd backend
npm run dev
```

##### **Étape 3: Uploader de vraies images**
1. **Allez dans la gestion des biens**
2. **Modifiez un bien**
3. **Ajoutez des photos**
4. **Les placeholders seront remplacés automatiquement**

---

### 3. 🔍 Débogage avancé

#### **Activer les logs détaillés**

##### **Backend**
```javascript
// Les logs sont déjà activés dans auth.js
console.log('🔍 Auth Debug - Headers:', Object.keys(req.headers));
console.log('🔍 Auth Debug - Authorization Header:', authHeader);
```

##### **Frontend**
```javascript
// Ajoutez ce code dans votre composant
useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔍 Token:', token ? token.substring(0, 50) + '...' : '❌ Non trouvé');
}, []);
```

#### **Vérifier la configuration**

##### **Variables d'environnement**
```bash
# Vérifier le .env
cat backend/.env | grep JWT_SECRET
```

##### **URL de l'API**
```javascript
// Dans le frontend (vite.config.js ou .env)
VITE_API_URL=http://127.0.0.1:5055/api
```

---

### 4. 🌐 Problèmes de réseau

#### **CORS**
```javascript
// Dans backend/src/app.js
app.use(cors({
    origin: 'http://localhost:5173', // URL du frontend
    credentials: true
}));
```

#### **Port occupé**
```bash
# Vérifier les ports utilisés
netstat -an | findstr :5055  # Backend
netstat -an | findstr :5173  # Frontend

# Changer de port si nécessaire
PORT=5056 npm run dev  # Backend
```

---

### 5. 📱 Problèmes spécifiques aux navigateurs

#### **Chrome**
- **Vider le cache** : Ctrl+Shift+Suppr
- **Mode incognito** pour tester
- **Désactiver les extensions**

#### **Firefox**
- **Vider le cache** : Ctrl+Shift+Suppr
- **Débogueur réseau** : F12 > Réseau

#### **Safari**
- **Vider le cache** : Développement > Vider le cache
- **Console** : Développement > Console JavaScript

---

## 🛠️ Scripts de Maintenance

### **Nettoyage complet**
```bash
# Backend
cd backend
npm run clean
npm install
npm run dev

# Frontend  
cd frontend
npm run clean
npm install
npm run dev
```

### **Vérification de l'authentification**
```bash
# Backend
node check_auth.js

# Frontend (console)
localStorage.clear()
location.reload()
```

### **Reset des images**
```bash
cd backend
node setup_images.js
```

---

## 📞 Support

### **Logs à collecter**
1. **Console navigateur** (F12)
2. **Logs backend** (terminal)
3. **Réseau** (onglet Network)
4. **LocalStorage** (onglet Application)

### **Informations utiles**
- **Navigateur** et version
- **Système d'exploitation**
- **Heure du problème**
- **Actions effectuées**

---

## 🎯 Checklist de résolution

### **Avant de contacter le support**
- [ ] **Redémarrer les serveurs** (backend + frontend)
- [ ] **Vider le cache** du navigateur
- [ ] **Vérifier la connexion** internet
- [ ] **Tester en mode incognito**
- [ ] **Vérifier les variables** d'environnement
- [ ] **Consulter les logs** d'erreur

### **Après résolution**
- [ ] **Noter la solution** appliquée
- [ ] **Mettre à jour** la documentation
- [ ] **Tester** toutes les fonctionnalités
- [ ] **Sauvegarder** la configuration

---

**🔧 Pour toute question, consultez les logs et suivez les étapes dans l'ordre !**
