import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('locataire'); // Par défaut
    
    // Gestion du double compte
    const [confirmationRequired, setConfirmationRequired] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e, isConfirmed = false) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const payload = {
            email: email,
            mot_de_passe: password,
            type_souhaite: role,
            confirmation: isConfirmed // true si l'utilisateur a cliqué sur "OUI"
        };

        try {
            const response = await api.post('/auth/login', payload);

            // Cas Route 3 : Confirmation requise pour double compte
            if (response.data.confirmation_requise) {
                setConfirmationRequired(true);
                setMessage(response.data.message);
            } 
            // Connexion réussie
            else {
                login(response.data.user, response.data.token);
                
                // Redirection selon le type d'utilisateur
                if (response.data.user.type === 'proprietaire') {
                    navigate('/owner-dashboard');
                } else {
                    navigate('/tenant/properties');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de connexion au serveur");
            setConfirmationRequired(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '450px', borderRadius: '15px' }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">ImmoGest</h2>
                    <p className="text-muted">Gérez vos biens en toute simplicité</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {/* UI pour la confirmation du Double Compte */}
                {confirmationRequired ? (
                    <div className="alert alert-warning text-center">
                        <p>{message}</p>
                        <div className="d-flex justify-content-around mt-3">
                            <button 
                                className="btn btn-success" 
                                onClick={() => handleSubmit(null, true)}
                                disabled={loading}
                            >
                                {loading ? 'Chargement...' : 'OUI, je confirme'}
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
                    /* Formulaire de Login Classique */
                    <form onSubmit={(e) => handleSubmit(e, false)}>
                        <div className="mb-3">
                            <label className="form-label">Adresse Email</label>
                            <input 
                                type="email" 
                                className="form-control" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemple@gmail.com"
                                required 
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Mot de passe</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required 
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Se connecter en tant que :</label>
                            <select 
                                className="form-select" 
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
                            disabled={loading}
                        >
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>
                )}

                <div className="text-center mt-4">
                    <p className="small text-muted">
                        Pas encore de compte ? <Link to="/register" className="text-decoration-none">Inscrivez-vous</Link>
                    </p>
                    <Link to="/forgot-password" size="sm" className="text-decoration-none small">Mot de passe oublié ?</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;