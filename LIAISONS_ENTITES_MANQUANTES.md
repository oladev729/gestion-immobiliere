# 🔗 **LIAISONS ADÉQUATES POUR LES ENTITÉS MANQUANTES**

## 📋 **RÉSUMÉ DES ENTITÉS À AJOUTER**

### 1. **ALERTES** (Déjà implémentée)
### 2. **PHOTOS** (À implémenter)
### 3. **MODE_PAYMENT** (À implémenter)
### 4. **LOCATAIRE_BIEN** (À implémenter)

---

## 🔗 **1. TABLE ALERTES** ✅ **DÉJÀ IMPLÉMENTÉE**

### 📊 **Structure complète**
```sql
CREATE TABLE alertes (
    id_alerte SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_alerte VARCHAR(50) NOT NULL, -- 'maintenance', 'fiscale', 'paiement'
    statut VARCHAR(20) DEFAULT 'en_attente', -- 'en_attente', 'traitee', 'archivée'
    priorite VARCHAR(20) DEFAULT 'moyenne', -- 'basse', 'moyenne', 'haute'
    expediteur_type VARCHAR(20) NOT NULL, -- 'locataire', 'proprietaire', 'systeme'
    destinataire_type VARCHAR(20) NOT NULL,
    id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire),
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP
);
```

### 🔗 **Relations avec les tables existantes**
```sql
-- Relations avec PROPRIÉTAIRE
ALTER TABLE alertes 
ADD CONSTRAINT fk_alertes_proprietaire 
FOREIGN KEY (id_proprietaire) REFERENCES proprietaire(id_proprietaire);

-- Relations avec LOCATAIRE  
ALTER TABLE alertes
ADD CONSTRAINT fk_alertes_locataire
FOREIGN KEY (id_locataire) REFERENCES locataire(id_locataire);

-- Relations avec BIEN
ALTER TABLE alertes
ADD CONSTRAINT fk_alertes_bien
FOREIGN KEY (id_bien) REFERENCES bien(id_bien);
```

### 📝 **Requêtes de liaison**
```sql
-- Alertes d'un propriétaire
SELECT a.*, u.nom, u.prenom, u.email
FROM alertes a
JOIN proprietaire p ON a.id_proprietaire = p.id_proprietaire
JOIN utilisateur u ON p.id_utilisateur = u.id_utilisateur
WHERE p.id_proprietaire = ?;

-- Alertes reçues par un locataire
SELECT a.*, u.nom, u.prenom, u.email
FROM alertes a
JOIN locataire l ON a.id_locataire = l.id_locataire
JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
WHERE l.id_locataire = ?;
```

---

## 📸 **2. TABLE PHOTOS** 📸

### 📊 **Structure**
```sql
CREATE TABLE photos (
    id_photo SERIAL PRIMARY KEY,
    url_photo VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    type_photo VARCHAR(50) NOT NULL, -- 'bien', 'probleme', 'profil', 'contrat'
    id_bien INTEGER REFERENCES bien(id_bien),
    id_probleme INTEGER REFERENCES probleme(id_probleme),
    id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur),
    id_contrat INTEGER REFERENCES contact(id_contact),
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    taille_fichier INTEGER, -- en octets
    format_fichier VARCHAR(10) -- 'jpg', 'png', 'pdf', etc.
);
```

### 🔗 **Relations avec les tables existantes**
```sql
-- Photos des biens
ALTER TABLE photos
ADD CONSTRAINT fk_photos_bien
FOREIGN KEY (id_bien) REFERENCES bien(id_bien);

-- Photos des problèmes
ALTER TABLE photos
ADD CONSTRAINT fk_photos_probleme
FOREIGN KEY (id_probleme) REFERENCES probleme(id_probleme);

-- Photos de profil
ALTER TABLE photos
ADD CONSTRAINT fk_photos_utilisateur
FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur);

-- Photos des contrats
ALTER TABLE photos
ADD CONSTRAINT fk_photos_contrat
FOREIGN KEY (id_contrat) REFERENCES contact(id_contact);
```

### 📝 **Requêtes de liaison**
```sql
-- Photos d'un bien
SELECT p.* FROM photos p
WHERE p.id_bien = ? AND p.type_photo = 'bien'
ORDER BY p.date_upload DESC;

-- Photos d'un problème
SELECT p.* FROM photos p
WHERE p.id_probleme = ? AND p.type_photo = 'probleme'
ORDER BY p.date_upload DESC;

-- Photo de profil d'un utilisateur
SELECT p.* FROM photos p
WHERE p.id_utilisateur = ? AND p.type_photo = 'profil'
ORDER BY p.date_upload DESC LIMIT 1;
```

---

## 💳 **3. TABLE MODE_PAYMENT** 💳

### 📊 **Structure**
```sql
CREATE TABLE mode_payment (
    id_mode_payment SERIAL PRIMARY KEY,
    nom_mode VARCHAR(100) NOT NULL, -- 'CaurisPay', 'Espèces', 'Virement', 'Chèque'
    description TEXT,
    actif BOOLEAN DEFAULT true,
    frais_transaction DECIMAL(10,2) DEFAULT 0.00,
    delai_traitement INTEGER, -- en heures
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔗 **Relations avec les tables existantes**
```sql
-- Intégration dans la table payement
ALTER TABLE payement
ADD COLUMN id_mode_payment INTEGER REFERENCES mode_payment(id_mode_payment);

-- Valeurs par défaut
INSERT INTO mode_payment (nom_mode, description, frais_transaction, delai_traitement) VALUES
('CaurisPay', 'Paiement en ligne sécurisé', 0.02, 0),
('Espèces', 'Paiement en espèces', 0.00, 0),
('Virement bancaire', 'Virement bancaire classique', 0.00, 48),
('Chèque', 'Paiement par chèque', 0.00, 72);
```

### 📝 **Requêtes de liaison**
```sql
-- Modes de paiement actifs
SELECT * FROM mode_payment WHERE actif = true;

-- Paiements avec leur mode
SELECT p.*, mp.nom_mode, mp.description
FROM payement p
JOIN mode_payment mp ON p.id_mode_payment = mp.id_mode_payment
WHERE p.id_contact = ?;
```

---

## 🏠 **4. TABLE LOCATAIRE_BIEN** 🏠

### 📊 **Structure**
```sql
CREATE TABLE locataire_bien (
    id_locataire_bien SERIAL PRIMARY KEY,
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'actif', -- 'actif', 'termine', 'suspendu'
    motif_fin VARCHAR(255), -- 'fin_contrat', 'resiliation', 'expulsion'
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔗 **Relations avec les tables existantes**
```sql
-- Relations avec LOCATAIRE
ALTER TABLE locataire_bien
ADD CONSTRAINT fk_locataire_bien_locataire
FOREIGN KEY (id_locataire) REFERENCES locataire(id_locataire);

-- Relations avec BIEN
ALTER TABLE locataire_bien
ADD CONSTRAINT fk_locataire_bien_bien
FOREIGN KEY (id_bien) REFERENCES bien(id_bien);

-- Trigger pour mise à jour du statut du bien
CREATE OR REPLACE FUNCTION update_bien_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'actif' THEN
        UPDATE bien SET statut = 'loue' WHERE id_bien = NEW.id_bien;
    ELSIF NEW.statut = 'termine' THEN
        UPDATE bien SET statut = 'disponible' WHERE id_bien = NEW.id_bien;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bien_status
AFTER INSERT OR UPDATE ON locataire_bien
FOR EACH ROW EXECUTE FUNCTION update_bien_status();
```

### 📝 **Requêtes de liaison**
```sql
-- Biens loués par un locataire
SELECT lb.*, b.titre, b.adresse, b.loyer_mensuel
FROM locataire_bien lb
JOIN bien b ON lb.id_bien = b.id_bien
WHERE lb.id_locataire = ? AND lb.statut = 'actif';

-- Locataires d'un bien
SELECT lb.*, l.*, u.nom, u.prenom, u.email
FROM locataire_bien lb
JOIN locataire l ON lb.id_locataire = l.id_locataire
JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
WHERE lb.id_bien = ? AND lb.statut = 'actif';

-- Historique des locations d'un bien
SELECT lb.*, l.*, u.nom, u.prenom
FROM locataire_bien lb
JOIN locataire l ON lb.id_locataire = l.id_locataire
JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
WHERE lb.id_bien = ?
ORDER BY lb.date_debut DESC;
```

---

## 🔄 **5. INTÉGRATION COMPLÈTE**

### 📋 **Diagramme de relations final**
```mermaid
erDiagram
    utilisateur ||--o{ proprietaire
    utilisateur ||--o{ locataire
    proprietaire ||--o{ bien
    locataire ||--o{ locataire_bien
    bien ||--o{ locataire_bien
    proprietaire ||--o{ alertes
    locataire ||--o{ alertes
    bien ||--o{ alertes
    probleme ||--o{ alertes
    bien ||--o{ photos
    probleme ||--o{ photos
    utilisateur ||--o{ photos
    contact ||--o{ photos
    payement ||--o{ mode_payment
    contact ||--o{ payement
```

### 🎯 **Requêtes complexes multi-tables**
```sql
-- Profil complet avec alertes d'un propriétaire
SELECT 
    u.id_utilisateur, u.nom, u.prenom, u.email,
    p.id_proprietaire,
    COUNT(a.id_alerte) as nb_alertes,
    COUNT(CASE WHEN a.statut = 'en_attente' THEN 1 END) as alertes_en_attente
FROM utilisateur u
JOIN proprietaire p ON u.id_utilisateur = p.id_utilisateur
LEFT JOIN alertes a ON p.id_proprietaire = a.id_proprietaire
WHERE u.id_utilisateur = ?
GROUP BY u.id_utilisateur, p.id_proprietaire;

-- Biens avec photos et locataires actifs
SELECT 
    b.*, 
    (SELECT url_photo FROM photos WHERE id_bien = b.id_bien AND type_photo = 'bien' LIMIT 1) as photo_principale,
    (SELECT COUNT(*) FROM photos WHERE id_bien = b.id_bien AND type_photo = 'bien') as nb_photos,
    (SELECT u.nom FROM locataire_bien lb 
     JOIN locataire l ON lb.id_locataire = l.id_locataire 
     JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur 
     WHERE lb.id_bien = b.id_bien AND lb.statut = 'actif' LIMIT 1) as locataire_actif
FROM bien b
WHERE b.id_proprietaire = ?;
```

---

## ✅ **VÉRIFICATION FINALE**

### 🎯 **Points de contrôle**
- [x] **Alertes** : ✅ Implémentée et fonctionnelle
- [ ] **Photos** : 🔄 À implémenter avec uploads
- [ ] **Mode_Payment** : 🔄 À implémenter avec intégration CaurisPay
- [ ] **Locataire_Bien** : 🔄 À implémenter pour l'historique

### 🚀 **Ordre d'implémentation recommandé**
1. **Photos** (priorité haute - galeries essentielles)
2. **Locataire_Bien** (priorité moyenne - historique locations)
3. **Mode_Payment** (priorité basse - amélioration existante)

---

**🎯 Avec ces liaisons, votre diagramme sera complet à 100% !**
