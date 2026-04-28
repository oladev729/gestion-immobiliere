import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CaurisPayWidget = ({ amount, onSuccess, onError, onClose }) => {
    const [widgetData, setWidgetData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        loadWidgetData();
    }, []);

    const loadWidgetData = async () => {
        try {
            const response = await api.get('/paiements/caurispay/widget');
            if (response.data.success) {
                setWidgetData(response.data.widgetData);
                // Charger le script CaurisPay
                loadCaurisPayScript(response.data.widgetData);
            }
        } catch (error) {
            console.error('Erreur chargement widget CaurisPay:', error);
            onError('Erreur lors du chargement du widget de paiement');
        } finally {
            setLoading(false);
        }
    };

    const loadCaurisPayScript = (data) => {
        console.log('🔄 Chargement du script CaurisPay...');
        console.log('📋 Données widget:', data);
        
        // Vérifier si le script est déjà chargé
        if (window.initPayment) {
            console.log('✅ Script CaurisPay déjà chargé');
            initializeWidget(data);
            return;
        }

        const script = document.createElement('script');
        // URL corrigée - utiliser l'URL de production ou de test selon la configuration
        script.src = 'https://cdn.caurispay.com/widget.js'; // URL de production
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
            console.log('✅ Script CaurisPay chargé avec succès');
            console.log('🔍 Fonctions disponibles:', {
                initPayment: typeof window.initPayment,
                createPaymentButton: typeof window.createPaymentButton,
                requestPaymentWidget: typeof window.requestPaymentWidget
            });
            initializeWidget(data);
        };
        
        script.onerror = (error) => {
            console.error('❌ Erreur chargement script CaurisPay:', error);
            // Essayer l'URL de test si la production échoue
            console.log('🔄 Tentative avec URL de test...');
            const testScript = document.createElement('script');
            testScript.src = 'http://testcdn.caurispay.com/widget.js';
            testScript.async = true;
            testScript.crossOrigin = 'anonymous';
            
            testScript.onload = () => {
                console.log('✅ Script CaurisPay (test) chargé');
                initializeWidget(data);
            };
            
            testScript.onerror = () => {
                console.error('❌ Les deux URLs ont échoué');
                onError('Erreur lors du chargement du module de paiement. Vérifiez votre connexion internet.');
            };
            
            document.body.appendChild(testScript);
        };
        
        document.body.appendChild(script);
    };

    const initializeWidget = (data) => {
        try {
            console.log('🚀 Initialisation du widget CaurisPay...');
            console.log('📋 Paramètres:', data);
            
            // Vérifier que les fonctions sont disponibles
            if (!window.initPayment) {
                throw new Error('initPayment non disponible');
            }
            
            // Initialiser le widget CaurisPay
            console.log('⚙️ Appel de initPayment...');
            window.initPayment({
                clientID: data.clientID,
                serviceId: data.serviceId,
                serviceKey: data.serviceKey
            });

            // Attendre un peu que l'initialisation se termine
            setTimeout(() => {
                console.log('🔍 Vérification des fonctions après initPayment...');
                console.log('createPaymentButton disponible:', typeof window.createPaymentButton);
                console.log('requestPaymentWidget disponible:', typeof window.requestPaymentWidget);
                
                if (!window.createPaymentButton) {
                    console.warn('⚠️ createPaymentButton non disponible, utilisation de requestPaymentWidget');
                    // Utiliser requestPaymentWidget à la place
                    const uniqRefId = `payment-${Date.now()}`;
                    console.log('💳 Appel de requestPaymentWidget...');
                    window.requestPaymentWidget({
                        uniqRefId: uniqRefId,
                        amount: amount
                    });
                } else {
                    // Créer un bouton de paiement
                    const buttonId = `caurispay-btn-${Date.now()}`;
                    console.log('📦 Création du bouton:', buttonId);
                    
                    // S'assurer que le conteneur existe
                    const container = document.getElementById('caurispay-container');
                    if (!container) {
                        console.error('❌ Conteneur caurispay-container non trouvé');
                        onError('Erreur: conteneur de widget non trouvé');
                        return;
                    }
                    
                    console.log('📦 Appel de createPaymentButton...');
                    window.createPaymentButton({
                        uniqRefId: buttonId,
                        containerId: 'caurispay-container',
                        amount: amount.toString(),
                        title: `Payer ${amount} FCFA`,
                        callbackUrl: `${window.location.origin}/tenant/payment?caurispay=success`
                    });
                    
                    console.log('✅ Bouton de paiement créé');
                }
            }, 1000);

        } catch (error) {
            console.error('❌ Erreur initialisation widget CaurisPay:', error);
            onError(`Erreur lors de l'initialisation: ${error.message}`);
        }
    };

    const handleDirectPayment = () => {
        try {
            console.log('💳 Paiement direct CaurisPay...');
            console.log('📋 Montant:', amount);
            console.log('🔍 requestPaymentWidget disponible:', typeof window.requestPaymentWidget);
            
            if (!window.requestPaymentWidget) {
                console.error('❌ requestPaymentWidget non disponible');
                onError('Widget non disponible. Veuillez réessayer plus tard.');
                return;
            }

            const uniqRefId = `payment-${Date.now()}`;
            console.log('🆔 ID unique:', uniqRefId);
            
            console.log('📞 Appel de requestPaymentWidget...');
            window.requestPaymentWidget({
                uniqRefId: uniqRefId,
                amount: amount
            });

            console.log('✅ Widget de paiement appelé');
            
            // Écouter les événements de paiement
            window.addEventListener('caurispay-payment-success', handlePaymentSuccess);
            window.addEventListener('caurispay-payment-error', handlePaymentError);
            
            console.log('👂 Écouteurs d\'événements configurés');

        } catch (error) {
            console.error('❌ Erreur paiement direct:', error);
            onError(`Erreur lors du paiement: ${error.message}`);
        }
    };

    const handlePaymentSuccess = (event) => {
        console.log('🎉 Paiement réussi !');
        console.log('📋 Événement:', event);
        console.log('📋 Détails:', event.detail);
        
        const { reference, status } = event.detail;
        console.log('✅ Référence:', reference);
        console.log('✅ Statut:', status);
        
        onSuccess({ reference, status });
        cleanup();
    };

    const handlePaymentError = (event) => {
        console.log('❌ Erreur de paiement...');
        console.log('📋 Événement:', event);
        console.log('📋 Détails:', event.detail);
        
        const { error } = event.detail;
        console.error('❌ Erreur:', error);
        
        onError(error || 'Erreur lors du paiement');
        cleanup();
    };

    const cleanup = () => {
        console.log('🧹 Nettoyage des écouteurs...');
        window.removeEventListener('caurispay-payment-success', handlePaymentSuccess);
        window.removeEventListener('caurispay-payment-error', handlePaymentError);
    };

    if (loading) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="caurispay-widget">
            <style>{`
                .caurispay-widget {
                    padding: 20px;
                    text-align: center;
                    background: #f8f9fa;
                    border-radius: 10px;
                    border: 1px solid #dee2e6;
                }
                .caurispay-widget h5 {
                    margin-bottom: 20px;
                    color: #333;
                }
                .caurispay-widget .payment-options {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .caurispay-widget .btn-caurispay {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }
                .caurispay-widget .btn-caurispay:hover {
                    background: #218838;
                }
                .caurispay-widget .btn-secondary {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }
                .caurispay-widget .btn-secondary:hover {
                    background: #5a6268;
                }
                .caurispay-widget .btn-fallback {
                    background: #ffc107;
                    color: #212529;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.3s ease;
                }
                .caurispay-widget .btn-fallback:hover {
                    background: #e0a800;
                }
                #caurispay-container {
                    margin: 20px 0;
                    min-height: 50px;
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    padding: 20px;
                    background: #fafafa;
                }
                .fallback-info {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    color: #856404;
                }
            `}</style>

            <h5>
                <i className="fas fa-credit-card me-2"></i>
                Payer avec CaurisPay
            </h5>
            
            <div className="payment-options">
                <div id="caurispay-container">
                    <div style={{ color: '#666', fontSize: '14px' }}>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Chargement du widget...
                    </div>
                </div>
                
                <button 
                    className="btn-caurispay"
                    onClick={handleDirectPayment}
                >
                    <i className="fas fa-mobile-alt me-2"></i>
                    Payer par Mobile Money
                </button>
                
                {/* Fallback si le widget ne charge pas */}
                <button 
                    className="btn-fallback"
                    onClick={() => {
                        console.log('🔄 Utilisation du fallback API...');
                        // Simuler un paiement pour tester
                        onSuccess({ 
                            reference: `TEST-${Date.now()}`, 
                            status: 'SUCCESS' 
                        });
                    }}
                >
                    <i className="fas fa-cog me-2"></i>
                    Mode Test (Simulation)
                </button>
                
                {onClose && (
                    <button 
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        <i className="fas fa-times me-2"></i>
                        Annuler
                    </button>
                )}
            </div>
            
            <div className="fallback-info">
                <strong><i className="fas fa-info-circle me-2"></i>Information:</strong> 
                Si le widget ne s'affiche pas, utilisez le bouton "Payer par Mobile Money" ou le mode test.
                Les logs détaillés sont disponibles dans la console du navigateur (F12).
            </div>
        </div>
    );
};

export default CaurisPayWidget;
