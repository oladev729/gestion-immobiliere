import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payment/history', {
        params: {
          userId: user.id,
          userType: user.type
        }
      });

      if (response.data.success) {
        setPayments(response.data.data);
      } else {
        setError('Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('Erreur fetchPaymentHistory:', error);
      setError('Erreur serveur lors de la récupération de l\'historique');
    } finally {
      setLoading(false);
    }
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'LOYER':
        return 'Loyer';
      case 'CAUTION':
        return 'Caution';
      case 'CHARGES':
        return 'Charges';
      default:
        return type || 'Autre';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Historique des paiements
              </h5>
            </div>
            
            <div className="card-body">
              {error ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                  <button 
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={fetchPaymentHistory}
                  >
                    Réessayer
                  </button>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-receipt display-4 text-muted"></i>
                  <h5 className="mt-3 text-muted">Aucun paiement</h5>
                  <p className="text-muted">Vous n'avez effectué aucun paiement pour le moment.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
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
                            <div>
                              <strong>{payment.description || 'Paiement'}</strong>
                              {payment.bien_titre && (
                                <small className="d-block text-muted">
                                  <i className="bi bi-house-door me-1"></i>
                                  {payment.bien_titre}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {getTypeLabel(payment.type_paiement)}
                            </span>
                          </td>
                          <td className="fw-bold">{formatAmount(payment.montant)}</td>
                          <td>{getStatusBadge(payment.statut)}</td>
                          <td>
                            <small className="text-muted font-monospace">
                              {payment.reference_marchand}
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

export default PaymentHistory;
