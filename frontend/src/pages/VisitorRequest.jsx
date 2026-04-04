// src/pages/VisitorRequest.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const VisitorRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email_visiteur: "",
    telephone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const payload = {
        nom: formData.nom,
        prenoms: formData.prenoms,
        email: formData.email_visiteur,
        telephone: formData.telephone,
        message: formData.message,
      };

      await api.post("/demande-inscription-visiteur", payload);

      setInfo(
        "Votre demande a été enregistrée. " +
          "Votre propriétaire pourra vous inviter par e-mail. " +
          "Une fois l'invitation reçue, suivez le lien pour confirmer votre inscription."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'envoi de la demande."
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
            Demande d’invitation
          </h3>
          <p
            className="small"
            style={{ color: "#000000", marginBottom: 16 }}
          >
            Remplissez ce formulaire. Votre propriétaire pourra ensuite vous
            envoyer une invitation par e‑mail.
          </p>

          {error && (
            <div className="alert alert-danger small mb-3">{error}</div>
          )}
          {info && (
            <div className="alert alert-success small mb-3">{info}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Nom
              </label>
              <input
                type="text"
                className="form-control input-blue"
                value={formData.nom}
                onChange={handleChange("nom")}
                required
              />
            </div>

            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Prénoms
              </label>
              <input
                type="text"
                className="form-control input-blue"
                value={formData.prenoms}
                onChange={handleChange("prenoms")}
                required
              />
            </div>

            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Votre e‑mail
              </label>
              <input
                type="email"
                className="form-control input-blue"
                value={formData.email_visiteur}
                onChange={handleChange("email_visiteur")}
                placeholder="votre-email@example.com"
                required
              />
            </div>

            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Votre téléphone
              </label>
              <input
                type="tel"
                className="form-control input-blue"
                value={formData.telephone}
                onChange={handleChange("telephone")}
                placeholder="Ex: 0123456789"
              />
            </div>

            <div className="mb-3">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Message (optionnel)
              </label>
              <textarea
                className="form-control input-blue"
                rows={3}
                value={formData.message}
                onChange={handleChange("message")}
                placeholder="Précisez par exemple la résidence ou le contexte."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-2"
              style={{ borderRadius: "999px" }}
              disabled={loading}
            >
              {loading ? "Envoi en cours..." : "Envoyer la demande"}
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
        </div>
      </div>
    </div>
  );
};

export default VisitorRequest;