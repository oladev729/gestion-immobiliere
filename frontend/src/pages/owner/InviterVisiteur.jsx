import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const InviterVisiteur = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDemandes();
  }, []);

  const fetchDemandes = async () => {
    try {
      const response = await api.get('/visiteurs/demandes-en-attente');
      setDemandes(response.data.demandes || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes:', err);
      setError('Erreur lors de la récupération des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleInviter = async (demandeId) => {
    try {
      setLoading(true);
      const response = await api.post(`/visiteurs/inviter/${demandeId}`);
      
      const successMsg = response.data.ethereal_url 
        ? `Invitation envoyée ! Vous pouvez voir l'email ici : ${response.data.ethereal_url}`
        : 'Invitation envoyée avec succès !';
      
      setMessage(successMsg);
      
      // Rafraîchir la liste
      fetchDemandes();
      
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Erreur lors de l\'invitation:', err);
      setError('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && demandes.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* EN-TÊTE DE PAGE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>Inviter Visiteur</h1>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Gérez les demandes d'inscription et invitez vos futurs locataires.</p>
          </div>

        </div>

        {/* FEEDBACK MESSAGES */}
        {message && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #a7f3d0', fontWeight: '500' }}>
            <i className="bi bi-check-circle-fill" style={{ marginRight: '0.5rem' }}></i>
            {message}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fecaca', fontWeight: '500' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        {/* CONTENU PRINCIPAL */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>


          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visiteur</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacts</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date souhaitée</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ divideY: '1px #e5e7eb' }}>
                {demandes.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#9ca3af' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}></i>
                      Aucune demande en attente
                    </td>
                  </tr>
                ) : (
                  demandes.map((demande) => (
                    <tr key={demande.id_demande || demande.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            height: '2.5rem', width: '2.5rem', borderRadius: '9999px',
                            backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', fontWeight: '700',
                            marginRight: '0.75rem'
                          }}>
                            {demande.nom ? demande.nom[0].toUpperCase() : 'V'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{demande.nom} {demande.prenoms}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{demande.ville || 'Ville non précisée'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>{demande.email}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{demande.telephone || 'Non renseigné'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#374151' }}>{formatDate(demande.date_demande)}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleInviter(demande.id_demande || demande.id)}
                          disabled={loading}
                          style={{ 
                            backgroundColor: '#10b981', color: '#ffffff', border: 'none',
                            padding: '0.375rem 0.875rem', borderRadius: '0.375rem', fontWeight: '600',
                            fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                          }}
                        >
                          + Inviter
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviterVisiteur;
