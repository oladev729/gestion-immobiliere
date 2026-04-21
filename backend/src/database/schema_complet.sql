-- =============================================================
-- SCRIPT DE CRÉATION DES TABLES - IMMOGEST
-- =============================================================

-- Suppression des tables existantes (ordre respectant les clés étrangères)
DROP TABLE IF EXISTS photosbp, photosbien, problemes, demander_visite, notification, payement, loyermensuel, depotgarantie, contact, invitation_locataire, locataire, bien, proprietaire, demande_inscription_visiteur, mode_paiement, utilisateur CASCADE;

-- 1. Table des utilisateurs (Base pour tous les rôles)
CREATE TABLE utilisateur (
    id_utilisateur SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenoms VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255) NOT NULL,
    type_utilisateur VARCHAR(20) CHECK (type_utilisateur IN ('admin', 'proprietaire', 'locataire', 'visiteur')),
    statut VARCHAR(20) DEFAULT 'actif',
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP
);

-- 2. Profil Propriétaire
CREATE TABLE proprietaire (
    id_proprietaire SERIAL PRIMARY KEY,
    id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    adresse_fiscale TEXT
);

-- 3. Profil Locataire
CREATE TABLE locataire (
    id_locataire SERIAL PRIMARY KEY,
    id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL,
    date_invitation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    compte_confirme BOOLEAN DEFAULT FALSE,
    token_invitation VARCHAR(255),
    date_confirmation TIMESTAMP,
    email_invite VARCHAR(150),
    date_expiration_token TIMESTAMP,
    statut_invitation VARCHAR(20) DEFAULT 'en_attente',
    date_naissance DATE,
    piece_identite VARCHAR(255)
);

-- 4. Table des Biens Immobiliers
CREATE TABLE bien (
    id_bien SERIAL PRIMARY KEY,
    id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_bien VARCHAR(50),
    charge NUMERIC DEFAULT 0,
    loyer_mensuel NUMERIC NOT NULL,
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    superficie NUMERIC,
    nombre_pieces INTEGER,
    nombre_chambres INTEGER,
    meuble BOOLEAN DEFAULT FALSE,
    statut VARCHAR(20) DEFAULT 'disponible',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table des Contrats (Bail)
CREATE TABLE contact (
    id_contact SERIAL PRIMARY KEY,
    numero_contrat VARCHAR(50) UNIQUE NOT NULL,
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    date_debut DATE NOT NULL,
    date_fin DATE,
    loyer_mensuel NUMERIC NOT NULL,
    charge NUMERIC DEFAULT 0,
    nb_mois_depot_guarantie INTEGER DEFAULT 1,
    montant_depot_guarantie_attendu NUMERIC,
    date_signature TIMESTAMP,
    statut_contrat VARCHAR(20) DEFAULT 'actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Modes de Paiement
CREATE TABLE mode_paiement (
    id_mode SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL
);

INSERT INTO mode_paiement (libelle) VALUES ('Espèces'), ('Virement'), ('Carte Bancaire'), ('Mobile Money');

-- 7. Échéances de Loyers
CREATE TABLE loyermensuel (
    id_loyer SERIAL PRIMARY KEY,
    id_contact INTEGER REFERENCES contact(id_contact) ON DELETE CASCADE,
    mois_concerne VARCHAR(7) NOT NULL,
    montant_loyer NUMERIC NOT NULL,
    montant_charge NUMERIC DEFAULT 0,
    date_echeance DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'en_attente'
);

-- 8. Dépôts de Garantie (Cautions)
CREATE TABLE depotgarantie (
    id_depot SERIAL PRIMARY KEY,
    id_contact INTEGER REFERENCES contact(id_contact) ON DELETE CASCADE,
    montant_depot_verse NUMERIC NOT NULL,
    date_versement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mode_versement VARCHAR(50),
    commentaire TEXT,
    date_remboursement TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'encaisse'
);

-- 9. Suivi des Paiements
CREATE TABLE payement (
    id_payment SERIAL PRIMARY KEY,
    numero_transaction VARCHAR(100) UNIQUE NOT NULL,
    id_contact INTEGER REFERENCES contact(id_contact),
    id_loyer INTEGER REFERENCES loyermensuel(id_loyer),
    id_depot INTEGER REFERENCES depotgarantie(id_depot),
    id_mode_payment INTEGER REFERENCES mode_paiement(id_mode),
    montant NUMERIC NOT NULL,
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_echeance DATE,
    statut_paiement VARCHAR(20) DEFAULT 'valide'
);

-- 10. Notifications Système
CREATE TABLE notification (
    id_notification SERIAL PRIMARY KEY,
    id_utilisateur INTEGER REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    lu BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_lecture TIMESTAMP
);

-- 11. Demandes de Visites
CREATE TABLE demander_visite (
    id_demande SERIAL PRIMARY KEY,
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire),
    date_visite TIMESTAMP NOT NULL,
    date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse TIMESTAMP,
    message TEXT,
    statut_demande VARCHAR(20) DEFAULT 'en_attente'
);

-- 12. Inscriptions Visiteurs / Prospects
CREATE TABLE demande_inscription_visiteur (
    id_demande SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenoms VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telephone VARCHAR(20),
    message TEXT,
    statut VARCHAR(20) DEFAULT 'en_attente',
    date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Invitations Propriétaires
CREATE TABLE invitation_locataire (
    id_invitation SERIAL PRIMARY KEY,
    id_demande INTEGER REFERENCES demande_inscription_visiteur(id_demande) ON DELETE CASCADE,
    id_proprietaire INTEGER REFERENCES proprietaire(id_proprietaire) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    statut VARCHAR(20) DEFAULT 'envoyee',
    date_invitation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_utilisation TIMESTAMP
);

-- 14. Gestion des Problèmes / Maintenance
CREATE TABLE problemes (
    id_probleme SERIAL PRIMARY KEY,
    id_locataire INTEGER REFERENCES locataire(id_locataire),
    id_bien INTEGER REFERENCES bien(id_bien),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(50),
    priorite VARCHAR(20) DEFAULT 'moyenne',
    statut_probleme VARCHAR(20) DEFAULT 'ouvert',
    date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP
);

-- 15. Photos des Biens
CREATE TABLE photosbien (
    id_photosbien SERIAL PRIMARY KEY,
    id_bien INTEGER REFERENCES bien(id_bien) ON DELETE CASCADE,
    url_photobien TEXT NOT NULL,
    legende VARCHAR(255),
    est_principale BOOLEAN DEFAULT FALSE,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Photos liées aux Problèmes
CREATE TABLE photosbp (
    id_photosbp SERIAL PRIMARY KEY,
    id_probleme INTEGER REFERENCES problemes(id_probleme) ON DELETE CASCADE,
    url_photosbp TEXT NOT NULL,
    description TEXT,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
