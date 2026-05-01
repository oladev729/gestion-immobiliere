import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { getImageUrl, IMAGE_FALLBACK } from '../../utils/imageConfig';

const AvailableProperties = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [biens, setBiens] = useState([]);
    const [ville, setVille] = useState('');
    const [selectedBien, setSelectedBien] = useState(null);
    const [dateVisite, setDateVisite] = useState('');
    const [message, setMessage] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchBiens = async () => {
        const res = await api.get(`/biens/disponibles${ville ? '?ville=' + ville : ''}`);
        setBiens(res.data);
    };

    useEffect(() => { 
        fetchBiens(); 
        
        // Vérifier si un bien a été sélectionné après inscription
        const stateData = location.state || {};
        const { bienSelectionne, showVisiteForm } = stateData;
        
        if (showVisiteForm && bienSelectionne) {
            setSelectedBien(bienSelectionne);
            setSuccessMsg('');
            setErrorMsg('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [ville, location.state]);

    const handleDemandeVisite = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);
        try {
            await api.post('/demandes-visite', {
                id_bien: selectedBien.id_bien,
                date_visite: dateVisite,
                message: message
            });
            setSuccessMsg(`Demande de visite envoyée pour "${selectedBien.titre}" !`);
            setSelectedBien(null);
            setDateVisite('');
            setMessage('');
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la demande de visite');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">

            {/* Alertes */}
            {successMsg && (
                <div className="alert alert-success alert-dismissible fade show">
                    ✅ {successMsg}
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger alert-dismissible fade show">
                    ❌ {errorMsg}
                    <button type="button" className="btn-close" onClick={() => setErrorMsg('')} />
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Logements Disponibles</h2>
                <input type="text" placeholder="Filtrer par ville..."
                    className="form-control w-25"
                    onChange={e => setVille(e.target.value)} />
            </div>

            {/* Formulaire demande de visite */}
            {selectedBien && (
                <div className="card border-primary shadow p-4 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Demande de visite — <span className="text-primary">{selectedBien.titre}</span></h5>
                        <button className="btn-close" onClick={() => setSelectedBien(null)} />
                    </div>
                    <form onSubmit={handleDemandeVisite}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Date et heure souhaitées</label>
                                <input type="datetime-local" className="form-control" required
                                    value={dateVisite}
                                    min={new Date().toISOString().slice(0, 16)}
                                    onChange={e => setDateVisite(e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Message (optionnel)</label>
                                <input type="text" className="form-control"
                                    placeholder="Ex: Disponible le matin de préférence"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)} />
                            </div>
                        </div>
                        <div className="mt-3 d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Envoi...' : 'Envoyer la demande'}
                            </button>
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={() => setSelectedBien(null)}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Liste des biens */}
            <div className="row">
                {biens.map(bien => (
                    <div className="col-md-6 mb-3" key={bien.id_bien}>
                        <div className="card shadow-sm border-0 h-100">
                            {bien.photo_principale ? (
                                <img src={getImageUrl(bien.photo_principale)}
                                    className="card-img-top" alt={bien.titre}
                                    style={{ height: 180, objectFit: 'cover' }} 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = IMAGE_FALLBACK;
                                    }} />
                            ) : (
                                <div className="bg-secondary d-flex align-items-center justify-content-center"
                                    style={{ height: 180 }}>
                                    <span className="text-white small">Pas de photo</span>
                                </div>
                            )}
                            <div className="card-body">
                                <h5>{bien.titre}</h5>
                                <p className="text-muted small mb-1">📍 {bien.adresse}, {bien.ville}</p>
                                <p className="text-success fw-bold mb-1">
                                    {Number(bien.loyer_mensuel).toLocaleString()} FCFA / mois
                                </p>
                                                                <p className="small text-muted mb-2">
                                    {bien.superficie && `${bien.superficie} m²`}
                                    {bien.nombre_pieces && ` · ${bien.nombre_pieces} pièces`}
                                    {bien.meuble ? ' · Meublé' : ''}
                                </p>
                                <p className="small">{bien.description}</p>
                            </div>
                            <div className="card-footer bg-white border-0 pb-3">
                                <div className="d-grid gap-2">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            // Vérifier si l'utilisateur est connecté
                                            if (!user) {
                                                // Rediriger vers l'inscription locataire
                                                navigate('/register-step-role', { 
                                                    state: { 
                                                        redirectTo: '/tenant/properties',
                                                        bienSelectionne: bien 
                                                    } 
                                                });
                                            } else {
                                                // Ouvrir le formulaire de demande de visite
                                                setSelectedBien(bien);
                                                setSuccessMsg('');
                                                setErrorMsg('');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}>
                                        Demander une visite
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => {
                                            // Rediriger vers la messagerie avec le propriétaire
                                            navigate(`/tenant/messaging?proprietaireId=${bien.id_proprietaire}&bienId=${bien.id_bien}`);
                                        }}>
                                        Contacter le propriétaire
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {biens.length === 0 && (
                    <p className="text-muted text-center py-4">Aucun bien disponible pour le moment.</p>
                )}
            </div>
        </div>
    );
};

export default AvailableProperties;
