-- ============================================================
-- AJOUTER COLONNE TEXTE_MODIFIABLE À LA TABLE CONTACT (CONTRATS)
-- ============================================================

-- Ajouter la colonne pour stocker le texte du contrat
ALTER TABLE contact 
ADD COLUMN IF NOT EXISTS texte_contrat TEXT;

-- Ajouter la colonne pour stocker les clauses personnalisées
ALTER TABLE contact 
ADD COLUMN IF NOT EXISTS clauses_personnalisees TEXT;

-- Ajouter la colonne pour indiquer si le texte est personnalisé
ALTER TABLE contact 
ADD COLUMN IF NOT EXISTS texte_personnalise BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne pour la version du contrat
ALTER TABLE contact 
ADD COLUMN IF NOT EXISTS version_contrat INTEGER DEFAULT 1;

-- Ajouter la colonne pour la date de modification du texte
ALTER TABLE contact 
ADD COLUMN IF NOT EXISTS date_modification_texte TIMESTAMP;

-- Créer un index pour optimisation
CREATE INDEX IF NOT EXISTS idx_contact_texte_personnalise ON contact(texte_personnalise);
