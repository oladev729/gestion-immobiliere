import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const FedaPayWidget = ({ amount, onSuccess, onError, onClose }) => {
    const [widgetData, setWidgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        loadWidgetData();
    }, []);

    const loadWidgetData = async () => {
        try {
            const response = await api.get('/paiements/fedapay/widget');
            if (response.data.success) {
                setWidgetData(response.data.widgetData);
                // Charger le script FedaPay
                loadFedaPayScript(response.data.widgetData);
            }
        } catch (error) {
            console.error('Erreur chargement widget FedaPay:', error);
            onError('Erreur lors du chargement du widget de paiement');
        } finally {
            setLoading(false);
        }
    };

    const loadFedaPayScript = (data) => {
        console.log('🔄 Chargement du script FedaPay...');
        console.log('📋 Données widget:', data);
        
        // Vérifier si le script est déjà chargé
        if (window.initPayment) {
            console.log('✅ Script FedaPay déjà chargé');
            initializeWidget(data);
            return;
        }

        const script = document.createElement('script');
        // URL de production FedaPay
        script.src = 'https://api.fedapay.com/widget.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
            console.log('✅ Script FedaPay chargé avec succès');
            console.log('🔍 Fonctions disponibles:', {
                initPayment: typeof window.initPayment,
                createPaymentButton: typeof window.createPaymentButton,
                closePayment: typeof window.closePayment
            });
            initializeWidget(data);
        };
        
        script.onerror = (error) => {
            console.error('❌ Erreur chargement script FedaPay:', error);
            // Essayer l'URL de test si la production échoue
            console.log('🔄 Tentative avec URL de test...');
            const testScript = document.createElement('script');
            testScript.src = 'https://test-api.fedapay.com/widget.js';
            testScript.async = true;
            testScript.crossOrigin = 'anonymous';
            
            testScript.onload = () => {
                console.log('✅ Script FedaPay (test) chargé');
                initializeWidget(data);
            };
            
            testScript.onerror = () => {
                console.error('❌ Impossible de charger le script FedaPay');
                onError('Impossible de charger le système de paiement FedaPay');
            };
            
            document.head.appendChild(testScript);
        };
        
        document.head.appendChild(script);
    };

    const initializeWidget = (data) => {
        try {
            console.log('🚀 Initialisation du widget FedaPay...');
            
            if (window.initPayment) {
                window.initPayment({
                    merchantId: data.merchantId,
                    publicKey: data.publicKey,
                    amount: amount,
                    currency: 'XOF',
                    country: 'BJ',
                    onSuccess: (response) => {
                        console.log('✅ Paiement FedaPay réussi:', response);
                        setPaymentData(response);
                        onSuccess(response);
                    },
                    onError: (error) => {
                        console.error('❌ Erreur paiement FedaPay:', error);
                        onError(error);
                    },
                    onClose: () => {
                        console.log('🔒 Widget FedaPay fermé');
                        onClose();
                    }
                });
            } else {
                console.error('❌ Fonction initPayment non disponible');
                onError('Widget FedaPay non disponible');
            }
        } catch (error) {
            console.error('❌ Erreur initialisation widget FedaPay:', error);
            onError('Erreur lors de l\'initialisation du paiement');
        }
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px',
                fontSize: '16px',
                color: '#666'
            }}>
                Chargement du système de paiement FedaPay...
            </div>
        );
    }

    if (!widgetData) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#dc3545',
                fontSize: '14px'
            }}>
                Impossible de charger le système de paiement FedaPay
            </div>
        );
    }

    return (
        <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '20px',
            backgroundColor: '#f8f9fa',
            minHeight: '300px'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: '0', color: '#28a745' }}>
                    Payer avec FedaPay
                </h4>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    Montant: {amount} XOF
                </p>
            </div>
            
            <div id="fedapay-widget-container" style={{ 
                minHeight: '200px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {/* Le widget FedaPay sera injecté ici */}
                <div style={{ 
                    padding: '20px', 
                    textAlign: 'center',
                    color: '#666'
                }}>
                    Initialisation du widget FedaPay...
                </div>
            </div>
            
            <div style={{ 
                textAlign: 'center', 
                marginTop: '15px',
                fontSize: '12px',
                color: '#999'
            }}>
                <p style={{ margin: '0' }}>
                    Paiement sécurisé via FedaPay
                </p>
                <p style={{ margin: '0' }}>
                    <small>
                        En utilisant ce service, vous acceptez les conditions générales de FedaPay
                    </small>
                </p>
            </div>
        </div>
    );
};

export default FedaPayWidget;
