const Paiement = require('../models/Paiement');
const LoyerMensuel = require('../models/LoyerMensuel');
const DepotGarantie = require('../models/DepotGarantie');
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
                        u_loc.nom AS nom_locataire, u_loc.prenom AS prenom_locataire, u_loc.email AS email_locataire
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
                        u.nom AS locataire_nom, u.prenom AS locataire_prenom
                 FROM payement p
                 JOIN contact c ON c.id_contact = p.id_contact
                 JOIN bien b ON b.id_bien = c.id_bien
                 JOIN proprietaire pr ON pr.id_proprietaire = b.id_proprietaire
                 JOIN locataire l ON l.id_locataire = c.id_locataire
                 JOIN utilisateur u ON u.id_utilisateur = l.id_utilisateur
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
    }
};

module.exports = paiementController;
