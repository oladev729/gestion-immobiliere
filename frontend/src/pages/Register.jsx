import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const typeFromStep = location.state?.type_utilisateur || "locataire";
  const [loading, setLoading] = useState(false);
  
  console.log('Type utilisateur reçu:', typeFromStep, 'Location state:', location.state);

  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    confirmer_mot_de_passe: "",
    adresse_fiscale: "",
  });

  const handleChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de correspondance des mots de passe
    if (formData.mot_de_passe !== formData.confirmer_mot_de_passe) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }
    
    setLoading(true);
    try {
      const payload = { ...formData, type_utilisateur: typeFromStep };
      await api.post("/auth/register", payload);
      alert("Inscription réussie !");
      
      // Récupérer les données de redirection
      const { redirectTo, bienSelectionne } = location.state || {};
      
      // Rediriger vers la page appropriée
      if (typeFromStep === "proprietaire") {
        navigate(redirectTo || "/owner-dashboard");
      } else if (typeFromStep === "locataire") {
        // Si un bien était sélectionné, rediriger vers les propriétés avec le bien
        if (bienSelectionne) {
          navigate("/tenant/properties", { 
            state: { 
              bienSelectionne: bienSelectionne,
              showVisiteForm: true 
            } 
          });
        } else {
          navigate(redirectTo || "/tenant/properties");
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
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
      
      <div
        style={{
          paddingTop: "40px",
          paddingBottom: "40px",
          textAlign: "center",
        }}
      >
      <div className="mb-4">
        <h4 className="logo-immogest">ImmoGest</h4>
        <p className="mb-1">Ouvrir un compte gratuit</p>
        <p className="text-muted small">Créer de meilleures relations entre propriétaires et locataires !</p>
      </div>
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

          <p
            style={{
              fontWeight: 700,
              color: "#000000",
              marginBottom: "8px",
            }}
          >
            {typeFromStep === "proprietaire" 
              ? "Inscription propriétaire" 
              : "Inscription locataire"
            }
          </p>
          
          <p 
            className="text-muted small"
            style={{ marginBottom: "20px" }}
          >
            {typeFromStep === "proprietaire" 
              ? "Gérez vos biens et locataires facilement" 
              : "Trouvez votre logement idéal"
            }
          </p>

          <hr style={{ marginTop: 0, marginBottom: 16 }} />

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Nom"
                value={formData.nom}
                onChange={handleChange("nom")}
                required
              />
            </div>

            <div className="mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Prénoms"
                value={formData.prenoms}
                onChange={handleChange("prenoms")}
                required
              />
            </div>

            <div className="mb-2">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange("email")}
                required
              />
            </div>

            <div className="mb-2">
              <input
                type="tel"
                className="form-control"
                placeholder="Téléphone"
                value={formData.telephone}
                onChange={handleChange("telephone")}
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Mot de passe"
                value={formData.mot_de_passe}
                onChange={handleChange("mot_de_passe")}
                required
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Confirmer mot de passe"
                value={formData.confirmer_mot_de_passe}
                onChange={handleChange("confirmer_mot_de_passe")}
                required
              />
            </div>

            {typeFromStep === "proprietaire" && (
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Adresse fiscale"
                  value={formData.adresse_fiscale}
                  onChange={handleChange("adresse_fiscale")}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="signin-btn w-100 mb-3"
              disabled={loading}
            >
              {loading ? "Inscription..." : "S'inscrire"}
            </button>
          </form>

          <p
            className="text-center small mb-0"
            style={{ color: "#0a0a0a" }}
          >
            vous avez déjà un compte ?{" "}
            <Link
              to="/login"
              className="text-decoration-none"
              style={{ color: "#0d6efd" }}
            >
              connectez vous
            </Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default Register;
