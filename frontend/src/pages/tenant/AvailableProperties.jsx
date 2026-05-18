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
    const [selectedDetailBien, setSelectedDetailBien] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [errorDetail, setErrorDetail] = useState('');
    const [dateVisite, setDateVisite] = useState('');
    const [message, setMessage] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchBiens = async () => {
        const res = await api.get(`/biens/disponibles${ville ? '?ville=' + ville : ''}`);
        setBiens(res.data);
    };

    const handleVoirPlus = async (bienId) => {
        setLoadingDetail(true);
        setErrorDetail('');
        try {
            const res = await api.get(`/biens/${bienId}`);
            setSelectedDetailBien(res.data);
        } catch (err) {
            console.error("Erreur lors du chargement du bien:", err);
            setErrorDetail("Impossible de charger les détails.");
        } finally {
            setLoadingDetail(false);
        }
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
                        <div className="card shadow-sm border-0 h-100" style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* IMAGE CONTAINER */}
                            <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                                {bien.photo_principale ? (
                                    <img
                                        src={getImageUrl(bien.photo_principale)}
                                        alt={bien.titre}
                                        className="card-img-hero"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.5s ease'
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = IMAGE_FALLBACK;
                                        }}
                                    />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                        Pas de photo
                                    </div>
                                )}

                                {/* FLOATING BADGE (TOP-RIGHT) */}
                                <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                                    <span style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                        color: '#ffffff',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: '800',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}>
                                        A LOUER
                                    </span>
                                </div>

                                {/* FLOATING ACTION BUTTONS (BOTTOM-RIGHT) */}
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
                                    <div style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        color: '#ffffff',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <i className="bi bi-arrows-fullscreen" style={{ fontSize: '0.8rem' }}></i>
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        color: '#ffffff',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <i className="bi bi-heart" style={{ fontSize: '0.8rem' }}></i>
                                    </div>
                                </div>
                            </div>

                            {/* CARD BODY CONTENT */}
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, backgroundColor: '#ffffff' }}>
                                {/* 1. PRICE (LARGE, BOLD, BLACK, TOP) */}
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '800',
                                    color: '#000000',
                                    marginBottom: '6px',
                                    fontFamily: 'Inter, sans-serif'
                                }}>
                                    {Number(bien.loyer_mensuel).toLocaleString()} CFA<span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#000000' }}>/Mois</span>
                                </div>

                                {/* 2. TITLE (BOLD, BLACK) */}
                                <h3 style={{
                                    fontSize: '1.02rem',
                                    fontWeight: '800',
                                    color: '#000000',
                                    marginBottom: '6px',
                                    lineHeight: '1.3',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                }}>
                                    {bien.titre}
                                </h3>

                                {/* 2.5. DESCRIPTION (PURE BLACK, ONE LINE, COMPACT) */}
                                <p style={{
                                    fontSize: "0.85rem",
                                    color: "#000000",
                                    marginBottom: "8px",
                                    lineHeight: "1.3",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontWeight: "500"
                                }}>
                                    {bien.description || "Aucune description fournie pour ce bien."}
                                </p>

                                {/* 3. LOCATION (GREY, PIN ICON) */}
                                <p style={{
                                    color: '#000000',
                                    fontSize: '0.78rem',
                                    fontWeight: '550',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <i className="bi bi-geo-alt" style={{ color: '#000000' }}></i>
                                    {bien.adresse}, {bien.ville}
                                </p>

                                {/* 4. SPECS ROW (HORIZONTAL AT BOTTOM - PUSHED BY MARGIN TOP AUTO) */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                    fontSize: '0.8rem',
                                    color: '#000000',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #e5e7eb',
                                    fontWeight: '700',
                                    marginTop: 'auto'
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <i className="bi bi-tag" style={{ color: '#000000' }}></i> {bien.id_bien}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <i className="bi bi-door-open" style={{ color: '#000000' }}></i> {bien.nombre_pieces}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <i className="bi bi-arrows-fullscreen" style={{ color: "#000000" }}></i> {bien.superficie} m²
                                    </span>
                                    {bien.meuble && (
                                        <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#047857" }}>
                                            <i className="bi bi-check-circle-fill"></i> Meublé
                                        </span>
                                    )}
                                </div>

                                {/* BUTTON ACTIONS */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                                    {/* 1. VOIR DETAILS BUTTON */}
                                    <button
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: "#2563eb",
                                            color: "#ffffff",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: "700",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px",
                                            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                                            transition: "all 0.2s"
                                        }}
                                        onClick={() => handleVoirPlus(bien.id_bien)}>
                                        <i className="bi bi-eye"></i> Voir les détails
                                    </button>

                                    {/* 2. ROW ACTIONS */}
                                    <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                                        <button
                                            style={{
                                                flex: 1,
                                                padding: "8px",
                                                borderRadius: "6px",
                                                border: "none",
                                                backgroundColor: "#2563eb",
                                                color: "#ffffff",
                                                cursor: "pointer",
                                                fontSize: "0.75rem",
                                                fontWeight: "700",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "4px",
                                                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                                                transition: "all 0.2s"
                                            }}
                                            onClick={() => {
                                                if (!user) {
                                                    navigate('/register-step-role', {
                                                        state: {
                                                            redirectTo: '/tenant/properties',
                                                            bienSelectionne: bien
                                                        }
                                                    });
                                                } else {
                                                    setSelectedBien(bien);
                                                    setSuccessMsg('');
                                                    setErrorMsg('');
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}>
                                            <i className="bi bi-calendar-check"></i> Visiter
                                        </button>
                                        <button
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: '1px solid #d1d5db',
                                                backgroundColor: '#ffffff',
                                                color: '#374151',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '4px',
                                                transition: 'all 0.2s'
                                            }}
                                            onClick={() => {
                                                navigate(`/tenant/messaging?proprietaireId=${bien.id_proprietaire}&bienId=${bien.id_bien}`);
                                            }}>
                                            <i className="bi bi-chat-left-dots"></i> Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {biens.length === 0 && (
                    <p className="text-muted text-center py-4">Aucun bien disponible pour le moment.</p>
                )}
            </div>

            {/* MODAL DETAIL BIEN */}
            {(selectedDetailBien || loadingDetail || errorDetail) && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1050,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '850px', maxHeight: '90vh',
                        backgroundColor: '#ffffff', borderRadius: '16px', overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        position: 'relative', border: '1px solid #e5e7eb'
                    }}>
                        <button
                            onClick={() => { setSelectedDetailBien(null); setErrorDetail(''); }}
                            style={{
                                position: 'absolute', top: '20px', right: '20px', zIndex: 10,
                                background: 'rgba(0,0,0,0.05)', border: 'none', color: '#000000',
                                width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                            }}
                        >✕</button>

                        {loadingDetail ? (
                            <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="spinner-border text-primary mb-3" role="status" />
                                <p className="text-muted">Chargement des détails...</p>
                            </div>
                        ) : errorDetail ? (
                            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                                <i className="bi bi-exclamation-triangle text-danger mb-3" style={{ fontSize: '3rem' }}></i>
                                <h4 className="text-dark mb-2">Erreur</h4>
                                <p className="text-muted">{errorDetail}</p>
                                <button className="btn btn-primary mt-3" onClick={() => setSelectedDetailBien(null)}>Fermer</button>
                            </div>
                        ) : selectedDetailBien && (
                            <div>
                                {/* Galerie Photos (Grille) */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px', padding: '8px', background: '#f3f4f6' }}>
                                    {selectedDetailBien.photos && selectedDetailBien.photos.length > 0 ? (
                                        selectedDetailBien.photos.map((p, idx) => (
                                            <img
                                                key={idx}
                                                src={`${api.defaults.baseURL.replace('/api', '')}${p.url_photobien}`}
                                                alt={`Photo ${idx}`}
                                                style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://images.unsplash.com/photo-1582408921715-18e7806365c1?w=400&q=80";
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <div style={{ height: '250px', gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', borderRadius: '8px', color: '#6b7280' }}>
                                            Aucune photo supplémentaire pour ce logement.
                                        </div>
                                    )}
                                </div>

                                <div style={{ padding: '2rem' }}>
                                    <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                                        <div>
                                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem', color: '#000000' }}>{selectedDetailBien.titre}</h2>
                                            <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: '500', margin: 0 }}>📍 {selectedDetailBien.adresse}, {selectedDetailBien.ville}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#2563eb', margin: 0 }}>{Number(selectedDetailBien.loyer_mensuel).toLocaleString()} FCFA</p>
                                            <p style={{ color: '#4b5563', fontWeight: '600', margin: 0 }}>Loyer mensuel</p>
                                        </div>
                                    </div>

                                    <hr style={{ borderColor: '#e5e7eb', margin: '1.5rem 0' }} />

                                    <div className="row g-4">
                                        <div className="col-md-7">
                                            <h4 style={{ fontWeight: '800', color: '#000000', marginBottom: '1rem' }}>Description du bien</h4>
                                            <p style={{ color: '#1f2937', lineHeight: '1.7', fontSize: '1rem', whiteSpace: 'pre-line', fontWeight: '500' }}>
                                                {selectedDetailBien.description || "Aucune description fournie pour ce bien."}
                                            </p>
                                        </div>
                                        <div className="col-md-5">
                                            <div style={{ backgroundColor: '#f9fafb', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                                                <h5 style={{ fontWeight: '800', color: '#000000', marginBottom: '1.2rem' }}>Caractéristiques</h5>
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#1f2937', fontWeight: '600' }}>
                                                    <li><i className="bi bi-arrows-fullscreen me-2 text-primary"></i> <strong>Superficie :</strong> {selectedDetailBien.superficie} m²</li>
                                                    <li><i className="bi bi-door-open me-2 text-primary"></i> <strong>Pièces :</strong> {selectedDetailBien.nombre_pieces} pièces</li>
                                                    <li><i className="bi bi-house-check me-2 text-primary"></i> <strong>Type :</strong> {selectedDetailBien.type_bien}</li>
                                                    {selectedDetailBien.meuble && <li><i className="bi bi-check-circle me-2 text-success"></i> Meublé</li>}
                                                </ul>

                                                <button
                                                    onClick={() => {
                                                        setSelectedDetailBien(null);
                                                        setSelectedBien(selectedDetailBien);
                                                        setSuccessMsg('');
                                                        setErrorMsg('');
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="btn btn-primary w-100 mt-4 fw-bold p-3"
                                                    style={{ borderRadius: '12px', fontSize: '0.9rem' }}
                                                >
                                                    Demander une visite
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailableProperties;