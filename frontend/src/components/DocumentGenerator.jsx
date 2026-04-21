import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Contracts from '../pages/owner/Contracts';

const DocumentGenerator = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('contracts');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/paiements/recus');
      setPayments(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
    }
  };

  const generateReceipt = async (paymentId) => {
    setLoading(true);
    try {
      const response = await api.post(`/documents/generate-receipt/${paymentId}`);
      
      // Créer un lien de téléchargement
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quittance_${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Quittance générée avec succès!');
    } catch (error) {
      console.error('Erreur lors de la génération de la quittance:', error);
      alert('Erreur lors de la génération de la quittance');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="document-generator">
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col-12">
            <h2 className="mb-4" style={{ color: '#1e293b', fontWeight: '700' }}>
              génération de documents
            </h2>
            
            {/* Onglets */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'contracts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contracts')}
                  style={{ border: 'none', background: 'none', color: activeTab === 'contracts' ? '#3b82f6' : '#6b7280' }}
                >
                  contrats
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'receipts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('receipts')}
                  style={{ border: 'none', background: 'none', color: activeTab === 'receipts' ? '#3b82f6' : '#6b7280' }}
                >
                  quittances
                </button>
              </li>
            </ul>

            {/* Onglet Contrats */}
            {activeTab === 'contracts' && (
              <div className="tab-content">
                <Contracts />
              </div>
            )}

            {/* Onglet Quittances */}
            {activeTab === 'receipts' && (
              <div className="tab-content">
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
                              <th>locataire</th>
                              <th>type</th>
                              <th>montant</th>
                              <th>date paiement</th>
                              <th>statut</th>
                              <th>actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((payment) => (
                              <tr key={payment.id_payment}>
                                <td>{payment.prenom_locataire} {payment.locataire_nom}</td>
                                <td>{payment.type_paiement}</td>
                                <td>{payment.montant?.toLocaleString('fr-FR')} XOF</td>
                                <td>{formatDate(payment.date_paiement)}</td>
                                <td>
                                  <span className={`badge ${payment.statut_paiement === 'payé' ? 'bg-success' : 'bg-warning'}`}>
                                    {payment.statut_paiement}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-primary btn-sm me-2"
                                    onClick={() => generateReceipt(payment.id_payment)}
                                    disabled={loading || payment.statut_paiement !== 'payé'}
                                    style={{ borderRadius: '8px' }}
                                  >
                                    {loading ? 'génération...' : 'générer'}
                                  </button>
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
              </div>
            )}
          </div>
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
                  <p><strong>locataire:</strong> {selectedPayment.prenom_locataire} {selectedPayment.locataire_nom}</p>
                  <p><strong>type:</strong> {selectedPayment.type_paiement}</p>
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
                  className="btn btn-secondary"
                  onClick={() => setSelectedPayment(null)}
                >
                  fermer
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    generateReceipt(selectedPayment.id_payment);
                    setSelectedPayment(null);
                  }}
                  disabled={loading}
                >
                  {loading ? 'génération...' : 'générer le pdf'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .document-generator {
          background: #f8fafc;
          min-height: 100vh;
        }
        
        .nav-tabs .nav-link {
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }
        
        .nav-tabs .nav-link.active {
          border-bottom-color: #3b82f6;
          font-weight: 600;
        }
        
        .card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .card-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          border-radius: 12px 12px 0 0 !important;
        }
        
        .table th {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
          text-transform: lowercase;
        }
        
        .btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .modal-content {
          border: none;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .contract-preview, .receipt-preview {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default DocumentGenerator;
