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

  const fetchBiens = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtres.ville) params.append("ville", filtres.ville);
    if (filtres.type_bien) params.append("type_bien", filtres.type_bien);
    if (filtres.prix_max) params.append("prix_max", filtres.prix_max);

    const res = await api.get(`/biens/disponibles?${params.toString()}`);
    setBiens(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBiens();
  }, []);

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
            <Link to="/login" className="btn btn-outline-light btn-sm">
              Se connecter
            </Link>
            <Link to="/register/role" className="btn btn-primary btn-sm">
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
            <Link
              to="/register/role"
              className="btn btn-primary btn-lg px-5 me-3"
            >
              Créer un compte gratuit
            </Link>
            <a href="#biens" className="btn btn-outline-light btn-lg px-5">
              Voir les biens
            </a>
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
                          src={`http://localhost:5000${bien.photo_principale}`}
                          alt={bien.titre}
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
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
                        <Link
                          to="/register/role"
                          className="btn btn-primary w-100 mt-3"
                        >
                          Demander une visite
                        </Link>
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
              Rejoignez des milliers de locataires et propriétaires sur
              ImmoGest.
            </p>
            <Link
              to="/register/role"
              className="btn btn-light btn-lg px-5 me-3 fw-bold text-primary"
            >
              S'inscrire gratuitement
            </Link>
            <Link
              to="/login"
              className="btn btn-outline-light btn-lg px-5"
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
    </div>
  );
};

export default HomePage;