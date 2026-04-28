import React, { useState } from 'react';
import api from '../api/axios';

const ContractInvitation = ({ contrat, bien, locataire }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInviteLocataire = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Créer l'invitation de contrat
      const invitationData = {
        id_contrat: contrat.id_contact || contrat.id_contrat,
        id_locataire: locataire.id_locataire,
        id_proprietaire: bien.id_proprietaire,
        id_bien: bien.id_bien,
        email_locataire: locataire.email,
        message_invitation: `Vous êtes invité à consulter et accepter le contrat de location pour le bien : ${bien.titre}`
      };

      const response = await api.post('/contract-invitations/invite-locataire', invitationData);
      
      setMessage('✅ Invitation envoyée avec succès ! Le locataire recevra une notification par email.');
      
      // Optionnel: générer et télécharger le contrat PDF pour le propriétaire
      if (window.confirm('Voulez-vous également télécharger le contrat PDF ?')) {
        const ContratGenerator = require('./ContratGenerator').default;
        // Appeler la génération PDF ici
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'invitation du locataire:', error);
      setMessage(`❌ Erreur: ${error.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-invitation">
      <button 
        className="btn btn-success btn-sm"
        onClick={handleInviteLocataire}
        disabled={loading}
        title="Inviter le locataire à consulter le contrat"
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Envoi en cours...
          </>
        ) : (
          <>
            <i className="bi bi-envelope-plus me-2"></i>
            Inviter locataire
          </>
        )}
      </button>
      
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mt-2`} role="alert">
          {message}
        </div>
      )}
    </div>
  );
};

export default ContractInvitation;
