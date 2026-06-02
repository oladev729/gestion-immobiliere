import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function Quittances() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/paiements/mes-paiements');
      setPayments(response.data || []);
    } catch (err) {
      setError('Impossible de charger vos paiements.');
      console.error('Erreur paiements:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async (paymentId) => {
    setGenerating(true);
    try {
      const response = await api.post('/quittances/generer', {
        id_paiement: paymentId,
        type_quittance: 'loyer'
      });
      
      // Télécharger le PDF de la quittance
      const quittanceId = response.data.quittance.id_quittance;
      const pdfResponse = await api.get(`/quittances/${quittanceId}/pdf`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quittance_${quittanceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Quittance générée avec succès!');
      setSelectedPayment(null);
    } catch (error) {
      console.error('Erreur lors de la génération de la quittance:', error);
      alert('Erreur lors de la génération de la quittance');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">
        <i className="bi bi-file-earmark-text me-2"></i>
        Mes Quittances
      </h2>
      
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">liste des paiements</h5>
        </div>
        <div className="card-body">
          {payments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">aucun paiement trouvé</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>type</th>
                    <th>montant</th>
                    <th>date paiement</th>
                    <th>statut</th>
                    <th>actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id_payment || payment.id_payement}>
                      <td>{payment.type_paiement || 'Loyer'}</td>
                      <td>{payment.montant?.toLocaleString('fr-FR')} XOF</td>
                      <td>{formatDate(payment.date_paiement)}</td>
                      <td>
                        <span className={`badge ${payment.statut_paiement === 'valide' || payment.statut_paiement === 'payé' ? 'bg-success' : 'bg-warning'}`}>
                          {payment.statut_paiement === 'valide' ? 'payé' : payment.statut_paiement}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedPayment(payment)}
                          style={{ borderRadius: '8px' }}
                        >
                          aperçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal aperçu quittance */}
      {selectedPayment && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">aperçu de la quittance</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedPayment(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="receipt-preview">
                  <h6>informations du paiement</h6>
                  <p><strong>type:</strong> {selectedPayment.type_paiement || 'Loyer'}</p>
                  <p><strong>montant:</strong> {selectedPayment.montant?.toLocaleString('fr-FR')} XOF</p>
                  <p><strong>date:</strong> {formatDate(selectedPayment.date_paiement)}</p>
                  
                  <h6 className="mt-3">quittance de loyer</h6>
                  <div className="border p-3 rounded">
                    <p>Je soussigné, propriétaire du bien, certifie avoir reçu la somme de:</p>
                    <p className="text-center fw-bold">{selectedPayment.montant?.toLocaleString('fr-FR')} XOF</p>
                    <p>en paiement du loyer pour la période correspondante.</p>
                    <p>Fait à {selectedPayment.lieu || 'Lieu'}, le {formatDate(selectedPayment.date_paiement)}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    generateReceipt(selectedPayment.id_payment || selectedPayment.id_payement);
                  }}
                  disabled={generating}
                >
                  {generating ? 'génération...' : 'générer le pdf'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPayment(null)}
                >
                  fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
