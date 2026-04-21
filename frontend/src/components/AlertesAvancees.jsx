import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import MaintenanceRecues from '../pages/owner/MaintenanceRecues';

const AlertesAvancees = () => {
  const [alertes, setAlertes] = useState([]);
  const [activeTab, setActiveTab] = useState('fiscales');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type_alerte: 'fiscale',
    titre: '',
    description: '',
    date_echeance: '',
    priorite: 'moyenne',
    id_bien: '',
    periodicite: 'annuelle'
  });
  const [biens, setBiens] = useState([]);

  useEffect(() => {
    fetchAlertes();
    fetchBiens();
  }, []);

  const fetchAlertes = async () => {
    try {
      const response = await api.get('/alertes/mes-alertes');
      setAlertes(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBiens = async () => {
    try {
      const response = await api.get('/biens/mes-biens');
      setBiens(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des biens:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/alertes', form);
      setForm({
        type_alerte: 'fiscale',
        titre: '',
        description: '',
        date_echeance: '',
        priorite: 'moyenne',
        id_bien: '',
        periodicite: 'annuelle'
      });
      setShowForm(false);
      fetchAlertes();
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette alerte ?')) {
      try {
        await api.delete(`/alertes/${id}`);
        fetchAlertes();
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'alerte:', error);
      }
    }
  };

  const handleMarquerTraitee = async (id) => {
    try {
      await api.patch(`/alertes/${id}/marquer-traitee`);
      fetchAlertes();
    } catch (error) {
      console.error('Erreur lors du traitement de l\'alerte:', error);
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

  const getAlertesFiltrees = () => {
    return alertes.filter(alerte => alerte.type_alerte === activeTab.slice(0, -1));
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
              >
                + nouvelle alerte
              </button>
            </div>

            {/* Onglets */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'fiscales' ? 'active' : ''}`}
                  onClick={() => setActiveTab('fiscales')}
                  style={{ border: 'none', background: 'none', color: activeTab === 'fiscales' ? '#3b82f6' : '#6b7280' }}
                >
                  alertes fiscales
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'maintenance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('maintenance')}
                  style={{ border: 'none', background: 'none', color: activeTab === 'maintenance' ? '#3b82f6' : '#6b7280' }}
                >
                  maintenance
                </button>
              </li>
            </ul>

            {/* Formulaire d'ajout */}
            {showForm && (
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">créer une nouvelle alerte</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">type d'alerte</label>
                        <select
                          className="form-select"
                          value={form.type_alerte}
                          onChange={(e) => setForm({...form, type_alerte: e.target.value})}
                        >
                          <option value="fiscale">fiscale</option>
                          <option value="maintenance">maintenance</option>
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
                        <label className="form-label">bien concerné</label>
                        <select
                          className="form-select"
                          value={form.id_bien}
                          onChange={(e) => setForm({...form, id_bien: e.target.value})}
                        >
                          <option value="">sélectionner un bien</option>
                          {biens.map(bien => (
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
              <div className="tab-content">
                <MaintenanceRecues />
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
