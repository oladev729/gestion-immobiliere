import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const ReportIssue = () => {
    const { user } = useContext(AuthContext);
    const [contrats, setContrats] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [data, setData] = useState({
        id_bien: '',
        titre: '',
        description: '',
        categorie: 'plomberie',
        priorite: 'moyenne'
    });

    useEffect(() => {
        api.get('/contrats/mes-contrats-locataire')
            .then(res => setContrats(res.data))
            .catch(() => {});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);
        try {
            // 1. Créer le signalement
            const res = await api.post('/problemes', data);
            const id_probleme = res.data.probleme?.id_probleme;

            // 2. Upload des photos si présentes
            if (photos.length > 0 && id_probleme) {
                const formData = new FormData();
                photos.forEach(photo => formData.append('photos', photo));
                try {
                    await api.post(`/photos/probleme/${id_probleme}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } catch {
                    // Photos non uploadées mais signalement créé
                }
            }

            setSuccessMsg('Signalement envoyé avec succès !');
            setData({ id_bien: '', titre: '', description: '', categorie: 'plomberie', priorite: 'moyenne' });
            setPhotos([]);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Erreur lors de l'envoi du signalement");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                <h3 className="mb-4">Signaler un problème</h3>

                {successMsg && (
                    <div className="alert alert-success alert-dismissible fade show">
                        {successMsg}
                        <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
                    </div>
                )}
                {errorMsg && (
                    <div className="alert alert-danger alert-dismissible fade show">
                        {errorMsg}
                        <button type="button" className="btn-close" onClick={() => setErrorMsg('')} />
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Bien concerné */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Bien concerné</label>
                        <select className="form-select" required value={data.id_bien}
                            onChange={e => setData({ ...data, id_bien: e.target.value })}>
                            <option value="">Sélectionner votre logement</option>
                            {contrats.filter(c => c.statut_contrat === 'actif').map(c => (
                                <option key={c.id_bien} value={c.id_bien}>
                                    {c.bien_titre} — {c.bien_ville || ''}
                                </option>
                            ))}
                        </select>
                        {contrats.length === 0 && (
                            <small className="text-muted">Aucun contrat actif trouvé.</small>
                        )}
                    </div>

                    {/* Titre */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Titre du problème</label>
                        <input type="text" className="form-control"
                            placeholder="Ex: Fuite d'eau dans la salle de bain"
                            value={data.titre}
                            onChange={e => setData({ ...data, titre: e.target.value })}
                            required />
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Description</label>
                        <textarea className="form-control" rows={4}
                            placeholder="Décrivez le problème en détail..."
                            value={data.description}
                            onChange={e => setData({ ...data, description: e.target.value })}
                            required />
                    </div>

                    {/* Catégorie */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Catégorie</label>
                        <select className="form-select" value={data.categorie}
                            onChange={e => setData({ ...data, categorie: e.target.value })}>
                            <option value="plomberie">Plomberie</option>
                            <option value="electricite">Électricité</option>
                            <option value="chauffage">Chauffage</option>
                            <option value="serrurerie">Serrurerie</option>
                            <option value="toiture">Toiture</option>
                            <option value="autre">Autre</option>
                        </select>
                    </div>

                    {/* Priorité */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Priorité</label>
                        <div className="d-flex gap-3 flex-wrap">
                            {['basse', 'moyenne', 'haute', 'urgente'].map(p => (
                                <div key={p} className="form-check">
                                    <input className="form-check-input" type="radio"
                                        name="priorite" value={p}
                                        checked={data.priorite === p}
                                        onChange={e => setData({ ...data, priorite: e.target.value })} />
                                    <label className={`form-check-label ${
                                        p === 'urgente' ? 'text-danger fw-bold' :
                                        p === 'haute' ? 'text-warning' : ''
                                    }`}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="mb-4">
                        <label className="form-label fw-bold">Photos du problème (optionnel)</label>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            multiple
                            onChange={e => setPhotos(Array.from(e.target.files))}
                        />
                        {photos.length > 0 && (
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {photos.map((photo, i) => (
                                    <div key={i} className="position-relative">
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt={`preview-${i}`}
                                            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        <small className="text-muted">Vous pouvez joindre plusieurs photos pour illustrer le problème.</small>
                    </div>

                    <button className="btn btn-danger w-100 py-2" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Envoi en cours...
                            </>
                        ) : 'Envoyer le signalement'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
