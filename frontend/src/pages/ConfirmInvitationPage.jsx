import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmerInvitation } from '../services/authService';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ConfirmInvitationPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = query.get('token');
    if (t) {
      setToken(t);
    }
  }, [query]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setMessage('');
    setLoading(true);

    try {
      const data = await confirmerInvitation(token, motDePasse, telephone);

      setMessage(data.message || "Invitation confirmée avec succès.");

      // Connexion automatique après confirmation
      localStorage.setItem('token', data.token);
      localStorage.setItem('type_utilisateur', data.user.type_utilisateur);

      // Redirection selon type
      if (data.user.type_utilisateur === 'proprietaire') {
        navigate('/owner/dashboard');
      } else {
        navigate('/tenant/dashboard');
      }
    } catch (err) {
      console.error(err);
      setErreur("Erreur lors de la confirmation (token invalide ou déjà utilisé).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Confirmation d'invitation</h1>
        <p>Complétez vos informations pour activer votre compte invité.</p>

        {erreur && <div className="alert-error">{erreur}</div>}
        {message && <div className="alert-success">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Token d'invitation
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              rows={3}
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={motDePasse}
              onChange={e => setMotDePasse(e.target.value)}
              required
            />
          </label>

          <label>
            Téléphone
            <input
              type="text"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Confirmation..." : "Confirmer l'invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}
