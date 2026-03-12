// src/pages/ForgotPasswordPage.jsx
import { useState } from 'react';
import { forgotPassword } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setMessage('');
    setResetToken('');
    setLoading(true);

    try {
      const data = await forgotPassword(email);
      setMessage(data.message || "Email de réinitialisation envoyé.");
      if (data.reset_token_dev) {
        setResetToken(data.reset_token_dev);
      }
    } catch (err) {
      console.error(err);
      setErreur("Erreur lors de la demande de réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Mot de passe oublié</h1>
        <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>

        {erreur && <div className="alert-error">{erreur}</div>}
        {message && <div className="alert-success">{message}</div>}

        {resetToken && (
          <div className="alert-info">
            <strong>Token de réinitialisation (DEV) :</strong>
            <p style={{ wordBreak: 'break-all' }}>{resetToken}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </div>
  );
}
