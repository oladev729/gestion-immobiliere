-- Création de la table des messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    id_expediteur INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    id_destinataire INTEGER REFERENCES utilisateurs(id) ON DELETE CASCADE,
    id_bien INTEGER REFERENCES biens(id) ON DELETE SET NULL,
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(id_expediteur);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(id_destinataire);
CREATE INDEX IF NOT EXISTS idx_messages_bien ON messages(id_bien);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(LEAST(id_expediteur, id_destinataire), GREATEST(id_expediteur, id_destinataire), date_envoi);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
