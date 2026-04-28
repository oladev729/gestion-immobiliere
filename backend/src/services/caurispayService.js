const crypto = require('crypto');
const axios = require('axios');

class CaurisPayService {
    constructor() {
        this.baseUrl = process.env.CAURISPAY_BASE_URL || 'http://liveapi.caurispay.com:10110/v1';
        this.apiKey = process.env.CAURISPAY_API_KEY;
        this.clientId = process.env.CAURISPAY_CLIENT_ID;
        this.serviceKey = process.env.CAURISPAY_SERVICE_KEY;
        this.serviceId = process.env.CAURISPAY_SERVICE_ID;
    }

    // Générer la signature pour les requêtes API
    generateSignature(data) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = JSON.stringify(data) + timestamp;
        return crypto.createHash('sha256').update(message).digest('hex');
    }

    // Préparer les headers pour les requêtes API
    getHeaders(payload) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = this.generateSignature(payload);
        
        return {
            'X-API-KEY': this.apiKey,
            'X-CLIENT-ID': this.clientId,
            'X-Secure-Version': 'no',
            'X-CLINET-TIMESTEMP': timestamp,
            'X-CLIENT-SIGNATURE': signature,
            'Content-Type': 'application/json'
        };
    }

    // Initier un paiement via API directe
    async initiatePayment(paymentData) {
        try {
            const payload = {
                amount: paymentData.montant.toString(),
                currency: 'XOF',
                customerMessage: paymentData.description || 'Paiement gestion immobilière',
                merchantReference: paymentData.reference || this.generateReference(),
                feesByPayer: 'no',
                operator: {
                    countryCodeA2: 'bj',
                    operatorCode: paymentData.operatorCode || 'BJMTN',
                    type: 'MMO'
                },
                payer: {
                    accountNumber: paymentData.phoneNumber,
                    email: paymentData.email,
                    firstName: paymentData.firstName || '',
                    lastName: paymentData.lastName || '',
                    phoneNumber: paymentData.phoneNumber
                }
            };

            const headers = this.getHeaders(payload);
            
            const response = await axios.post(
                `${this.baseUrl}/userrequest/makepayment`,
                payload,
                { headers }
            );

            return {
                success: true,
                data: response.data,
                merchantReference: payload.merchantReference
            };

        } catch (error) {
            console.error('Erreur CaurisPay initiatePayment:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Vérifier le statut d'un paiement
    async checkPaymentStatus(merchantReference, processingReference) {
        try {
            const payload = {
                merchantReference,
                processingReference
            };

            const headers = this.getHeaders(payload);
            
            const response = await axios.post(
                `${this.baseUrl}/userrequest/checkpaymentstatus`,
                payload,
                { headers }
            );

            return {
                success: true,
                data: response.data
            };

        } catch (error) {
            console.error('Erreur CaurisPay checkPaymentStatus:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Générer une référence unique
    generateReference() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `GEST-${timestamp}-${random}`;
    }

    // Obtenir les données pour le widget
    getWidgetData() {
        return {
            clientID: this.clientId,
            serviceId: this.serviceId,
            serviceKey: this.serviceKey
        };
    }
}

module.exports = new CaurisPayService();
