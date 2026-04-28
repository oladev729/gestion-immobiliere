# API Documentation - ImmoGest

## 📋 Table des matières

1. [Authentification](#authentification)
2. [Utilisateurs](#utilisateurs)
3. [Biens Immobiliers](#biens-immobiliers)
4. [Contrats](#contrats)
5. [Paiements](#paiements)
6. [Maintenance](#maintenance)
7. [Messagerie](#messagerie)

## 🔐 Authentification

### Inscription
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "type": "proprietaire|locataire",
  "nom": "Nom",
  "prenoms": "Prénoms"
}
```

### Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "type": "proprietaire|locataire"
}
```

**Réponse :**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "type": "proprietaire"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 👥 Utilisateurs

### Profil utilisateur
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### Mise à jour profil
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "Nouveau nom",
  "prenoms": "Nouveaux prénoms",
  "telephone": "+229XXXXXXXX"
}
```

## 🏠 Biens Immobiliers

### Liste des biens (propriétaire)
```http
GET /api/biens
Authorization: Bearer <token>
```

### Créer un bien
```http
POST /api/biens
Authorization: Bearer <token>
Content-Type: application/json

{
  "titre": "Appartement 3 pièces",
  "description": "Bel appartement en centre-ville",
  "type": "appartement",
  "adresse": "123 Rue Example",
  "ville": "Cotonou",
  "loyer_mensuel": 150000,
  "caution": 300000,
  "superficie": 90,
  "nombre_pieces": 3
}
```

### Détails d'un bien
```http
GET /api/biens/:id
Authorization: Bearer <token>
```

### Biens disponibles (locataire)
```http
GET /api/biens/disponibles
Authorization: Bearer <token>
```

## 📋 Contrats

### Liste des contrats
```http
GET /api/contrats
Authorization: Bearer <token>
```

### Créer un contrat
```http
POST /api/contrats
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_bien": 1,
  "id_locataire": 2,
  "date_debut": "2024-01-01",
  "date_fin": "2024-12-31",
  "loyer_mensuel": 150000,
  "caution": 300000,
  "frequence_paiement": "mensuel"
}
```

### Générer PDF du contrat
```http
GET /api/contrats/:id/pdf
Authorization: Bearer <token>
```

## 💰 Paiements

### Historique des paiements
```http
GET /api/paiements
Authorization: Bearer <token>
```

### Initier un paiement CaurisPay
```http
POST /api/paiements/caurispay/initier
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_contact": 1,
  "type_paiement": "loyer",
  "montant": 150000,
  "telephone": "+229XXXXXXXX",
  "operateur": "MTN"
}
```

**Réponse :**
```json
{
  "success": true,
  "payment": {
    "reference": "CAU-123456789",
    "amount": 150000,
    "status": "pending",
    "payment_url": "https://caurispay.com/payment/CAU-123456789"
  }
}
```

### Vérifier statut paiement
```http
GET /api/paiements/caurispay/statut/:reference
Authorization: Bearer <token>
```

### Données widget CaurisPay
```http
GET /api/paiements/caurispay/widget
Authorization: Bearer <token>
```

## 🔧 Maintenance

### Signaler un problème
```http
POST /api/maintenance/signaler
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_bien": 1,
  "type_probleme": "fuite",
  "description": "Fuite d'eau dans la salle de bain",
  "urgence": "moyenne"
}
```

### Liste des demandes de maintenance
```http
GET /api/maintenance/demandes
Authorization: Bearer <token>
```

### Marquer comme résolu
```http
PUT /api/maintenance/:id/resoudre
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Fuite réparée",
  "cout": 25000
}
```

## 💬 Messagerie

### Conversations
```http
GET /api/messages/conversations
Authorization: Bearer <token>
```

### Messages d'une conversation
```http
GET /api/messages/conversation/:id
Authorization: Bearer <token>
```

### Envoyer un message
```http
POST /api/messages/envoyer
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_destinataire": 2,
  "contenu": "Bonjour, je souhaiterais discuter du contrat..."
}
```

### Marquer messages comme lus
```http
PUT /api/messages/lire/:id
Authorization: Bearer <token>
```

## 📊 Statistiques

### Dashboard propriétaire
```http
GET /api/stats/proprietaire
Authorization: Bearer <token>
```

**Réponse :**
```json
{
  "total_biens": 5,
  "biens_occupes": 4,
  "total_loyers": 600000,
  "loyers_en_retard": 2,
  "maintenance_en_cours": 1
}
```

### Dashboard locataire
```http
GET /api/stats/locataire
Authorization: Bearer <token>
```

## 🔍 Recherche

### Rechercher des biens
```http
GET /api/biens/recherche?q=appartement&ville=Cotonou&prix_max=200000
Authorization: Bearer <token>
```

## 📄 Téléchargements

### Télécharger un document
```http
GET /api/documents/:id/download
Authorization: Bearer <token>
```

### Upload de document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": <fichier>,
  "type": "contrat|identite|justificatif",
  "description": "Description du document"
}
```

## 🚨 Erreurs

### Format des erreurs
```json
{
  "success": false,
  "message": "Erreur description",
  "error": "ERROR_CODE"
}
```

### Codes d'erreur courants
- `UNAUTHORIZED` : Token invalide ou manquant
- `FORBIDDEN` : Permissions insuffisantes
- `NOT_FOUND` : Ressource non trouvée
- `VALIDATION_ERROR` : Données invalides
- `PAYMENT_ERROR` : Erreur de paiement CaurisPay

## 🔄 Webhooks

### CaurisPay Webhook
```http
POST /api/paiements/caurispay/webhook
Content-Type: application/json

{
  "reference": "CAU-123456789",
  "status": "completed",
  "amount": 150000,
  "transaction_id": "TXN-123456"
}
```

## 📝 Notes

- Toutes les requêtes nécessitent un token JWT valide
- Les uploads sont limités à 10MB
- Les réponses sont au format JSON
- La pagination utilise `page` et `limit`
- Les timestamps sont au format ISO 8601
