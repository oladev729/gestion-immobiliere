const Quittance = require('../models/Quittance');
const db = require('../config/database');

const quittanceController = {
    // ============================================================
    // GÉNÉRER UNE QUITTANCE AUTOMATIQUEMENT
    // ============================================================
    async generateQuittance(req, res) {
        try {
            console.log('🧾 Génération de quittance automatique...');
            const { id_paiement, type_quittance } = req.body;
            console.log('📥 Données reçues:', { id_paiement, type_quittance });

            // Récupérer les informations du paiement
            const paiementQuery = `
                SELECT p.*, 
                       lm.id_contact, lm.mois_concerne, lm.date_echeance,
                       c.id_locataire, c.id_bien,
                       l.id_utilisateur as locataire_id_utilisateur,
                       b.id_proprietaire,
                       prop.id_utilisateur as proprietaire_id_utilisateur,
                       b.titre as bien_titre
                FROM payement p
                LEFT JOIN loyermensuel lm ON p.id_loyer = lm.id_loyer
                LEFT JOIN contact c ON lm.id_contact = c.id_contact
                LEFT JOIN locataire l ON c.id_locataire = l.id_locataire
                LEFT JOIN bien b ON c.id_bien = b.id_bien
                LEFT JOIN proprietaire prop ON b.id_proprietaire = prop.id_proprietaire
                WHERE p.id_payment = $1
            `;
            
            console.log('🔍 Exécution de la requête paiement avec id:', id_paiement);
            const paiementResult = await db.query(paiementQuery, [id_paiement]);
            console.log('📊 Résultat paiement:', paiementResult.rows.length, 'lignes');
            
            if (paiementResult.rows.length === 0) {
                console.log('❌ Paiement non trouvé');
                return res.status(404).json({ message: 'Paiement non trouvé' });
            }

            const paiement = paiementResult.rows[0];
            console.log('✅ Paiement trouvé:', paiement);
            
            // Générer la référence
            const reference = await Quittance.generateReference();

            // Créer la quittance
            const quittanceData = {
                id_paiement: id_paiement,
                id_locataire: paiement.locataire_id_utilisateur,
                id_proprietaire: paiement.proprietaire_id_utilisateur,
                id_bien: paiement.id_bien,
                type_quittance: type_quittance || 'loyer',
                periode: paiement.mois_concerne || new Date().toISOString().slice(0, 7),
                montant: paiement.montant,
                date_paiement: paiement.date_paiement,
                reference_paiement: paiement.numero_transaction || reference
            };

            console.log('📝 Données quittance:', quittanceData);
            const quittance = await Quittance.create(quittanceData);
            console.log('✅ Quittance créée:', quittance);

            res.status(201).json({
                message: 'Quittance générée avec succès',
                quittance
            });

        } catch (error) {
            console.error('❌ Erreur génération quittance:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({ 
                message: 'Erreur serveur lors de la génération de la quittance',
                details: error.message 
            });
        }
    },

    // ============================================================
    // OBTENIR LES QUITTANCES DU LOCATAIRE
    // ============================================================
    async getQuittancesLocataire(req, res) {
        try {
            const id_locataire = req.user.id;
            const quittances = await Quittance.findByLocataire(id_locataire);
            
            res.json({
                message: 'Quittances récupérées avec succès',
                quittances
            });

        } catch (error) {
            console.error('Erreur récupération quittances locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // OBTENIR LES QUITTANCES DU PROPRIÉTAIRE
    // ============================================================
    async getQuittancesProprietaire(req, res) {
        try {
            // Récupérer l'ID propriétaire depuis l'utilisateur
            const proprioQuery = `
                SELECT p.id_proprietaire 
                FROM proprietaire p 
                WHERE p.id_utilisateur = $1
            `;
            
            const proprioResult = await db.query(proprioQuery, [req.user.id]);
            if (proprioResult.rows.length === 0) {
                return res.status(404).json({ message: 'Propriétaire non trouvé' });
            }

            const id_proprietaire = proprioResult.rows[0].id_proprietaire;
            const quittances = await Quittance.findByProprietaire(id_proprietaire);
            
            res.json({
                message: 'Quittances récupérées avec succès',
                quittances
            });

        } catch (error) {
            console.error('Erreur récupération quittances propriétaire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // TÉLÉCHARGER UNE QUITTANCE EN PDF
    // ============================================================
    async downloadQuittancePDF(req, res) {
        try {
            const { id_quittance } = req.params;
            
            // Récupérer les détails complets de la quittance
            const query = `
                SELECT q.*, 
                       p.numero_transaction,
                       u_locataire.nom as locataire_nom, u_locataire.prenoms as locataire_prenoms,
                       u_proprietaire.nom as proprietaire_nom, u_proprietaire.prenoms as proprietaire_prenoms,
                       b.titre as bien_titre, b.adresse as bien_adresse, b.ville as bien_ville
                FROM quittance q
                LEFT JOIN payement p ON q.id_paiement = p.id_payment
                LEFT JOIN utilisateur u_locataire ON q.id_locataire = u_locataire.id_utilisateur
                LEFT JOIN utilisateur u_proprietaire ON q.id_proprietaire = u_proprietaire.id_utilisateur
                LEFT JOIN bien b ON q.id_bien = b.id_bien
                WHERE q.id_quittance = $1
            `;
            
            const result = await db.query(query, [id_quittance]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Quittance non trouvée' });
            }

            const quittance = result.rows[0];
            
            // Générer le HTML de la quittance
            const html = generateQuittanceHTML(quittance);
            
            res.setHeader('Content-Type', 'text/html');
            res.send(html);

        } catch (error) {
            console.error('Erreur téléchargement quittance:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }
};

// Fonction utilitaire pour générer le HTML de la quittance
function generateQuittanceHTML(quittance) {
    const datePaiement = new Date(quittance.date_paiement).toLocaleDateString('fr-FR');
    const montant = new Intl.NumberFormat('fr-FR').format(quittance.montant);
    const periode = quittance.periode || 'N/A';
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>QUITTANCE #${quittance.id_quittance}</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.6; color: #000; padding: 40px; max-width: 800px; margin: auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #000; margin: 0; text-transform: uppercase; font-size: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .signature { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 250px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>QUITTANCE DE LOYER</h1>
        <p>Référence : <strong>#${quittance.id_quittance}</strong></p>
    </div>

    <div class="section">
        <div class="section-title">Propriétaire</div>
        <p><strong>${quittance.proprietaire_prenoms || ''} ${quittance.proprietaire_nom || ''}</strong></p>
    </div>

    <div class="section">
        <div class="section-title">Locataire</div>
        <p><strong>${quittance.locataire_prenoms || ''} ${quittance.locataire_nom || ''}</strong></p>
    </div>

    <div class="section">
        <div class="section-title">Bien loué</div>
        <p><strong>${quittance.bien_titre || 'N/A'}</strong></p>
        <p>${quittance.bien_adresse || ''}, ${quittance.bien_ville || ''}</p>
    </div>

    <div class="section">
        <div class="section-title">Détails du paiement</div>
        <div class="info-grid">
            <div>
                <p><strong>Montant payé :</strong> ${montant} FCFA</p>
                <p><strong>Date de paiement :</strong> ${datePaiement}</p>
            </div>
            <div>
                <p><strong>Période :</strong> ${periode}</p>
                <p><strong>Type :</strong> ${quittance.type_quittance === 'loyer' ? 'Loyer' : 'Dépôt de garantie'}</p>
            </div>
        </div>
        <p><strong>Référence transaction :</strong> ${quittance.numero_transaction || 'N/A'}</p>
    </div>

    <div class="section">
        <p>Je soussigné, propriétaire du bien mentionné ci-dessus, certifie avoir reçu la somme de <strong>${montant} FCFA</strong> au titre de ${quittance.type_quittance === 'loyer' ? 'loyer' : 'dépôt de garantie'} pour la période de <strong>${periode}</strong>.</p>
    </div>

    <div class="signature">
        <div class="signature-box">
            <p><strong>Le Propriétaire</strong></p>
            <p style="margin-top: 60px;">Signature</p>
        </div>
        <div class="signature-box">
            <p><strong>Le Locataire</strong></p>
            <p style="margin-top: 60px;">Signature</p>
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: white; border: none; cursor: pointer;">Imprimer</button>
    </div>
</body>
</html>`;
}

module.exports = quittanceController;
