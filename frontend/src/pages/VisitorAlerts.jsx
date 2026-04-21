// src/pages/VisitorAlerts.jsx
import React, { useState, useEffect } from "react";
import api from "../api/axios";

const VisitorAlerts = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const email = localStorage.getItem("visitor_email");
    const code = localStorage.getItem("visitor_code");

    useEffect(() => {
        if (email && code) {
            fetchAlerts();
        }
    }, [email, code]);

    const fetchAlerts = async () => {
        try {
            const res = await api.get(`/visiteurs/dashboard-data?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
            // On filtre pour ne garder que les demandes qui ne sont plus "en_attente" ou les plus récentes
            setRequests(res.data);
        } catch (err) {
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
        <div className="visitor-alerts-modern">
            <h2 className="h5 fw-bold mb-3" style={{ color: '#1e293b' }}>Mes Notifications</h2>
            
            <div className="alerts-list">
                {requests.length === 0 ? (
                    <div className="p-4 bg-white rounded border text-center text-muted small">
                        Aucune nouvelle notification.
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id_demande} className="alert-item mb-2 p-2 bg-white rounded shadow-sm border-start border-4" 
                            style={{ borderLeftColor: req.statut === 'acceptee' ? '#10b981' : (req.statut === 'refusee' ? '#ef4444' : '#f59e0b') }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="fw-bold mb-0 text-dark" style={{ fontSize: '0.8rem' }}>
                                        {req.statut === 'acceptee' ? 'Visite Confirmée !' : 
                                         (req.statut === 'refusee' ? 'Demande Refusée' : 'Demande en cours d\'examen')}
                                    </p>
                                    <p className="text-muted mb-0" style={{ fontSize: '0.7rem' }}>
                                        Votre demande pour le bien <strong>{req.bien_titre}</strong> a été mise à jour.
                                    </p>
                                </div>
                                <span className="small text-muted" style={{ fontSize: '0.6rem' }}>
                                    {new Date().toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .visitor-alerts-modern {
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .alert-item {
                    transition: all 0.2s ease;
                }
                .alert-item:hover {
                    transform: translateX(3px);
                    background-color: #f8fafc !important;
                }
            `}</style>
        </div>
    );
};

export default VisitorAlerts;
