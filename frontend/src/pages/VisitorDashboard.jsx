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
    const code = localStorage.getItem("visitor_code");

    useEffect(() => {
        if (!email || !code) {
            navigate("/visitor/login");
            return;
        }
        fetchDashboardData();
    }, [email, code]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/visiteurs/dashboard-data?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
            setRequests(res.data);
        } catch (err) {
            setError("Impossible de charger vos données. Veuillez réessayer.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
            <div className="spinner-border text-primary spinner-border-sm" role="status" />
        </div>
    );

    return (
        <div className="visitor-dashboard-modern">
            <div className="container-fluid p-0">
                <div className="row g-3">
                    <div className="col-12">
                        <div className="text-center mb-4">
                            <h2 className="h4 fw-bold mb-1" style={{ color: '#1e293b' }}>Suivi de mes demandes</h2>
                            <p className="text-muted small mb-0">Retrouvez ici l'état de vos demandes de visite et discuter avec votre propriétaire.</p>
                        </div>
                    </div>

                    {error && <div className="col-12 alert alert-danger py-1 small">{error}</div>}

                    <div className="col-12">
                        {requests.length === 0 ? (
                            <div className="text-center p-4 bg-white rounded shadow-sm border">
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                                <p className="text-muted small">Vous n'avez pas encore de demande de visite.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate("/visitor/properties")}>Voir les biens disponibles</button>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {requests.map(req => (
                                    <div key={req.id_demande} className="col-12">
                                        <div className="card border-0 shadow-sm rounded overflow-hidden"
                                            style={{ border: '1px solid #f1f5f9' }}>
                                            <div className="card-body p-2 px-3">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <div>
                                                        <h6 className="fw-bold mb-0" style={{ fontSize: '0.85rem' }}>{req.bien_titre}</h6>
                                                        <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>📍 {req.bien_adresse}, {req.bien_ville}</p>
                                                    </div>
                                                    <span className={`badge rounded-pill px-2 py-1 ${req.statut === 'en_attente' ? 'bg-warning text-dark' :
                                                            req.statut === 'acceptee' ? 'bg-success' :
                                                                req.statut === 'refusee' ? 'bg-danger' : 'bg-primary'
                                                        }`} style={{ fontSize: '0.65rem' }}>
                                                        {req.statut === 'en_attente' ? 'En attente' :
                                                            req.statut === 'acceptee' ? 'Acceptée' :
                                                                req.statut === 'refusee' ? 'Refusée' : req.statut}
                                                    </span>
                                                </div>

                                                <div className="d-flex gap-4 mb-2">
                                                    <div>
                                                        <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>Visite souhaitée</p>
                                                        <p className="fw-bold mb-0" style={{ fontSize: '0.75rem' }}>
                                                            {req.date_visite_souhaitee ? new Date(req.date_visite_souhaitee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Non précisée"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted mb-0" style={{ fontSize: '0.65rem' }}>Propriétaire</p>
                                                        <p className="fw-bold mb-0" style={{ fontSize: '0.75rem' }}>{req.proprietaire_prenoms} {req.proprietaire_nom}</p>
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-primary btn-sm py-1 px-3"
                                                        style={{ fontSize: '0.75rem' }}
                                                        onClick={() => navigate(`/visitor/messaging?demandeId=${req.id_demande}`)}>
                                                        💬 Messagerie
                                                    </button>
                                                    <button className="btn btn-outline-secondary btn-sm py-1 px-3"
                                                        style={{ fontSize: '0.75rem' }}
                                                        onClick={() => {/* TODO: Annuler */ }}>
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>


                </div>
            </div>

            <style>{`
                .visitor-dashboard-modern {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default VisitorDashboard;
