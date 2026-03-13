import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";

const RegisterPage = () => {
  const [userType, setUserType] = useState("locataire");
  const [showPassword, setShowPassword] = useState(false);

  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresseFiscale, setAdresseFiscale] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      // Corps de requête conforme à la doc
      const body = {
        nom,
        prenoms,
        email,
        telephone,
        mot_de_passe: password,
        type_utilisateur: userType,
      };

      // adresse_fiscale requise seulement pour un propriétaire
      if (userType === "proprietaire" && adresseFiscale.trim() !== "") {
        body.adresse_fiscale = adresseFiscale;
      }

      const { data } = await api.post("/auth/register", body);

      // data.message devrait être "Inscription réussie"
      // Si tout est OK, on renvoie vers la page de connexion
      setMessage(data?.message || "Inscription réussie, redirection...");
      navigate("/login");
    } catch (err) {
      console.error(err);

      // Essayer de récupérer un message d’erreur renvoyé par le backend
      const backendMessage =
        err?.response?.data?.message || "Erreur lors de l'inscription";

      setMessage(backendMessage);
    }
  };

  return (
    <div className="register-wrapper d-flex flex-column">
      {/* Bandeau informatif */}
      <div className="register-banner w-100">
        <div className="container py-2 text-center">
          Veuillez entrer vos informations pour créer votre compte.
        </div>
      </div>

      {/* Contenu centré verticalement */}
      <div className="flex-grow-1 d-flex align-items-center">
        <div className="container py-4">
          {message && (
            <div className="alert alert-info py-2 mb-3" style={{ fontSize: 14 }}>
              {message}
            </div>
          )}

          {/* Carte formulaire */}
          <div className="register-card">
            <form onSubmit={handleSubmit}>
              {/* Nom */}
              <div className="mb-3">
                <label className="form-label-navy" htmlFor="nom">
                  Nom
                </label>
                <input
                  id="nom"
                  type="text"
                  className="form-control input-light-blue"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                />
              </div>

              {/* Prénoms */}
              <div className="mb-3">
                <label className="form-label-navy" htmlFor="prenoms">
                  Prénoms
                </label>
                <input
                  id="prenoms"
                  type="text"
                  className="form-control input-light-blue"
                  value={prenoms}
                  onChange={(e) => setPrenoms(e.target.value)}
                  required
                />
              </div>

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

              {/* Téléphone */}
              <div className="mb-3">
                <label className="form-label-navy" htmlFor="telephone">
                  Téléphone
                </label>
                <input
                  id="telephone"
                  type="tel"
                  className="form-control input-light-blue"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  required
                />
              </div>

              {/* Adresse fiscale (propriétaire uniquement) */}
              {userType === "proprietaire" && (
                <div className="mb-3">
                  <label className="form-label-navy" htmlFor="adresseFiscale">
                    Adresse fiscale
                  </label>
                  <input
                    id="adresseFiscale"
                    type="text"
                    className="form-control input-light-blue"
                    value={adresseFiscale}
                    onChange={(e) => setAdresseFiscale(e.target.value)}
                    placeholder="Ex : Dakar, Sénégal"
                    required
                  />
                </div>
              )}

              {/* Mot de passe */}
              <div className="mb-3">
                <label className="form-label-navy" htmlFor="password">
                  Mot de passe
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="form-control input-light-blue"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-group-text"
                    style={{ cursor: "pointer" }}
                    onClick={toggleShowPassword}
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </span>
                </div>
              </div>

              {/* Confirmation mot de passe */}
              <div className="mb-3">
                <label className="form-label-navy" htmlFor="confirmPassword">
                  Confirmer mot de passe
                </label>
                <div className="input-group">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="form-control input-light-blue"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                
                </div>
              </div>

              {/* Sélecteur type d'utilisateur */}
              <div className="mb-4">
                <label className="form-label-navy" htmlFor="userType">
                  Type d’utilisateur
                </label>
                <select
                  id="userType"
                  className="form-select select-user-type"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  required
                >
                  <option value="proprietaire">Propriétaire</option>
                  <option value="locataire">Locataire</option>
                </select>
              </div>

              {/* Bouton centré */}
              <div className="d-flex justify-content-center">
                <button type="submit" className="btn btn-register-main">
                  S’inscrire
                </button>
              </div>
            </form>
          </div>

          {/* Lien déjà un compte */}
          <div className="text-center mt-3 register-footer-text">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="text-decoration-none">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
