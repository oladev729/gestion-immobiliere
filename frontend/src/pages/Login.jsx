import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("locataire"); // locataire ou proprietaire

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

        if (response.data.user.type === "proprietaire" || response.data.user.type_utilisateur === "proprietaire") {
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

  return (
    <div className="login-page-modern">
      <div className="login-container">
        {/* Logo ImmoGest */}
        <h1 className="main-logo-text">ImmoGest</h1>

        {/* Login Card */}
        <div className="login-card">
          
          {/* Role Switch INSIDE the card */}
          <div className="role-switch-container">
            <div className="role-switch">
              <button 
                className={`role-btn ${role === 'locataire' ? 'active' : ''}`}
                onClick={() => setRole('locataire')}
              >
                Locataire
              </button>
              <button 
                className={`role-btn ${role === 'proprietaire' ? 'active' : ''}`}
                onClick={() => setRole('proprietaire')}
              >
                Propriétaire
              </button>
              <div className={`switch-bg ${role === 'proprietaire' ? 'right' : 'left'}`}></div>
            </div>
          </div>

          <div className="card-divider"></div>

          {error && <div className="alert-custom error">{error}</div>}
          
          {confirmationRequired ? (
             <div className="alert-custom warning">
                <p>{message}</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button className="confirm-btn" onClick={() => handleSubmit(null, true)} disabled={loading}>OUI, JE CONFIRME</button>
                  <button className="cancel-btn" onClick={() => setConfirmationRequired(false)}>ANNULER</button>
                </div>
             </div>
          ) : (
            <form onSubmit={(e) => handleSubmit(e, false)} className="login-form">
              <div className="form-group">
                <label>Adresse Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  required
                />
              </div>

              <button type="submit" className="signin-btn" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          )}

          <div className="login-footer">
            <div className="signup-link-container">
              <span>Pas encore de compte ? </span>
              <Link to="/register/role" className="signup-link">Inscrivez-vous</Link>
            </div>
            
            <div className="forgot-link-container">
              <Link to="/forgot-password" title="Réinitialiser" className="forgot-link">Mot de passe oublié ?</Link>
            </div>

            <div className="visitor-shortcut">
              <Link to="/visitor/login" className="visitor-link">Accès Visiteur simple (email/code)</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-page-modern {
          min-height: 100vh;
          background-color: #f1f4f9;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 15px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .login-container {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .main-logo-text {
          font-size: 32px;
          font-weight: 900;
          color: #1a73e8;
          margin-bottom: 0px;
          text-shadow: 0 1px 2px rgba(26, 115, 232, 0.1);
          letter-spacing: -1px;
        }

        /* Card UI */
        .login-card {
          background: #ffffff;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
          width: 100%;
        }

        /* Switch UI INSIDE Card */
        .role-switch-container {
          display: flex;
          justify-content: center;
          margin-bottom: 4px;
        }

        .role-switch {
          position: relative;
          background: #1a73e8;
          padding: 3px;
          border-radius: 999px;
          display: flex;
          width: 230px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        }

        .role-btn {
          position: relative;
          z-index: 2;
          flex: 1;
          background: none;
          border: none;
          padding: 6px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .role-btn.active {
          color: #1a73e8;
        }

        .switch-bg {
          position: absolute;
          top: 3px;
          left: 3px;
          height: calc(100% - 6px);
          width: calc(50% - 3px);
          background: white;
          border-radius: 999px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }

        .switch-bg.right {
          transform: translateX(100%);
        }

        .card-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 16px 0;
        }

        /* Form UI */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          color: #1e293b;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #c2d7ff;
          border-radius: 10px;
          font-size: 14px;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
          background: #f8fbff;
        }

        .form-group input:focus {
          border-color: #1a73e8;
          background: white;
          box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
        }

        .signin-btn {
          margin-top: 6px;
          background: #1a73e8;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .signin-btn:hover {
          background: #1557b0;
          transform: translateY(-1px);
        }

        .signin-btn:active {
          transform: translateY(0);
        }

        .signin-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Footer links */
        .login-footer {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .signup-link-container {
          font-size: 13px;
          color: #475569;
        }

        .signup-link, .forgot-link {
          color: #1a73e8;
          text-decoration: none;
          font-weight: 500;
        }

        .signup-link:hover, .forgot-link:hover {
          text-decoration: underline;
        }

        .forgot-link-container {
          margin-bottom: 2px;
        }

        .visitor-shortcut {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px dashed #e2e8f0;
          width: 100%;
          text-align: center;
        }

        .visitor-link {
          font-size: 11px;
          color: #94a3b8;
          text-decoration: none;
        }

        .visitor-link:hover {
          color: #1a73e8;
        }

        /* Alerts */
        .alert-custom {
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
          text-align: center;
        }
        .alert-custom.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
        .alert-custom.warning { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
        .confirm-btn { background: #059669; color: white; border: none; padding: 5px 14px; border-radius: 6px; font-weight: 600; }
        .cancel-btn { background: #64748b; color: white; border: none; padding: 5px 14px; border-radius: 6px; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default Login;
