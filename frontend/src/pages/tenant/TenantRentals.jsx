import { useState, useEffect } from 'react';
import api from '../../api/axios';


export default function TenantRentals() {
  const [contrats, setContrats] = useState([]);
  const [charges, setCharges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContrats();
  }, []);

  const fetchContrats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contrats/mes-contrats-locataire');
      const data = res.data;
      setContrats(data);

      const chargesMap = {};
      await Promise.all(
        data.map(async (contrat) => {
          try {
            const chargesRes = await api.get(
              `/paiements/contrat/${contrat.id_contact || contrat.id_contrat}`
            );
            chargesMap[contrat.id_contact || contrat.id_contrat] = chargesRes.data.filter(
              (p) => p.type_paiement === 'charge'
            );
          } catch {
            chargesMap[contrat.id_contact || contrat.id_contrat] = [];
          }
        })
      );
      setCharges(chargesMap);
    } catch (err) {
      setError('Impossible de charger vos locations.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'actif': return 'success';
      case 'termine': return 'secondary';
      case 'resilie': return 'danger';
      default: return 'info';
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

  const getChargesContrat = (contrat) => {
    const id = contrat.id_contact || contrat.id_contrat;
    return charges[id] || [];
  };

  const totalCharges = (contrat) => {
    return getChargesContrat(contrat).reduce(
      (sum, c) => sum + parseFloat(c.montant || 0),
      0
    );
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Mes locations</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : contrats.length === 0 ? (
        <div className="alert alert-info">
          Aucune location active pour le moment.
        </div>
      ) : (
        <div className="row g-4">
          {contrats.map((contrat) => {
            const idContrat = contrat.id_contact || contrat.id_contrat;
            const chargesContrat = getChargesContrat(contrat);
            const total = totalCharges(contrat);

            return (
              <div className="col-12" key={idContrat}>
                <div className="card shadow-sm">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      {contrat.bien_titre || contrat.titre || `Bien #${contrat.id_bien}`}
                    </h5>
                    <span className={`badge bg-${getStatutBadge(contrat.statut_contrat)}`}>
                      {contrat.statut_contrat || 'actif'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="row g-3 mb-3">
                      {/* Infos contrat */}
                      <div className="col-md-6">
                        <p className="mb-1">
                          <span className="text-muted">Loyer mensuel :</span>{' '}
                          <strong>{formatMontant(contrat.loyer_mensuel)}</strong>
                        </p>
                        <p className="mb-1">
                          <span className="text-muted">Dépôt de garantie :</span>{' '}
                          <strong>{formatMontant(contrat.depot_garantie)}</strong>
                        </p>
                        <p className="mb-1">
                          <span className="text-muted">Début du contrat :</span>{' '}
                          <strong>{formatDate(contrat.date_debut)}</strong>
                        </p>
                        <p className="mb-1">
                          <span className="text-muted">Fin du contrat :</span>{' '}
                          <strong>
                            {contrat.date_fin ? formatDate(contrat.date_fin) : 'Indéterminée'}
                          </strong>
                        </p>
                      </div>

                      {/* Infos bien */}
                      <div className="col-md-6">
                        {contrat.ville && (
                          <p className="mb-1">
                            <span className="text-muted">Ville :</span>{' '}
                            <strong>{contrat.ville}</strong>
                          </p>
                        )}
                        {contrat.adresse && (
                          <p className="mb-1">
                            <span className="text-muted">Adresse :</span>{' '}
                            <strong>{contrat.adresse}</strong>
                          </p>
                        )}
                        {contrat.type_bien && (
                          <p className="mb-1">
                            <span className="text-muted">Type :</span>{' '}
                            <strong>{contrat.type_bien}</strong>
                          </p>
                        )}
                        {contrat.proprietaire_nom && (
                          <p className="mb-1">
                            <span className="text-muted">Propriétaire :</span>{' '}
                            <strong>{contrat.proprietaire_nom}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Section charges */}
                    <div className="mt-3">
                      <h6 className="fw-semibold border-bottom pb-2">
                        Charges ({chargesContrat.length})
                        {total > 0 && (
                          <span className="ms-2 text-danger">
                            — Total : {formatMontant(total)}
                          </span>
                        )}
                      </h6>

                      {chargesContrat.length === 0 ? (
                        <p className="text-muted small">Aucune charge pour le moment.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover bg-white shadow-sm rounded">
                            <thead className="table-dark">
                              <tr>
                                <th>Description</th>
                                <th>Montant</th>
                                <th>Date</th>
                                <th>Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {chargesContrat.map((charge, idx) => (
                                <tr key={charge.id_paiement || idx} style={{ backgroundColor: '#fff' }}>
                                  <td style={{ color: '#000' }}>{charge.description || 'Charge'}</td>
                                  <td style={{ color: '#dc3545', fontWeight: 600 }}>
                                    {formatMontant(charge.montant)}
                                  </td>
                                  <td style={{ color: '#000' }}>{formatDate(charge.date_paiement)}</td>
                                  <td>
                                    <span className={`badge ${
                                      charge.statut_paiement === 'paye' ? 'bg-success' :
                                      charge.statut_paiement === 'en_attente' ? 'bg-warning text-dark' :
                                      'bg-secondary'
                                    }`}>
                                      {charge.statut_paiement === 'en_attente' ? 'En attente'
                                        : charge.statut_paiement === 'paye' ? 'Payé'
                                        : charge.statut_paiement || 'N/A'}
                                    </span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
