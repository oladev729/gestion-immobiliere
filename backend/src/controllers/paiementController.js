const Paiement = require('../models/Paiement');
const LoyerMensuel = require('../models/LoyerMensuel');
const DepotGarantie = require('../models/DepotGarantie');
const Quittance = require('../models/Quittance');
const db = require('../config/database');
const axios = require('axios');
const caurispayService = require('../services/caurispayService');
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5055';

const paiementController = {
    // ============================================================
    // PAYER UN LOYER
    // ============================================================
    async payerLoyer(req, res) {
        try {
            const { id_loyer, id_mode_payment, montant } = req.body;

            const loyer = await LoyerMensuel.findById(id_loyer);
            if (!loyer) {
                return res.status(404).json({ message: 'Loyer non trouvé' });
            }

            if (loyer.statut === 'paye') {
                return res.status(400).json({ message: 'Ce loyer est déjà payé' });
            }

            const id_contact = loyer.id_contact;

            const paiement = await Paiement.payerLoyer({
                id_contact,
                id_loyer,
                id_mode_payment,
                montant,
                statut_paiement: 'valide'
            });

            // 🧾 GÉNÉRER AUTOMATIQUEMENT LA QUITTANCE
            try {
                console.log('🧾 Génération automatique de quittance pour le paiement:', paiement.id_payement);
                
                // Récupérer les informations nécessaires pour la quittance
                const quittanceQuery = `
                    SELECT p.id_payement, lm.mois_concerne, lm.id_contact, 
                           c.id_locataire, c.id_proprietaire, c.id_bien,
                           l.id_utilisateur as locataire_id_utilisateur,
                           prop.id_utilisateur as proprietaire_id_utilisateur,
                           b.titre as bien_titre
                    FROM payement p
                    LEFT JOIN loyermensuel lm ON p.id_loyer = lm.id_loyer
                    LEFT JOIN contact c ON lm.id_contact = c.id_contact
                    LEFT JOIN locataire l ON c.id_locataire = l.id_locataire
                    LEFT JOIN proprietaire prop ON c.id_proprietaire = prop.id_proprietaire
                    LEFT JOIN bien b ON c.id_bien = b.id_bien
                    WHERE p.id_payement = $1
                `;
                
                const quittanceResult = await db.query(quittanceQuery, [paiement.id_payement]);
                
                if (quittanceResult.rows.length > 0) {
                    const quittanceInfo = quittanceResult.rows[0];
                    
                    const quittanceData = {
                        id_paiement: paiement.id_payement,
                        id_locataire: quittanceInfo.locataire_id_utilisateur,
                        id_proprietaire: quittanceInfo.proprietaire_id_utilisateur,
                        id_bien: quittanceInfo.id_bien,
                        type_quittance: 'loyer',
                        periode: quittanceInfo.mois_concerne,
                        montant: paiement.montant,
                        date_paiement: paiement.date_paiement,
                        reference_paiement: paiement.numero_transaction
                    };

                    const quittance = await Quittance.create(quittanceData);
                    console.log('✅ Quittance générée avec succès:', quittance.id_quittance);
                }
            } catch (quittanceError) {
                console.error('⚠️ Erreur génération quittance automatique:', quittanceError);
                // Ne pas bloquer le paiement si la quittance échoue
            }

            res.status(201).json({
                message: 'Paiement effectué avec succès',
                paiement
            });

        } catch (error) {
            console.error('Erreur paiement loyer:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // PAYER UN DÉPÔT DE GARANTIE
    // ============================================================
    async payerDepot(req, res) {
        try {
            const { id_contact, id_mode_payment, montant } = req.body;

            const contrat = await db.query(
                'SELECT * FROM contact WHERE id_contact = $1',
                [id_contact]
            );
            if (contrat.rows.length === 0) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            const depot = await DepotGarantie.create({
                id_contact,
                montant_depot_verse: montant,
                date_versement: new Date(),
                mode_versement: req.body.mode_versement || 'virement'
            });

            const paiement = await Paiement.payerDepot({
                id_contact,
                id_depot: depot.id_depot,
                id_mode_payment,
                montant,
                statut_paiement: 'valide'
            });

            res.status(201).json({
                message: 'Dépôt de garantie effectué avec succès',
                depot,
                paiement
            });

        } catch (error) {
            console.error('Erreur paiement dépôt:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    
    // ============================================================
    // INITIER UN PAIEMENT EN LIGNE VIA CAURISPAY
    // ============================================================
    async initierCaurisPay(req, res) {
        try {
            const { id_contact, montant, type_paiement, description, phoneNumber, operatorCode } = req.body;

            if (!id_contact || !montant || !type_paiement || !phoneNumber) {
                return res.status(400).json({ message: 'Champs requis manquants' });
            }

            // Vérifier que le contrat appartient bien au locataire connecté
            const contrat = await db.query(
                `SELECT c.id_contact, c.id_bien, b.titre,
                        u_loc.nom AS nom_locataire, u_loc.prenoms AS prenom_locataire, u_loc.email AS email_locataire
                 FROM contact c
                 JOIN bien b ON b.id_bien = c.id_bien
                 JOIN locataire l ON l.id_locataire = c.id_locataire
                 JOIN utilisateur u_loc ON u_loc.id_utilisateur = l.id_utilisateur
                 WHERE c.id_contact = $1 AND l.id_utilisateur = $2 AND c.statut_contrat = 'actif'`,
                [id_contact, req.user.id]
            );

            if (contrat.rows.length === 0) {
                return res.status(403).json({ message: 'Contrat introuvable ou non autorisé' });
            }

            const { nom_locataire, prenom_locataire, email_locataire, titre } = contrat.rows[0];

            // Générer un numéro de transaction unique
            const merchantReference = `GEST-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            // Pré-enregistrer le paiement en statut 'en_attente'
            await db.query(
                `INSERT INTO payement (numero_transaction, id_contact, montant, type_paiement,
                  statut_paiement, date_paiement, description)
                 VALUES ($1, $2, $3, $4, 'en_attente', CURRENT_DATE, $5)`,
                [merchantReference, id_contact, montant, type_paiement,
                 description || `${type_paiement} - ${titre}`]
            );

            // Préparer les données pour CaurisPay
            const paymentData = {
                montant,
                reference: merchantReference,
                description: description || `${type_paiement} - ${titre}`,
                phoneNumber,
                email: email_locataire,
                firstName: prenom_locataire,
                lastName: nom_locataire,
                operatorCode
            };

            // Appel API CaurisPay
            const caurispayResult = await caurispayService.initiatePayment(paymentData);

            if (!caurispayResult.success) {
                return res.status(502).json({
                    message: 'Erreur CaurisPay',
                    details: caurispayResult.error
                });
            }

            res.json({
                success: true,
                merchantReference: caurispayResult.merchantReference,
                processingReference: caurispayResult.data.precessingReference,
                status: caurispayResult.data.status,
                message: caurispayResult.data.message
            });

        } catch (error) {
            console.error('Erreur initiation paiement CaurisPay:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // VÉRIFIER STATUT PAIEMENT CAURISPAY
    // ============================================================
    async checkCaurisPayStatus(req, res) {
        try {
            const { merchantReference, processingReference } = req.body;

            if (!merchantReference || !processingReference) {
                return res.status(400).json({ message: 'Références manquantes' });
            }

            const result = await caurispayService.checkPaymentStatus(merchantReference, processingReference);

            if (!result.success) {
                return res.status(502).json({
                    message: 'Erreur vérification statut CaurisPay',
                    details: result.error
                });
            }

            // Mettre à jour le statut dans la BDD si succès
            if (result.data.status === 'SUCCESS') {
                const statut = 'valide';
                await db.query(
                    `UPDATE payement SET statut_paiement = $1
                     WHERE numero_transaction = $2 RETURNING *`,
                    [statut, merchantReference]
                );
            }

            res.json({
                success: true,
                status: result.data.status,
                message: result.data.message,
                operatorRefId: result.data.operatorRefId
            });

        } catch (error) {
            console.error('Erreur vérification statut CaurisPay:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // OBTENIR LES DONNÉES DU WIDGET CAURISPAY
    // ============================================================
    async getCaurisPayWidgetData(req, res) {
        try {
            const widgetData = caurispayService.getWidgetData();
            res.json({
                success: true,
                widgetData
            });
        } catch (error) {
            console.error('Erreur récupération widget CaurisPay:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // HISTORIQUE PAIEMENTS EN LIGNE DU LOCATAIRE
    // ============================================================
    async mesPaiementsEnLigne(req, res) {
        try {
            const result = await db.query(
                `SELECT p.*, b.titre AS bien_titre
                 FROM payement p
                 JOIN contact c ON c.id_contact = p.id_contact
                 JOIN bien b ON b.id_bien = c.id_bien
                 JOIN locataire l ON l.id_locataire = c.id_locataire
                 WHERE l.id_utilisateur = $1
                 ORDER BY p.date_paiement DESC`,
                [req.user.id]
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Erreur historique paiements en ligne:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // CHARGES DU LOCATAIRE
    // ============================================================
    async mesCharges(req, res) {
        try {
            const result = await db.query(
                `SELECT p.*, b.titre AS bien_titre, b.id_bien
                 FROM payement p
                 JOIN contact c ON c.id_contact = p.id_contact
                 JOIN bien b ON b.id_bien = c.id_bien
                 JOIN locataire l ON l.id_locataire = c.id_locataire
                 WHERE l.id_utilisateur = $1 
                 AND p.id_loyer IS NULL 
                 AND p.id_depot IS NULL
                 AND p.numero_transaction LIKE 'CHG-%'
                 ORDER BY p.date_paiement DESC`,
                [req.user.id]
            );
            
            res.json({ charges: result.rows });
        } catch (error) {
            console.error('Erreur récupération charges locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // NOTIFICATIONS DU LOCATAIRE
    // ============================================================
    async mesNotifications(req, res) {
        try {
            const result = await db.query(
                `SELECT n.*, 
                        CASE 
                            WHEN n.lu = false THEN 'unread'
                            ELSE 'read'
                        END as statut_lecture
                 FROM notification n
                 WHERE n.id_utilisateur = $1
                 ORDER BY n.date_envoi DESC`,
                [req.user.id]
            );
            
            res.json({ notifications: result.rows });
        } catch (error) {
            console.error('Erreur récupération notifications locataire:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // PAIEMENTS REÇUS PAR LE PROPRIÉTAIRE
    // ============================================================
    async paiementsRecus(req, res) {
        try {
            const result = await db.query(
                `SELECT p.*, b.titre AS bien_titre,
                        u.nom AS locataire_nom, u.prenoms AS locataire_prenom,
                        CASE 
                            WHEN p.id_loyer IS NOT NULL THEN 'loyer'
                            WHEN p.id_depot IS NOT NULL THEN 'depot_garantie'
                            ELSE 'autre'
                        END as type_paiement,
                        CASE 
                            WHEN p.statut_paiement = 'valide' THEN 'payé'
                            WHEN p.statut_paiement = 'echoue' THEN 'échoué'
                            ELSE p.statut_paiement
                        END as statut_paiement
                 FROM payement p
                 JOIN contact c ON c.id_contact = p.id_contact
                 JOIN bien b ON b.id_bien = c.id_bien
                 JOIN proprietaire pr ON pr.id_proprietaire = b.id_proprietaire
                 LEFT JOIN locataire l ON l.id_locataire = c.id_locataire
                 LEFT JOIN utilisateur u ON u.id_utilisateur = l.id_utilisateur
                 WHERE pr.id_utilisateur = $1
                 ORDER BY p.date_paiement DESC`,
                [req.user.id]
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Erreur paiements reçus:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES PAIEMENTS D'UN CONTRAT
    // ============================================================
    async getPaiementsByContrat(req, res) {
        try {
            const { id_contact } = req.params;
            const paiements = await Paiement.findByContrat(id_contact);
            res.json(paiements);
        } catch (error) {
            console.error('Erreur récupération paiements:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES PAIEMENTS D'UN LOCATAIRE
    // ============================================================
    async getMesPaiements(req, res) {
        try {
            const locataire = await db.query(
                'SELECT id_locataire FROM locataire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            if (locataire.rows.length === 0) {
                return res.status(200).json([]);
            }

            const paiements = await Paiement.findByLocataire(locataire.rows[0].id_locataire);
            res.json(paiements);

        } catch (error) {
            console.error('Erreur récupération mes paiements:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES LOYERS D'UN CONTRAT
    // ============================================================
    async getLoyersByContrat(req, res) {
        try {
            const { id_contact } = req.params;
            const loyers = await LoyerMensuel.findByContrat(id_contact);
            res.json(loyers);
        } catch (error) {
            console.error('Erreur récupération loyers:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // RÉCUPÉRER LES LOYERS IMPAYÉS
    // ============================================================
    async getImpayes(req, res) {
        try {
            const impayes = await LoyerMensuel.findImpayes();
            res.json(impayes);
        } catch (error) {
            console.error('Erreur récupération impayés:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // GÉNÉRER LES ÉCHÉANCES D'UN CONTRAT
    // ============================================================
    async genererEcheances(req, res) {
        try {
            const { id_contact } = req.params;

            const contrat = await db.query(
                'SELECT * FROM contact WHERE id_contact = $1',
                [id_contact]
            );

            if (contrat.rows.length === 0) {
                return res.status(404).json({ message: 'Contrat non trouvé' });
            }

            const proprietaire = await db.query(
                'SELECT id_proprietaire FROM proprietaire WHERE id_utilisateur = $1',
                [req.user.id]
            );

            const bien = await db.query(
                'SELECT id_proprietaire FROM bien WHERE id_bien = $1',
                [contrat.rows[0].id_bien]
            );

            if (proprietaire.rows.length === 0 ||
                bien.rows[0].id_proprietaire !== proprietaire.rows[0].id_proprietaire) {
                return res.status(403).json({ message: 'Vous n\'êtes pas autorisé' });
            }

            const loyers = await LoyerMensuel.genererEcheances(contrat.rows[0]);

            res.status(201).json({
                message: 'Échéances générées avec succès',
                loyers
            });

        } catch (error) {
            console.error('Erreur génération échéances:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // STATISTIQUES DES PAIEMENTS
    // ============================================================
    async getStats(req, res) {
        try {
            const stats = await db.query(`
                SELECT 
                    COUNT(*) as total_paiements,
                    COUNT(CASE WHEN statut_paiement = 'valide' THEN 1 END) as paiements_valides,
                    COUNT(CASE WHEN statut_paiement = 'echoue' THEN 1 END) as paiements_echoues,
                    SUM(CASE WHEN statut_paiement = 'valide' THEN montant ELSE 0 END) as montant_total
                FROM payement
            `);

            const impayes = await db.query(`
                SELECT COUNT(*) as total_impayes
                FROM loyermensuel
                WHERE statut = 'impaye' AND date_echeance < CURRENT_DATE
            `);

            res.json({
                stats: stats.rows[0],
                impayes: impayes.rows[0].total_impayes
            });

        } catch (error) {
            console.error('Erreur stats paiements:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // INITIER UN PAIEMENT EN LIGNE VIA FEDAPAY
    // ============================================================
    async initierFedaPay(req, res) {
        try {
            const { id_contact, montant, type_paiement, description, phoneNumber, operatorCode, mois_concerne, annee } = req.body;
            
            console.log('🚀 Initialisation paiement FedaPay:', { id_contact, montant, type_paiement, mois_concerne, annee });
            
            // Validation des données
            if (!id_contact || !montant || !phoneNumber) {
                return res.status(400).json({ 
                    message: 'Données requises manquantes',
                    required: ['id_contact', 'montant', 'phoneNumber']
                });
            }
            
            // 1. Récupérer les infos du locataire pour FedaPay
            const locataireQuery = `
                SELECT u.nom, u.prenoms as prenom, u.email, u.telephone, b.titre as bien_titre
                FROM contact c
                JOIN locataire l ON c.id_locataire = l.id_locataire
                JOIN utilisateur u ON l.id_utilisateur = u.id_utilisateur
                JOIN bien b ON c.id_bien = b.id_bien
                WHERE c.id_contact = $1 AND l.id_utilisateur = $2
            `;
            const locataireRes = await db.query(locataireQuery, [id_contact, req.user.id]);
            
            if (locataireRes.rows.length === 0) {
                return res.status(404).json({ message: 'Locataire ou contrat non trouvé' });
            }
            
            const locataire = locataireRes.rows[0];
            
            // 1.5 Déterminer l'id_loyer s'il s'agit d'un loyer
            let id_loyer = null;
            if (type_paiement === 'loyer' && mois_concerne) {
                const monthsMap = {
                    'janvier': '01',
                    'février': '02',
                    'mars': '03',
                    'avril': '04',
                    'mai': '05',
                    'juin': '06',
                    'juillet': '07',
                    'août': '08',
                    'septembre': '09',
                    'octobre': '10',
                    'novembre': '11',
                    'décembre': '12'
                };
                const monthNum = monthsMap[mois_concerne.toLowerCase()];
                if (monthNum) {
                    const targetAnnee = annee || new Date().getFullYear().toString();
                    const dbMoisConcerne = `${targetAnnee}-${monthNum}`;
                    console.log('🔍 Recherche loyermensuel pour:', { id_contact, dbMoisConcerne });
                    
                    const lmQuery = 'SELECT id_loyer, statut FROM loyermensuel WHERE id_contact = $1 AND mois_concerne = $2';
                    const lmRes = await db.query(lmQuery, [id_contact, dbMoisConcerne]);
                    if (lmRes.rows.length > 0) {
                        id_loyer = lmRes.rows[0].id_loyer;
                        console.log('✅ Trouvé id_loyer:', id_loyer);
                        
                        if (lmRes.rows[0].statut === 'paye') {
                            return res.status(400).json({
                                success: false,
                                message: 'Cette échéance a déjà été payée !'
                            });
                        }
                    }
                }
            }
            
            // 1.8 Déterminer id_depot s'il s'agit d'un depot de garantie
            let id_depot = null;
            if (type_paiement === 'depot_garantie') {
                const depotQuery = `
                    INSERT INTO depotgarantie (id_contact, montant_depot_verse, date_versement, statut, mode_versement)
                    VALUES ($1, $2, CURRENT_DATE, 'en_attente', 'fedapay')
                    RETURNING id_depot
                `;
                const depotRes = await db.query(depotQuery, [id_contact, montant]);
                id_depot = depotRes.rows[0].id_depot;
                console.log('✅ Dépôt de garantie créé, id_depot:', id_depot);
            }
            
            // 2. Générer une référence unique pour le paiement
            const merchantReference = `FEDA_${Date.now()}_${id_contact}`;
            
            // 3. Créer l'enregistrement de paiement en base
            const paiement = await Paiement.create({
                id_contact,
                id_loyer,
                id_depot,
                montant,
                type_paiement: 'fedapay',
                statut_paiement: 'en_attente',
                numero_transaction: merchantReference,
                description: description || `Paiement FedaPay - ${type_paiement} - ${locataire.bien_titre}`,
                date_paiement: new Date()
            });
            
            // 4. Appeler l'API FedaPay pour initialiser le paiement
            const targetPhone = phoneNumber || locataire.telephone || '64000001';
            const fedaPayResponse = await paiementController.initiateFedaPayPayment({
                montant,
                telephone: targetPhone,
                operateur: operatorCode || 'BJMTN',
                reference: merchantReference,
                description: description || `Paiement via FedaPay pour ${locataire.bien_titre}`,
                customer: {
                    firstname: locataire.prenom,
                    lastname: locataire.nom,
                    email: locataire.email
                }
            });
            
            if (fedaPayResponse.success) {
                // Mettre à jour le paiement avec la référence FedaPay si différente
                if (fedaPayResponse.reference !== merchantReference) {
                    await Paiement.updateReference(paiement.id_payment, fedaPayResponse.reference);
                }
                
                res.json({
                    success: true,
                    message: 'Paiement FedaPay initialisé avec succès',
                    merchantReference: fedaPayResponse.reference,
                    processingReference: fedaPayResponse.processingReference,
                    paymentUrl: fedaPayResponse.paymentUrl
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Erreur lors de l\'initialisation du paiement FedaPay',
                    error: fedaPayResponse.error
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur initialisation paiement FedaPay:', error);
            res.status(500).json({ 
                message: 'Erreur lors de l\'initialisation du paiement',
                error: error.message 
            });
        }
    },

    // Vérifier le statut d'un paiement FedaPay
    async checkFedaPayStatus(req, res) {
        try {
            const { merchantReference, processingReference } = req.body;
            
            console.log('🔍 Vérification statut FedaPay:', { merchantReference, processingReference });
            
            // Appeler l'API FedaPay pour vérifier le statut
            const statusResponse = await paiementController.checkFedaPayPaymentStatus(merchantReference, processingReference);
            
            if (statusResponse.success) {
                // Mettre à jour le statut en base si succès
                if (statusResponse.status === 'approved' || statusResponse.status === 'captured') {
                    await Paiement.markAsPaid(statusResponse.reference || merchantReference, statusResponse.transactionId);
                    
                    // 🧾 GÉNÉRATION AUTOMATIQUEMENT DE LA QUITTANCE POUR FEDAPAY
                    try {
                        console.log('🧾 Récupération des détails pour génération automatique de quittance FedaPay...');
                        const queryPaiement = `
                            SELECT p.id_payment, p.montant, p.numero_transaction, p.date_paiement, p.id_loyer, p.id_depot,
                                   lm.mois_concerne, lm.id_contact, 
                                   c.id_locataire, b.id_proprietaire, c.id_bien,
                                   l.id_utilisateur as locataire_id_utilisateur,
                                   prop.id_utilisateur as proprietaire_id_utilisateur,
                                   b.titre as bien_titre
                            FROM payement p
                            LEFT JOIN loyermensuel lm ON p.id_loyer = lm.id_loyer
                            LEFT JOIN contact c ON p.id_contact = c.id_contact
                            LEFT JOIN locataire l ON c.id_locataire = l.id_locataire
                            LEFT JOIN bien b ON c.id_bien = b.id_bien
                            LEFT JOIN proprietaire prop ON b.id_proprietaire = prop.id_proprietaire
                            WHERE p.numero_transaction = $1 OR p.numero_transaction = $2
                        `;
                        const resPaiement = await db.query(queryPaiement, [
                            statusResponse.reference || merchantReference || null, 
                            statusResponse.transactionId ? statusResponse.transactionId.toString() : null
                        ]);
                        
                        if (resPaiement.rows.length > 0) {
                            const paiement = resPaiement.rows[0];
                            
                            if (paiement.id_loyer) {
                                // 1. Marquer le loyer mensuel comme payé
                                console.log('🔹 Passage du loyermensuel à statut = paye pour id_loyer:', paiement.id_loyer);
                                await db.query(
                                    'UPDATE loyermensuel SET statut = $2 WHERE id_loyer = $1',
                                    [paiement.id_loyer, 'paye']
                                );
                                
                                // 2. Vérifier si la quittance n'existe pas déjà
                                const checkQuittance = await db.query(
                                    'SELECT id_quittance FROM quittance WHERE id_paiement = $1',
                                    [paiement.id_payment]
                                );
                                
                                if (checkQuittance.rows.length === 0) {
                                    // 3. Générer la quittance
                                    const quittanceData = {
                                        id_paiement: paiement.id_payment,
                                        id_locataire: paiement.locataire_id_utilisateur,
                                        id_proprietaire: paiement.proprietaire_id_utilisateur,
                                        id_bien: paiement.id_bien,
                                        type_quittance: 'loyer',
                                        periode: paiement.mois_concerne,
                                        montant: paiement.montant,
                                        date_paiement: paiement.date_paiement || new Date(),
                                        reference_paiement: paiement.numero_transaction
                                    };
                                    
                                    const quittance = await Quittance.create(quittanceData);
                                    console.log('✅ Quittance FedaPay générée avec succès:', quittance.id_quittance);
                                } else {
                                    console.log('ℹ️ La quittance pour ce paiement existe déjà.');
                                }
                            } else if (paiement.id_depot) {
                                // 1. Marquer le depot comme encaissé
                                console.log('🔹 Passage du depotgarantie à statut = encaisse pour id_depot:', paiement.id_depot);
                                await db.query(
                                    'UPDATE depotgarantie SET statut = $2 WHERE id_depot = $1',
                                    [paiement.id_depot, 'encaisse']
                                );
                                
                                // 2. Vérifier si la quittance n'existe pas déjà
                                const checkQuittance = await db.query(
                                    'SELECT id_quittance FROM quittance WHERE id_paiement = $1',
                                    [paiement.id_payment]
                                );
                                
                                if (checkQuittance.rows.length === 0) {
                                    // 3. Générer la quittance de dépôt
                                    const quittanceData = {
                                        id_paiement: paiement.id_payment,
                                        id_locataire: paiement.locataire_id_utilisateur,
                                        id_proprietaire: paiement.proprietaire_id_utilisateur,
                                        id_bien: paiement.id_bien,
                                        type_quittance: 'depot_garantie',
                                        periode: null,
                                        montant: paiement.montant,
                                        date_paiement: paiement.date_paiement || new Date(),
                                        reference_paiement: paiement.numero_transaction
                                    };
                                    
                                    const quittance = await Quittance.create(quittanceData);
                                    console.log('✅ Quittance FedaPay (Dépôt) générée avec succès:', quittance.id_quittance);
                                } else {
                                    console.log('ℹ️ La quittance (Dépôt) pour ce paiement existe déjà.');
                                }
                            }
                        } else {
                            console.log('⚠️ Aucun paiement trouvé en base pour générer la quittance.');
                        }
                    } catch (quittanceErr) {
                        console.error('❌ Erreur lors de la génération automatique de quittance FedaPay:', quittanceErr);
                    }
                }
                
                res.json({
                    success: true,
                    status: statusResponse.status,
                    transactionId: statusResponse.transactionId,
                    message: 'Statut récupéré avec succès'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Erreur lors de la vérification du statut',
                    error: statusResponse.error
                });
            }
            
        } catch (error) {
            console.error('❌ Erreur vérification statut FedaPay:', error);
            res.status(500).json({ 
                message: 'Erreur lors de la vérification du statut',
                error: error.message 
            });
        }
    },

    // Obtenir les données du widget FedaPay
    async getFedaPayWidgetData(req, res) {
        try {
            console.log('📦 Récupération données widget FedaPay');
            
            const widgetData = {
                merchantId: process.env.FEDAPAY_MERCHANT_ID || 'FEDA_MERCHANT',
                publicKey: process.env.FEDAPAY_PUBLIC_KEY,
                apiUrl: process.env.FEDAPAY_API_URL || 'https://api.fedapay.com/v1',
                currency: 'XOF',
                country: 'BJ',
                supportedOperators: ['BJMTN', 'BJMOOV', 'BJCELTIIS']
            };
            
            res.json({
                success: true,
                widgetData
            });
            
        } catch (error) {
            console.error('❌ Erreur récupération widget FedaPay:', error);
            res.status(500).json({ 
                message: 'Erreur lors de la récupération des données du widget',
                error: error.message 
            });
        }
    },

    // Services internes FedaPay
    async initiateFedaPayPayment(paymentData) {
        try {
            const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
            const FEDAPAY_API_URL = process.env.FEDAPAY_API_URL || 'https://api.fedapay.com/v1';

            console.log('📡 Appel API FedaPay pour créer transaction...');
            
            // 1. Créer la transaction
            const transactionRes = await axios.post(`${FEDAPAY_API_URL}/transactions`, {
                amount: paymentData.montant,
                currency: { iso: 'XOF' },
                description: paymentData.description,
                callback_url: `${FRONTEND_URL}/payment-success`,
                customer: {
                    firstname: paymentData.customer.firstname,
                    lastname: paymentData.customer.lastname,
                    email: paymentData.customer.email,
                    phone_number: {
                        number: paymentData.telephone,
                        country: 'BJ'
                    }
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`
                }
            });

            const transaction = transactionRes.data['v1/transaction'] || transactionRes.data.v1_transaction || transactionRes.data.transaction || transactionRes.data;
            
            if (!transaction || (!transaction.reference && !transaction.id)) {
                console.error("Structure de réponse inattendue:", transactionRes.data);
                throw new Error("Réponse API FedaPay invalide");
            }
            
            // 2. Si c'est Mobile Money, on peut soit renvoyer l'URL de checkout, 
            // soit tenter un paiement direct si l'opérateur est fourni
            // Pour l'instant, on renvoie l'URL de checkout ou on gère le token
            
            return {
                success: true,
                reference: transaction.reference || `REF-${transaction.id}`,
                transactionId: transaction.id,
                paymentUrl: transaction.payment_url || transaction.checkout_url || `https://checkout.fedapay.com/${transaction.reference || transaction.id}`,
                processingReference: transaction.id ? transaction.id.toString() : '',
                message: 'Transaction créée avec succès'
            };
            
        } catch (error) {
            console.error('❌ Erreur API FedaPay (initiate):', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.message || error.message 
            };
        }
    },

    async checkFedaPayPaymentStatus(merchantReference, processingReference) {
        try {
            const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY;
            const FEDAPAY_API_URL = process.env.FEDAPAY_API_URL || 'https://api.fedapay.com/v1';

            console.log(`📡 Vérification statut transaction ${merchantReference} sur FedaPay...`);
            
            // On peut chercher par ID ou par référence
            const url = processingReference ? 
                `${FEDAPAY_API_URL}/transactions/${processingReference}` : 
                `${FEDAPAY_API_URL}/transactions?reference=${merchantReference}`;

            const res = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`
                }
            });

            let transaction;
            if (res.data['v1/transaction'] || res.data.v1_transaction) {
                transaction = res.data['v1/transaction'] || res.data.v1_transaction;
            } else if ((res.data['v1/transactions'] && res.data['v1/transactions'].length > 0) || (res.data.v1_transactions && res.data.v1_transactions.length > 0)) {
                transaction = (res.data['v1/transactions'] || res.data.v1_transactions)[0];
            } else {
                throw new Error('Transaction non trouvée sur FedaPay');
            }
            
            return {
                success: true,
                status: transaction.status, // 'approved', 'captured', 'declined', 'pending', etc.
                transactionId: transaction.id,
                reference: transaction.reference,
                message: 'Statut récupéré'
            };
            
        } catch (error) {
            console.error('❌ Erreur vérification statut FedaPay:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.message || error.message 
            };
        }
    }
};

module.exports = paiementController;
