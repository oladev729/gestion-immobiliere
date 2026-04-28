import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const RegisterStepRole = () => {
  const [role, setRole] = useState("locataire");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Récupérer les données de l'état (bien sélectionné, redirection)
  const stateData = location.state || {};
  const { redirectTo, bienSelectionne } = stateData;

  const handleContinue = () => {
    if (role === "locataire") {
      navigate("/register", { 
        state: { 
          type_utilisateur: "locataire",
          redirectTo: redirectTo || "/tenant/properties",
          bienSelectionne: bienSelectionne
        } 
      });
      return;                   
    }

    if (role === "proprietaire") {
      navigate("/register", { 
        state: { 
          type_utilisateur: "proprietaire",
          redirectTo: redirectTo || "/owner-dashboard"
        } 
      });
      return;
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
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h4 className="logo-immogest">ImmoGest</h4>
          <p style={{ margin: 0 }}>Ouvrir un compte gratuit</p>
          <p className="text-muted small" style={{ margin: 0 }}>Créer de meilleures relations entre propriétaires et locataires !</p>
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
            <h3>Inscription</h3>
            <p
              style={{
                fontWeight: 600,
                color: "#8e7e7e",
                marginBottom: "16px",
              }}
            >
              Qui êtes-vous ?
            </p>

            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="radio"
                name="role"
                id="roleLocataire"
                value="locataire"
                checked={role === "locataire"}
                onChange={() => setRole("locataire")}
              />
              <label
                className="form-check-label ms-1"
                htmlFor="roleLocataire"
              >
                Je suis locataire
              </label>
            </div>

            <div className="form-check mb-4">
              <input
                className="form-check-input"
                type="radio"
                name="role"
                id="roleProprietaire"
                value="proprietaire"
                checked={role === "proprietaire"}
                onChange={() => setRole("proprietaire")}
              />
              <label
                className="form-check-label ms-1"
                htmlFor="roleProprietaire"
              >
                Je suis propriétaire
              </label>
            </div>

            <button
              className="signin-btn w-100 mb-3"
              onClick={handleContinue}
              disabled={loading}
            >
              {loading ? "Chargement..." : "Continuer"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterStepRole;
