import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const VisitRequests = () => {
    const [visites, setVisites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const navigate = useNavigate();

    const fetchVisites = () => {
        setLoading(true);
        api.get('/demandes-visite/recues')
           .then(res => {
               // Filtrer pour n'afficher que les demandes de locataires (pas de visiteurs)
               const locataireRequests = res.data.filter(v => v.type_demandeur !== 'visiteur');
               setVisites(locataireRequests);
           })
           .catch(() => {})
           .finally(() => setLoading(false));
    };

    useEffect(() => { fetchVisites(); }, []);

    const handleAction = async (id, statut) => {
        try {
            await api.patch(`/demandes-visite/${id}/statut`, { statut });
            fetchVisites();
        } catch (error) {
            console.error('Erreur action demande:', error);
            alert('Erreur lors du traitement de la demande');
        }
    };

    const handleQuickReply = async (v) => {
        if (!replyMessage.trim()) return;
        
        setSendingReply(true);
        const demandeId = v.id_demande || v.id;
        const bienId = v.id_bien || v.bien_id;
        
        const payload = {
            contenu: replyMessage,
            id_bien: bienId,
            id_demande: demandeId,
            destinataire_type: v.type_demandeur === 'visiteur' ? 'visiteur' : 'utilisateur',
            id_destinataire: v.id_utilisateur || null
        };
        console.log('Sending message payload:', payload);

        try {
            await api.post('/messages/send', payload);
            
            setReplyMessage('');
            setReplyingTo(null);
            // Rediriger vers la messagerie pour voir la conversation
            navigate(`/messaging?demandeId=${demandeId}&type=${v.type_demandeur}`);
        } catch (error) {
            console.error('Erreur envoi réponse rapide:', error);
            const errorData = error.response?.data;
            const debugInfo = errorData?.debug ? JSON.stringify(errorData.debug) : 'No debug info';
            const payloadInfo = JSON.stringify(payload);
            
            alert(`ERREUR D'ENVOI !
            Message serveur: ${errorData?.message || 'Erreur inconnue'}
            Payload envoyé: ${payloadInfo}
            Debug serveur: ${debugInfo}
            
            Veuillez copier ce message pour le diagnostic.`);
        } finally {
            setSendingReply(false);
        }
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

    const badgeType = (type) => {
        return (
            <span style={{
                background: type === 'visiteur' ? '#e0f2fe' : '#f3e8ff',
                color: type === 'visiteur' ? '#0369a1' : '#7e22ce',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase'
            }}>
                {type}
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
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>Demandeur</th>
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
                                        <React.Fragment key={v.id_demande}>
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{v.bien_titre}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{v.bien_ville}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div className="d-flex flex-column gap-1">
                                                    <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '600' }}>{v.locataire_prenoms} {v.locataire_nom}</div>
                                                    <div>{badgeType(v.type_demandeur)}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', color: '#374151' }}>{v.date_visite ? new Date(v.date_visite).toLocaleString('fr-FR') : '—'}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.message}>
                                                    {v.message || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                {badgeStatut(v.statut_demande)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        onClick={() => setReplyingTo(replyingTo === v.id_demande ? null : v.id_demande)}
                                                        className={`btn btn-sm ${replyingTo === v.id_demande ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        title="Répondre"
                                                    >
                                                        <i className="bi bi-chat-dots"></i>
                                                    </button>
                                                    
                                                    {v.statut_demande === 'en_attente' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleAction(v.id_demande, 'acceptee')} 
                                                                className="btn btn-sm btn-success"
                                                            >
                                                                Accepter
                                                            </button>
                                                            <button 
                                                                onClick={() => handleAction(v.id_demande, 'refusee')} 
                                                                className="btn btn-sm btn-danger"
                                                            >
                                                                Refuser
                                                            </button>
                                                        </>
                                                    )}
                                                    
                                                    {v.statut_demande === 'acceptee' && (
                                                        <button 
                                                            onClick={() => navigate(`/owner/inviter-locataire?demandeId=${v.id_demande}&locataireId=${v.id_locataire}`)} 
                                                            className="btn btn-sm btn-warning"
                                                            title="Inviter pour contrat"
                                                        >
                                                            <i className="bi bi-file-contract"></i> Contrat
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {replyingTo === v.id_demande && (
                                            <tr style={{ backgroundColor: '#f0f9ff' }}>
                                                <td colSpan="6" style={{ padding: '1rem 1.5rem' }}>
                                                    <div className="card border-primary-subtle shadow-sm">
                                                        <div className="card-body">
                                                            <label className="form-label fw-bold mb-2">Votre réponse à {v.locataire_prenoms}</label>
                                                            <textarea 
                                                                className="form-control mb-3" 
                                                                rows="3" 
                                                                placeholder="Écrivez votre message ici..."
                                                                value={replyMessage}
                                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                                autoFocus
                                                            ></textarea>
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <button 
                                                                    className="btn btn-light btn-sm" 
                                                                    onClick={() => setReplyingTo(null)}
                                                                    disabled={sendingReply}
                                                                >
                                                                    Annuler
                                                                </button>
                                                                <button 
                                                                    className="btn btn-primary btn-sm px-4"
                                                                    onClick={() => handleQuickReply(v)}
                                                                    disabled={sendingReply || !replyMessage.trim()}
                                                                >
                                                                    {sendingReply ? (
                                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                                    ) : (
                                                                        <i className="bi bi-send me-2"></i>
                                                                    )}
                                                                    Envoyer et ouvrir la discussion
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </React.Fragment>
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
