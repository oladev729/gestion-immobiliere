-- Création de la table des invitations de contrat
CREATE TABLE IF NOT EXISTS contract_invitations (
    id_invitation SERIAL PRIMARY KEY,
    id_contrat INTEGER NOT NULL REFERENCES contrats(id_contrat),
    id_locataire INTEGER NOT NULL REFERENCES locataires(id_locataire),
    id_proprietaire INTEGER NOT NULL REFERENCES proprietaire(id_proprietaire),
    id_bien INTEGER NOT NULL REFERENCES biens(id_bien),
    email_locataire VARCHAR(255) NOT NULL,
    message_invitation TEXT,
    token_invitation VARCHAR(255) UNIQUE NOT NULL,
    date_creation TIMESTAMP DEFAULT NOW(),
    date_expiration TIMESTAMP NOT NULL,
    date_acceptation TIMESTAMP,
    date_refus TIMESTAMP,
    statut_invitation VARCHAR(50) DEFAULT 'envoyée' CHECK (statut_invitation IN ('envoyée', 'acceptée', 'refusée', 'expirée'))
);

-- Index pour accélérer les recherches par token
CREATE INDEX idx_contract_invitations_token ON contract_invitations(token_invitation);

-- Index pour les invitations en cours
CREATE INDEX idx_contract_invitations_actives ON contract_invitations(token_invitation, date_expiration, statut_invitation) 
WHERE statut_invitation = 'envoyée' AND date_expiration > NOW();

-- Commentaires sur la table
COMMENT ON TABLE contract_invitations IS 'Table pour gérer les invitations de contrats envoyées aux locataires';
COMMENT ON COLUMN contract_invitations.token_invitation IS 'Token unique pour l\'invitation';
COMMENT ON COLUMN contract_invitations.statut_invitation IS 'Statut de l\'invitation: envoyée, acceptée, refusée, expirée';
