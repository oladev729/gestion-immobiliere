import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

const ContractInvitation = () => {
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get("id");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!invitationId) {
      setError("ID d'invitation manquant");
      setLoading(false);
      return;
    }

    const fetchContract = async () => {
      try {
        const res = await api.get(`/contract-invitations/invitation/${invitationId}`);
        setContract(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de récupérer le contrat");
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [invitationId]);

  const handleAcceptContract = async () => {
    setAccepting(true);
    try {
      await api.post(`/contract-invitations/accept/${invitationId}`);
      // Rediriger vers les contrats du locataire
      navigate("/tenant/contracts");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'acceptation du contrat");
    } finally {
      setAccepting(false);
    }
  };

  const handleViewPDF = async () => {
    try {
      // Générer le PDF du contrat pour visualisation
      const contratData = {
        ...contract,
        bien: contract.bien || {},
        proprietaire: contract.proprietaire || {},
        locataire: contract.locataire || {}
      };

      const response = await api.post('/documents/generate-contrat', contratData, {
        responseType: 'blob'
      });
      
      // Ouvrir le PDF dans un nouvel onglet
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError('Erreur lors de la génération du PDF');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div className="card border-0 shadow-lg" style={{ width: '450px' }}>
          <div className="card-body p-4 text-center">
            <div className="text-danger mb-3">
              <i className="fas fa-exclamation-triangle fa-3x"></i>
            </div>
            <h4 className="text-danger">Erreur</h4>
            <p className="text-muted">{error}</p>
            <button className="btn btn-primary" onClick={() => navigate("/tenant/properties")}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="card border-0 shadow-lg" style={{ width: '600px', maxWidth: '95vw' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="text-success mb-3">
              <i className="fas fa-file-contract fa-3x"></i>
            </div>
            <h4 className="fw-bold text-success">Proposition de Contrat</h4>
            <p className="text-muted small">Vous avez reçu une proposition de contrat</p>
          </div>

          <div className="alert alert-info">
            <h6 className="fw-bold mb-2">Détails du bien:</h6>
            <p className="mb-1"><strong>{contract.bien_titre}</strong></p>
            <p className="mb-0 text-muted">{contract.bien_adresse}, {contract.bien_ville}</p>
          </div>

          <div className="card bg-light mb-4">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Termes du contrat:</h6>
              
              <div className="row mb-2">
                <div className="col-6"><strong>Loyer mensuel:</strong></div>
                <div className="col-6 text-end">{contract.loyer} FCFA</div>
              </div>
              
                            
              <div className="row mb-2">
                <div className="col-6"><strong>Durée:</strong></div>
                <div className="col-6 text-end">{contract.duree} mois</div>
              </div>
              
              <div className="row mb-2">
                <div className="col-6"><strong>Date de début:</strong></div>
                <div className="col-6 text-end">{new Date(contract.date_debut).toLocaleDateString('fr-FR')}</div>
              </div>
              
              <div className="row mb-2">
                <div className="col-6"><strong>Dépôt de garantie:</strong></div>
                <div className="col-6 text-end">{contract.depot_garantie} FCFA</div>
              </div>

              {contract.conditions && (
                <div className="mt-3">
                  <h6 className="fw-bold mb-2">Conditions particulières:</h6>
                  <p className="small text-muted mb-0">{contract.conditions}</p>
                </div>
              )}
            </div>
          </div>

          <div className="alert alert-warning">
            <h6 className="fw-bold mb-2">Propriétaire:</h6>
            <p className="mb-1"><strong>{contract.proprietaire_nom} {contract.proprietaire_prenoms}</strong></p>
            <p className="mb-0 text-muted small">En date du: {new Date(contract.date_proposition).toLocaleDateString('fr-FR')}</p>
          </div>

          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i>
                Retour
              </button>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-info"
                  onClick={handleViewPDF}
                  title="Voir le contrat en PDF"
                >
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Voir le contrat
                </button>
                <button 
                  className="btn btn-success"
                  onClick={handleAcceptContract}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      J'accepte
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <small className="text-muted">
              En acceptant ce contrat, vous vous engagez à respecter les termes et conditions
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractInvitation;
