import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile } from '../services/authService';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await getProfile();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        setErreur("Impossible de charger le profil. Veuillez vous reconnecter.");
        // si token invalide, on peut rediriger vers login
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="page"><p>Chargement du profil...</p></div>;
  }

  if (erreur) {
    return <div className="page"><div className="alert-error">{erreur}</div></div>;
  }

  if (!user) {
    return <div className="page"><p>Aucun utilisateur trouvé.</p></div>;
  }

  return (
    <div className="page">
      <div className="profile-card">
        <h1>Mon profil</h1>
        <p><strong>Nom :</strong> {user.nom} {user.prenoms}</p>
        <p><strong>Email :</strong> {user.email}</p>
        <p><strong>Téléphone :</strong> {user.telephone}</p>
        <p><strong>Type d'utilisateur :</strong> {user.type_utilisateur}</p>
        <p><strong>Statut :</strong> {user.statut}</p>
      </div>
    </div>
  );
}
