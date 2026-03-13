// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [typeSouhaite, setTypeSouhaite] = useState("");
  const [message, setMessage] = useState("");
  const [confirmationRequise, setConfirmationRequise] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const body = {
        email,
        mot_de_passe: motDePasse,
      };

      if (typeSouhaite) {
        body.type_souhaite = typeSouhaite;
        if (confirmationRequise) {
          body.confirmation = true;
        }
      }

      const { data } = await api.post("/auth/login", body);

      if (data.confirmation_requise) {
        setMessage(data.message);
        setConfirmationRequise(true);
        return;
      }

      login(data.token, data.user);
      navigate("/mes-biens");
    } catch (err) {
      console.error(err);
      setMessage("Erreur de connexion");
    }
  };

  return (
    <div className="login-wrapper d-flex align-items-center">
      <div className="container py-4">
        <div className="login-card">
          <div className="login-title mb-2">Connexion</div>

          {message && (
            <div className="alert alert-info py-2" style={{ fontSize: 14 }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label-navy" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control input-light-blue"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Mot de passe + icône œil */}
            <div className="mb-3">
              <label className="form-label-navy" htmlFor="password">
                Mot de passe
              </label>
              <div className="input-group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control input-light-blue"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                />
                <span
                  className="input-group-text"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </div>
            </div>

            {/* Type souhaité (optionnel) */}
            <div className="mb-4">
              <label className="form-label-navy" htmlFor="typeSouhaite">
                Type d’utilisateur (optionnel)
              </label>
              <select
                id="typeSouhaite"
                className="form-select select-user-type"
                value={typeSouhaite}
                onChange={(e) => setTypeSouhaite(e.target.value)}
              >
                <option value="">Connexion simple</option>
                <option value="proprietaire">Propriétaire</option>
                <option value="locataire">Locataire</option>
              </select>
            </div>

            {/* Bouton */}
            <div className="d-flex justify-content-center">
              <button type="submit" className="btn btn-register-main">
                {confirmationRequise
                  ? "Confirmer et se connecter"
                  : "Se connecter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
