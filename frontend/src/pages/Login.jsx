import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("locataire");

  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e, isConfirmed = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      email,
      mot_de_passe: password,
      type_souhaite: role,
      confirmation: isConfirmed,
    };

    try {
      const response = await api.post("/auth/login", payload);

      if (response.data.confirmation_requise) {
        setConfirmationRequired(true);
        setMessage(response.data.message);
      } else {
        login(response.data.user, response.data.token);

        if (response.data.user.type === "proprietaire") {
          navigate("/owner-dashboard");
        } else {
          navigate("/tenant/properties");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur de connexion au serveur"
      );
      setConfirmationRequired(false);
    } finally {
      setLoading(false);
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
      <span className="navbar-brand logo-immogest">ImmoGest</span>

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
            className="small"
            style={{ color: "#000000", marginBottom: 16 }}
          >
            Accédez à votre compte
          </p>

          <hr style={{ marginTop: 0, marginBottom: 16 }} />

          {error && <div className="alert alert-danger">{error}</div>}

          {confirmationRequired ? (
            <div className="alert alert-warning text-center">
              <p>{message}</p>
              <div className="d-flex justify-content-around mt-3">
                <button
                  className="btn btn-success"
                  onClick={() => handleSubmit(null, true)}
                  disabled={loading}
                >
                  {loading ? "Chargement..." : "OUI, je confirme"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setConfirmationRequired(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="mb-3">
                <label className="form-label" style={{ color: "#000000" }}>
                  Adresse Email
                </label>
                <input
                  type="email"
                  className={inputClassName}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@gmail.com"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ color: "#000000" }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  className={inputClassName}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" style={{ color: "#000000" }}>
                  Se connecter en tant que :
                </label>
                <select
                  className={inputClassName}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="locataire">Locataire</option>
                  <option value="proprietaire">Propriétaire</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-bold"
                style={{ borderRadius: "999px" }}
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <p
              className="small mb-1"
              style={{ color: "#121213" }}
            >
              Pas encore de compte ?{" "}
              <Link
                to="/register/role"
                className="text-decoration-none"
                style={{ color: "#0d6efd" }}
              >
                Inscrivez-vous
              </Link>
            </p>
            <Link
              to="/forgot-password"
              className="text-decoration-none small"
              style={{ color: "#0d6efd" }}
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;