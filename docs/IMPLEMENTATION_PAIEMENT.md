# Guide d'Implémentation du Système de Paiement CaurisPay

## 📋 Table des Matières
1. [Configuration Backend](#configuration-backend)
2. [Services de Paiement](#services-de-paiement)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Base de Données](#base-de-données)
6. [Sécurité](#sécurité)
7. [Tests](#tests)

---

## 🔧 Configuration Backend

### 1. Variables d'Environnement
```bash
# CaurisPay Configuration
CAURISPAY_BASE_URL=http://liveapi.caurispay.com:10110/v1
CAURISPAY_API_KEY=votre_api_key
CAURISPAY_CLIENT_ID=votre_client_id
CAURISPAY_SECURE_VERSION=no

# Configuration Widget
CAURISPAY_WIDGET_CLIENT_ID=COM-I2BJ2
CAURISPAY_WIDGET_SERVICE_ID=SVC-JPI936
CAURISPAY_WIDGET_SERVICE_KEY=KEY-QWRTZEQJM8NYM7HI7DFG
```

### 2. Service CaurisPay
```javascript
// services/caurisPayService.js
const crypto = require('crypto');
const axios = require('axios');

class CaurisPayService {
    constructor() {
        this.baseUrl = process.env.CAURISPAY_BASE_URL;
        this.apiKey = process.env.CAURISPAY_API_KEY;
        this.clientId = process.env.CAURISPAY_CLIENT_ID;
        this.secureVersion = process.env.CAURISPAY_SECURE_VERSION;
    }

    // Générer la signature pour les requêtes API
    generateSignature(timestamp, body) {
        const message = `${this.apiKey}${this.clientId}${timestamp}${JSON.stringify(body)}`;
        return crypto.createHash('sha256').update(message).digest('hex');
    }

    // Obtenir les headers pour les requêtes
    getHeaders(timestamp, body) {
        return {
            "X-API-KEY": this.apiKey,
            "X-CLIENT-ID": this.clientId,
            "X-Secure-Version": this.secureVersion,
            "X-CLINET-TIMESTEMP": timestamp.toString(),
            "X-CLIENT-SIGNATURE": this.generateSignature(timestamp, body),
            "Content-Type": "application/json"
        };
    }

    // Initier un paiement via API directe
    async initiatePayment(paymentData) {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const body = {
                amount: paymentData.amount.toString(),
                currency: "XOF",
                customerMessage: paymentData.customerMessage || "Paiement loyer",
                merchantReference: paymentData.merchantReference,
                feesByPayer: paymentData.feesByPayer || "no",
                operator: {
                    countryCodeA2: paymentData.operator.countryCodeA2,
                    operatorCode: paymentData.operator.operatorCode,
                    type: paymentData.operator.type
                },
                payer: {
                    accountNumber: paymentData.payer.accountNumber,
                    email: paymentData.payer.email,
                    firstName: paymentData.payer.firstName,
                    lastName: paymentData.payer.lastName,
                    phoneNumber: paymentData.payer.phoneNumber
                }
            };

            const headers = this.getHeaders(timestamp, body);
            const response = await axios.post(
                `${this.baseUrl}/userrequest/makepayment`,
                body,
                { headers }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    // Vérifier le statut d'un paiement
    async checkPaymentStatus(merchantReference, processingReference) {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const body = {
                merchantReference,
                processingReference
            };

            const headers = this.getHeaders(timestamp, body);
            const response = await axios.post(
                `${this.baseUrl}/userrequest/checkpaymentstatus`,
                body,
                { headers }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }
}

module.exports = new CaurisPayService();
```

---

## 🏗️ Services de Paiement

### 1. Service de Paiement Principal
```javascript
// services/paymentService.js
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const caurisPayService = require('./caurisPayService');

class PaymentService {
    // Créer un paiement
    async createPayment(paymentData) {
        const merchantReference = uuidv4();
        
        const payment = {
            id_locataire: paymentData.id_locataire,
            id_contrat: paymentData.id_contrat,
            montant: paymentData.montant,
            devise: 'XOF',
            merchant_reference: merchantReference,
            statut: 'EN_ATTENTE',
            customer_message: paymentData.customer_message || 'Paiement loyer',
            created_at: new Date()
        };

        const [result] = await db('paiements').insert(payment).returning('*');
        return result;
    }

    // Initier un paiement
    async initiatePayment(paymentId, paymentMethodData) {
        const payment = await db('paiements').where('id', paymentId).first();
        
        if (!payment) {
            throw new Error('Paiement non trouvé');
        }

        const paymentData = {
            amount: payment.montant,
            customerMessage: payment.customer_message,
            merchantReference: payment.merchant_reference,
            feesByPayer: "no",
            operator: paymentMethodData.operator,
            payer: paymentMethodData.payer
        };

        const result = await caurisPayService.initiatePayment(paymentData);

        if (result.success) {
            // Mettre à jour le paiement avec la référence de traitement
            await db('paiements')
                .where('id', paymentId)
                .update({
                    processing_reference: result.data.precessingReference,
                    statut: 'PROCESSING',
                    updated_at: new Date()
                });

            return {
                success: true,
                processingReference: result.data.precessingReference,
                merchantReference: payment.merchant_reference
            };
        } else {
            // Marquer le paiement comme échoué
            await db('paiements')
                .where('id', paymentId)
                .update({
                    statut: 'FAILED',
                    updated_at: new Date()
                });

            throw new Error(result.error);
        }
    }

    // Vérifier le statut d'un paiement
    async checkPaymentStatus(paymentId) {
        const payment = await db('paiements').where('id', paymentId).first();
        
        if (!payment || !payment.processing_reference) {
            throw new Error('Paiement non trouvé ou pas de référence de traitement');
        }

        const result = await caurisPayService.checkPaymentStatus(
            payment.merchant_reference,
            payment.processing_reference
        );

        if (result.success) {
            const newStatus = result.data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
            
            await db('paiements')
                .where('id', paymentId)
                .update({
                    statut: newStatus,
                    operator_ref_id: result.data.operatorRefId,
                    updated_at: new Date()
                });

            // Si le paiement est réussi, mettre à jour le loyer correspondant
            if (newStatus === 'SUCCESS') {
                await this.updateLoyerStatus(payment.id_contrat, 'PAYE');
                await this.sendPaymentNotifications(payment, 'SUCCESS');
            }

            return {
                success: true,
                status: newStatus,
                data: result.data
            };
        } else {
            throw new Error(result.error);
        }
    }

    // Mettre à jour le statut du loyer
    async updateLoyerStatus(contractId, status) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        await db('loyers')
            .where({
                id_contrat: contractId,
                mois: currentMonth,
                annee: currentYear
            })
            .update({
                statut: status,
                date_paiement: status === 'PAYE' ? new Date() : null
            });
    }

    // Envoyer les notifications de paiement
    async sendPaymentNotifications(payment, status) {
        // Récupérer les informations du locataire et propriétaire
        const [locataire, proprietaire] = await Promise.all([
            db('utilisateurs').where('id', payment.id_locataire).first(),
            db('contrats')
                .join('utilisateurs', 'contrats.id_proprietaire', 'utilisateurs.id')
                .where('contrats.id', payment.id_contrat)
                .select('utilisateurs.*')
                .first()
        ]);

        // Envoyer les emails
        if (status === 'SUCCESS') {
            await emailService.sendPaymentConfirmation(locataire, payment);
            await emailService.sendPaymentReceipt(proprietaire, payment);
        }
    }

    // Obtenir l'historique des paiements d'un locataire
    async getPaymentHistory(locataireId, limit = 10, offset = 0) {
        return await db('paiements')
            .join('contrats', 'paiements.id_contrat', 'contrats.id')
            .join('biens', 'contrats.id_bien', 'biens.id')
            .where('paiements.id_locataire', locataireId)
            .select(
                'paiements.*',
                'biens.titre as bien_titre',
                'biens.adresse as bien_adresse'
            )
            .orderBy('paiements.created_at', 'desc')
            .limit(limit)
            .offset(offset);
    }
}

module.exports = new PaymentService();
```

---

## 🛠️ API Endpoints

### 1. Routes de Paiement
```javascript
// routes/payments.js
const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const authMiddleware = require('../middleware/auth');

// Initier un paiement
router.post('/initiate', authMiddleware, async (req, res) => {
    try {
        const { id_contrat, montant, payment_method } = req.body;
        const id_locataire = req.user.id;

        // Créer le paiement
        const payment = await paymentService.createPayment({
            id_locataire,
            id_contrat,
            montant,
            customer_message: 'Paiement loyer mensuel'
        });

        // Initier le paiement avec CaurisPay
        const result = await paymentService.initiatePayment(payment.id, payment_method);

        res.json({
            success: true,
            payment_id: payment.id,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Vérifier le statut d'un paiement
router.get('/status/:payment_id', authMiddleware, async (req, res) => {
    try {
        const result = await paymentService.checkPaymentStatus(req.params.payment_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Historique des paiements
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const payments = await paymentService.getPaymentHistory(
            req.user.id,
            parseInt(limit),
            parseInt(offset)
        );
        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Callback du widget CaurisPay
router.post('/callback', async (req, res) => {
    try {
        const { merchant_reference, status, operator_ref_id } = req.body;
        
        // Trouver le paiement correspondant
        const payment = await db('paiements')
            .where('merchant_reference', merchant_reference)
            .first();

        if (payment) {
            await db('paiements')
                .where('id', payment.id)
                .update({
                    statut: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
                    operator_ref_id,
                    updated_at: new Date()
                });

            if (status === 'SUCCESS') {
                await paymentService.updateLoyerStatus(payment.id_contrat, 'PAYE');
                await paymentService.sendPaymentNotifications(payment, 'SUCCESS');
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
```

---

## 🎨 Frontend Components

### 1. Contexte de Paiement
```javascript
// context/PaymentContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const PaymentContext = createContext();

const paymentReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_PAYMENT':
            return { ...state, currentPayment: action.payload };
        case 'SET_STATUS':
            return { 
                ...state, 
                currentPayment: { 
                    ...state.currentPayment, 
                    statut: action.payload 
                } 
            };
        case 'SET_HISTORY':
            return { ...state, paymentHistory: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
};

export const PaymentProvider = ({ children }) => {
    const [state, dispatch] = useReducer(paymentReducer, {
        loading: false,
        currentPayment: null,
        paymentHistory: [],
        error: null
    });

    const initiatePayment = async (paymentData) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const response = await api.post('/payments/initiate', paymentData);
            dispatch({ type: 'SET_PAYMENT', payload: response.data });
            return response.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const checkPaymentStatus = async (paymentId) => {
        try {
            const response = await api.get(`/payments/status/${paymentId}`);
            dispatch({ type: 'SET_STATUS', payload: response.data.status });
            return response.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const getPaymentHistory = async () => {
        try {
            const response = await api.get('/payments/history');
            dispatch({ type: 'SET_HISTORY', payload: response.data.data });
            return response.data.data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const value = {
        ...state,
        initiatePayment,
        checkPaymentStatus,
        getPaymentHistory
    };

    return (
        <PaymentContext.Provider value={value}>
            {children}
        </PaymentContext.Provider>
    );
};

export const usePayment = () => {
    const context = useContext(PaymentContext);
    if (!context) {
        throw new Error('usePayment must be used within PaymentProvider');
    }
    return context;
};
```

### 2. Composant de Paiement
```javascript
// components/PaymentForm.jsx
import React, { useState } from 'react';
import { usePayment } from '../context/PaymentContext';

const PaymentForm = ({ contract, onPaymentSuccess }) => {
    const { initiatePayment, checkPaymentStatus, loading } = usePayment();
    const [paymentMethod, setPaymentMethod] = useState('api');
    const [formData, setFormData] = useState({
        operator: 'BJMTN',
        accountNumber: '',
        phoneNumber: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const paymentData = {
                id_contrat: contract.id,
                montant: contract.loyer_mensuel,
                payment_method: {
                    operator: {
                        countryCodeA2: 'bj',
                        operatorCode: formData.operator,
                        type: 'MMO'
                    },
                    payer: {
                        accountNumber: formData.accountNumber,
                        email: contract.locataire_email,
                        firstName: contract.locataire_prenoms,
                        lastName: contract.locataire_nom,
                        phoneNumber: formData.phoneNumber
                    }
                }
            };

            const result = await initiatePayment(paymentData);
            
            // Vérifier le statut périodiquement
            const checkStatus = setInterval(async () => {
                const status = await checkPaymentStatus(result.payment_id);
                if (status.status === 'SUCCESS') {
                    clearInterval(checkStatus);
                    onPaymentSuccess();
                } else if (status.status === 'FAILED') {
                    clearInterval(checkStatus);
                    alert('Paiement échoué');
                }
            }, 5000);

            // Arrêter après 2 minutes
            setTimeout(() => clearInterval(checkStatus), 120000);

        } catch (error) {
            alert('Erreur lors du paiement: ' + error.message);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h5>Payer le loyer</h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Montant</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={`${contract.loyer_mensuel} XOF`}
                            disabled 
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Opérateur</label>
                        <select 
                            className="form-select"
                            value={formData.operator}
                            onChange={(e) => setFormData({...formData, operator: e.target.value})}
                        >
                            <option value="BJMTN">MTN Bénin</option>
                            <option value="BJMOOV">MOOV Bénin</option>
                            <option value="BJCELTIIS">CELTIIS</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Numéro de compte</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                            placeholder="229XXXXXXXX"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Numéro de téléphone</label>
                        <input 
                            type="text" 
                            className="form-control"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            placeholder="229XXXXXXXX"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading ? 'Traitement...' : 'Payer maintenant'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentForm;
```

### 3 Widget de Paiement
```javascript
// components/PaymentWidget.jsx
import React, { useEffect } from 'react';

const PaymentWidget = ({ amount, onSuccess, onError }) => {
    useEffect(() => {
        // Charger le CDN CaurisPay
        const script = document.createElement('script');
        script.src = 'http://127.0.0.1:51001/cdn.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            // Initialiser le widget
            if (window.initPayment) {
                window.initPayment({
                    clientID: "COM-I2BJ2",
                    serviceId: "SVC-JPI936",
                    serviceKey: "KEY-QWRTZEQJM8NYM7HI7DFG"
                });
            }
        };

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayment = () => {
        if (window.requestPaymentWidget) {
            window.requestPaymentWidget({
                uniqRefId: `payment_${Date.now()}`,
                amount: amount
            });
        }
    };

    return (
        <div className="card">
            <div className="card-body text-center">
                <h5>Payer avec CaurisPay</h5>
                <p>Montant: {amount} XOF</p>
                <button 
                    className="btn btn-success"
                    onClick={handlePayment}
                >
                    Payer maintenant
                </button>
                <div id="payment-widget-container"></div>
            </div>
        </div>
    );
};

export default PaymentWidget;
```

---

## 🗄️ Base de Données

### 1. Tables de Paiement
```sql
-- Table des paiements
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    id_locataire INTEGER REFERENCES utilisateurs(id),
    id_contrat INTEGER REFERENCES contrats(id),
    montant DECIMAL(10,2) NOT NULL,
    devise VARCHAR(3) DEFAULT 'XOF',
    date_paiement TIMESTAMP,
    date_echeance DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE',
    merchant_reference VARCHAR(255) UNIQUE NOT NULL,
    processing_reference VARCHAR(255),
    operator_ref_id VARCHAR(255),
    methode_paiement VARCHAR(50),
    customer_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des loyers mensuels
CREATE TABLE loyers (
    id SERIAL PRIMARY KEY,
    id_contrat INTEGER REFERENCES contrats(id),
    montant DECIMAL(10,2) NOT NULL,
    date_echeance DATE NOT NULL,
    date_paiement TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE',
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    periode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_contrat, mois, annee)
);

-- Table des notifications de paiement
CREATE TABLE notifications_paiement (
    id SERIAL PRIMARY KEY,
    id_paiement INTEGER REFERENCES paiements(id),
    type_notification VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    destinataire VARCHAR(255) NOT NULL,
    date_envoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut VARCHAR(20) DEFAULT 'ENVOYE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimisation
CREATE INDEX idx_paiements_locataire ON paiements(id_locataire);
CREATE INDEX idx_paiements_contrat ON paiements(id_contrat);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_paiements_merchant_ref ON paiements(merchant_reference);
CREATE INDEX idx_loyers_contrat ON loyers(id_contrat);
CREATE INDEX idx_loyers_statut ON loyers(statut);
```

---

## 🔒 Sécurité

### 1. Validation des Données
```javascript
// middleware/paymentValidation.js
const validatePaymentData = (req, res, next) => {
    const { id_contrat, montant, payment_method } = req.body;

    // Valider le montant
    if (!montant || montant <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Montant invalide'
        });
    }

    // Valider le contrat
    if (!id_contrat) {
        return res.status(400).json({
            success: false,
            message: 'ID de contrat requis'
        });
    }

    // Valider la méthode de paiement
    if (!payment_method || !payment_method.operator) {
        return res.status(400).json({
            success: false,
            message: 'Méthode de paiement invalide'
        });
    }

    // Valider l'opérateur
    const validOperators = ['BJMTN', 'BJMOOV', 'BJCELTIIS'];
    if (!validOperators.includes(payment_method.operator.operatorCode)) {
        return res.status(400).json({
            success: false,
            message: 'Opérateur non valide'
        });
    }

    next();
};

module.exports = validatePaymentData;
```

### 2. Rate Limiting
```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const paymentRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limiter à 5 tentatives de paiement
    message: {
        success: false,
        message: 'Trop de tentatives de paiement, veuillez réessayer plus tard'
    }
});

module.exports = paymentRateLimit;
```

---

## 🧪 Tests

### 1. Tests des Services de Paiement
```javascript
// tests/paymentService.test.js
const paymentService = require('../services/paymentService');
const caurisPayService = require('../services/caurisPayService');

describe('PaymentService', () => {
    describe('createPayment', () => {
        it('should create a payment successfully', async () => {
            const paymentData = {
                id_locataire: 1,
                id_contrat: 1,
                montant: 50000,
                customer_message: 'Test payment'
            };

            const payment = await paymentService.createPayment(paymentData);
            
            expect(payment).toHaveProperty('id');
            expect(payment.montant).toBe(50000);
            expect(payment.statut).toBe('EN_ATTENTE');
            expect(payment).toHaveProperty('merchant_reference');
        });
    });

    describe('initiatePayment', () => {
        it('should initiate payment with CaurisPay', async () => {
            // Mock CaurisPay service
            jest.spyOn(caurisPayService, 'initiatePayment')
                .mockResolvedValue({
                    success: true,
                    data: {
                        precessingReference: 'test_ref',
                        status: 'PROCESSING'
                    }
                });

            const result = await paymentService.initiatePayment(1, {
                operator: {
                    countryCodeA2: 'bj',
                    operatorCode: 'BJMTN',
                    type: 'MMO'
                },
                payer: {
                    accountNumber: '2290197000000',
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    phoneNumber: '2290197000000'
                }
            });

            expect(result.success).toBe(true);
            expect(result.processingReference).toBe('test_ref');
        });
    });
});
```

### 2. Tests des API Endpoints
```javascript
// tests/payments.test.js
const request = require('supertest');
const app = require('../app');

describe('Payment API', () => {
    let authToken;

    beforeAll(async () => {
        // Login et obtenir le token
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'locataire@example.com',
                password: 'password123'
            });
        
        authToken = response.body.token;
    });

    describe('POST /payments/initiate', () => {
        it('should initiate a payment', async () => {
            const paymentData = {
                id_contrat: 1,
                montant: 50000,
                payment_method: {
                    operator: {
                        countryCodeA2: 'bj',
                        operatorCode: 'BJMTN',
                        type: 'MMO'
                    },
                    payer: {
                        accountNumber: '2290197000000',
                        email: 'locataire@example.com',
                        firstName: 'Test',
                        lastName: 'User',
                        phoneNumber: '2290197000000'
                    }
                }
            };

            const response = await request(app)
                .post('/payments/initiate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(paymentData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('payment_id');
        });
    });

    describe('GET /payments/history', () => {
        it('should get payment history', async () => {
            const response = await request(app)
                .get('/payments/history')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
});
```

---

## 📊 Monitoring et Logging

### 1. Logs de Paiement
```javascript
// utils/paymentLogger.js
const winston = require('winston');

const paymentLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/payments.log' }),
        new winston.transports.Console()
    ]
});

const logPaymentEvent = (event, data) => {
    paymentLogger.info({
        event,
        timestamp: new Date().toISOString(),
        data
    });
};

module.exports = { logPaymentEvent };
```

### 2. Métriques de Paiement
```javascript
// utils/paymentMetrics.js
class PaymentMetrics {
    constructor() {
        this.metrics = {
            totalPayments: 0,
            successfulPayments: 0,
            failedPayments: 0,
            totalAmount: 0,
            averageProcessingTime: 0
        };
    }

    recordPayment(payment) {
        this.metrics.totalPayments++;
        this.metrics.totalAmount += payment.montant;

        if (payment.statut === 'SUCCESS') {
            this.metrics.successfulPayments++;
        } else if (payment.statut === 'FAILED') {
            this.metrics.failedPayments++;
        }
    }

    getSuccessRate() {
        return this.metrics.totalPayments > 0 
            ? (this.metrics.successfulPayments / this.metrics.totalPayments) * 100 
            : 0;
    }

    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.getSuccessRate()
        };
    }
}

module.exports = new PaymentMetrics();
```

---

Ce guide complet vous fournit tout ce dont vous avez besoin pour implémenter le système de paiement CaurisPay dans votre application de gestion immobilière. Les diagrammes UML correspondants sont déjà intégrés dans le fichier `DIAGRAMMES_UML.md`.
