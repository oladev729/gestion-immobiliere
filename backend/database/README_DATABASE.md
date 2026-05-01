# 📊 Base de Données ImmoGest

## 🚀 Script d'Initialisation Automatique

### 📋 Utilisation

Le script `setup_database.js` permet d'initialiser ou de mettre à jour automatiquement la base de données `gestion_immobiliere`.

### 🔧 Prérequis

1. **PostgreSQL** installé et en cours d'exécution
2. **Base de données `gestion_immobiliere`** créée
3. **Node.js** et les dépendances installées

### ⚡ Installation et Exécution

#### **1. Installation des dépendances :**
```bash
cd backend/database
npm install
```

#### **2. Configuration (si nécessaire) :**
```bash
# Éditer le fichier .env à la racine du backend
# Assurez-vous que les variables DB_* sont correctes
```

#### **3. Exécution du script :**
```bash
# Initialisation/Mise à jour
npm run setup

# Ou directement
node setup_database.js
```

### 🎯 Ce que fait le script :

#### **✅ Création des tables :**
- `utilisateur` - Utilisateurs du système
- `proprietaire` - Informations des propriétaires
- `locataire` - Informations des locataires
- `bien` - Biens immobiliers
- `photosbien` - Photos des biens
- `contrat` - Contrats de location
- `paiement` - Paiements des loyers
- `probleme` - Signalements de problèmes
- `photos_probleme` - Photos des problèmes
- `notification` - Notifications système

#### **✅ Création des index :**
- Optimisation des performances
- Accélère les requêtes fréquentes

#### **✅ Insertion des données de test :**
- 3 comptes utilisateurs de test
- 2 propriétaires
- 1 locataire
- (uniquement si la base est vide)

### 📊 Structure des Tables

#### **Utilisateurs :**
```sql
utilisateur (
    id_utilisateur SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    type_utilisateur ENUM('proprietaire', 'locataire', 'admin'),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_actif BOOLEAN DEFAULT true
)
```

#### **Biens :**
```sql
bien (
    id_bien SERIAL PRIMARY KEY,
    id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_bien ENUM('appartement', 'maison', 'studio', 'villa', 'duplex', 'chambre'),
    loyer_mensuel DECIMAL(10,2) NOT NULL,
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    superficie DECIMAL(8,2) NOT NULL,
    nombre_pieces INTEGER NOT NULL,
    statut ENUM('disponible', 'loué', 'en_maintenance', 'indisponible'),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### 🔑 Comptes de Test

#### **Propriétaires :**
- **Email** : `yessoufouzenabou46@gmail.com`
- **Mot de passe** : `123456`

- **Email** : `assaninazifatou@gmail.com`
- **Mot de passe** : `123456`

#### **Locataires :**
- **Email** : `agossouroland@gmail.com`
- **Mot de passe** : `agossou12`

### 🚨 Dépannage

#### **Erreur de connexion :**
```bash
# Vérifier que PostgreSQL est en cours d'exécution
pg_isready

# Vérifier la base de données
psql -U postgres -l
```

#### **Permissions :**
```bash
# Donner les permissions à l'utilisateur
GRANT ALL PRIVILEGES ON DATABASE gestion_immobiliere TO votre_utilisateur;
```

#### **Réinitialisation complète :**
```bash
# Supprimer et recréer la base
dropdb gestion_immobiliere
createdb gestion_immobiliere

# Relancer le script
npm run setup
```

### 📋 Vérification

Après exécution, vérifiez que tout est correct :

```bash
# Se connecter à la base
psql -U postgres -d gestion_immobiliere

# Vérifier les tables
\dt

# Vérifier les données
SELECT COUNT(*) FROM utilisateur;
SELECT email, type_utilisateur FROM utilisateur;
```

### 🔄 Mises à jour

Le script est **idempotent** :
- ✅ Peut être exécuté plusieurs fois
- ✅ Ne crée pas les tables existantes
- ✅ Ajoute seulement les éléments manquants
- ✅ Préserve les données existantes

### 📞 Support

En cas de problème :
1. Vérifiez les logs du script
2. Consultez `docs/TROUBLESHOOTING.md`
3. Vérifiez la configuration `.env`

---

**🎯 Le script garantit une base de données propre et fonctionnelle !** ✨
