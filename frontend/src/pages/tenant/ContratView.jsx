import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { printContrat, generateContratHTML } from '../../utils/contratGenerator';

export default function ContratView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrat, setContrat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContrat();
  }, [id]);

  const fetchContrat = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/contrats/${id}`);
      setContrat(response.data);
    } catch (err) {
      setError('Impossible de charger le contrat.');
      console.error('Erreur contrat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (contrat) {
      printContrat(contrat, contrat, contrat, contrat);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
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

  if (!contrat) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">
          Contrat non trouvé.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-file-earmark-text me-2"></i>
          Contrat de Bail
        </h2>
        <button className="btn btn-secondary" onClick={() => navigate('/tenant/rentals')}>
          <i className="bi bi-arrow-left me-2"></i>
          Retour
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Contrat #{contrat.id_contact || contrat.id_contrat}
          </h5>
          <span className={`badge bg-light text-dark`}>
            {contrat.statut_contrat || 'actif'}
          </span>
        </div>

        <div className="card-body">
          <div 
            dangerouslySetInnerHTML={{ 
              __html: generateContratHTML(contrat, contrat, contrat, contrat) 
            }} 
            style={{ 
              maxHeight: '70vh', 
              overflowY: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff'
            }}
          />
          
          <div className="alert alert-info mt-4">
            <i className="bi bi-info-circle me-2"></i>
            Ce contrat est en lecture seule. Vous pouvez le consulter et le télécharger, mais vous ne pouvez pas le modifier.
          </div>

          <div className="d-flex gap-2 justify-content-end mt-4">
            <button className="btn btn-primary" onClick={handlePrint}>
              <i className="bi bi-download me-2"></i>
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
