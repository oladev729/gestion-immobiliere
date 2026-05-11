const caurisPayService = require('../services/caurispayService');
const db = require('../config/database');

// Initier un paiement
const initiatePayment = async (req, res) => {
    try {
        const { 
            montant, 
            phoneNumber, 
            email, 
            firstName, 
            lastName, 
            description,
            typePaiement,
            idContrat,
            idBien,
            idLocataire,
            idProprietaire
        } = req.body;

        // Validation des données
        if (!montant || !phoneNumber || !email) {
            return res.status(400).json({
                success: false,
                message: 'Montant, téléphone et email sont requis'
            });
        }

        // Vérifier si le paiement existe déjà pour éviter les doublons
        if (idContrat && typePaiement === 'LOYER') {
            const existingPaymentQuery = `
                SELECT id FROM paiements 
                WHERE id_contrat = $1 
                AND type_paiement = $2 
                AND statut = 'SUCCES'
                AND DATE_TRUNC('month', date_creation) = DATE_TRUNC('month', CURRENT_DATE)
            `;
            const existingPayment = await db.query(existingPaymentQuery, [idContrat, typePaiement]);
            
            if (existingPayment.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le loyer pour ce mois a déjà été payé'
                });
            }
        }

        // Générer une référence unique
        const reference = caurisPayService.generateReference();
        
        // Préparer les données de paiement
        const paymentData = {
            montant,
            phoneNumber,
            email,
            firstName: firstName || 'Client',
            lastName: lastName || 'Application',
            description: description || `Paiement ${typePaiement || 'général'}`,
            operatorCode: 'BJMTN', // Par défaut, peut être paramétré
            reference
        };

        // Initier le paiement via CaurisPay
        const result = await caurisPayService.initiatePayment(paymentData);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de l\'initiation du paiement',
                error: result.error
            });
        }

        // Enregistrer le paiement en base de données
        const paiementQuery = `
            INSERT INTO paiements (
                reference_marchand, 
                reference_traitement, 
                montant, 
                devise, 
                statut, 
                id_contrat, 
                id_bien, 
                id_locataire, 
                id_proprietaire, 
                type_paiement, 
                telephone, 
                email, 
                date_creation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        `;

        const paiementValues = [
            reference,
            result.data.processingReference || null,
            montant,
            'XOF',
            'EN_COURS',
            idContrat || null,
            idBien || null,
            idLocataire || null,
            idProprietaire || null,
            typePaiement || 'AUTRE',
            phoneNumber,
            email
        ];

        await db.query(paiementQuery, paiementValues);

        res.json({
            success: true,
            message: 'Paiement initié avec succès',
            data: {
                merchantReference: reference,
                processingReference: result.data.processingReference,
                status: result.data.status,
                amount: montant,
                currency: 'XOF'
            }
        });

    } catch (error) {
        console.error('Erreur PaymentController initiatePayment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'initiation du paiement',
            error: error.message
        });
    }
};

// Vérifier le statut d'un paiement
const checkPaymentStatus = async (req, res) => {
    try {
        const { merchantReference, processingReference } = req.body;

        if (!merchantReference || !processingReference) {
            return res.status(400).json({
                success: false,
                message: 'merchantReference et processingReference sont requis'
            });
        }

        // Vérifier le statut via CaurisPay
        const result = await caurisPayService.checkPaymentStatus(merchantReference, processingReference);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de la vérification du statut',
                error: result.error
            });
        }

        const paymentStatus = result.data.status;
        let newStatus = 'EN_COURS';

        // Mapper les statuts CaurisPay vers notre base de données
        switch (paymentStatus) {
            case 'SUCCESS':
                newStatus = 'SUCCES';
                break;
            case 'FAILED':
                newStatus = 'ECHEC';
                break;
            case 'CANCELLED':
                newStatus = 'ANNULE';
                break;
            case 'PROCESSING':
                newStatus = 'EN_COURS';
                break;
            default:
                newStatus = 'EN_COURS';
        }

        // Mettre à jour le statut en base de données
        const updateQuery = `
            UPDATE paiements 
            SET statut = $1, date_mise_a_jour = NOW() 
            WHERE reference_marchand = $2
        `;

        await db.query(updateQuery, [newStatus, merchantReference]);

        // Si le paiement est réussi, mettre à jour le contrat si applicable
        if (newStatus === 'SUCCES') {
            const contratQuery = `
                UPDATE contrats 
                SET statut_paiement = 'PAYE', date_dernier_paiement = NOW() 
                WHERE id = (
                    SELECT id_contrat FROM paiements 
                    WHERE reference_marchand = $1
                )
            `;
            await db.query(contratQuery, [merchantReference]);

            // Générer automatiquement la quittance
            try {
                const QuittanceController = require('./quittanceController');
                const paymentIdQuery = `
                    SELECT id FROM paiements 
                    WHERE reference_marchand = $1
                `;
                const paymentResult = await db.query(paymentIdQuery, [merchantReference]);
                
                if (paymentResult.rows.length > 0) {
                    const paymentId = paymentResult.rows[0].id;
                    await QuittanceController.generateQuittance({
                        body: { id_paiement: paymentId, type_quittance: 'LOYER' }
                    }, {
                        json: (data) => console.log('✅ Quittance générée automatiquement:', data)
                    });
                }
            } catch (quittanceError) {
                console.error('❌ Erreur génération quittance automatique:', quittanceError);
                // Ne pas bloquer le processus si la quittance échoue
            }
        }

        res.json({
            success: true,
            message: 'Statut du paiement vérifié',
            data: {
                merchantReference,
                status: newStatus,
                originalStatus: paymentStatus,
                processingReference
            }
        });

    } catch (error) {
        console.error('Erreur PaymentController checkPaymentStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification du statut',
            error: error.message
        });
    }
};

// Obtenir l'historique des paiements d'un utilisateur
const getPaymentHistory = async (req, res) => {
    try {
        const { userId, userType } = req.query;

        if (!userId || !userType) {
            return res.status(400).json({
                success: false,
                message: 'userId et userType sont requis'
            });
        }

        let query = `
            SELECT p.*, 
                   c.numero_contrat,
                   b.titre as bien_titre,
                   l.prenoms as locataire_prenoms,
                   l.nom as locataire_nom,
                   pr.prenoms as proprietaire_prenoms,
                   pr.nom as proprietaire_nom
            FROM paiements p
            LEFT JOIN contrats c ON p.id_contrat = c.id
            LEFT JOIN biens b ON p.id_bien = b.id
            LEFT JOIN utilisateurs l ON p.id_locataire = l.id
            LEFT JOIN utilisateurs pr ON p.id_proprietaire = pr.id
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (userType === 'locataire') {
            query += ` AND p.id_locataire = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        } else if (userType === 'proprietaire') {
            query += ` AND p.id_proprietaire = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        query += ` ORDER BY p.date_creation DESC`;

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Erreur PaymentController getPaymentHistory:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de l\'historique',
            error: error.message
        });
    }
};

// Obtenir les données pour le widget CaurisPay
const getWidgetData = async (req, res) => {
    try {
        const widgetData = caurisPayService.getWidgetData();

        res.json({
            success: true,
            data: widgetData
        });

    } catch (error) {
        console.error('Erreur PaymentController getWidgetData:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des données widget',
            error: error.message
        });
    }
};

module.exports = {
    initiatePayment,
    checkPaymentStatus,
    getPaymentHistory,
    getWidgetData
};
