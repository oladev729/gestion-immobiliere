# ImmoGest - Gestion Immobilière

Plateforme complète de gestion immobilière avec système de paiement intégré CaurisPay.

## 📋 Structure du Projet

```
gestion-immobiliere/
│
├── backend/                 # API Node.js + Express
│   ├── src/                # Source code backend
│   ├── uploads/            # Fichiers uploadés (ignoré par git)
│   └── tests/              # Tests backend (optionnel)
│
├── frontend/               # Application React
│   ├── src/                # Source code frontend
│   └── dist/               # Build production (ignoré)
│
├── docs/                   # Documentation (TRÈS IMPORTANT)
│   ├── UML/                # Diagrammes UML
│   ├── API/                # Documentation API
│   └── README.md           # Ce fichier
│
├── .gitignore              # Fichiers ignorés
├── README.md               # Documentation principale
└── package.json            # Configuration globale (si besoin)
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Installation

1. **Backend**
```bash
cd backend
npm install
cp .env.example .env  # Configurer les variables
npm run dev
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

### Backend
- **Framework** : Express.js
- **Base de données** : PostgreSQL
- **Authentification** : JWT
- **Paiements** : CaurisPay API

### Frontend
- **Framework** : React 18
- **Routing** : React Router
- **UI** : Bootstrap 5 + CSS personnalisé
- **State** : Context API

## 💰 Système de Paiement

### CaurisPay Intégration
- **API Direct** : Paiement par formulaire
- **Widget** : Interface interactive
- **Opérateurs** : MTN, MOOV, CELTIIS (Bénin)
- **Validation** : Vérification automatique des statuts

## 📚 Documentation

- [API Documentation](./API/README.md)
- [Diagrammes UML](./UML/README.md)
- [Guide de Déploiement](./DEPLOYMENT.md)

## 🔧 Configuration

### Variables d'environnement essentielles
```env
# Base de données
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=...

# CaurisPay
CAURISPAY_API_KEY=...
CAURISPAY_CLIENT_ID=...
CAURISPAY_SERVICE_ID=...
CAURISPAY_SERVICE_KEY=...
```

## 🎨 Fonctionnalités

### Propriétaires
- Gestion des biens immobiliers
- Suivi des contrats de location
- Gestion des paiements
- Maintenance et réparations
- Messagerie avec locataires

### Locataires
- Recherche de biens
- Gestion des paiements (CaurisPay)
- Signalement de problèmes
- Messagerie avec propriétaires
- Historique des transactions

## 📱 Technologies

### Backend
- Node.js, Express.js
- PostgreSQL, Sequelize
- JWT, bcrypt
- Multer (uploads)
- CaurisPay SDK

### Frontend
- React, React Router
- Bootstrap 5, Bootstrap Icons
- Axios, React Context
- Vite (build tool)

## 🔒 Sécurité

- JWT tokens pour l'authentification
- Validation des entrées
- Protection contre les injections SQL
- Uploads sécurisés
- CORS configuré

## 📊 Monitoring

- Logs structurés
- Gestion d'erreurs
- Monitoring des performances
- Alertes système

## 🚀 Déploiement

### Production
- Docker containers
- Nginx reverse proxy
- PostgreSQL cluster
- SSL/TLS

### Développement
- Hot reload
- Environment variables
- Database seeding
- API documentation

## 📝 Notes de Développement

Ce projet est conçu pour être scalable et maintenable. La documentation est essentielle pour la compréhension et l'évolution du système.

## 🤝 Contributeurs

- [Votre Nom] - Développeur principal
- [Autres contributeurs]

## 📄 Licence

MIT License
