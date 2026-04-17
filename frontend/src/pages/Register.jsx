import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const typeFromStep = location.state?.type_utilisateur || "locataire";

  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    email: "",
    telephone: "",
    mot_de_passe: "",
    adresse_fiscale: "",
  });

  const handleChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, type_utilisateur: typeFromStep };
      await api.post("/auth/register", payload);
      alert("Inscription réussie ! Connectez-vous.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur d'inscription");
    }
  };

  const inputClassName = "form-control input-blue";

  return (
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
              marginBottom: "20px",   // espace ajouté
            }}
          >
            "Vous étant propriétaire devriez inviter vos locataire"
          </p>


          <hr style={{ marginTop: 0, marginBottom: 16 }} />

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Nom
              </label>
              <input
                type="text"
                className={inputClassName}
                placeholder="Nom"
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
                className={inputClassName}
                placeholder="Prénoms"
                value={formData.prenoms}
                onChange={handleChange("prenoms")}
                required
              />
            </div>

            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Email
              </label>
              <input
                type="email"
                className={inputClassName}
                placeholder="exemple@gmail.com"
                value={formData.email}
                onChange={handleChange("email")}
                required
              />
            </div>

            <div className="mb-2">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Téléphone
              </label>
              <input
                type="tel"
                className={inputClassName}
                placeholder="Ex: 0123456789"
                value={formData.telephone}
                onChange={handleChange("telephone")}
                required
              />
            </div>

            <div className="mb-3">
              <label className="small mb-1" style={{ color: "#000000" }}>
                Mot de passe
              </label>
              <input
                type="password"
                className={inputClassName}
                placeholder="••••••••"
                value={formData.mot_de_passe}
                onChange={handleChange("mot_de_passe")}
                required
              />
            </div>

            {typeFromStep === "proprietaire" && (
              <div className="mb-3">
                <label className="small mb-1" style={{ color: "#000000" }}>
                  Adresse fiscale (Ex: XX BP Numéro)
                </label>
                <input
                  type="text"
                  className={inputClassName}
                  placeholder="Adresse fiscale"
                  value={formData.adresse_fiscale}
                  onChange={handleChange("adresse_fiscale")}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              style={{ borderRadius: "999px" }}
            >
              S’inscrire
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
  );
};

export default Register;
