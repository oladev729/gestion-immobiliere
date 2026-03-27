import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const OwnerProperties = () => {
    const [biens, setBiens] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [form, setForm] = useState({
        titre: '', description: '', type_bien: 'appartement',
        loyer_mensuel: '', charge: 0, adresse: '', ville: '',
        code_postal: '', superficie: '', nombre_pieces: '', nombre_chambres: '', meuble: false
    });

    const fetchBiens = () => api.get('/biens/mes-biens').then(res => setBiens(res.data));

    useEffect(() => { fetchBiens(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const res = await api.post('/biens', form);
            const id_bien = res.data.bien.id_bien;

            if (photos.length > 0) {
                const formData = new FormData();
                photos.forEach(photo => formData.append('photos', photo));
                await api.post(`/photos/bien/${id_bien}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setSuccessMsg('Bien créé avec succès !');
            setShowForm(false);
            setPhotos([]);
            setForm({
                titre: '', description: '', type_bien: 'appartement',
                loyer_mensuel: '', charge: 0, adresse: '', ville: '',
                code_postal: '', superficie: '', nombre_pieces: '', nombre_chambres: '', meuble: false
            });
            fetchBiens();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la création du bien');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Supprimer ce bien ?')) {
            try {
                await api.delete(`/biens/${id}`);
                setSuccessMsg('Bien supprimé avec succès !');
                fetchBiens();
            } catch (err) {
                setErrorMsg(err.response?.data?.message || 'Erreur lors de la suppression');
            }
        }
    };

    const toggleStatut = async (id, statut) => {
        try {
            const newStatut = statut === 'disponible' ? 'loue' : 'disponible';
            await api.patch(`/biens/${id}/statut`, { statut: newStatut });
            setSuccessMsg(`Statut mis à jour : ${newStatut}`);
            fetchBiens();
        } catch (err) {
            setErrorMsg('Erreur lors du changement de statut');
        }
    };

    return (
        <div className="container mt-4">

            {/* Alertes */}
            {successMsg && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    ✅ {successMsg}
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    ❌ {errorMsg}
                    <button type="button" className="btn-close" onClick={() => setErrorMsg('')} />
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Mes Biens</h2>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Annuler' : '+ Ajouter un bien'}
                </button>
            </div>

            {showForm && (
                <div className="card p-4 mb-4 shadow-sm">
                    <h5 className="mb-3">Nouveau bien</h5>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <input className="form-control" placeholder="Titre" required
                                    value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} />
                            </div>
                            <div className="col-md-6">
                                <select className="form-select" value={form.type_bien}
                                    onChange={e => setForm({...form, type_bien: e.target.value})}>
                                    <option value="appartement">Appartement</option>
                                    <option value="maison">Maison</option>
                                    <option value="studio">Studio</option>
                                    <option value="bureau">Bureau</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <input className="form-control" placeholder="Loyer mensuel (FCFA)" required type="number"
                                    value={form.loyer_mensuel} onChange={e => setForm({...form, loyer_mensuel: e.target.value})} />
                            </div>
                            <div className="col-md-6">
                                <input className="form-control" placeholder="Charges (FCFA)" type="number"
                                    value={form.charge} onChange={e => setForm({...form, charge: e.target.value})} />
                            </div>
                            <div className="col-md-8">
                                <input className="form-control" placeholder="Adresse" required
                                    value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} />
                            </div>
                            <div className="col-md-4">
                                <input className="form-control" placeholder="Ville" required
                                    value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} />
                            </div>
                            <div className="col-md-4">
                                <input className="form-control" placeholder="Code postal"
                                    value={form.code_postal} onChange={e => setForm({...form, code_postal: e.target.value})} />
                            </div>
                            <div className="col-md-4">
                                <input className="form-control" placeholder="Superficie (m²)" type="number"
                                    value={form.superficie} onChange={e => setForm({...form, superficie: e.target.value})} />
                            </div>
                            <div className="col-md-4">
                                <input className="form-control" placeholder="Nbre pièces" type="number"
                                    value={form.nombre_pieces} onChange={e => setForm({...form, nombre_pieces: e.target.value})} />
                            </div>
                            <div className="col-md-6">
                                <input className="form-control" placeholder="Nbre chambres" type="number"
                                    value={form.nombre_chambres} onChange={e => setForm({...form, nombre_chambres: e.target.value})} />
                            </div>
                            <div className="col-12">
                                <textarea className="form-control" placeholder="Description" rows={2}
                                    value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                            </div>

                            {/* Photos */}
                            <div className="col-12">
                                <label className="form-label">Photos du bien</label>
                                <input className="form-control" type="file" accept="image/*" multiple
                                    onChange={e => setPhotos(Array.from(e.target.files))} />
                                {photos.length > 0 && (
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        {photos.map((photo, i) => (
                                            <img key={i}
                                                src={URL.createObjectURL(photo)}
                                                alt={`preview-${i}`}
                                                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="col-12">
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox"
                                        checked={form.meuble} onChange={e => setForm({...form, meuble: e.target.checked})} />
                                    <label className="form-check-label">Meublé</label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success mt-3">Créer le bien</button>
                    </form>
                </div>
            )}

            <div className="row">
                {biens.map(bien => (
                    <div className="col-md-4 mb-4" key={bien.id_bien}>
                        <div className="card h-100 shadow-sm">
                            {bien.photos?.[0] ? (
                                <img src={`http://localhost:5000${bien.photos[0].url_photobien}`}
                                    className="card-img-top" alt={bien.titre}
                                    style={{ height: 180, objectFit: 'cover' }} />
                            ) : (
                                <div className="bg-secondary d-flex align-items-center justify-content-center"
                                    style={{ height: 180 }}>
                                    <span className="text-white small">Pas de photo</span>
                                </div>
                            )}
                            <div className="card-body">
                                <h5 className="card-title text-primary">{bien.titre}</h5>
                                <p className="text-muted small">{bien.adresse}, {bien.ville}</p>
                                <p className="fw-bold">{Number(bien.loyer_mensuel).toLocaleString()} FCFA/mois</p>
                                <p className="small">
                                    {bien.superficie && `${bien.superficie} m²`}
                                    {bien.nombre_pieces && ` · ${bien.nombre_pieces} pièces`}
                                    {` · ${bien.meuble ? 'Meublé' : 'Non meublé'}`}
                                </p>
                                <span className={`badge ${bien.statut === 'disponible' ? 'bg-success' : 'bg-warning text-dark'} mb-2`}>
                                    {bien.statut}
                                </span>
                            </div>
                            <div className="card-footer d-flex gap-2">
                                <button onClick={() => toggleStatut(bien.id_bien, bien.statut)}
                                    className="btn btn-outline-secondary btn-sm flex-fill">
                                    {bien.statut === 'disponible' ? 'Marquer loué' : 'Rendre disponible'}
                                </button>
                                <button onClick={() => handleDelete(bien.id_bien)}
                                    className="btn btn-outline-danger btn-sm">
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {biens.length === 0 && (
                    <p className="text-muted">Aucun bien enregistré. Cliquez sur "+ Ajouter un bien" pour commencer.</p>
                )}
            </div>
        </div>
    );
};

export default OwnerProperties;
