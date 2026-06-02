import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { printContrat } from '../../utils/contratGenerator';
import { useAuth } from '../../context/AuthContext';


export default function TenantRentals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contrats, setContrats] = useState([]);
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

  const handleAccept = async (id) => {
    if (!window.confirm('Voulez-vous vraiment accepter ce contrat ?')) return;
    try {
      await api.patch(`/contrats/${id}/accepter`);
      alert('Contrat accepté avec succès !');
      fetchContrats();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'acceptation");
    }
  };

  const handleView = async (contrat) => {
    try {
      const idContrat = contrat.id_contact || contrat.id_contrat;
      const response = await api.get(`/contrats/${idContrat}`);
      const completeContrat = response.data;
      
      printContrat(
        completeContrat,
        completeContrat.bien || contrat,
        completeContrat.locataire || contrat,
        completeContrat.proprietaire || user
      );
    } catch (error) {
      console.error('Erreur lors du chargement du contrat:', error);
      alert('Erreur lors du chargement du contrat');
    }
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

                    <div className="d-flex gap-2 justify-content-end mt-3 border-top pt-3">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => handleView(contrat)}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Voir le contrat
                      </button>
                      
                      {contrat.statut_contrat === 'en_attente' && (
                        <button 
                          className="btn btn-success"
                          onClick={() => handleAccept(idContrat)}
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          Accepter et Signer
                        </button>
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
