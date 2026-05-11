-- ============================================================
-- AJOUTER COLONNES DATE D'ÉCHÉANCE À LA TABLE ALERTES
-- ============================================================

-- Ajouter la colonne pour la date d'échéance
ALTER TABLE alertes 
ADD COLUMN IF NOT EXISTS date_echeance TIMESTAMP;

-- Ajouter la colonne pour les rappels automatiques
ALTER TABLE alertes 
ADD COLUMN IF NOT EXISTS rappels_envoyes TEXT DEFAULT '[]'; -- Format JSON: ["J-30", "J-15", "J-7"]

-- Ajouter la colonne pour le statut de l'échéance
ALTER TABLE alertes 
ADD COLUMN IF NOT EXISTS statut_echeance VARCHAR(20) DEFAULT 'en_attente'; -- 'en_attente', 'rappel_envoye', 'expire'

-- Index pour optimisation des recherches d'échéances
CREATE INDEX IF NOT EXISTS idx_alertes_date_echeance ON alertes(date_echeance);
CREATE INDEX IF NOT EXISTS idx_alertes_statut_echeance ON alertes(statut_echeance);
CREATE INDEX IF NOT EXISTS idx_alertes_type_fiscale ON alertes(type_alerte) WHERE type_alerte = 'fiscale';
