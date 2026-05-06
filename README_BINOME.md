# 🏠 GUIDE RAPIDE POUR BINÔME

## Installation Express (2 minutes)

### 1️⃣ Télécharger et décompresser le dossier `gestion-immobiliere`

### 2️⃣ Double-cliquer sur `INSTALL.bat`
- Le script installe tout automatiquement
- Suivez les instructions à l'écran

### 3️⃣ Configuration rapide
- Ouvrir `backend/.env` et remplacer :
  ```
  DB_USER=votre_nom_postgresql
  DB_PASSWORD=votre_mot_de_passe_postgresql
  JWT_SECRET=votre_secret_personnel
  ```

### 4️⃣ Lancer PostgreSQL et créer la base :
```sql
CREATE DATABASE gestion_immobiliere;
```

### 5️⃣ C'est prêt ! 🎉
- Frontend : http://localhost:5173
- Backend : http://localhost:5055

---

## 🔑 Identifiants de test

### Propriétaire
- **Email** : `yessoufouzenabou46@gmail.com`
- **MDP** : `123456`

### Locataire  
- **Email** : `agossouroland@gmail.com`
- **MDP** : `agossou12`

---

## 🎯 Test rapide (5 minutes)

### Test propriétaire
1. Se connecter avec le compte propriétaire
2. Allez dans "Mes biens" → Voir les biens
3. Allez dans "Alertes" → "Communications locataires"
4. Cliquez "+ Nouvelle communication" → Envoyer une alerte

### Test locataire
1. Se connecter avec le compte locataire
2. Allez dans "Signaler un problème" → Envoyer un signalement
3. Vérifier que l'alerte apparaît chez le propriétaire

---

## 🚨 Si ça ne marche pas

### Problème : "Port déjà utilisé"
```bash
# Ouvrir cmd et taper :
netstat -ano | findstr :5055
taskkill /PID [PID] /F
```

### Problème : "Base de données refusée"
- Vérifier que PostgreSQL est démarré
- Vérifier les identifiants dans `.env`
- Créer la base `gestion_immobiliere`

### Problème : "Node.js pas trouvé"
- Installer Node.js depuis https://nodejs.org

---

## 📱 Accès rapide

| Lien | Description |
|------|-------------|
| http://localhost:5173 | Application web |
| http://localhost:5055/api | API backend |
| `GUIDE_INSTALLATION_COMPLETE.md | Guide complet |

---

## 🎉 Félicitations !

Votre système de gestion immobilière est prêt ! 

**Fonctionnalités principales :**
- ✅ Gestion des biens et locataires
- ✅ Alertes maintenance (locataire → propriétaire)
- ✅ Communications fiscales (propriétaire → locataire)
- ✅ Interface moderne et responsive

**Bonne utilisation !** 🏠
