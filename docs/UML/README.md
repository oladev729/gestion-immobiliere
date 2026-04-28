# Diagrammes UML - ImmoGest

## 📋 Table des matières

1. [Diagramme de Cas d'Utilisation](#diagramme-de-cas-dutilisation)
2. [Diagramme de Classes](#diagramme-de-classes)
3. [Diagramme de Séquence](#diagramme-de-séquence)
4. [Diagramme d'Activité](#diagramme-dactivité)
5. [Diagramme d'États](#diagramme-détats)

## 🎯 Diagramme de Cas d'Utilisation

### Acteurs principaux
- **Propriétaire** : Gère ses biens et locataires
- **Locataire** : Recherche et gère sa location
- **Système** : Plateforme ImmoGest
- **CaurisPay** : Service de paiement externe

### Cas d'utilisation principaux

#### Propriétaire
- Gérer les biens immobiliers
- Créer et suivre les contrats
- Gérer les paiements
- Traiter les demandes de maintenance
- Communiquer avec les locataires

#### Locataire
- Rechercher des biens
- Soumettre des demandes de location
- Effectuer des paiements
- Signaler des problèmes
- Communiquer avec le propriétaire

## 🏗️ Diagramme de Classes

### Classes principales

#### Utilisateur
```
+------------------------+
|       Utilisateur       |
+------------------------+
| - id: Integer          |
| - email: String        |
| - password: String     |
| - type: String         |
| - nom: String          |
| - prenoms: String      |
| - telephone: String    |
| - created_at: Date     |
+------------------------+
| + s'inscrire()         |
| + seConnecter()        |
| + mettreAJourProfil()   |
+------------------------+
        ▲
        |
+----------------+----------------+
|                |                |
|   Propriétaire  |     Locataire    |
+----------------+----------------+
| - id_proprietaire | - id_locataire  |
+----------------+----------------+
| + ajouterBien()   | + rechercherBien()|
| + creerContrat()  | + payerLoyer()   |
| + gererPaiements()| + signalerProbleme()|
+----------------+----------------+
```

#### Bien Immobilier
```
+--------------------------+
|        BienImmobilier     |
+--------------------------+
| - id_bien: Integer       |
| - titre: String          |
| - description: Text       |
| - type: String           |
| - adresse: String        |
| - ville: String          |
| - loyer_mensuel: Float   |
| - caution: Float         |
| - superficie: Integer     |
| - nombre_pieces: Integer |
| - statut: String         |
| - created_at: Date       |
+--------------------------+
| + creer()                |
| + modifier()             |
| + supprimer()            |
| + verifierDisponibilite()|
+--------------------------+
```

#### Contrat
```
+------------------------+
|        Contrat          |
+------------------------+
| - id_contrat: Integer   |
| - id_bien: Integer      |
| - id_locataire: Integer |
| - id_proprietaire: Integer|
| - date_debut: Date      |
| - date_fin: Date        |
| - loyer_mensuel: Float  |
| - caution: Float        |
| - statut: String        |
| - created_at: Date      |
+------------------------+
| + creer()               |
| + signer()              |
| + resilier()            |
| + genererPDF()          |
+------------------------+
```

#### Paiement
```
+------------------------+
|        Paiement         |
+------------------------+
| - id_paiement: Integer |
| - id_contrat: Integer  |
| - id_locataire: Integer|
| - montant: Float       |
| - type_paiement: String |
| - statut: String       |
| - date_paiement: Date   |
| - reference: String    |
| - methode: String      |
+------------------------+
| + initierPaiement()     |
| + verifierStatut()      |
| + confirmerPaiement()   |
+------------------------+
```

## 🔄 Diagramme de Séquence

### Processus de Paiement CaurisPay

```
Propriétaire    Système      CaurisPay      Locataire
    |              |             |             |
    |--CréerContrat--->|             |             |
    |              |             |             |
    |<--ContratCréé--|             |             |
    |              |             |             |
    |              |--InitierPaiement-->|         |
    |              |             |             |
    |              |<--PaiementInitié--|         |
    |              |             |             |
    |              |             |--NotifPaiement-->|
    |              |             |             |
    |              |             |<--ConfirmationPaiement--|
    |              |             |             |
    |<--PaiementConfirmé--|             |             |
    |              |             |             |
```

### Processus de Recherche de Bien

```
Locataire      Système        Base de Données
    |              |                 |
    |--Rechercher-->|                 |
    |              |                 |
    |              |--QueryBiens----->|
    |              |                 |
    |              |<--ResultatsBiens--|
    |              |                 |
    |<--ListeBiens--|                 |
    |              |                 |
    |--VoirDétails->|                 |
    |              |                 |
    |              |--GetBienDetails->|
    |              |                 |
    |              |<--BienDetails---|
    |              |                 |
    |<--DétailsBien--|                 |
    |              |                 |
```

## 📋 Diagramme d'Activité

### Processus d'Inscription Propriétaire

```
[Début]
  |
  v
[Remplir Formulaire]
  |
  v
[Valider Email]
  |
  v
{Email Valide?}--Non-->[Afficher Erreur]
  |Oui                    |
  v                       |
[Valider Mot de Passe]     |
  |                       |
  v                       |
{Mot de Passe Valide?}--Non-->[Afficher Erreur]
  |Oui                    |
  v                       |
[Créer Compte]            |
  |                       |
  v                       |
[Envoyer Email Confirmation]
  |
  v
[Rediriger vers Dashboard]
  |
  v
[Fin]
```

### Processus de Paiement

```
[Début]
  |
  v
[Sélectionner Contrat]
  |
  v
[Choisir Type Paiement]
  |
  v
[Saisir Montant]
  |
  v
[Sélectionner Méthode]
  |
  v
{CaurisPay?}--Non-->[Formulaire Bancaire]
  |Oui                    |
  v                       |
[Rediriger vers CaurisPay]|
  |                       |
  v                       |
[Paiement Externe]-------|
  |                       |
  v                       |
[Retour Callback]--------|
  |                       |
  v                       |
[Vérifier Statut]---------|
  |                       |
  v                       |
[Mettre à Jour Contrat]--|
  |                       |
  v                       |
[Envoyer Confirmation]----|
  |                       |
  v                       |
[Fin]---------------------|
```

## 🔄 Diagramme d'États

### Cycle de Vie d'un Bien Immobilier

```
        [Créé]
           |
           v
    [Disponible]
           |
           v
    [Réservé]--Annulation-->[Disponible]
           |
           v
      [Loué]--Fin Contrat-->[Disponible]
           |
           v
    [En Maintenance]
           |
           v
        [Disponible]
```

### État d'un Paiement

```
      [Initié]
         |
         v
    [En Attente]
         |
         v
    [Traité]--Échec-->[Annulé]
         |              |
         v              |
     [Succès]----------|
         |
         v
    [Confirmé]
```

## 🔗 Relations entre Classes

### Association
- **Propriétaire** 1..* → **BienImmobilier**
- **BienImmobilier** 1..1 → **Contrat**
- **Locataire** 1..* → **Contrat**
- **Contrat** 1..* → **Paiement**
- **Utilisateur** 1..* → **Message**

### Agrégation
- **Contrat** → **BienImmobilier** (un contrat concerne un bien)
- **Paiement** → **Contrat** (un paiement est lié à un contrat)

### Composition
- **Contrat** → **Clauses** (un contrat est composé de clauses)
- **BienImmobilier** → **Photos** (un bien est composé de photos)

## 📊 Patterns Utilisés

### Singleton
- **DatabaseConnection** : Gestion unique de la connexion BDD
- **Logger** : Gestion centralisée des logs

### Factory
- **PaymentFactory** : Création de différents types de paiement
- **DocumentFactory** : Génération de différents documents

### Observer
- **NotificationSystem** : Notification des changements d'état
- **PaymentStatusObserver** : Suivi des changements de statut de paiement

### Strategy
- **PaymentStrategy** : Différentes méthodes de paiement
- **ValidationStrategy** : Différentes stratégies de validation

## 🎯 Architecture Globale

### Couches
1. **Presentation** : Components React
2. **Business** : Services et Controllers
3. **Persistence** : Models et Database
4. **External** : APIs externes (CaurisPay)

### Flux de Données
```
Frontend → API Gateway → Controllers → Services → Models → Database
                ↓
            External APIs (CaurisPay, Email, SMS)
```

## 📝 Notes d'Implémentation

- **Base de données** : PostgreSQL avec relations claires
- **API REST** : Respect des principes RESTful
- **Authentification** : JWT tokens
- **Validation** : Input validation à tous les niveaux
- **Logging** : Traçabilité complète des actions
- **Sécurité** : Protection contre les attaques courantes
