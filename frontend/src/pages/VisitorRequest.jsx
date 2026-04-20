// src/pages/VisitorRequest.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const VisitorRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id_bien = searchParams.get("id_bien");
  const titreBien = searchParams.get("titre");

  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    telephone: "",
    message: "",
    date_visite_souhaitee: "",
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
      const endpoint = id_bien ? `/visiteurs/demande-visite/${id_bien}` : "/visiteurs/demande";
      const res = await api.post(endpoint, formData);

      setInfo("Votre demande de visite a été envoyée avec succès ! Redirection vers votre tableau de bord...");
      
      // Stocker l'email dans le localStorage pour faciliter l'accès au dashboard visiteur
      localStorage.setItem("visitor_email", formData.email);

      // Redirection vers la messagerie pour commencer la conversation
      setTimeout(() => {
        navigate(`/messaging?demandeId=${res.data.demande.id_demande}`);
      }, 2000);
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h4 className="logo-immogest" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>ImmoGest</h4>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Trouvez votre futur foyer en toute simplicité</p>
      </div>

      <div style={{
        width: "100%",
        maxWidth: "500px",
        borderRadius: "24px",
        backgroundColor: "#ffffff",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        padding: "40px",
        border: "1px solid #f1f5f9"
      }}>
        <h3 style={{ color: "#1e293b", marginBottom: 8, fontWeight: '800' }}>
          Demande de visite
        </h3>
        {titreBien && (
          <div style={{ 
            backgroundColor: '#f1f5f9', 
            padding: '12px 16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            borderLeft: '4px solid #3b82f6'
          }}>
            <p className="small mb-0" style={{ color: '#475569' }}>Bien concerné :</p>
            <p className="fw-bold mb-0" style={{ color: '#1e293b' }}>{titreBien}</p>
          </div>
        )}
        <p className="small" style={{ color: "#64748b", marginBottom: 24 }}>
          Remplissez vos informations pour planifier une visite. Le propriétaire vous contactera via la messagerie dédiée.
        </p>

        {error && (
          <div className="alert alert-danger d-flex align-items-center" style={{ borderRadius: '12px', fontSize: '0.9rem' }}>
            <span className="me-2">⚠️</span> {error}
          </div>
        )}
        {info && (
          <div className="alert alert-success d-flex align-items-center" style={{ borderRadius: '12px', fontSize: '0.9rem' }}>
            <span className="me-2">✅</span> {info}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-md-6 mb-3">
              <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Nom</label>
              <input type="text" className="form-control" style={{ borderRadius: '10px', padding: '12px' }}
                value={formData.nom} onChange={handleChange("nom")} required placeholder="Ex: DUPONT" />
            </div>
            <div className="col-md-6 mb-3">
              <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Prénoms</label>
              <input type="text" className="form-control" style={{ borderRadius: '10px', padding: '12px' }}
                value={formData.prenoms} onChange={handleChange("prenoms")} required placeholder="Ex: Jean" />
            </div>
          </div>

          <div className="mb-3">
            <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Email</label>
            <input type="email" className="form-control" style={{ borderRadius: '10px', padding: '12px' }}
              value={formData.email} onChange={handleChange("email")} required placeholder="jean.dupont@email.com" />
          </div>

          <div className="mb-3">
            <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Téléphone</label>
            <input type="tel" className="form-control" style={{ borderRadius: '10px', padding: '12px' }}
              value={formData.telephone} onChange={handleChange("telephone")} placeholder="Ex: 0102030405" />
          </div>

          <div className="mb-3">
            <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Date de visite souhaitée</label>
            <input type="datetime-local" className="form-control" style={{ borderRadius: '10px', padding: '12px' }}
              value={formData.date_visite_souhaitee} onChange={handleChange("date_visite_souhaitee")} required
              min={new Date().toISOString().slice(0, 16)} />
          </div>

          <div className="mb-4">
            <label className="small mb-1 fw-bold" style={{ color: "#334155" }}>Message pour le propriétaire</label>
            <textarea className="form-control" rows={3} style={{ borderRadius: '10px', padding: '12px' }}
                value={formData.message} onChange={handleChange("message")}
                placeholder="Précisez vos disponibilités ou posez une question..." />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-3 mb-3 fw-bold"
            style={{ borderRadius: "12px", boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)' }} disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Envoi en cours...</>
            ) : "Envoyer ma demande de visite"}
          </button>

          <button type="button" className="btn btn-link w-100 text-decoration-none"
            style={{ color: "#64748b" }} onClick={() => navigate("/")}>
            ← Retour à l'accueil
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitorRequest;
