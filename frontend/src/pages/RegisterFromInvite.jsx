// src/pages/RegisterFromInvite.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const RegisterFromInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [visiteur, setVisiteur] = useState({
    nom: "",
    prenoms: "",
    email: "",
  });

  const [motDePasse, setMotDePasse] = useState("");
  const [telephone, setTelephone] = useState("");

  // Vérifier le token à l'arrivée sur la page
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Lien d'invitation invalide.");
        setChecking(false);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(
          `/invitation-locataire/verify?token=${encodeURIComponent(token)}`
        );

        if (!res.data.valid) {
          setError("Cette invitation n'est plus valide.");
        } else {
          setVisiteur(res.data.visiteur);
        }
      } catch (e) {
        setError(
          e.response?.data?.message || "Erreur lors de la vérification du lien."
        );
      } finally {
        setChecking(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const payload = {
        token,
        mot_de_passe: motDePasse,
        telephone,
      };

      const res = await api.post("/auth/register-from-invite", payload);

      setInfo("Inscription confirmée. Vous êtes maintenant connecté.");

      // si ton backend retourne user + token, tu peux connecter directement
      if (res.data.user && res.data.token) {
        login(res.data.user, res.data.token);
        navigate("/tenant/properties"); // ou la page d’accueil locataire
      } else {
        // fallback : rediriger vers login
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Erreur lors de la confirmation de votre inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        paddingTop: "40px",
        paddingBottom: "40px",
        textAlign: "center",
      }}
    >
      <h4 className="logo-immogest">ImmoGest</h4>

      <div className="d-flex justify-content-center">
        <div
          style={{
            width: "420px",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.15)",
            padding: "24px 28px",
            textAlign: "left",
          }}
        >
          <h3 style={{ color: "#000000", marginBottom: 4 }}>
            Confirmation d’invitation
          </h3>
          <p
            className="small"
            style={{ color: "#000000", marginBottom: 16 }}
          >
            Créez votre compte locataire à partir de l’invitation reçue par
            e‑mail.
          </p>

          {checking && (
            <p style={{ color: "#000000" }}>
              Vérification du lien en cours...
            </p>
          )}

          {error && (
            <div className="alert alert-danger small mb-3">{error}</div>
          )}

          {info && (
            <div className="alert alert-success small mb-3">{info}</div>
          )}

          {!checking && !error && (
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="small mb-1" style={{ color: "#000000" }}>
                  Nom
                </label>
                <input
                  type="text"
                  className="form-control input-blue"
                  value={visiteur.nom}
                  disabled
                />
              </div>

              <div className="mb-2">
                <label className="small mb-1" style={{ color: "#000000" }}>
                  Prénoms
                </label>
                <input
                  type="text"
                  className="form-control input-blue"
                  value={visiteur.prenoms}
                  disabled
                />
              </div>

              <div className="mb-2">
                <label className="small mb-1" style={{ color: "#000000" }}>
                  E‑mail
                </label>
                <input
                  type="email"
                  className="form-control input-blue"
                  value={visiteur.email}
                  disabled
                />
              </div>

              <div className="mb-2">
                <label className="small mb-1" style={{ color: "#000000" }}>
                  Téléphone
                </label>
                <input
                  type="tel"
                  className="form-control input-blue"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex: 0123456789"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="small mb-1" style={{ color: "#000000" }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="form-control input-blue"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-2"
                style={{ borderRadius: "999px" }}
                disabled={loading}
              >
                {loading ? "Validation en cours..." : "Confirmer mon inscription"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                style={{ borderRadius: "999px" }}
                onClick={() => navigate("/")}
              >
                Retour à l’accueil
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterFromInvite;