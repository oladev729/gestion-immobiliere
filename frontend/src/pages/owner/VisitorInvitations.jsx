import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const VisitorInvitations = () => {
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invitingId, setInvitingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchDemandes = async () => {
        try {
            const res = await api.get('/visiteurs/demandes');
            setDemandes(res.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des demandes:', error);
            setMessage({ text: 'Erreur lors de la récupération des demandes.', type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDemandes();
    }, []);

    const handleInvite = async (id_demande) => {
        setInvitingId(id_demande);
        setMessage({ text: '', type: '' });
        try {
            const res = await api.post(`/visiteurs/demandes/${id_demande}/inviter`);
            setMessage({ text: 'Invitation envoyée avec succès ! Un compte locataire temporaire a été créé et un e-mail a été envoyé.', type: 'success' });
            fetchDemandes();
        } catch (error) {
            console.error('Erreur lors de l\'invitation:', error);
            setMessage({ text: error.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation.', type: 'danger' });
        } finally {
            setInvitingId(null);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Demandes d'invitation</h2>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                    {message.type === 'success' ? '✅ ' : '❌ '} {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
                </div>
            )}

            <div className="card-modern shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light text-secondary">
                            <tr>
                                <th className="ps-4 py-3">Visiteur</th>
                                <th className="py-3">E-mail</th>
                                <th className="py-3">Téléphone</th>
                                <th className="py-3">Message</th>
                                <th className="py-3">Date</th>
                                <th className="py-3">Statut</th>
                                <th className="pe-4 py-3 text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : demandes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-5 text-muted">
                                        Aucune demande d'invitation en attente.
                                    </td>
                                </tr>
                            ) : (
                                demandes.map((d) => (
                                    <tr key={d.id_demande} className="animate-fade-in">
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="avatar-circle me-3" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                    {d.prenoms?.[0]}{d.nom?.[0]}
                                                </div>
                                                <div>
                                                    <div className="fw-bold text-dark">{d.prenoms} {d.nom}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{d.email}</td>
                                        <td>{d.telephone || '-'}</td>
                                        <td className="text-muted small" style={{ maxWidth: '200px' }}>
                                            <div className="text-truncate" title={d.message}>
                                                {d.message || '-'}
                                            </div>
                                        </td>
                                        <td>{new Date(d.date_creation).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge rounded-pill ${
                                                d.statut === 'en_attente' ? 'bg-warning text-dark' : 
                                                d.statut === 'invite' ? 'bg-info text-white' : 'bg-success'
                                            }`}>
                                                {d.statut === 'en_attente' ? 'En attente' : d.statut}
                                            </span>
                                        </td>
                                        <td className="pe-4 text-end">
                                            {d.statut === 'en_attente' && (
                                                <button 
                                                    className="btn btn-primary btn-sm rounded-pill px-3"
                                                    onClick={() => handleInvite(d.id_demande)}
                                                    disabled={invitingId === d.id_demande}
                                                >
                                                    {invitingId === d.id_demande ? (
                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    ) : '+ '}
                                                    Inviter
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .container {
                    max-width: 1200px;
                }
                .card-modern {
                    background: white;
                    border: 1px solid var(--gray-200);
                }
                .avatar-circle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    font-weight: 600;
                    border-radius: 50%;
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default VisitorInvitations;
