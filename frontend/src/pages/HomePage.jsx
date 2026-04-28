import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const HomePage = () => {
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
                      }}
                    >
                      {bien.photo_principale ? (
                        <img
                          src={`${api.defaults.baseURL.replace('/api', '')}${bien.photo_principale}`}
                          alt={bien.titre}
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1582408921715-18e7806365c1?w=400&q=80";
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center"
                          style={{
                            height: 200,
                            background: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <span className="text-white opacity-50">
                            Pas de photo
                          </span>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="mb-0 text-white fw-bold">
                            {bien.titre}
                          </h5>
                          <span className="badge bg-success">Disponible</span>
                        </div>
                        <p
                          className="small mb-1"
                          style={{ color: "rgba(255,255,255,0.7)" }}
                        >
                          📍 {bien.adresse}, {bien.ville}
                        </p>
                        <p
                          className="small mb-2"
                          style={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {bien.superficie && `${bien.superficie} m²`}
                          {bien.nombre_pieces &&
                            ` · ${bien.nombre_pieces} pièces`}
                          {bien.meuble ? " · Meublé" : ""}
                        </p>
                        <p
                          className="fw-bold fs-5 mb-0"
                          style={{ color: "#7ee8a2" }}
                        >
                          {Number(bien.loyer_mensuel).toLocaleString("fr-FR")}{" "}
                          FCFA
                          <span
                            className="fs-6"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            {" "}
                            /mois
                          </span>
                        </p>
                        <div className="d-flex gap-2 mt-2 flex-wrap">
                          <span
                            className="badge"
                            style={{
                              background: "rgba(255,255,255,0.15)",
                              color: "#fff",
                            }}
                          >
                            {bien.type_bien}
                          </span>
                          {bien.proprietaire_nom && (
                            <span
                              className="badge"
                              style={{
                                background: "rgba(255,255,255,0.15)",
                                color: "#fff",
                              }}
                            >
                              {bien.proprietaire_prenoms}{" "}
                              {bien.proprietaire_nom}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleVoirPlus(bien.id_bien)}
                          className="btn btn-primary w-100 mt-3 fw-bold"
                          style={{ borderRadius: "12px", padding: "10px" }}
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
            <h2 className="fw-bold mb-3">
              Prêt à trouver votre logement ?
            </h2>
            <p
              className="lead mb-4"
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
      
      {/* MODALE DE DÉTAILS DU BIEN */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#111827', width: '100%', maxWidth: '900px',
            maxHeight: '90vh', borderRadius: '24px', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative', animation: 'fadeInUp 0.4s ease'
          }}>
            <button 
              onClick={() => { setShowModal(false); setSelectedBien(null); }}
              style={{
                position: 'absolute', top: '20px', right: '20px', zIndex: 10,
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer'
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
            ) : selectedBien && (
              <div style={{ color: '#fff' }}>
                {/* Galerie Photo simple (Grille) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '8px', padding: '8px', background: '#000' }}>
                  {selectedBien.photos && selectedBien.photos.length > 0 ? (
                    selectedBien.photos.map((p, idx) => (
                      <img 
                        key={idx} 
                        src={`${api.defaults.baseURL.replace('/api', '')}${p.url_photobien}`} 
                        alt={`Photo ${idx}`} 
                        style={{ width: '100%', height: '300px', objectFit: 'cover', cursor: 'zoom-in' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1582408921715-18e7806365c1?w=400&q=80";
                        }}
                      />
                    ))
                  ) : (
                    <div style={{ height: '300px', gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f2937' }}>
                      Pas de photos supplémentaires
                    </div>
                  )}
                </div>

                <div style={{ padding: '2.5rem' }}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>{selectedBien.titre}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>📍 {selectedBien.adresse}, {selectedBien.ville}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#7ee8a2', margin: 0 }}>{Number(selectedBien.loyer_mensuel).toLocaleString()} FCFA</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Loyer mensuel</p>
                    </div>
                  </div>

                  <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />

                  <div className="row g-4">
                    <div className="col-md-8">
                      <h4 style={{ fontWeight: '700', marginBottom: '1.2rem' }}>Description du bien</h4>
                      <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', fontSize: '1.1rem', whiteSpace: 'pre-line' }}>
                        {selectedBien.description || "Aucune description fournie pour ce bien."}
                      </p>
                    </div>
                    <div className="col-md-4">
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h5 style={{ fontWeight: '700', marginBottom: '1rem' }}>Caractéristiques</h5>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                          <li><i className="bi bi-arrows-fullscreen me-2"></i> {selectedBien.superficie} m²</li>
                          <li><i className="bi bi-door-open me-2"></i> {selectedBien.nombre_pieces} pièces</li>
                          <li><i className="bi bi-house-check me-2"></i> {selectedBien.type_bien}</li>
                          {selectedBien.meuble && <li><i className="bi bi-check-circle me-2"></i> Meublé</li>}
                        </ul>
                        
                        <Link to="/register-step-role" state={{ 
                          redirectTo: '/tenant/properties', 
                          bienSelectionne: selectedBien 
                        }} className="btn btn-primary w-100 mt-4 fw-bold p-3" style={{ borderRadius: '12px' }}>
                          Demander une visite
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
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
