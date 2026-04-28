import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const RegisterFromInviteLocataire = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    code_invitation: code || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteValid, setInviteValid] = useState(null);

  useEffect(() => {
    if (!code) {
      setError("Code d'invitation manquant");
      return;
    }

    // Vérifier si le code est valide
    const validateInvite = async () => {
      try {
        const res = await api.get(`/proprietaires/validate-invite/${code}`);
        if (res.data.valid) {
          setInviteValid(true);
          setFormData(prev => ({ ...prev, email: res.data.email || "" }));
        } else {
          setInviteValid(false);
          setError("Code d'invitation invalide ou expiré");
        }
      } catch (err) {
        setInviteValid(false);
        setError("Impossible de vérifier le code d'invitation");
      }
    };

    validateInvite();
  }, [code]);

  const handleChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = { ...formData, type_utilisateur: "locataire" };
      await api.post("/auth/register-from-invite", payload);
      setSuccess("Inscription réussie ! Redirection...");
      setTimeout(() => {
        navigate("/tenant/properties");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (inviteValid === null) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Vérification...</span>
        </div>
      </div>
    );
  }

  if (inviteValid === false) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        <div className="card border-0 shadow-lg" style={{ width: '450px' }}>
          <div className="card-body p-4 text-center">
            <div className="text-danger mb-3">
              <i className="fas fa-exclamation-triangle fa-3x"></i>
            </div>
            <h4 className="text-danger">Invitation invalide</h4>
            <p className="text-muted">{error}</p>
            <button className="signin-btn" onClick={() => navigate("/login")}>
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="card border-0 shadow-lg" style={{ width: '450px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-success">Inscription Locataire</h4>
            <p className="text-muted small">Vous avez été invité par un propriétaire</p>
            <div className="badge bg-success">Code: {code}</div>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Nom</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Votre nom"
                  value={formData.nom}
                  onChange={handleChange("nom")}
                  required
                />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small fw-bold">Prénoms</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Vos prénoms"
                  value={formData.prenoms}
                  onChange={handleChange("prenoms")}
                  required
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="form-label small fw-bold">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange("email")}
                required
              />
            </div>

            <div className="mb-2">
              <label className="form-label small fw-bold">Téléphone</label>
              <input
                type="tel"
                className="form-control"
                placeholder="Votre téléphone"
                value={formData.telephone}
                onChange={handleChange("telephone")}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-bold">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.mot_de_passe}
                onChange={handleChange("mot_de_passe")}
                required
              />
            </div>

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Inscription...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/login")}
              >
                Annuler
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <small className="text-muted">
              Bienvenue dans votre espace locataire !
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterFromInviteLocataire;
