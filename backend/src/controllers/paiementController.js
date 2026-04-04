const Paiement = require('../models/Paiement');
const LoyerMensuel = require('../models/LoyerMensuel');
const DepotGarantie = require('../models/DepotGarantie');
const db = require('../config/database');
const axios = require('axios');

const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

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
    // INITIER UN PAIEMENT EN LIGNE VIA CINETPAY
    // ============================================================
    async initier(req, res) {
        try {
            const { id_contact, montant, type_paiement, description } = req.body;

            if (!id_contact || !montant || !type_paiement) {
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
            const transaction_id = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            // Pré-enregistrer le paiement en statut 'en_attente'
            await db.query(
                `INSERT INTO payement (numero_transaction, id_contact, montant, type_paiement,
                  statut_paiement, date_paiement, description)
                 VALUES ($1, $2, $3, $4, 'en_attente', CURRENT_DATE, $5)`,
                [transaction_id, id_contact, montant, type_paiement,
                 description || `${type_paiement} - ${titre}`]
            );

            // Appel API CinetPay
            const payload = {
                apikey: CINETPAY_API_KEY,
                site_id: CINETPAY_SITE_ID,
                transaction_id,
                amount: parseInt(montant),
                currency: 'XOF',
                alternative_currency: '',
                description: description || `${type_paiement} - ${titre}`,
                customer_id: String(req.user.id),
                customer_name: nom_locataire,
                customer_surname: prenom_locataire,
                customer_email: email_locataire,
                customer_phone_number: '',
                customer_address: '',
                customer_city: '',
                customer_country: 'BJ',
                customer_state: 'BJ',
                customer_zip_code: '',
                notify_url: `${BACKEND_URL}/api/paiements/notify`,
                return_url: `${FRONTEND_URL}/tenant/rentals?payment=success`,
                channels: 'ALL',
                metadata: JSON.stringify({ id_contact, type_paiement })
            };

            const cinetpayRes = await axios.post(
                'https://api-checkout.cinetpay.com/v2/payment',
                payload
            );

            if (cinetpayRes.data.code !== '201') {
                return res.status(502).json({
                    message: 'Erreur CinetPay',
                    details: cinetpayRes.data.message
                });
            }

            res.json({
                payment_url: cinetpayRes.data.data.payment_url,
                transaction_id
            });

        } catch (error) {
            console.error('Erreur initiation paiement CinetPay:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    },

    // ============================================================
    // WEBHOOK CINETPAY (appelé par CinetPay après paiement)
    // ============================================================
    async notify(req, res) {
        try {
            const { cpm_trans_id } = req.body;

            if (!cpm_trans_id) {
                return res.status(400).json({ message: 'transaction_id manquant' });
            }

            // Vérifier le statut auprès de CinetPay
            const verif = await axios.post(
                'https://api-checkout.cinetpay.com/v2/payment/check',
                {
                    apikey: CINETPAY_API_KEY,
                    site_id: CINETPAY_SITE_ID,
                    transaction_id: cpm_trans_id
                }
            );

            const statut = verif.data.data.status === 'ACCEPTED' ? 'payé' : 'échoué';

            // Mettre à jour le statut dans la BDD
            const updated = await db.query(
                `UPDATE payement SET statut_paiement = $1
                 WHERE numero_transaction = $2 RETURNING *`,
                [statut, cpm_trans_id]
            );

            if (updated.rows.length === 0) {
                return res.status(404).json({ message: 'Transaction introuvable' });
            }

            // Si paiement accepté → notifier le propriétaire
            if (statut === 'payé') {
                const paiement = updated.rows[0];

                const propResult = await db.query(
                    `SELECT u.id_utilisateur, b.titre
                     FROM contact c
                     JOIN bien b ON b.id_bien = c.id_bien
                     JOIN proprietaire p ON p.id_proprietaire = b.id_proprietaire
                     JOIN utilisateur u ON u.id_utilisateur = p.id_utilisateur
                     WHERE c.id_contact = $1`,
                    [paiement.id_contact]
                );

                if (propResult.rows.length > 0) {
                    const prop = propResult.rows[0];
                    await db.query(
                        `INSERT INTO notification (id_utilisateur, titre, message, type)
                         VALUES ($1, $2, $3, $4)`,
                        [
                            prop.id_utilisateur,
                            'Paiement reçu',
                            `Un paiement de ${paiement.montant} FCFA (${paiement.type_paiement}) a été effectué pour le bien "${prop.titre}"`,
                            'paiement'
                        ]
                    );
                }
            }

            res.status(200).json({ message: 'OK' });

        } catch (error) {
            console.error('Erreur webhook CinetPay:', error);
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
