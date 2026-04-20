// src/pages/VisitorDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const VisitorDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const email = searchParams.get("email") || localStorage.getItem("visitor_email");

    useEffect(() => {
        if (!email) {
            navigate("/visitor-request");
            return;
        }
        fetchDashboardData();
    }, [email]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/visiteurs/dashboard-data?email=${encodeURIComponent(email)}`);
            setRequests(res.data);
        } catch (err) {
            setError("Impossible de charger vos données. Veuillez réessayer.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="spinner-border text-primary" role="status" />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '20px 40px' }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <h1 className="logo-immogest" style={{ margin: 0, fontSize: '1.8rem', cursor: 'pointer' }} onClick={() => navigate("/")}>ImmoGest</h1>
                    <div className="d-flex align-items-center gap-3">
                        <span className="small text-muted d-none d-md-inline">{email}</span>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => { localStorage.removeItem("visitor_email"); navigate("/"); }}>Déconnexion</button>
                    </div>
                </div>
            </div>

            <div className="container py-5">
                <div className="row">
                    <div className="col-12 mb-4">
                        <h2 className="fw-bold" style={{ color: '#1e293b' }}>Tableau de bord Visiteur</h2>
                        <p className="text-muted">Suivez vos demandes de visite et communiquez avec les propriétaires.</p>
                    </div>

                    {error && <div className="col-12 alert alert-danger mb-4">{error}</div>}

                    <div className="col-md-8">
                        <h4 className="mb-4 fw-bold" style={{ fontSize: '1.2rem', color: '#334155' }}>Mes demandes de visite</h4>
                        {requests.length === 0 ? (
                            <div className="text-center p-5 bg-white rounded-4 border">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
                                <p className="text-muted">Vous n'avez pas encore de demande de visite.</p>
                                <button className="btn btn-primary" onClick={() => navigate("/")}>Voir les biens disponibles</button>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {requests.map(req => (
                                    <div key={req.id_demande} className="card border-0 shadow-sm rounded-4 overflow-hidden" 
                                        style={{ transition: 'transform 0.2s', border: '1px solid #f1f5f9' }}>
                                        <div className="card-body p-4">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h5 className="fw-bold mb-1">{req.bien_titre}</h5>
                                                    <p className="small text-muted mb-0">📍 {req.bien_adresse}, {req.bien_ville}</p>
                                                </div>
                                                <span className={`badge rounded-pill px-3 py-2 ${
                                                    req.statut === 'en_attente' ? 'bg-warning text-dark' : 
                                                    req.statut === 'acceptee' ? 'bg-success' : 
                                                    req.statut === 'refusee' ? 'bg-danger' : 'bg-primary'
                                                }`}>
                                                    {req.statut === 'en_attente' ? 'En attente' : 
                                                     req.statut === 'acceptee' ? 'Acceptée' : 
                                                     req.statut === 'refusee' ? 'Refusée' : req.statut}
                                                </span>
                                            </div>
                                            
                                            <div className="row mb-4">
                                                <div className="col-sm-6">
                                                    <p className="small text-muted mb-1">Date de visite souhaitée</p>
                                                    <p className="fw-bold small mb-0">
                                                        {req.date_visite_souhaitee ? new Date(req.date_visite_souhaitee).toLocaleString('fr-FR') : "Non précisée"}
                                                    </p>
                                                </div>
                                                <div className="col-sm-6">
                                                    <p className="small text-muted mb-1">Propriétaire</p>
                                                    <p className="fw-bold small mb-0">{req.proprietaire_prenoms} {req.proprietaire_nom}</p>
                                                </div>
                                            </div>

                                            <div className="d-flex gap-2">
                                                <button className="btn btn-primary flex-grow-1" 
                                                    onClick={() => navigate(`/visitor/messaging?demandeId=${req.id_demande}`)}>
                                                    💬 Ouvrir la messagerie
                                                </button>
                                                <button className="btn btn-outline-secondary" onClick={() => {/* TODO: Annuler */}}>
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="col-md-4 mt-4 mt-md-0">
                        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: '#0f172a', color: 'white' }}>
                            <h4 className="fw-bold mb-3" style={{ fontSize: '1.1rem' }}>Besoin d'aide ?</h4>
                            <p className="small text-light text-opacity-75 mb-4">
                                Si vous avez des questions sur le fonctionnement d'ImmoGest ou sur une visite, n'hésitez pas à nous contacter.
                            </p>
                            <button className="btn btn-light w-100 fw-bold">Support client</button>
                        </div>
                        
                        <div className="mt-4 p-4 rounded-4 bg-white border border-info border-start-4">
                            <h5 className="fw-bold small mb-2 text-info">💡 Info pratique</h5>
                            <p className="small text-muted mb-0">
                                Une fois votre visite effectuée, le propriétaire pourra vous envoyer une invitation officielle pour finaliser votre dossier de location.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitorDashboard;
