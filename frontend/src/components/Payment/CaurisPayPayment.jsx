import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const CaurisPayPayment = ({ 
  montant, 
  description, 
  typePaiement = 'AUTRE', 
  idContrat = null, 
  idBien = null,
  onSuccess,
  onError,
  onCancel
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  const [paymentData, setPaymentData] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: user?.email || '',
    firstName: user?.prenoms || '',
    lastName: user?.nom || ''
  });

  // Nettoyer le polling lors du démontage
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Initier le paiement
  const initiatePayment = async (e) => {
    e.preventDefault();
    
    if (!formData.phoneNumber || !formData.email) {
      alert('Veuillez remplir le numéro de téléphone et l\'email');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const payload = {
        montant,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        description,
        typePaiement,
        idContrat,
        idBien,
        idLocataire: user?.type === 'locataire' ? user.id : null,
        idProprietaire: user?.type === 'proprietaire' ? user.id : null
      };

      console.log('🚀 Initiation paiement CaurisPay:', payload);

      const response = await api.post('/payment/initiate', payload);
      
      if (response.data.success) {
        const paymentResult = response.data.data;
        setPaymentData(paymentResult);
        
        console.log('✅ Paiement initié:', paymentResult);
        
        // Démarrer le polling pour vérifier le statut
        startPaymentPolling(paymentResult.merchantReference, paymentResult.processingReference);
        
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'initiation du paiement');
      }

    } catch (error) {
      console.error('❌ Erreur initiation paiement:', error);
      setPaymentStatus('error');
      onError?.(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Démarrer le polling pour vérifier le statut
  const startPaymentPolling = (merchantReference, processingReference) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.post('/payment/status', {
          merchantReference,
          processingReference
        });

        if (response.data.success) {
          const status = response.data.data.status;
          console.log('🔄 Statut paiement:', status);

          if (status === 'SUCCES') {
            clearInterval(interval);
            setPollingInterval(null);
            setPaymentStatus('success');
            onSuccess?.(response.data.data);
            
          } else if (status === 'ECHEC') {
            clearInterval(interval);
            setPollingInterval(null);
            setPaymentStatus('error');
            onError?.('Le paiement a échoué');
            
          } else if (status === 'ANNULE') {
            clearInterval(interval);
            setPollingInterval(null);
            setPaymentStatus('idle');
            onCancel?.('Le paiement a été annulé');
          }
        }

      } catch (error) {
        console.error('❌ Erreur vérification statut:', error);
        // Continuer le polling même en cas d'erreur
      }
    }, 5000); // Vérifier toutes les 5 secondes

    setPollingInterval(interval);
    
    // Arrêter le polling après 5 minutes maximum
    setTimeout(() => {
      clearInterval(interval);
      setPollingInterval(null);
      if (paymentStatus === 'processing') {
        setPaymentStatus('error');
        onError?.('Délai d\'attente dépassé');
      }
    }, 300000); // 5 minutes
  };

  // Annuler le paiement
  const cancelPayment = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setPaymentStatus('idle');
    setPaymentData(null);
    onCancel?.('Paiement annulé');
  };

  // Formatter le montant
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="card">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-credit-card me-2"></i>
          Paiement CaurisPay
        </h5>
      </div>
      
      <div className="card-body">
        {paymentStatus === 'idle' && (
          <form onSubmit={initiatePayment}>
            <div className="mb-3">
              <label className="form-label">Montant à payer</label>
              <div className="form-control bg-light">
                <strong>{formatAmount(montant)}</strong>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <div className="form-control bg-light">
                {description}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="phoneNumber" className="form-label">
                  Numéro de téléphone <span className="text-danger">*</span>
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="229XXXXXXXX"
                  required
                />
                <small className="text-muted">Format: 229XXXXXXXX</small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="firstName" className="form-label">Prénom</label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Jean"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="lastName" className="form-label">Nom</label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Traitement...
                  </>
                ) : (
                  <>
                    <i className="bi bi-credit-card me-2"></i>
                    Payer {formatAmount(montant)}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {paymentStatus === 'processing' && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Traitement...</span>
            </div>
            <h5>Paiement en cours...</h5>
            <p className="text-muted">
              Veuillez compléter le paiement sur votre téléphone.
              Nous vérifions automatiquement le statut.
            </p>
            <p className="text-muted">
              <small>Référence: {paymentData?.merchantReference}</small>
            </p>
            <button
              className="btn btn-outline-secondary"
              onClick={cancelPayment}
            >
              Annuler
            </button>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center py-4">
            <div className="text-success mb-3">
              <i className="bi bi-check-circle display-1"></i>
            </div>
            <h5 className="text-success">Paiement réussi !</h5>
            <p className="text-muted">
              Votre paiement de {formatAmount(montant)} a été effectué avec succès.
            </p>
            <p className="text-muted">
              <small>Référence: {paymentData?.merchantReference}</small>
            </p>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="text-center py-4">
            <div className="text-danger mb-3">
              <i className="bi bi-x-circle display-1"></i>
            </div>
            <h5 className="text-danger">Paiement échoué</h5>
            <p className="text-muted">
              Une erreur est survenue lors du paiement. Veuillez réessayer.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setPaymentStatus('idle')}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Réessayer
            </button>
          </div>
        )}
      </div>

      <div className="card-footer text-muted">
        <small>
          <i className="bi bi-info-circle me-1"></i>
          Paiement sécurisé via CaurisPay - Opérateurs mobiles Bénin
        </small>
      </div>
    </div>
  );
};

export default CaurisPayPayment;
