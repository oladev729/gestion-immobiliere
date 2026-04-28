import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const Entretien = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [charges, setCharges] = useState([]);
    const [alertes, setAlertes] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('charges');
    
    // Statistiques pour les charges
    const [stats, setStats] = useState({
        totalCharges: 0,
        chargesEnAttente: 0,
        chargesPayees: 0,
        moisEnCours: []
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const handlePayer = (charge) => {
        // Stocker les informations de la charge pour le paiement
        const chargeData = {
            id_payment: charge.id_payment,
            numero_transaction: charge.numero_transaction,
            montant: charge.montant,
            type_paiement: 'charge',
            bien_titre: charge.bien_titre,
            description: `Charge pour ${charge.bien_titre}`
        };
        
        // Stocker dans sessionStorage pour la page de paiement
        sessionStorage.setItem('chargeToPay', JSON.stringify(chargeData));
        
        // Naviguer vers la page de paiement
        navigate('/tenant/payment', { state: { chargeData } });
    };

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Récupérer les charges (endpoint qui existe)
            try {
                console.log('🔄 Récupération des charges...');
                const chargesRes = await api.get('/paiements/mes-charges');
                console.log('✅ Réponse charges:', chargesRes.data);
                const chargesData = chargesRes.data.charges || [];
                console.log('📊 Charges data:', chargesData);
                setCharges(chargesData);
                
                const total = chargesData.reduce((sum, charge) => sum + parseFloat(charge.montant || 0), 0);
                const enAttente = chargesData.filter(c => c.statut_paiement === 'en_attente').reduce((sum, charge) => sum + parseFloat(charge.montant || 0), 0);
                const payees = chargesData.filter(c => c.statut_paiement === 'valide').reduce((sum, charge) => sum + parseFloat(charge.montant || 0), 0);
                
                setStats({
                    totalCharges: total,
                    chargesEnAttente: enAttente,
                    chargesPayees: payees,
                    moisEnCours: [...new Set(chargesData.map(c => {
                        const date = new Date(c.date_paiement);
                        return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    }))]
                });
            } catch (err) {
                console.error('❌ Erreur chargement charges:', err);
                console.error('❌ Détails erreur:', err.response?.data);
                setCharges([]);
                setStats({
                    totalCharges: 0,
                    chargesEnAttente: 0,
                    chargesPayees: 0,
                    moisEnCours: []
                });
            }

            // Récupérer les alertes (endpoint qui existe)
            try {
                const alertesRes = await api.get('/alertes/mes-alertes');
                setAlertes(alertesRes.data.alertes || []);
            } catch (err) {
                console.error('Erreur chargement alertes:', err);
                setAlertes([]);
            }

            // Récupérer les invitations (endpoint qui existe)
            try {
                const invitationsRes = await api.get('/invitations/reçues');
                setInvitations(invitationsRes.data.invitations || []);
            } catch (err) {
                console.error('Erreur chargement invitations:', err);
                setInvitations([]);
            }

            // Récupérer les notifications (endpoint qui existe)
            try {
                const notificationsRes = await api.get('/paiements/mes-notifications');
                setNotifications(notificationsRes.data.notifications || []);
            } catch (err) {
                console.error('Erreur chargement notifications:', err);
                setNotifications([]);
            }
            
        } catch (err) {
            console.error('Erreur générale:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const getStatutBadge = (statut) => {
        switch (statut) {
            case 'en_attente':
                return 'bg-warning';
            case 'valide':
                return 'bg-success';
            case 'annule':
                return 'bg-danger';
            case 'actif':
                return 'bg-success';
            case 'inactif':
                return 'bg-secondary';
            case 'pending':
                return 'bg-warning';
            case 'accepted':
                return 'bg-success';
            case 'rejected':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'en_attente':
                return 'En attente';
            case 'valide':
                return 'Payée';
            case 'annule':
                return 'Annulée';
            case 'actif':
                return 'Actif';
            case 'inactif':
                return 'Inactif';
            case 'pending':
                return 'En attente';
            case 'accepted':
                return 'Acceptée';
            case 'rejected':
                return 'Refusée';
            default:
                return statut;
        }
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'charge':
                return 'bg-danger';
            case 'alerte':
                return 'bg-warning';
            case 'invitation':
                return 'bg-info';
            case 'maintenance':
                return 'bg-primary';
            default:
                return 'bg-secondary';
        }
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                .entretien-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .stat-card {
                    background: rgba(0,0,0,0.1);
                    color: #333;
                    border-radius: 15px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    transition: transform 0.3s ease;
                    border: 1px solid rgba(0,0,0,0.1);
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    background: rgba(0,0,0,0.15);
                }
                .card-custom {
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                }
                .card-custom:hover {
                    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }
                .amount {
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: #333;
                }
                .nav-tabs .nav-link {
                    border: none;
                    border-bottom: 3px solid rgba(0,0,0,0.1);
                    color: #6c757d;
                    font-weight: 600;
                }
                .nav-tabs .nav-link.active {
                    border-bottom-color: rgba(0,0,0,0.3);
                    color: #333;
                    background: rgba(0,0,0,0.05);
                }
                .tab-content {
                    margin-top: 2rem;
                }
                .notification-item {
                    border-left: 4px solid rgba(0,0,0,0.3);
                    background: rgba(0,0,0,0.05);
                }
                .notification-item.unread {
                    border-left-color: rgba(0,0,0,0.5);
                    background: rgba(0,0,0,0.08);
                }
                .card-title {
                    color: #333 !important;
                }
                .text-primary {
                    color: #333 !important;
                }
            `}</style>
            
            <div className="container py-4 entretien-container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">
                        <i className="fas fa-tools me-2"></i>
                        Espace Entretien
                    </h2>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}

                {/* Statistiques globales */}
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="stat-card">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="mb-1">Total Charges</h6>
                                    <div className="amount">{stats.totalCharges.toLocaleString('fr-FR')} FCFA</div>
                                </div>
                                <i className="fas fa-receipt fa-2x opacity-75"></i>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card bg-warning">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="mb-1">Charges En Attente</h6>
                                    <div className="amount">{stats.chargesEnAttente.toLocaleString('fr-FR')} FCFA</div>
                                </div>
                                <i className="fas fa-clock fa-2x opacity-75"></i>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card bg-info">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="mb-1">Alertes</h6>
                                    <div className="amount">{alertes.length}</div>
                                </div>
                                <i className="fas fa-bell fa-2x opacity-75"></i>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="stat-card bg-success">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="mb-1">Invitations</h6>
                                    <div className="amount">{invitations.length}</div>
                                </div>
                                <i className="fas fa-envelope fa-2x opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Onglets de navigation */}
                <ul className="nav nav-tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button 
                            className={`nav-link ${activeTab === 'charges' ? 'active' : ''}`}
                            onClick={() => setActiveTab('charges')}
                        >
                            <i className="fas fa-receipt me-2"></i>
                            Charges ({charges.length})
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button 
                            className={`nav-link ${activeTab === 'alertes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('alertes')}
                        >
                            <i className="fas fa-bell me-2"></i>
                            Alertes ({alertes.length})
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button 
                            className={`nav-link ${activeTab === 'invitations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('invitations')}
                        >
                            <i className="fas fa-envelope me-2"></i>
                            Invitations ({invitations.length})
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button 
                            className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notifications')}
                        >
                            <i className="fas fa-comment me-2"></i>
                            Notifications ({notifications.length})
                        </button>
                    </li>
                </ul>

                <div className="tab-content">
                    {/* Onglet Charges */}
                    {activeTab === 'charges' && (
                        <div className="row">
                            {charges.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-info text-center">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Aucune charge trouvée pour le moment.
                                    </div>
                                </div>
                            ) : (
                                charges.map((charge) => (
                                    <div className="col-md-6 col-lg-4 mb-3" key={charge.id_payment}>
                                        <div className="card card-custom">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="card-title mb-0">
                                                        <i className="fas fa-file-invoice-dollar me-2 text-primary"></i>
                                                        Charge
                                                    </h6>
                                                    <span className={`badge ${getStatutBadge(charge.statut_paiement)}`}>
                                                        {getStatutLabel(charge.statut_paiement)}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Numéro:</small>
                                                    <div className="fw-semibold">{charge.numero_transaction}</div>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Montant:</small>
                                                    <div className="amount text-primary">{parseFloat(charge.montant).toLocaleString('fr-FR')} FCFA</div>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Date:</small>
                                                    <div>{new Date(charge.date_paiement).toLocaleDateString('fr-FR')}</div>
                                                </div>
                                                
                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                    <small className="text-muted">
                                                        <i className="fas fa-home me-1"></i>
                                                        Bien: {charge.bien_titre || 'Non spécifié'}
                                                    </small>
                                                    {charge.statut_paiement === 'en_attente' && (
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handlePayer(charge)}
                                                        >
                                                            <i className="fas fa-credit-card me-1"></i>
                                                            Payer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Onglet Alertes */}
                    {activeTab === 'alertes' && (
                        <div className="row">
                            {alertes.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-info text-center">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Aucune alerte trouvée pour le moment.
                                    </div>
                                </div>
                            ) : (
                                alertes.map((alerte) => (
                                    <div className="col-md-6 col-lg-4 mb-3" key={alerte.id_alerte}>
                                        <div className="card card-custom">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="card-title mb-0">
                                                        <i className="fas fa-bell me-2 text-warning"></i>
                                                        Alerte
                                                    </h6>
                                                    <span className={`badge ${getStatutBadge(alerte.statut_alerte)}`}>
                                                        {getStatutLabel(alerte.statut_alerte)}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Type:</small>
                                                    <div className="fw-semibold">{alerte.type_alerte}</div>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Message:</small>
                                                    <div>{alerte.message}</div>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Date:</small>
                                                    <div>{new Date(alerte.date_creation).toLocaleDateString('fr-FR')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Onglet Invitations */}
                    {activeTab === 'invitations' && (
                        <div className="row">
                            {invitations.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-info text-center">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Aucune invitation trouvée pour le moment.
                                    </div>
                                </div>
                            ) : (
                                invitations.map((invitation) => (
                                    <div className="col-md-6 col-lg-4 mb-3" key={invitation.id_invitation}>
                                        <div className="card card-custom">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="card-title mb-0">
                                                        <i className="fas fa-envelope me-2 text-info"></i>
                                                        Invitation
                                                    </h6>
                                                    <span className={`badge ${getStatutBadge(invitation.statut)}`}>
                                                        {getStatutLabel(invitation.statut)}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Bien:</small>
                                                    <div className="fw-semibold">{invitation.bien_titre}</div>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Message:</small>
                                                    <div>{invitation.message}</div>
                                                </div>
                                                
                                                <div className="mb-2">
                                                    <small className="text-muted">Date:</small>
                                                    <div>{new Date(invitation.date_envoi).toLocaleDateString('fr-FR')}</div>
                                                </div>
                                                
                                                {invitation.statut === 'pending' && (
                                                    <div className="d-flex gap-2 mt-3">
                                                        <button className="btn btn-sm btn-success">
                                                            <i className="fas fa-check me-1"></i>
                                                            Accepter
                                                        </button>
                                                        <button className="btn btn-sm btn-danger">
                                                            <i className="fas fa-times me-1"></i>
                                                            Refuser
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Onglet Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="row">
                            {notifications.length === 0 ? (
                                <div className="col-12">
                                    <div className="alert alert-info text-center">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Aucune notification trouvée pour le moment.
                                    </div>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div className="col-12 mb-3" key={notification.id_notification}>
                                        <div className={`card card-custom notification-item ${!notification.lu ? 'unread' : ''}`}>
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div className="flex-grow-1">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <h6 className="card-title mb-0 me-2">
                                                                <i className="fas fa-comment me-2 text-primary"></i>
                                                                {notification.titre}
                                                            </h6>
                                                            <span className={`badge ${getTypeBadge(notification.type)}`}>
                                                                {notification.type}
                                                            </span>
                                                            {!notification.lu && (
                                                                <span className="badge bg-danger ms-2">
                                                                    Non lue
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="mb-2">
                                                            <div>{notification.message}</div>
                                                        </div>
                                                        
                                                        <div className="mb-2">
                                                            <small className="text-muted">
                                                                <i className="fas fa-calendar me-1"></i>
                                                                {new Date(notification.date_envoi).toLocaleDateString('fr-FR')}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    
                                                    {!notification.lu && (
                                                        <button className="btn btn-sm btn-outline-primary">
                                                            <i className="fas fa-check me-1"></i>
                                                            Marquer comme lue
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Entretien;
