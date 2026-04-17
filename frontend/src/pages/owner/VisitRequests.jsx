import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const VisitRequests = () => {
    const [visites, setVisites] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVisites = () => {
        setLoading(true);
        api.get('/demandes-visite/recues')
           .then(res => setVisites(res.data))
           .catch(() => {})
           .finally(() => setLoading(false));
    };

    useEffect(() => { fetchVisites(); }, []);

    const handleAction = async (id, statut) => {
        await api.patch(`/demandes-visite/${id}/statut`, { statut });
        fetchVisites();
    };

    const badgeStatut = (statut) => {
        const config = {
            'acceptee': { bg: '#ecfdf5', text: '#065f46', label: 'Acceptée' },
            'refusee': { bg: '#fef2f2', text: '#991b1b', label: 'Refusée' },
            'en_attente': { bg: '#fffbeb', text: '#92400e', label: 'En attente' }
        };
        const s = config[statut] || { bg: '#f3f4f6', text: '#374151', label: statut };
        return (
            <span style={{
                background: s.bg,
                color: s.text,
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center'
            }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.text, marginRight: '6px' }}></span>
                {s.label}
            </span>
        );
    };

    if (loading && visites.length === 0) {
        return (
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* EN-TÊTE PAGE */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>Demandes de visite</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Gérez les rendez-vous de visite pour vos biens immobiliers.</p>
                </div>

                {/* CONTENU PRINCIPAL */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                            Toutes les demandes ({visites.length})
                        </h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>Bien</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>Locataire</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>Date souhaitée</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>Message</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>Statut</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visites.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#9ca3af' }}>
                                            <i className="bi bi-calendar-x" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}></i>
                                            Aucune demande de visite
                                        </td>
                                    </tr>
                                ) : (
                                    visites.map(v => (
                                        <tr key={v.id_demande} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{v.bien_titre}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{v.locataire_prenoms} {v.locataire_nom}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', color: '#374151' }}>{new Date(v.date_visite).toLocaleString('fr-FR')}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {v.message || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                {badgeStatut(v.statut_demande)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                {v.statut_demande === 'en_attente' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        <button 
                                                            onClick={() => handleAction(v.id_demande, 'acceptee')} 
                                                            style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}
                                                        >
                                                            Accepter
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(v.id_demande, 'refusee')} 
                                                            style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}
                                                        >
                                                            Refuser
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitRequests;
