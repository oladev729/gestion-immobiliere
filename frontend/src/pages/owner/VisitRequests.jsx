import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const VisitRequests = () => {
    const [visites, setVisites] = useState([]);

    const fetchVisites = () => api.get('/demandes-visite/recues').then(res => setVisites(res.data));

    useEffect(() => { fetchVisites(); }, []);

    const handleAction = async (id, statut) => {
        await api.patch(`/demandes-visite/${id}/statut`, { statut });
        fetchVisites();
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Demandes de visite</h2>
            <div className="table-responsive">
                <table className="table table-hover bg-white shadow-sm rounded">
                    <thead className="table-dark">
                        <tr>
                            <th>Bien</th>
                            <th>Locataire</th>
                            <th>Date souhaitée</th>
                            <th>Message</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visites.map(v => (
                            <tr key={v.id_demande}>
                                <td>{v.bien_titre}</td>
                                <td>{v.locataire_prenoms} {v.locataire_nom}</td>
                                <td>{new Date(v.date_visite).toLocaleString('fr-FR')}</td>
                                <td>{v.message || '-'}</td>
                                <td>
                                    <span className={`badge ${
                                        v.statut_demande === 'acceptee' ? 'bg-success' :
                                        v.statut_demande === 'refusee' ? 'bg-danger' : 'bg-warning text-dark'
                                    }`}>
                                        {v.statut_demande}
                                    </span>
                                </td>
                                <td>
                                    {v.statut_demande === 'en_attente' && (
                                        <div className="d-flex gap-2">
                                            <button onClick={() => handleAction(v.id_demande, 'acceptee')} className="btn btn-sm btn-success">Accepter</button>
                                            <button onClick={() => handleAction(v.id_demande, 'refusee')} className="btn btn-sm btn-danger">Refuser</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {visites.length === 0 && (
                            <tr><td colSpan="6" className="text-center text-muted">Aucune demande de visite</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VisitRequests;
