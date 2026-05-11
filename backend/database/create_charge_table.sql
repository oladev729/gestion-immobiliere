-- ============================================================
-- TABLE CHARGES
-- ============================================================
CREATE TABLE IF NOT EXISTS charges (
    id_charge SERIAL PRIMARY KEY,
    id_proprietaire INTEGER REFERENCES utilisateur(id_utilisateur),
    id_locataire INTEGER REFERENCES utilisateur(id_utilisateur),
    id_bien INTEGER REFERENCES bien(id_bien),
    
    -- Informations sur la charge
    type_charge VARCHAR(50) NOT NULL, -- 'eau', 'electricite', 'chauffage', 'entretien', 'taxe', 'autre'
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    montant DECIMAL(10,2) NOT NULL,
    
    -- Gestion du paiement
    statut VARCHAR(20) DEFAULT 'impaye', -- 'impaye', 'partiellement_paye', 'paye'
    date_echeance DATE,
    date_paiement TIMESTAMP,
    montant_paye DECIMAL(10,2) DEFAULT 0,
    
    -- Métadonnées
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    periode_facture VARCHAR(7), -- Format: AAAA-MM
    reference_facture VARCHAR(100),
    
    -- Notes et pièces jointes
    notes TEXT,
    pieces_jointes TEXT -- Format JSON pour stocker les URLs des fichiers
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_charges_proprietaire ON charges(id_proprietaire);
CREATE INDEX IF NOT EXISTS idx_charges_locataire ON charges(id_locataire);
CREATE INDEX IF NOT EXISTS idx_charges_bien ON charges(id_bien);
CREATE INDEX IF NOT EXISTS idx_charges_statut ON charges(statut);
CREATE INDEX IF NOT EXISTS idx_charges_echeance ON charges(date_echeance);
CREATE INDEX IF NOT EXISTS idx_charges_periode ON charges(periode_facture);
