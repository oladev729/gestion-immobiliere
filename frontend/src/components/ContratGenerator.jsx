import React, { useState } from 'react';
import api from '../api/axios';

const ContratGenerator = ({ contrat, bien, proprietaire, locataire }) => {
  const [loadingPrint, setLoadingPrint] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  const printContrat = async () => {
    setLoadingPrint(true);
    try {
      // Préparer les données du contrat dans la structure attendue par le backend
      const contratData = {
        contrat: contrat,
        bien: bien,
        proprietaire: proprietaire,
        locataire: locataire,
        date_generation: new Date().toISOString()
      };

      console.log('🔄 Début de la génération du contrat pour impression...');
      console.log('📋 Données du contrat:', contratData);

      const response = await api.post('/documents/generate-contrat', contratData, {
        responseType: 'blob',
        timeout: 30000
      });
      
      console.log('✅ Réponse reçue du serveur:', response.status);
      console.log('📄 Taille du document:', response.data.size, 'bytes');
      
      // Vérifier si la réponse est bien un document
      if (response.data.size === 0) {
        throw new Error('Le document généré est vide');
      }
      
      // Créer un URL pour le contrat
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Ouvrir dans une nouvelle fenêtre pour impression
      const printWindow = window.open(url, '_blank');
      
      // Attendre que la fenêtre se charge puis imprimer
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
        }
      }, 1000);
      
      alert('✅ Contrat généré! La fenêtre d\'impression va s\'ouvrir...');
      
    } catch (error) {
      console.error('❌ Erreur détaillée lors de la génération du contrat:', error);
      
      // Gérer les erreurs de réponse
      if (error.response) {
        console.error('📡 Erreur de réponse:', error.response.status, error.response.statusText);
        
        if (error.response.data instanceof Blob) {
          // Si la réponse est un blob (erreur PDF), essayer de lire le message
          try {
            const errorText = await error.response.data.text();
            console.error('📝 Message d\'erreur du serveur (blob):', errorText);
            
            if (errorText.includes('{')) {
              const errorJson = JSON.parse(errorText);
              alert(`❌ Erreur serveur: ${errorJson.message || errorJson.error || 'Erreur lors de la génération du contrat'}`);
            } else {
              alert(`❌ Erreur serveur: ${errorText}`);
            }
          } catch (parseError) {
            console.error('🔧 Erreur de parsing de l\'erreur:', parseError);
            alert(`❌ Erreur serveur: ${error.response.statusText || 'Erreur lors de la génération du contrat'}`);
          }
        } else {
          console.error('📝 Erreur réponse (JSON):', error.response.data);
          alert(`❌ Erreur: ${error.response.data?.message || error.response.data?.error || 'Erreur lors de la génération du contrat'}`);
        }
      } else if (error.request) {
        console.error('🌐 Erreur de requête:', error.request);
        alert('❌ Erreur de connexion au serveur - Vérifiez que le backend est démarré');
      } else {
        console.error('⚙️ Erreur de configuration:', error);
        alert(`❌ Erreur inattendue: ${error.message}`);
      }
    } finally {
      setLoadingPrint(false);
    }
  };

  const downloadContrat = async () => {
    setLoadingDownload(true);
    try {
      // Préparer les données du contrat dans la structure attendue par le backend
      const contratData = {
        contrat: contrat,
        bien: bien,
        proprietaire: proprietaire,
        locataire: locataire,
        date_generation: new Date().toISOString()
      };

      console.log('🔄 Début du téléchargement du contrat...');
      console.log('📋 Données du contrat:', contratData);

      const response = await api.post('/documents/generate-contrat', contratData, {
        responseType: 'blob',
        timeout: 30000
      });
      
      console.log('✅ Réponse reçue du serveur:', response.status);
      console.log('📄 Taille du document:', response.data.size, 'bytes');
      
      // Vérifier si la réponse est bien un document
      if (response.data.size === 0) {
        throw new Error('Le document généré est vide');
      }
      
      // Créer un blob et télécharger
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrat_${contrat.numero_contrat}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL
      window.URL.revokeObjectURL(url);
      
      alert('✅ Contrat téléchargé avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur détaillée lors du téléchargement du contrat:', error);
      
      // Gérer les erreurs de réponse
      if (error.response) {
        console.error('📡 Erreur de réponse:', error.response.status, error.response.statusText);
        
        if (error.response.data instanceof Blob) {
          // Si la réponse est un blob (erreur PDF), essayer de lire le message
          try {
            const errorText = await error.response.data.text();
            console.error('📝 Message d\'erreur du serveur (blob):', errorText);
            
            if (errorText.includes('{')) {
              const errorJson = JSON.parse(errorText);
              alert(`❌ Erreur serveur: ${errorJson.message || errorJson.error || 'Erreur lors du téléchargement du contrat'}`);
            } else {
              alert(`❌ Erreur serveur: ${errorText}`);
            }
          } catch (parseError) {
            console.error('🔧 Erreur de parsing de l\'erreur:', parseError);
            alert(`❌ Erreur serveur: ${error.response.statusText || 'Erreur lors du téléchargement du contrat'}`);
          }
        } else {
          console.error('📝 Erreur réponse (JSON):', error.response.data);
          alert(`❌ Erreur: ${error.response.data?.message || error.response.data?.error || 'Erreur lors du téléchargement du contrat'}`);
        }
      } else if (error.request) {
        console.error('🌐 Erreur de requête:', error.request);
        alert('❌ Erreur de connexion au serveur - Vérifiez que le backend est démarré');
      } else {
        console.error('⚙️ Erreur de configuration:', error);
        alert(`❌ Erreur inattendue: ${error.message}`);
      }
    } finally {
      setLoadingDownload(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant) => {
    if (!montant) return '';
    return Number(montant).toLocaleString('fr-FR');
  };

  const convertirEnLettres = (montant) => {
    // Fonction simple de conversion en lettres (à améliorer si nécessaire)
    const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 
                   'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    
    if (montant === 0) return 'zéro';
    if (montant < 20) return unites[montant];
    
    // Pour les montants simples, retourne une version basique
    return `${montant} francs CFA`;
  };

  return (
    <div className="contrat-generator">
      <button 
        className="btn btn-primary"
        onClick={printContrat}
        disabled={loadingPrint}
      >
        {loadingPrint ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Génération en cours...
          </>
        ) : (
          <>
            <i className="bi bi-printer me-2"></i>
            Imprimer le contrat
          </>
        )}
      </button>
      
      <button 
        className="btn btn-secondary ms-2"
        onClick={downloadContrat}
        disabled={loadingDownload}
        title="Télécharger le contrat en format HTML"
      >
        {loadingDownload ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Téléchargement...
          </>
        ) : (
          <>
            <i className="bi bi-download me-2"></i>
            Télécharger
          </>
        )}
      </button>
    </div>
  );
};

export default ContratGenerator;
