import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const Register = () => {
    const [formData, setFormData] = useState({
        nom: '', prenoms: '', email: '', telephone: '', mot_de_passe: '',
        type_utilisateur: 'locataire', adresse_fiscale: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert("Inscription réussie ! Connectez-vous.");
            navigate('/login');
        } catch (err) { alert(err.response?.data?.message || "Erreur d'inscription"); }
    };

    return (
        <div className="container mt-5 d-flex justify-content-center">
            <div className="card shadow p-4 w-100" style={{ maxWidth: '500px' }}>
                <h2 className="text-center mb-4">Inscription</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Nom" className="form-control mb-3" onChange={e => setFormData({...formData, nom: e.target.value})} required />
                    <input type="text" placeholder="Prénoms" className="form-control mb-3" onChange={e => setFormData({...formData, prenoms: e.target.value})} required />
                    <input type="email" placeholder="Email" className="form-control mb-3" onChange={e => setFormData({...formData, email: e.target.value})} required />
                    <input type="tel" placeholder="Téléphone" className="form-control mb-3" onChange={e => setFormData({...formData, telephone: e.target.value})} required />
                    <input type="password" placeholder="Mot de passe" className="form-control mb-3" onChange={e => setFormData({...formData, mot_de_passe: e.target.value})} required />
                    
                    <select className="form-select mb-3" onChange={e => setFormData({...formData, type_utilisateur: e.target.value})}>
                        <option value="locataire">Locataire</option>
                        <option value="proprietaire">Propriétaire</option>
                    </select>

                    {formData.type_utilisateur === 'proprietaire' && (
                        <input type="text" placeholder="Adresse Fiscale (Ex: Dakar)" className="form-control mb-3" onChange={e => setFormData({...formData, adresse_fiscale: e.target.value})} required />
                    )}

                    <button className="btn btn-success w-100">S'inscrire</button>
                </form>
                <Link to="/login" className="text-center d-block mt-3 small">Déjà un compte ? Connexion</Link>
            </div>
        </div>
    );
};
export default Register;