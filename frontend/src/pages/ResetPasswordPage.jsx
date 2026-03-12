import { useState } from 'react';
import { resetPassword } from '../services/authService';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setMessage('');
    setLoading(true);

    try {
      const data = await resetPassword(token, nouveauMotDePasse);
      setMessage(data.message || "Mot de passe réinitialisé avec succès.");
    } catch (err) {
      console.error(err);
      setErreur("Erreur lors de la réinitialisation (token invalide ou expiré).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Réinitialiser le mot de passe</h1>
        <p>Collez ici le token reçu et choisissez un nouveau mot de passe.</p>

        {erreur && <div className="alert-error">{erreur}</div>}
        {message && <div className="alert-success">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Token de réinitialisation
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              required
              rows={3}
            />
          </label>

          <label>
            Nouveau mot de passe
            <input
              type="password"
              value={nouveauMotDePasse}
              onChange={e => setNouveauMotDePasse(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </form>
      </div>
    </div>
  );
}
