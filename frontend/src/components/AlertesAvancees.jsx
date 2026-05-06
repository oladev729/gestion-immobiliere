import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import MaintenanceRecues from '../pages/owner/MaintenanceRecues';

const AlertesAvancees = () => {
  console.log('🚀 Chargement du composant AlertesAvancees - VERSION 2.0');
  console.log('🔍 Test de fetchBiens intégré');
  
  const [alertes, setAlertes] = useState([]);
  const [activeTab, setActiveTab] = useState('maintenance'); // Signalements des locataires par défaut
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [locataires, setLocataires] = useState([]); // Pour les communications fiscales
  const [form, setForm] = useState({
    type_alerte: 'fiscale',
    titre: '',
    description: '',
    date_echeance: '',
    priorite: 'moyenne',
    id_bien: '',
    id_locataire: '', // Pour les communications aux locataires
    periodicite: 'annuelle'
  });
  const [biens, setBiens] = useState([]);

  useEffect(() => {
    console.log('🔄 useEffect appelé - Chargement initial des données');
    fetchAlertes();
    fetchBiens();
    fetchLocataires();
  }, []);

  const fetchAlertes = async () => {
    try {
      console.log('🔍 Récupération des alertes...');
      const response = await api.get('/alertes/mes-alertes');
      console.log('📥 Alertes reçues:', response.data);
      console.log('📊 Nombre d\'alertes:', response.data?.length || 0);
      setAlertes(response.data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des alertes:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocataires = async () => {
    try {
      console.log('👥 Récupération des locataires...');
      const response = await api.get('/locataires/mes-locataires');
      console.log('📥 Locataires reçus:', response.data);
      setLocataires(response.data);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des locataires:', error);
    }
  };

  const fetchBiens = async () => {
    try {
      console.log('🏠 Récupération des biens...');
      
      // Forcer l'ajout du token JWT
      const token = localStorage.getItem('token');
      console.log('🔑 Token utilisé pour les biens:', token ? 'Présent' : 'Absent');
      
      console.log('📡 Envoi de la requête GET /biens/mes-biens...');
      
      // Utiliser l'API par défaut (avec interceptor déjà configuré)
      console.log('🌐 URL complète de la requête:', api.defaults.baseURL + '/biens/mes-biens');
      
      const response = await api.get('/biens/mes-biens');
      
      console.log('✅ Réponse reçue - Status:', response.status);
      console.log('✅ Headers de la réponse:', response.headers);
      console.log('📥 Biens reçus (brut):', response.data);
      console.log('� Type de données reçues:', typeof response.data);
      console.log('📥 Est-ce un tableau?', Array.isArray(response.data));
      console.log('�� Nombre de biens:', response.data?.length || 0);
      console.log('📊 Clés de l\'objet:', Object.keys(response.data || {}));
      
      // Afficher la structure de chaque bien pour debugging
      if (response.data && response.data.length > 0) {
        response.data.forEach((bien, index) => {
          console.log(`🏠 Bien ${index}:`, {
            id: bien.id,
            id_bien: bien.id_bien,
            titre: bien.titre,
            toutesProps: Object.keys(bien)
          });
        });
      } else {
        console.log('⚠️ Aucun bien reçu ou tableau vide');
      }
      
      setBiens(response.data || []);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des biens:', error);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Détails de l\'erreur:', error.response?.data || 'Pas de détails');
      console.error('❌ Status de l\'erreur:', error.response?.status || 'Pas de status');
      console.error('❌ Code d\'erreur:', error.code || 'Pas de code');
      setBiens([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Soumission du formulaire d\'alerte');
    console.log('📝 Données du formulaire:', form);
    
    // Validation des champs requis
    if (!form.titre || !form.description || !form.date_echeance) {
      console.error('❌ Champs requis manquants');
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      console.log('📡 Envoi de la requête POST à /alertes...');
      const response = await api.post('/alertes', form);
      console.log('✅ Réponse du serveur:', response.data);
      
      // Réinitialiser le formulaire
      setForm({
        type_alerte: 'fiscale',
        titre: '',
        description: '',
        date_echeance: '',
        priorite: 'moyenne',
        id_bien: '',
        periodicite: 'annuelle'
      });
      
      // Fermer le formulaire et rafraîchir la liste
      setShowForm(false);
      fetchAlertes();
      
      // Afficher un message de succès
      alert('Alerte créée avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'alerte:', error);
      console.error('❌ Détails de l\'erreur:', error.response?.data || error.message);
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      alert(`Erreur lors de la création de l'alerte: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    console.log('🗑️ handleDelete appelé avec ID:', id);
    if (window.confirm('Supprimer cette alerte ?')) {
      console.log('✅ Confirmation acceptée');
      try {
        console.log('🔄 Appel API DELETE vers:', `/alertes/${id}`);
        const response = await api.delete(`/alertes/${id}`);
        console.log('📥 Réponse API:', response.status, response.data);
        console.log('🔄 Rafraîchissement des alertes...');
        fetchAlertes();
      } catch (error) {
        console.error('❌ Erreur lors de la suppression de l\'alerte:', error);
        console.error('❌ Détails de l\'erreur:', error.response?.status, error.response?.data);
        alert(`Erreur lors de la suppression: ${error.response?.data?.message || error.message}`);
      }
    } else {
      console.log('❌ Suppression annulée par l\'utilisateur');
    }
  };

  const handleMarquerTraitee = async (id) => {
    try {
      await api.put(`/alertes/${id}/traiter`);
      fetchAlertes();
    } catch (error) {
      console.error('Erreur lors du traitement de l\'alerte:', error);
    }
  };

  const handleSupprimerAlerte = async (id) => {
    try {
      console.log('🗑️ Suppression de l\'alerte:', id);
      await api.delete(`/alertes/${id}`);
      console.log('✅ Alerte supprimée, rafraîchissement...');
      fetchAlertes(); // Rafraîchir la liste des alertes
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'alerte:', error);
      alert('Erreur lors de la suppression de l\'alerte');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getDaysUntilEcheance = (dateEcheance) => {
    const today = new Date();
    const echeance = new Date(dateEcheance);
    const diffTime = echeance - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'urgente': return '#dc2626';
      case 'haute': return '#ea580c';
      case 'moyenne': return '#ca8a04';
      case 'basse': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPriorityBadgeColor = (priorite) => {
    switch (priorite) {
      case 'urgente': return 'bg-danger';
      case 'haute': return 'bg-warning';
      case 'moyenne': return 'bg-warning text-dark';
      case 'basse': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getAlertesFiltrees = () => {
    console.log('🔍 Filtrage des alertes:');
    console.log('  - Onglet actif:', activeTab);
    console.log('  - Total alertes:', alertes.length);
    console.log('  - Alertes:', alertes);
    
    const filtered = alertes.filter(alerte => {
      let match = false;
      
      if (activeTab === 'maintenance') {
        // Onglet maintenance : signalements des locataires (expediteur_type = 'locataire')
        match = alerte.expediteur_type === 'locataire';
      } else if (activeTab === 'fiscales') {
        // Onglet fiscales : communications du propriétaire (expediteur_type = 'proprietaire')
        match = alerte.expediteur_type === 'proprietaire';
      }
      
      console.log(`    - Alerte ${alerte.id_alerte}: type=${alerte.type_alerte}, expediteur=${alerte.expediteur_type}, onglet=${activeTab}, match=${match}`);
      return match;
    });
    
    console.log('  - Alertes filtrées:', filtered.length);
    return filtered;
  };

  const alertesFiltrees = getAlertesFiltrees();

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">chargement des alertes...</p>
      </div>
    );
  }

  return (
    <div className="alertes-avancees">
      <div className="container-fluid p-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 style={{ color: '#1e293b', fontWeight: '700' }}>
                alertes avancées
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
                style={{ borderRadius: '8px' }}
                disabled={activeTab === 'maintenance'} // Désactivé dans l'onglet maintenance
              >
                {activeTab === 'fiscales' ? '+ nouvelle communication' : 'signalements reçus'}
              </button>
            </div>

            {/* Onglets */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'maintenance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('maintenance')}
                  style={{ border: 'none', background: 'none', color: activeTab === 'maintenance' ? '#3b82f6' : '#6b7280' }}
                >
                  signalements reçus
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'fiscales' ? 'active' : ''}`}
                  onClick={() => setActiveTab('fiscales')}
                  style={{ border: 'none', background: 'none', color: activeTab === 'fiscales' ? '#3b82f6' : '#6b7280' }}
                >
                  communications locataires
                </button>
              </li>
            </ul>

            {/* Formulaire d'ajout - seulement pour les communications fiscales */}
            {showForm && activeTab === 'fiscales' && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">créer une communication pour les locataires</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">type de communication</label>
                        <select
                          className="form-select"
                          value={form.type_alerte}
                          onChange={(e) => setForm({...form, type_alerte: e.target.value})}
                        >
                          <option value="fiscale">fiscalité</option>
                          <option value="maintenance">information maintenance</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">priorité</label>
                        <select
                          className="form-select"
                          value={form.priorite}
                          onChange={(e) => setForm({...form, priorite: e.target.value})}
                        >
                          <option value="basse">basse</option>
                          <option value="moyenne">moyenne</option>
                          <option value="haute">haute</option>
                          <option value="urgente">urgente</option>
                        </select>
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label">titre</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.titre}
                          onChange={(e) => setForm({...form, titre: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label">description</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={form.description}
                          onChange={(e) => setForm({...form, description: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">date d'échéance</label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.date_echeance}
                          onChange={(e) => setForm({...form, date_echeance: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">locataire concerné</label>
                        <select
                          className="form-select"
                          value={form.id_locataire}
                          onChange={(e) => setForm({...form, id_locataire: e.target.value})}
                          required
                        >
                          <option value="">sélectionner un locataire</option>
                          {locataires.map(locataire => (
                            <option key={locataire.id_locataire} value={locataire.id_locataire}>
                              {locataire.locataire_nom} {locataire.locataire_prenom} - {locataire.bien_titre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">bien concerné</label>
                        <select
                          className="form-select"
                          value={form.id_bien}
                          onChange={(e) => setForm({...form, id_bien: e.target.value})}
                        >
                          <option value="">sélectionner un bien</option>
                          {console.log('🏠 Biens dans le select:', biens) || biens.map(bien => (
                            <option key={bien.id_bien} value={bien.id_bien}>
                              {bien.titre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">périodicité</label>
                        <select
                          className="form-select"
                          value={form.periodicite}
                          onChange={(e) => setForm({...form, periodicite: e.target.value})}
                        >
                          <option value="ponctuelle">ponctuelle</option>
                          <option value="mensuelle">mensuelle</option>
                          <option value="trimestrielle">trimestrielle</option>
                          <option value="semestrielle">semestrielle</option>
                          <option value="annuelle">annuelle</option>
                        </select>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-primary">
                        créer l'alerte
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForm(false)}
                      >
                        annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Onglet Maintenance */}
            {activeTab === 'maintenance' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    maintenance
                    <span className="badge bg-primary ms-2">{alertesFiltrees.length}</span>
                  </h5>
                </div>
                <div className="card-body">
                  {console.log('🎯 Affichage des alertes - onglet:', activeTab, 'alertesFiltrees.length:', alertesFiltrees.length)}
                  {alertesFiltrees.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">aucune alerte de maintenance trouvée</p>
                    </div>
                  ) : (
                    <div className="alert-list">
                      {console.log('🎨 Rendu des alertes:', alertesFiltrees.length, 'alertes')}
                      {alertesFiltrees.map((alerte) => {
                        // Version simplifiée pour contourner le problème CSS
                        return (
                          <div key={alerte.id_alerte} style={{border: '2px solid blue', padding: '15px', margin: '10px', backgroundColor: 'lightblue'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                              <div style={{flex: 1}}>
                                <h4>{alerte.titre}</h4>
                                <p>{alerte.description}</p>
                                <small>Type: {alerte.type_alerte} | Expediteur: {alerte.expediteur_type}</small>
                                {alerte.bien_titre && <p><small>Bien: {alerte.bien_titre}</small></p>}
                              </div>
                              <button 
                                onClick={() => handleDelete(alerte.id_alerte)}
                                style={{
                                  backgroundColor: '#dc3545', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '50%', 
                                  width: '30px', 
                                  height: '30px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Supprimer l'alerte"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Liste des alertes */}
            {activeTab === 'fiscales' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    alertes fiscales
                    <span className="badge bg-primary ms-2">{alertesFiltrees.length}</span>
                  </h5>
                </div>
                <div className="card-body">
                  {alertesFiltrees.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">aucune alerte trouvée</p>
                    </div>
                  ) : (
                    <div className="alert-list">
                      {alertesFiltrees.map((alerte) => {
                        const daysUntil = getDaysUntilEcheance(alerte.date_echeance);
                        const isOverdue = daysUntil < 0;
                        const isUrgent = daysUntil <= 7 && daysUntil >= 0;

                        return (
                          <div
                            key={alerte.id_alerte}
                            className={`alert-item ${alerte.statut === 'traitee' ? 'alert-traitee' : ''}`}
                            style={{
                              borderLeft: `4px solid ${getPriorityColor(alerte.priorite)}`,
                              backgroundColor: alerte.statut === 'traitee' ? '#f8fafc' : '#ffffff',
                              marginBottom: '1rem',
                              padding: '1rem',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <h6 className="mb-0 me-2" style={{ color: '#1e293b' }}>
                                    {alerte.titre}
                                  </h6>
                                  <span
                                    className="badge"
                                    style={{
                                      backgroundColor: getPriorityColor(alerte.priorite),
                                      color: 'white',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {alerte.priorite}
                                  </span>
                                  {alerte.statut === 'traitee' && (
                                    <span className="badge bg-success ms-2">traitée</span>
                                  )}
                                </div>
                                <p className="text-muted mb-2">{alerte.description}</p>
                                <div className="d-flex align-items-center gap-3">
                                  <small className="text-muted">
                                    <i className="bi bi-calendar me-1"></i>
                                    échéance: {formatDate(alerte.date_echeance)}
                                  </small>
                                  <small className="text-muted">
                                    <i className="bi bi-house me-1"></i>
                                    {alerte.bien_titre || 'tous les biens'}
                                  </small>
                                  <small className="text-muted">
                                    <i className="bi bi-arrow-repeat me-1"></i>
                                    {alerte.periodicite}
                                  </small>
                                </div>
                                {alerte.statut !== 'traitee' && (
                                  <div className="mt-2">
                                    {isOverdue ? (
                                      <span className="badge bg-danger">
                                        en retard de {Math.abs(daysUntil)} jours
                                      </span>
                                    ) : isUrgent ? (
                                      <span className="badge bg-warning">
                                        {daysUntil} jours restants
                                      </span>
                                    ) : (
                                      <span className="badge bg-info">
                                        {daysUntil} jours restants
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="d-flex gap-2">
                                {alerte.statut !== 'traitee' && (
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleMarquerTraitee(alerte.id_alerte)}
                                    title="marquer comme traitée"
                                  >
                                    <i className="bi bi-check"></i>
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(alerte.id_alerte)}
                                  title="supprimer"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .alertes-avancees {
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
        
        .alert-item {
          transition: all 0.3s ease;
        }
        
        .alert-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .alert-traitee {
          opacity: 0.7;
        }
        
        .alert-traitee h6 {
          text-decoration: line-through;
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
        
        .badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
};

export default AlertesAvancees;
