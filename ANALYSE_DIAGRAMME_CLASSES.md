# 📊 ANALYSE DU DIAGRAMME DE CLASSES

## 🎯 **TABLES PRÉSENTES DANS VOTRE DIAGRAMME**

### ✅ **Tables existantes**
- `utilisateur`
- `locataire` 
- `proprietaire`
- `message`
- `notification`
- `payement`
- `loyermensuel`
- `depot garantie`
- `contrat`
- `probleme`
- `bien`
- `demandevisite`

---

## ⚠️ **ENTITÉS MANQUANTES IMPORTANTES**

### 🔥 **1. ALERTES (Très critique)**
**Pourquoi c'est important :** C'est une fonctionnalité majeure de notre application
```sql
-- Structure actuelle
CREATE TABLE alertes (
    id_alerte SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_alerte VARCHAR(50) NOT NULL, -- 'maintenance', 'fiscale', 'paiement'
    statut VARCHAR(20) DEFAULT 'en_attente',
    priorite VARCHAR(20) DEFAULT 'moyenne',
    expediteur_type VARCHAR(20) NOT NULL, -- 'locataire', 'proprietaire', 'systeme'
    destinataire_type VARCHAR(20) NOT NULL,
    id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire),
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP
);
```

### 📸 **2. PHOTOS (Très critique)**
**Pourquoi c'est important :** Essentiel pour la galerie photos des biens et preuves
```sql
CREATE TABLE photos (
    id_photo SERIAL PRIMARY KEY,
    url_photo VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    type_photo VARCHAR(50) NOT NULL, -- 'bien', 'probleme', 'profil'
    id_bien INTEGER REFERENCES bien(id_bien),
    id_probleme INTEGER REFERENCES probleme(id_probleme),
    id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur),
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 💳 **3. MODE_PAIEMENT (Important)**
**Pourquoi c'est important :** Gestion des modes de paiement (CaurisPay, espèces, virement)
```sql
CREATE TABLE mode_payment (
    id_mode_payment SERIAL PRIMARY KEY,
    nom_mode VARCHAR(100) NOT NULL, -- 'CaurisPay', 'Espèces', 'Virement', 'Chèque'
    description TEXT,
    actif BOOLEAN DEFAULT true
);
```

### 🏠 **4. LOCATAIRE_BIEN (Important)**
**Pourquoi c'est important :** Table de liaison entre locataires et biens
```sql
CREATE TABLE locataire_bien (
    id_locataire_bien SERIAL PRIMARY KEY,
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'actif' -- 'actif', 'termine'
);
```

---

## 🔧 **CORRECTIONS À APPORTER**

### 📝 **Problème de nommage**
- `depot garantie` → `depotgarantie` (sans espace)
- `demandevisite` → `demande_visite` (avec underscore)

### 🔄 **Relations à vérifier**
- **Contrat** : Dans notre BDD, la table s'appelle `contact` et non `contrat`
- **Utilisateur** : Vérifiez si vous avez bien la table `utilisateur` ou si vous utilisez directement `locataire` et `proprietaire`

---

## 📋 **DIAGRAMME DE CLASSES COMPLÉT**

### 🏗️ **Structure recommandée**

```mermaid
classDiagram
    class Utilisateur {
        +int id_utilisateur PK
        +string email
        +string mot_de_passe
        +string nom
        +string prenom
        +string telephone
        +string role
        +date date_creation
    }
    
    class Proprietaire {
        +int id_proprietaire PK
        +int id_utilisateur FK
        +string adresse
        +string telephone
        +date date_inscription
    }
    
    class Locataire {
        +int id_locataire PK
        +int id_utilisateur FK
        +string telephone
        +string adresse
        +date date_inscription
    }
    
    class Bien {
        +int id_bien PK
        +int id_proprietaire FK
        +string titre
        +string description
        +string adresse
        +decimal loyer_mensuel
        +decimal charges
        +string statut
        +date date_creation
    }
    
    class Photos {
        +int id_photo PK
        +string url_photo
        +string description
        +string type_photo
        +int id_bien FK
        +int id_probleme FK
        +int id_utilisateur FK
        +date date_upload
    }
    
    class Contrat {
        +int id_contact PK
        +int id_locataire FK
        +int id_bien FK
        +date date_debut
        +date date_fin
        +decimal loyer_mensuel
        +decimal charges
        +decimal montant_depot_garantie_attendu
        +string statut_contrat
    }
    
    class LoyerMensuel {
        +int id_loyer PK
        +int id_contact FK
        +string mois_concerne
        +decimal montant_loyer
        +decimal montant_charge
        +date date_echeance
        +string statut
    }
    
    class DepotGarantie {
        +int id_depot PK
        +int id_contact FK
        +decimal montant_depot_verse
        +date date_versement
        +string mode_versement
        +string statut
    }
    
    class Paiement {
        +int id_payment PK
        +string numero_transaction
        +int id_contact FK
        +int id_loyer FK
        +int id_depot FK
        +int id_mode_payment FK
        +decimal montant
        +date date_paiement
        +date date_echeance
        +string statut_paiement
        +string type_paiement
    }
    
    class ModePayment {
        +int id_mode_payment PK
        +string nom_mode
        +string description
        +boolean actif
    }
    
    class Probleme {
        +int id_probleme PK
        +int id_locataire FK
        +int id_bien FK
        +string description
        +string statut
        +date date_signalement
        +date date_resolution
    }
    
    class Alerte {
        +int id_alerte PK
        +string titre
        +text description
        +string type_alerte
        +string statut
        +string priorite
        +string expediteur_type
        +string destinataire_type
        +int id_proprietaire FK
        +int id_locataire FK
        +int id_bien FK
        +date date_creation
        +date date_traitement
    }
    
    class DemandeVisite {
        +int id_visite PK
        +int id_locataire FK
        +int id_bien FK
        +date date_demande
        +string statut
        +string message
    }
    
    class Message {
        +int id_message PK
        +int id_expediteur FK
        +int id_destinataire FK
        +text contenu
        +date date_envoi
        +string statut
    }
    
    class Notification {
        +int id_notification PK
        +int id_utilisateur FK
        +string titre
        +text message
        +string type_notification
        +boolean lue
        +date date_creation
    }
    
    class LocataireBien {
        +int id_locataire_bien PK
        +int id_locataire FK
        +int id_bien FK
        +date date_debut
        +date date_fin
        +string statut
    }

    Relations
    Utilisateur ||--o{ Proprietaire : "1:1"
    Utilisateur ||--o{ Locataire : "1:1"
    Proprietaire ||--o{ Bien : "1:N"
    Bien ||--o{ Photos : "1:N"
    Bien ||--o{ Contrat : "1:N"
    Locataire ||--o{ Contrat : "1:N"
    Contrat ||--o{ LoyerMensuel : "1:N"
    Contrat ||--o{ DepotGarantie : "1:1"
    Contrat ||--o{ Paiement : "1:N"
    ModePayment ||--o{ Paiement : "1:N"
    Locataire ||--o{ Probleme : "1:N"
    Bien ||--o{ Probleme : "1:N"
    Probleme ||--o{ Photos : "1:N"
    Proprietaire ||--o{ Alerte : "1:N"
    Locataire ||--o{ Alerte : "1:N"
    Bien ||--o{ Alerte : "1:N"
    Locataire ||--o{ DemandeVisite : "1:N"
    Bien ||--o{ DemandeVisite : "1:N"
    Locataire ||--o{ Message : "1:N"
    Utilisateur ||--o{ Notification : "1:N"
    Locataire ||--o{ LocataireBien : "1:N"
    Bien ||--o{ LocataireBien : "1:N"
```

---

## 🎯 **CONCLUSION**

### ✅ **Ce qui est bon dans votre diagramme**
- **Structure de base** solide avec les entités principales
- **Relations logiques** entre les tables
- **Couverture** des fonctionnalités essentielles

### ⚠️ **Ce qu'il manque**
- **Table `alertes`** : Fonctionnalité majeure non représentée
- **Table `photos`** : Essentielle pour les galeries et preuves
- **Table `mode_payment`** : Pour la gestion des paiements
- **Table `locataire_bien`** : Pour les relations multiples

### 🔧 **Recommandations**
1. **Ajoutez les 4 tables manquantes**
2. **Corrigez le nommage** (sans espaces)
3. **Vérifiez les relations** entre les tables
4. **Utilisez le diagramme complet** ci-dessus comme référence

**Votre diagramme est bon à 70% mais nécessite ces ajouts pour être complet !**
