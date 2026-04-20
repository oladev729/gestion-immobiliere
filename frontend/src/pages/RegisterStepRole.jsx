import { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterStepRole = () => {
  const [role, setRole] = useState("locataire");
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
  if (role === "locataire") {
    setShowInfo(true);
    return;                  
  }

  if (role === "proprietaire") {
    navigate("/register", { state: { type_utilisateur: "proprietaire" } });
    return;
  }

  if (role === "visiteur") {
    navigate("/visitor-request");
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
          
          {/* SI locataire choisi et message à afficher */}
          {showInfo ? (
            <>
              <p style={{ fontWeight: 600, color: "#000000", marginBottom: 24 }}>
                Merci de demander à votre propriétaire de vous inviter.pour cela cliquer sur je suis visiteur .
              </p>

              <button
                className="btn btn-primary w-100 mb-3"
                style={{ borderRadius: "999px" }}
                onClick={() => setShowInfo(false)}
              >
                Retour
              </button>
            </>
          ) : (
            <>
              <p
                style={{
                  fontWeight: 600,
                  color: "#000000",
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

               <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="radio"
                  name="role"
                  id="roleVisiteur"
                  value="visiteur"
                  checked={role === "visiteur"}
                  onChange={() => setRole("visiteur")}
                />
                <label
                  className="form-check-label ms-1"
                  htmlFor="roleVisiteur"
                >
                  Je suis visiteur
                </label>
              </div>

              <button
                className="btn btn-primary w-100 mb-3"
                style={{ borderRadius: "999px" }}
                onClick={handleContinue}
              >
                Continuer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterStepRole;
