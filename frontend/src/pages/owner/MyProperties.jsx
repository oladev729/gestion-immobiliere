import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const MyProperties = () => {
    const [biens, setBiens] = useState([]);

    useEffect(() => {
        api.get('/biens/mes-biens').then(res => setBiens(res.data));
    }, []);

    const toggleStatut = async (id, currentStatut) => {
        const newStatut = currentStatut === 'disponible' ? 'loue' : 'disponible';
        await api.patch(`/biens/${id}/statut`, { statut: newStatut });
        api.get('/biens/mes-biens').then(res => setBiens(res.data));
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Mes Biens Immobiliers</h2>
            <div className="row">
                {biens.map(bien => (
                    <div className="col-md-4 mb-4" key={bien.id_bien}>
                        <div className="card h-100 shadow-sm">
                            {bien.photos && bien.photos.length > 0 ? (
                                <img
                                    src={`http://127.0.0.1:5055${bien.photos[0].url_photobien}`}
                                    className="card-img-top"
                                    alt={bien.titre}
                                    style={{ height: 180, objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="d-flex align-items-center justify-content-center"
                                    style={{ height: 180, background: 'rgba(255,255,255,0.08)' }}>
                                    <span className="text-white opacity-50 small">Pas de photo</span>
                                </div>
                            )}
                            <div className="card-body">
                                <h5 className="card-title text-primary">{bien.titre}</h5>
                                <p className="card-text small text-muted">{bien.adresse}, {bien.ville}</p>
                                <p className="fw-bold">
                                    {Number(bien.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                                </p>
                                <span className={`badge ${bien.statut === 'disponible' ? 'bg-success' : 'bg-warning text-dark'} mb-3`}>
                                    {bien.statut}
                                </span>
                                <button
                                    onClick={() => toggleStatut(bien.id_bien, bien.statut)}
                                    className="btn btn-outline-dark btn-sm w-100">
                                    Changer Statut
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {biens.length === 0 && (
                    <p className="text-muted">Aucun bien enregistré.</p>
                )}
            </div>
        </div>
    );
};

export default MyProperties;
