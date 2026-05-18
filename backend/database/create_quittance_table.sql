-- ============================================================
-- TABLE QUITTANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS quittance (
    id_quittance SERIAL PRIMARY KEY,
    id_paiement INTEGER REFERENCES payement(id_payment),
    id_locataire INTEGER REFERENCES utilisateur(id_utilisateur),
    id_proprietaire INTEGER REFERENCES utilisateur(id_utilisateur),
    id_bien INTEGER REFERENCES bien(id_bien),
    
    -- Type de quittance
    type_quittance VARCHAR(20) NOT NULL DEFAULT 'loyer', -- 'loyer', 'charge', 'depot'
    
    -- Période concernée (format: AAAA-MM)
    periode VARCHAR(7),
    
    -- Montant et dates
    montant DECIMAL(10,2) NOT NULL,
    date_paiement TIMESTAMP,
    reference_paiement VARCHAR(100),
    
    -- Métadonnées
    date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'valide', -- 'valide', 'annulee'
    
    -- Informations supplémentaires
    notes TEXT,
    url_pdf VARCHAR(500) -- URL vers le PDF généré
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_quittance_locataire ON quittance(id_locataire);
CREATE INDEX IF NOT EXISTS idx_quittance_proprietaire ON quittance(id_proprietaire);
CREATE INDEX IF NOT EXISTS idx_quittance_bien ON quittance(id_bien);
CREATE INDEX IF NOT EXISTS idx_quittance_periode ON quittance(periode);
CREATE INDEX IF NOT EXISTS idx_quittance_type ON quittance(type_quittance);
