import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CaurisPayPayment from '../../components/Payment/CaurisPayPayment';

const ContractPayments = () => {
  const { user } = useAuth();
  const { contractId } = useParams();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContractDetails();
      fetchContractPayments();
    }
  }, [contractId]);

  const fetchContractDetails = async () => {
    try {
      const response = await api.get(`/contrats/${contractId}`);
      
      if (response.data.success) {
        setContract(response.data.data);
      } else {
        setError('Contrat non trouvé');
      }
    } catch (error) {
      console.error('Erreur fetchContractDetails:', error);
      setError('Erreur lors du chargement du contrat');
    }
  };

  const fetchContractPayments = async () => {
    try {
      const response = await api.get('/payment/history', {
        params: {
          userId: user.id,
          userType: user.type,
          contractId: contractId
        }
      });

      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Erreur fetchContractPayments:', error);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('✅ Paiement réussi:', paymentData);
    setShowPaymentForm(false);
    fetchContractPayments(); // Rafraîchir la liste des paiements
    fetchContractDetails(); // Mettre à jour le statut du contrat
  };

  const handlePaymentError = (error) => {
    console.error('❌ Erreur paiement:', error);
    alert(`Erreur de paiement: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCES':
        return <span className="badge bg-success">Succès</span>;
      case 'ECHEC':
        return <span className="badge bg-danger">Échec</span>;
      case 'ANNULE':
        return <span className="badge bg-warning">Annulé</span>;
      case 'EN_COURS':
        return <span className="badge bg-info">En cours</span>;
      default:
        return <span className="badge bg-secondary">Inconnu</span>;
    }
  };

  const calculateNextPayment = () => {
    if (!contract) return null;
    
    const lastPayment = payments
      .filter(p => p.statut === 'SUCCES' && p.type_paiement === 'LOYER')
      .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation))[0];
    
    if (lastPayment) {
      const nextDate = new Date(lastPayment.date_creation);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;
    }
    
    return new Date(contract.date_debut);
  };

  const isPaymentOverdue = () => {
    const nextPayment = calculateNextPayment();
    return nextPayment && nextPayment < new Date();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={() => navigate('/tenant/contracts')}
          >
            Retour aux contrats
          </button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Contrat non trouvé
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          {/* En-tête du contrat */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-file-text me-2"></i>
                  Contrat {contract.numero_contrat}
                </h5>
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => navigate('/tenant/contracts')}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Retour
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Informations du bien</h6>
                  <p><strong>{contract.bien_titre}</strong></p>
                  <p className="text-muted">{contract.bien_adresse}</p>
                </div>
                <div className="col-md-6">
                  <h6>Détails du contrat</h6>
                  <p><strong>Loyer:</strong> {formatAmount(contract.montant_loyer)}/mois</p>
                  <p><strong>Caution:</strong> {formatAmount(contract.montant_caution)}</p>
                  <p><strong>Période:</strong> {formatDate(contract.date_debut)} - {formatDate(contract.date_fin)}</p>
                </div>
              </div>
              
              {/* Statut du paiement */}
              <div className="mt-3">
                <h6>Statut du paiement</h6>
                {contract.statut_paiement === 'PAYE' ? (
                  <div className="alert alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    Tous les paiements sont à jour
                  </div>
                ) : isPaymentOverdue() ? (
                  <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Paiement en retard - Prochain paiement dû: {formatDate(calculateNextPayment())}
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Prochain paiement: {formatDate(calculateNextPayment())}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">Actions rapides</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-2">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                  >
                    <i className="bi bi-credit-card me-2"></i>
                    Payer le loyer
                  </button>
                </div>
                <div className="col-md-4 mb-2">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <i className="bi bi-shield-check me-2"></i>
                    Payer la caution
                  </button>
                </div>
                <div className="col-md-4 mb-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => navigate(`/tenant/payment-history`)}
                  >
                    <i className="bi bi-clock-history me-2"></i>
                    Historique
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de paiement */}
          {showPaymentForm && (
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0">
                  <i className="bi bi-credit-card me-2"></i>
                  Effectuer un paiement
                </h6>
              </div>
              <div className="card-body">
                <CaurisPayPayment
                  montant={contract.montant_loyer}
                  description={`Loyer mensuel - ${contract.bien_titre} - ${contract.numero_contrat}`}
                  typePaiement="LOYER"
                  idContrat={contract.id}
                  idBien={contract.id_bien}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              </div>
            </div>
          )}

          {/* Historique des paiements du contrat */}
          <div className="card">
            <div className="card-header bg-light">
              <h6 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Historique des paiements
              </h6>
            </div>
            <div className="card-body">
              {payments.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-receipt display-4 text-muted"></i>
                  <p className="mt-2 text-muted">Aucun paiement pour ce contrat</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Référence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.date_creation)}</td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {payment.type_paiement}
                            </span>
                          </td>
                          <td className="fw-bold">{formatAmount(payment.montant)}</td>
                          <td>{getStatusBadge(payment.statut)}</td>
                          <td>
                            <small className="text-muted font-monospace">
                              {payment.reference_marchand?.substring(0, 15)}...
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractPayments;
