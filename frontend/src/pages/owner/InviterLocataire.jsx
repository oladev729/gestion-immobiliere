import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";

const InviterLocataire = () => {
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get("demandeId");
  const locataireId = searchParams.get("locataireId");
  
  const [email, setEmail] = useState("");
  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [demandeInfo, setDemandeInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer la liste de tous les locataires pour le select
    api.get("/auth/locataires")
      .then(res => {
        setLocataires(res.data || []);
      })
      .catch(err => console.error("Erreur locataires:", err));

    if (demandeId && locataireId) {
      // Récupérer les infos de la demande de visite
      api.get(`/demandes-visite/${demandeId}`)
        .then(res => {
          setDemandeInfo(res.data);
          setEmail(res.data.locataire_email || "");
        })
        .catch(err => {
          console.error("Erreur récupération demande:", err);
        });
    }
  }, [demandeId, locataireId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const selectedLoc = locataires.find(l => l.email === email) || {};
      
      const payload = { 
        email, 
        nom: selectedLoc.nom || demandeInfo?.locataire_nom || "",
        prenoms: selectedLoc.prenoms || demandeInfo?.locataire_prenoms || "",
        demandeId, 
        locataireId,
        type_souhaite: 'locataire'
      };
      const res = await api.post("/auth/inviter-locataire", payload);
      setSuccess(`Invitation pour contrat envoyée à ${email} ! Le locataire recevra une notification.`);
      setTimeout(() => {
        navigate("/owner/visits");
      }, 3000);
    } catch (err) {
      console.error("Erreur complète:", err);
      const msg = err.response?.data?.message || err.message || "Erreur de connexion au serveur";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="card border-0 shadow-lg" style={{ width: '450px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-warning">Inviter pour Contrat</h4>
            <p className="text-muted small">Envoyez une invitation de contrat au locataire</p>
            {demandeInfo && (
              <div className="alert alert-info small py-2">
                <strong>Demande de visite:</strong> {demandeInfo.bien_titre}<br/>
                <strong>Locataire:</strong> {demandeInfo.locataire_prenoms} {demandeInfo.locataire_nom}
              </div>
            )}
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {success && <div className="alert alert-success py-2 small">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Sélectionner le locataire</label>
              <select
                className="form-select"
                value={email}
                onChange={(e) => {
                  const selectedEmail = e.target.value;
                  setEmail(selectedEmail);
                }}
                required
              >
                <option value="">-- Choisir un locataire --</option>
                {locataires.map((l) => (
                  <option key={l.id_locataire} value={l.email}>
                    {l.nom} {l.prenoms} ({l.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="d-grid gap-2">
              <button
                type="submit"
                className="btn btn-warning"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer l'invitation de contrat"
                )}
              </button>
              
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/owner/visits")}
              >
                Retour aux demandes
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <small className="text-muted">
              Le locataire recevra une notification avec une proposition de contrat
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviterLocataire;
