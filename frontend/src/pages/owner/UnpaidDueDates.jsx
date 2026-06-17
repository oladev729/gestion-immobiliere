import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function UnpaidDueDates() {
  const [impayes, setImpayes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImpayes();
  }, []);

  const fetchImpayes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/paiements/impayes-proprietaire');
      setImpayes(res.data);
    } catch (err) {
      console.error('Erreur récupération impayés:', err);
      setError('Impossible de charger les échéances impayées.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '0 FCFA';
    return parseFloat(montant).toLocaleString('fr-FR') + ' FCFA';
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'en_attente': return { bg: '#fffbeb', text: '#92400e', label: 'En attente' };
      case 'impaye': return { bg: '#fef2f2', text: '#991b1b', label: 'Impayé' };
      case 'paye': return { bg: '#ecfdf5', text: '#065f46', label: 'Payé' };
      default: return { bg: '#f3f4f6', text: '#374151', label: statut };
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Échéances impayées des locataires</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : impayes.length === 0 ? (
        <div className="alert alert-info">
          Aucune échéance impayée à afficher.
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Bien</th>
                    <th>Locataire</th>
                    <th>Mois concerné</th>
                    <th>Loyer</th>
                    <th>Charges</th>
                    <th>Total</th>
                    <th>Date d'échéance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {impayes.map((impaye) => {
                    const statutConfig = getStatutBadge(impaye.statut);
                    return (
                      <tr key={impaye.id_loyer}>
                        <td>
                          <strong>{impaye.bien_titre}</strong>
                          {impaye.bien_adresse && (
                            <small className="text-muted d-block">{impaye.bien_adresse}</small>
                          )}
                        </td>
                        <td>
                          {impaye.locataire_nom && impaye.locataire_prenoms ? (
                            <>
                              {impaye.locataire_prenoms} {impaye.locataire_nom}
                              {impaye.locataire_email && (
                                <small className="text-muted d-block">{impaye.locataire_email}</small>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">Non renseigné</span>
                          )}
                        </td>
                        <td>{impaye.mois_concerne}</td>
                        <td>{formatMontant(impaye.montant_loyer)}</td>
                        <td>{formatMontant(impaye.montant_charge)}</td>
                        <td>
                          <strong>{formatMontant(parseFloat(impaye.montant_loyer || 0) + parseFloat(impaye.montant_charge || 0))}</strong>
                        </td>
                        <td>{formatDate(impaye.date_echeance)}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ backgroundColor: statutConfig.bg, color: statutConfig.text }}
                          >
                            {statutConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
