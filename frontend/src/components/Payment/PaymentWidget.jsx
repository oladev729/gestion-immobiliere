import React, { useEffect } from 'react';

const PaymentWidget = ({ 
  amount, 
  reference, 
  onSuccess, 
  onError, 
  onClose 
}) => {
  useEffect(() => {
    // Charger le script CaurisPay si nécessaire
    const loadCaurisPayScript = () => {
      if (!window.caurisPay) {
        const script = document.createElement('script');
        script.src = 'http://127.0.0.1:51001/cdn.js';
        script.async = true;
        script.onload = initializeWidget;
        script.onerror = () => {
          console.error('Erreur de chargement du script CaurisPay');
          onError?.('Erreur de chargement du service de paiement');
        };
        document.body.appendChild(script);
      } else {
        initializeWidget();
      }
    };

    const initializeWidget = () => {
      try {
        // Initialiser CaurisPay avec les credentials
        window.initPayment({
          clientID: process.env.REACT_APP_CAURISPAY_CLIENT_ID,
          serviceId: process.env.REACT_APP_CAURISPAY_SERVICE_ID,
          serviceKey: process.env.REACT_APP_CAURISPAY_SERVICE_KEY
        });

        // Configurer les callbacks
        window.onPaymentSuccess = (data) => {
          console.log('✅ Paiement widget réussi:', data);
          onSuccess?.(data);
        };

        window.onPaymentError = (error) => {
          console.error('❌ Erreur paiement widget:', error);
          onError?.(error);
        };

        window.onPaymentClose = () => {
          console.log('🔒 Widget paiement fermé');
          onClose?.();
        };

      } catch (error) {
        console.error('Erreur initialisation widget CaurisPay:', error);
        onError?.('Erreur d\'initialisation du service de paiement');
      }
    };

    loadCaurisPayScript();

    // Nettoyage
    return () => {
      if (window.caurisPayWidget) {
        window.caurisPayWidget.close();
      }
    };
  }, [onSuccess, onError, onClose]);

  const openPaymentWidget = () => {
    try {
      if (window.requestPaymentWidget) {
        window.requestPaymentWidget({
          uniqRefId: reference,
          amount: amount
        });
      } else {
        onError?.('Service de paiement non disponible');
      }
    } catch (error) {
      console.error('Erreur ouverture widget:', error);
      onError?.('Erreur lors de l\'ouverture du formulaire de paiement');
    }
  };

  return (
    <div className="text-center">
      <button
        className="btn btn-primary btn-lg"
        onClick={openPaymentWidget}
      >
        <i className="bi bi-credit-card me-2"></i>
        Payer avec CaurisPay
      </button>
      <p className="text-muted mt-2">
        <small>
          <i className="bi bi-shield-check me-1"></i>
          Paiement sécurisé via CaurisPay
        </small>
      </p>
    </div>
  );
};

export default PaymentWidget;
