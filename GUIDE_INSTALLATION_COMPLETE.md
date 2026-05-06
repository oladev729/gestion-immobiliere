# 🏠 GUIDE D'INSTALLATION COMPLET
## Système de Gestion Immobilière avec Alertes Avancées

---

## 📋 PRÉREQUIS

### Logiciels nécessaires
- **Node.js** (version 18 ou supérieure)
- **PostgreSQL** (version 13 ou supérieure)
- **Git**
- **Navigateur web moderne** (Chrome, Firefox, Edge)

### Vérification des prérequis
```bash
# Vérifier Node.js
node --version

# Vérifier PostgreSQL
psql --version

# Vérifier Git
git --version
```

---

## 🚀 ÉTAPE 1 : CLONER LE PROJET

### Option A : Depuis GitHub
```bash
git clone https://github.com/VOTRE_USERNAME/gestion-immobiliere.git
cd gestion-immobiliere
```

### Option B : Depuis le dossier partagé
1. Copier le dossier `gestion-immobiliere` sur votre ordinateur
2. Ouvrir un terminal dans ce dossier

---

## 🗄️ ÉTAPE 2 : CONFIGURATION DE LA BASE DE DONNÉES

### 2.1 Créer la base de données
```sql
-- Ouvrir PostgreSQL et exécuter :
CREATE DATABASE gestion_immobiliere;
```

### 2.2 Configurer le fichier .env
Créer le fichier `backend/.env` :
```env
# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_immobiliere
DB_USER=votre_utilisateur_postgresql
DB_PASSWORD=votre_mot_de_passe_postgresql

# Configuration JWT
JWT_SECRET= Votre_Secret_JT_Tres_Securise_123456789
JWT_EXPIRES_IN=24h

# Port du serveur
PORT=5055
```

### 2.3 Initialiser les tables
```bash
cd backend
node setup_all_tables.js
```

---

## 🔧 ÉTAPE 3 : INSTALLATION DES DÉPENDANCES

### 3.1 Backend
```bash
cd backend
npm install
```

### 3.2 Frontend
```bash
cd ../frontend
npm install
```

---

## 🚀 ÉTAPE 4 : DÉMARRAGE DE L'APPLICATION

### 4.1 Démarrer le backend
```bash
# Dans le dossier backend
cd backend
npm start
```

Le backend devrait démarrer sur `http://localhost:5055`

### 4.2 Démarrer le frontend
```bash
# Dans un nouveau terminal, dans le dossier frontend
cd frontend
npm run dev
```

Le frontend devrait démarrer sur `http://localhost:5173`

---

## 👤 ÉTAPE 5 : COMPTES DE TEST

### Compte Propriétaire
- **Email** : `yessoufouzenabou46@gmail.com`
- **Mot de passe** : `123456`

### Compte Locataire
- **Email** : `agossouroland@gmail.com`
- **Mot de passe** : `agossou12`

---

## 🎯 ÉTAPE 6 : VÉRIFICATION DU FONCTIONNEMENT

### 6.1 Test du backend
Ouvrir `http://localhost:5055/api` dans votre navigateur
- Vous devriez voir : `{"message": "API de Gestion Immobilière"}`

### 6.2 Test du frontend
Ouvrir `http://localhost:5173`
- La page d'accueil devrait s'afficher
- Testez la connexion avec les comptes de test

---

## 🔧 FONCTIONNALITÉS À TESTER

### Pour le propriétaire
1. **Connexion** avec le compte propriétaire
2. **Gestion des biens** → "Mes biens"
3. **Alertes** → "Signalements reçus"
4. **Alertes** → "Communications locataires"
5. **Nouvelle communication** (formulaire)

### Pour le locataire
1. **Connexion** avec le compte locataire
2. **Signaler un problème** (maintenance)
3. **Voir les communications** du propriétaire
4. **Consulter les contrats**

---

## 🚨 DÉPANNAGE

### Problèmes courants

#### 1. "Port déjà utilisé"
```bash
# Sur Windows
netstat -ano | findstr :5055
taskkill /PID [PID] /F

# Sur Linux/Mac
lsof -ti:5055 | xargs kill -9
```

#### 2. "Connexion à la base de données refusée"
- Vérifier que PostgreSQL est démarré
- Vérifier les identifiants dans le fichier `.env`
- Vérifier que la base de données `gestion_immobiliere` existe

#### 3. "Module non trouvé"
```bash
# Réinstaller les dépendances
cd backend && npm install
cd ../frontend && npm install
```

#### 4. "Erreur JWT"
- Vérifier que `JWT_SECRET` est défini dans `.env`
- Redémarrer le backend après modification du `.env`

#### 5. "Frontend ne se charge pas"
- Vérifier que le backend est démarré sur le port 5055
- Vérifier que le frontend est démarré sur le port 5173
- Vérifier la console du navigateur pour les erreurs

---

## 📱 ACCÈS RAPIDE

### URLs importantes
- **Frontend** : `http://localhost:5173`
- **Backend API** : `http://localhost:5055/api`
- **Documentation API** : `http://localhost:5055/api/documentation`

### Commandes utiles
```bash
# Démarrer les deux serveurs en même temps
cd backend && npm start &
cd ../frontend && npm run dev &

# Voir les logs du backend
tail -f backend/logs/app.log

# Redémarrer PostgreSQL (Windows)
net start postgresql-x64-14
```

---

## 🎉 FÉLICITATIONS !

Votre système de gestion immobilière est maintenant opérationnel !

### Fonctionnalités disponibles
- ✅ **Authentification sécurisée** avec JWT
- ✅ **Gestion complète des biens**
- ✅ **Gestion des locataires et contrats**
- ✅ **Système d'alertes bidirectionnel**
- ✅ **Interface responsive et moderne**
- ✅ **API REST complète**

### Pour aller plus loin
- Ajouter de nouveaux biens et locataires
- Personnaliser les alertes
- Explorer la documentation API
- Contribuer au projet sur GitHub

---

## 📞 SUPPORT

En cas de problème :
1. Consultez la section **Dépannage** ci-dessus
2. Vérifiez les logs dans les terminaux
3. Contactez le développeur principal

---

**🏠 Bonne utilisation de votre système de gestion immobilière !**
