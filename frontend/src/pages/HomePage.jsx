import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getImageUrl, IMAGE_FALLBACK } from "../utils/imageConfig";
import { AuthContext } from "../context/AuthContext";

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [biens, setBiens] = useState([]);
  const [filtres, setFiltres] = useState({
    ville: "",
    type_bien: "",
    prix_max: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedBien, setSelectedBien] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const fetchBiens = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtres.ville) params.append("ville", filtres.ville);
      if (filtres.type_bien) params.append("type_bien", filtres.type_bien);
      if (filtres.prix_max) params.append("prix_max", filtres.prix_max);

      const res = await api.get(`/biens/disponibles?${params.toString()}`);
      if (Array.isArray(res.data)) {
        setBiens(res.data);
      } else {
        console.error("Format de réponse invalide:", res.data);
        setBiens([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des biens:", error);
      setBiens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiens();
  }, []);

  const handleVoirPlus = async (bienId) => {
    setLoadingPhotos(true);
    setErrorModal("");
    setShowModal(true);
    setCurrentPhotoIndex(0);
    try {
      const res = await api.get(`/biens/${bienId}`);
      setSelectedBien(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération du bien:", error);
      setErrorModal("Impossible de charger les détails du logement. Veuillez réessayer.");
    } finally {
      setLoadingPhotos(false);
    }
  };

  const getModalPhotos = (bien) => {
    if (!bien?.photos || bien.photos.length === 0) return [];
    const cover = bien.photos.find(p => p.est_principale) || bien.photos[0];
    const rest = bien.photos.filter(p => p !== cover);
    return [cover, ...rest];
  };

  const handleDemanderVisiteClick = () => {
    if (!selectedBien) return;
    if (!user) {
      // Rediriger vers la page de connexion
      navigate("/login", { 
        state: { 
          redirectTo: "/tenant/properties",
          bienSelectionne: selectedBien,
          showVisiteForm: true
        } 
      });
    } else {
      // Rediriger vers l'espace locataire avec le formulaire de visite déjà ouvert
      navigate("/tenant/properties", { 
        state: { 
          bienSelectionne: selectedBien,
          showVisiteForm: true 
        } 
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      {/* Overlay sombre */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
        }}
      />

      {/* Contenu de la page */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {/* NAVBAR */}
        <nav
          className="navbar navbar-expand-lg navbar-dark px-4"
          style={{
            background: "rgba(10, 12, 28, 0.75)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
          
        >
          <span className="navbar-brand logo-immogest">ImmoGest</span>
          <div className="ms-auto d-flex gap-2">
            <Link to="/login" className="signin-btn btn-sm px-3 py-2">
              Se connecter
            </Link>
            <Link to="/register/role" className="btn btn-outline-light btn-sm px-3 py-2">
              S'inscrire
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <div
          className="text-white text-center py-5"
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div className="container py-4">
            <h1
              className="display-4 fw-bold mb-3"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
            >
              Trouvez votre logement idéal
            </h1>
            <p className="lead text-light mb-4">
              Des centaines de biens disponibles : appartements, maisons, studios
              à louer en toute simplicité.
            </p>
            
          </div>
        </div>

       
        {/* FILTRES + BIENS */}
        <div id="biens" className="py-5">
          <div className="container">
            <h3 className="text-center mb-4 fw-bold text-white">
              Biens disponibles
            </h3>

            {/* Carte filtre */}
            <div
              className="p-3 mb-4"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 16,
              }}
            >
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-white">
                    Ville
                  </label>
                  <input
                    className="form-control"
                    placeholder="Ex: Cotonou..."
                    value={filtres.ville}
                    onChange={(e) =>
                      setFiltres({ ...filtres, ville: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-white">
                    Type de bien
                  </label>
                  <select
                    className="form-select"
                    value={filtres.type_bien}
                    onChange={(e) =>
                      setFiltres({ ...filtres, type_bien: e.target.value })
                    }
                  >
                    <option value="">Tous les types</option>
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                    <option value="studio">Studio</option>
                    <option value="bureau">Bureau</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-white">
                    Loyer max (FCFA)
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Ex: 200000"
                    min="0"
                    value={filtres.prix_max}
                    onChange={(e) =>
                      setFiltres({ ...filtres, prix_max: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-primary w-100"
                    onClick={fetchBiens}
                  >
                    Rechercher
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des biens */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-white" role="status" />
              </div>
            ) : (
              <div className="row">
                {biens.map((bien) => (
                  <div className="col-md-4 mb-4" key={bien.id_bien}>
                    <div
                      className="h-100"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 16,
                        overflow: "hidden",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Photo de couverture uniquement */}
                      {bien.photo_principale ? (
                        <img
                          src={getImageUrl(bien.photo_principale)}
                          alt={bien.titre}
                          style={{ width: "100%", height: 200, objectFit: "cover" }}
                          onError={(e) => { e.target.onerror = null; e.target.src = IMAGE_FALLBACK; }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center"
                          style={{ height: 200, background: "rgba(255,255,255,0.08)" }}
                        >
                          <i className="bi bi-image text-white opacity-30" style={{ fontSize: '3rem' }}></i>
                        </div>
                      )}

                      <div className="p-3" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        {/* Badge Disponible */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="mb-0 text-white fw-bold" style={{ fontSize: '1rem', flex: 1, paddingRight: '0.5rem' }}>
                            {bien.titre}
                          </h5>
                          <span className="badge bg-success">Disponible</span>
                        </div>

                        {/* Loyer mensuel */}
                        <p className="fw-bold fs-5 mb-1" style={{ color: "#7ee8a2", margin: 0 }}>
                          {Number(bien.loyer_mensuel).toLocaleString("fr-FR")} FCFA
                          <span className="fs-6" style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400 }}> /mois</span>
                        </p>

                        {/* Localisation */}
                        <p className="small mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                          📍 {bien.adresse}, {bien.ville}
                        </p>

                        {/* Propriétaire */}
                        {bien.proprietaire_nom && (
                          <p className="small mb-0" style={{ color: "rgba(255,255,255,0.6)" }}>
                            <i className="bi bi-person me-1"></i>
                            {bien.proprietaire_prenoms} {bien.proprietaire_nom}
                          </p>
                        )}

                        <button
                          onClick={() => handleVoirPlus(bien.id_bien)}
                          className="btn btn-primary w-100 mt-auto fw-bold"
                          style={{ borderRadius: "12px", padding: "10px", marginTop: "1rem" }}
                        >
                          Voir plus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {biens.length === 0 && (
                  <div className="col-12 text-center py-5">
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>
                      Aucun bien ne correspond à votre recherche.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

         {/* CHIFFRES */}
        <div
          className="py-4"
          style={{
            background: "rgba(13, 110, 253, 0.25)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div className="container">
            <div className="row text-center g-3">
              <div className="col-md-4">
                <h2 className="fw-bold display-6 text-white">
                  {biens.length}+
                </h2>
                <p className="mb-0 text-white">Biens disponibles</p>
              </div>
              <div className="col-md-4">
                <h2 className="fw-bold display-6 text-white">100%</h2>
                <p className="mb-0 text-white">Annonces vérifiées</p>
              </div>
              <div className="col-md-4">
                <h2 className="fw-bold display-6 text-white">24h</h2>
                <p className="mb-0 text-white">Réponse garantie</p>
              </div>
            </div>
          </div>
        </div>


        {/* COMMENT CA MARCHE */}
        <div
          className="py-5"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div className="container">
            <h3 className="text-center fw-bold mb-5 text-white">
              Comment ça marche ?
            </h3>
            <div className="row text-center g-4">
              {[
                {
                  num: 1,
                  titre: "Parcourez les biens",
                  desc: "Consultez les annonces disponibles et filtrez selon vos critères.",
                },
                {
                  num: 2,
                  titre: "Créez votre compte",
                  desc: "Inscrivez-vous gratuitement en tant que locataire ou propriétaire.",
                },
                {
                  num: 3,
                  titre: "Contactez & visitez",
                  desc: "Demandez une visite et signez votre contrat en ligne.",
                },
              ].map((item) => (
                <div className="col-md-4" key={item.num}>
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 64, height: 64, fontSize: 24 }}
                  >
                    {item.num}
                  </div>
                  <h5 className="fw-bold text-white">{item.titre}</h5>
                  <p style={{ color: "rgba(255,255,255,0.65)" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA INSCRIPTION */}
        <div
          className="text-white text-center py-5"
          style={{
            background: "rgba(13, 110, 253, 0.3)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div className="container">
            <h2 className="fw-bold mb-3 text-white">
              Prêt à trouver votre logement ?
            </h2>
            <p
              className="lead mb-4 text-white"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Rejoignez des milliers de locataires et propriétaires sur{" "}
              <span style={{ color: "#0d6efd", fontWeight: "bold" }}>ImmoGest</span>.
            </p>
            <Link
              to="/register/role"
              className="btn btn-outline-light btn-lg px-4 py-3 me-3 fw-bold"
            >
              S'inscrire gratuitement
            </Link>
            <Link
              to="/login"
              className="signin-btn btn-lg px-4 py-3"
            >
              Se connecter
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <footer
          className="text-white text-center py-3"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <small>
            Plateforme de gestion Immobilière - 2026 réalisée par Oulfath &
            Zeynabou - Contactez nous au +2290159815842 / 0158868731
          </small>
        </footer>
      </div>
      
      {/* MODALE DE DÉTAILS DU BIEN - CARROUSEL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px'
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setSelectedBien(null); } }}>
          <div style={{
            backgroundColor: '#0f172a', width: '100%', maxWidth: '820px',
            maxHeight: '92vh', borderRadius: '24px', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
            position: 'relative', animation: 'fadeInUp 0.35s ease'
          }}>
            {/* Bouton fermer */}
            <button
              onClick={() => { setShowModal(false); setSelectedBien(null); }}
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 20,
                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', width: '38px', height: '38px', borderRadius: '50%',
                cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>

            {loadingPhotos ? (
              <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-white">Chargement des détails...</p>
              </div>
            ) : errorModal ? (
              <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                <i className="bi bi-exclamation-triangle text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                <h4 className="text-white mb-2">Oups !</h4>
                <p className="text-light opacity-75">{errorModal}</p>
                <button className="btn btn-outline-light mt-3" onClick={() => handleVoirPlus(selectedBien?.id_bien)}>Réessayer</button>
              </div>
            ) : selectedBien && (() => {
              const allPhotos = getModalPhotos(selectedBien);
              const totalPhotos = allPhotos.length;
              const currentPhoto = allPhotos[currentPhotoIndex];
              return (
                <div style={{ color: '#fff' }}>

                  {/* ===== CARROUSEL PHOTOS ===== */}
                  <div style={{ position: 'relative', height: '420px', overflow: 'hidden', borderRadius: '24px 24px 0 0', background: '#1e293b' }}>
                    {currentPhoto ? (
                      <img
                        key={currentPhotoIndex}
                        src={getImageUrl(currentPhoto.url_photobien)}
                        alt={`Photo ${currentPhotoIndex + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeInPhoto 0.3s ease' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = IMAGE_FALLBACK; }}
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-image" style={{ fontSize: '4rem', color: 'rgba(255,255,255,0.2)' }}></i>
                      </div>
                    )}


                    {/* Bouton précédent */}
                    {totalPhotos > 1 && currentPhotoIndex > 0 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(i => i - 1)}
                        style={{
                          position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.25)',
                          color: '#fff', width: '44px', height: '44px', borderRadius: '50%',
                          cursor: 'pointer', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s', zIndex: 10
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
                      >‹</button>
                    )}

                    {/* Bouton suivant */}
                    {totalPhotos > 1 && currentPhotoIndex < totalPhotos - 1 && (
                      <button
                        onClick={() => setCurrentPhotoIndex(i => i + 1)}
                        style={{
                          position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.25)',
                          color: '#fff', width: '44px', height: '44px', borderRadius: '50%',
                          cursor: 'pointer', fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.2s', zIndex: 10
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
                      >›</button>
                    )}

                    {/* Compteur photos */}
                    {totalPhotos > 1 && (
                      <div style={{
                        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.6)', borderRadius: '20px', padding: '4px 14px',
                        fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', zIndex: 10
                      }}>
                        {currentPhotoIndex + 1} / {totalPhotos}
                      </div>
                    )}

                    {/* Points de navigation */}
                    {totalPhotos > 1 && totalPhotos <= 10 && (
                      <div style={{
                        position: 'absolute', bottom: '14px', right: '20px',
                        display: 'flex', gap: '6px', zIndex: 10
                      }}>
                        {allPhotos.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPhotoIndex(idx)}
                            style={{
                              width: idx === currentPhotoIndex ? '20px' : '8px',
                              height: '8px',
                              borderRadius: '4px',
                              background: idx === currentPhotoIndex ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                              border: 'none', cursor: 'pointer',
                              transition: 'all 0.25s ease', padding: 0
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ===== INFOS SOUS LE CARROUSEL ===== */}
                  <div style={{ padding: '2rem' }}>
                    {/* Titre + Loyer */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.7rem', fontWeight: '800', marginBottom: '0.3rem', lineHeight: 1.2 }}>
                        {selectedBien.titre}
                      </h2>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        📍 {selectedBien.adresse}, {selectedBien.ville}
                      </p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '800', color: '#7ee8a2', margin: 0 }}>
                        {Number(selectedBien.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                        <span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.45)' }}> / mois</span>
                      </p>
                    </div>

                    <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '1.2rem 0' }} />

                    {/* Layout 2 colonnes : Description gauche | Caractéristiques droite */}
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                      {/* Colonne gauche : Description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ fontWeight: '700', marginBottom: '0.75rem', color: '#e2e8f0', fontSize: '1rem' }}>
                          Description du bien
                        </h5>
                        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.8', fontSize: '0.92rem', whiteSpace: 'pre-line', margin: 0 }}>
                          {selectedBien.description || 'Aucune description fournie pour ce bien.'}
                        </p>
                      </div>

                      {/* Colonne droite : Caractéristiques */}
                      <div style={{ width: '200px', flexShrink: 0 }}>
                        <h5 style={{ fontWeight: '700', marginBottom: '1rem', color: '#e2e8f0', fontSize: '1rem' }}>
                          Caractéristiques
                        </h5>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                          {selectedBien.superficie && (
                            <li style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-arrows-fullscreen" style={{ color: '#93c5fd', width: '16px' }}></i>
                              {selectedBien.superficie} m²
                            </li>
                          )}
                          {selectedBien.nombre_pieces && (
                            <li style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-door-open" style={{ color: '#93c5fd', width: '16px' }}></i>
                              {selectedBien.nombre_pieces} pièces
                            </li>
                          )}
                          {selectedBien.type_bien && (
                            <li style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-house-check" style={{ color: '#93c5fd', width: '16px' }}></i>
                              {selectedBien.type_bien}
                            </li>
                          )}
                          {selectedBien.meuble && (
                            <li style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <i className="bi bi-check-circle" style={{ color: '#7ee8a2', width: '16px' }}></i>
                              Meublé
                            </li>
                          )}
                        </ul>

                        <button
                          onClick={handleDemanderVisiteClick}
                          className="btn btn-primary fw-bold"
                          style={{ width: '100%', borderRadius: '12px', padding: '12px', fontSize: '0.9rem', marginTop: '1.5rem' }}
                        >
                          <i className="bi bi-calendar-check me-2"></i>Demander une visite
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInPhoto {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .signin-btn {
          background: #1a73e8 !important;
          color: white !important;
          border: none !important;
          padding: 12px !important;
          border-radius: 999px !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          cursor: pointer !important;
          transition: transform 0.2s, background 0.2s !important;
        }
        
        .signin-btn:hover {
          background: #1557b0 !important;
          transform: translateY(-1px) !important;
        }
        
        .signin-btn:active {
          transform: translateY(0) !important;
        }
        
        .signin-btn:disabled {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
