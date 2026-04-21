import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useSearch } from '../../context/SearchContext.jsx';

const OwnerProperties = () => {
    const { searchTerm } = useSearch();
    const [biens, setBiens] = useState([]);
    const [formStep, setFormStep] = useState(0); // 0: List, 1: Step 1, 2: Step 2
    const [photoPrincipale, setPhotoPrincipale] = useState(null);
    const [photosDetails, setPhotosDetails] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBienId, setCurrentBienId] = useState(null);

    const [form, setForm] = useState({
        titre: '',
        description: '',
        type_bien: 'appartement',
        loyer_mensuel: '',
        charge: '',
        adresse: '',
        ville: '',
        code_postal: '',
        superficie: '',
        nombre_pieces: '',
        nombre_chambres: '',
        meuble: false
    });

    const fetchBiens = async () => {
        setLoading(true);
        try {
            const res = await api.get('/biens/mes-biens');
            setBiens(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBiens(); }, []);

    const biensFiltres = biens.filter(b => 
        b.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.adresse.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreateForm = () => {
        setIsEditing(false);
        setCurrentBienId(null);
        setForm({
            titre: '', description: '', type_bien: 'appartement',
            loyer_mensuel: '', adresse: '', ville: '',
            code_postal: '', superficie: '', nombre_pieces: '', meuble: false
        });
        setFormStep(1);
    };

    const handleEdit = (bien) => {
        setIsEditing(true);
        setCurrentBienId(bien.id_bien);
        setForm({
            titre: bien.titre || '',
            description: bien.description || '',
            type_bien: bien.type_bien || 'appartement',
            loyer_mensuel: bien.loyer_mensuel || '',
            adresse: bien.adresse || '',
            ville: bien.ville || '',
            code_postal: bien.code_postal || '',
            superficie: bien.superficie || '',
            nombre_pieces: bien.nombre_pieces || '',
            meuble: bien.meuble || false
        });
        setFormStep(1);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setLoading(true);

        try {
            let res;
            if (isEditing) {
                res = await api.put(`/biens/${currentBienId}`, form);
            } else {
                res = await api.post('/biens', form);
            }
            
            const id_bien = isEditing ? currentBienId : res.data.bien.id_bien;

            if (photoPrincipale || photosDetails.length > 0) {
                const formData = new FormData();
                if (photoPrincipale) formData.append('principale', photoPrincipale);
                photosDetails.forEach(photo => formData.append('details', photo));

                await api.post(`/photos/bien/${id_bien}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setSuccessMsg(isEditing ? 'Bien mis à jour avec succès !' : 'Bien créé avec succès !');
            setFormStep(0);
            setPhotoPrincipale(null);
            setPhotosDetails([]);
            fetchBiens();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de l\'enregistrement du bien');
        } finally {
            setLoading(false);
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

    const ProgressBar = () => (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: formStep >= 1 ? '#2563eb' : '#9ca3af' }}>1. Informations générales</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: formStep >= 2 ? '#2563eb' : '#9ca3af' }}>2. Emplacement & Détails</span>
            </div>
            <div style={{ height: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s ease',
                    width: formStep === 1 ? '50%' : formStep === 2 ? '100%' : '0%'
                }} />
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '0.75rem' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

                {successMsg && (
                    <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #a7f3d0' }}>
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #fecaca' }}>
                        {errorMsg}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                            {formStep === 0 ? 'Mes Biens' : isEditing ? 'Modifier le bien' : 'Ajouter un nouveau bien'}
                        </h1>
                        <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.75rem' }}>Gérez vos biens immobilier en toute simplicité.</p>
                    </div>
                    {formStep === 0 && (
                        <button
                            onClick={openCreateForm}
                            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)', textDecoration: 'none' }}
                        >
                            Ajouter un bien
                        </button>
                    )}
                </div>

                {formStep > 0 && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
                            <ProgressBar />

                            {formStep === 1 && (
                                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>Informations générales</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Titre de l'annonce</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                                placeholder="ex: Bel appartement F3 au centre ville" required
                                                value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Type de bien</label>
                                            <select style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                                value={form.type_bien} onChange={e => setForm({ ...form, type_bien: e.target.value })}>
                                                <option value="appartement">Appartement</option>
                                                <option value="maison">Maison</option>
                                                <option value="studio">Studio</option>
                                                <option value="bureau">Bureau</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Loyer mensuel (FCFA)</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} type="number"
                                                placeholder="ex: 150000" required min="0"
                                                value={form.loyer_mensuel} onChange={e => setForm({ ...form, loyer_mensuel: e.target.value })} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Description</label>
                                            <textarea style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} rows={3}
                                                placeholder="Décrivez les atouts de votre bien..."
                                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1e293b' }}>
                                                Photo de couverture {isEditing && "(Laissez vide pour conserver l'actuelle)"}
                                            </label>
                                            <input 
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', marginBottom: '1rem' }} 
                                                type="file" accept="image/*"
                                                onChange={e => setPhotoPrincipale(e.target.files[0])} 
                                            />
                                            {photoPrincipale && (
                                                <div style={{ marginBottom: '1.5rem' }}>
                                                    <img src={URL.createObjectURL(photoPrincipale)} alt="preview principale" style={{ width: '120px', height: '80px', borderRadius: '0.5rem', objectFit: 'cover', border: '2px solid #2563eb' }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={form.meuble} onChange={e => setForm({ ...form, meuble: e.target.checked })} style={{ width: '1.2rem', height: '1.2rem' }} />
                                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Ce bien est meublé</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                        <button onClick={() => setFormStep(0)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                                        <button onClick={() => setFormStep(2)} style={{ padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Suivant</button>
                                    </div>
                                </div>
                            )}

                            {formStep === 2 && (
                                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>Emplacement & Détails techniques</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Adresse complète</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                                placeholder="Numéro et nom de rue" required
                                                value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Ville</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                                placeholder="ex: Abidjan" required
                                                value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Code postal</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                                                type="number" min="0" placeholder="ex: 00225"
                                                value={form.code_postal} onChange={e => setForm({ ...form, code_postal: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Superficie (m²)</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} type="number"
                                                placeholder="ex: 85" min="0"
                                                value={form.superficie} onChange={e => setForm({ ...form, superficie: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Nombre de pièces</label>
                                            <input style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} type="number"
                                                placeholder="ex: 3" min="0"
                                                value={form.nombre_pieces} onChange={e => setForm({ ...form, nombre_pieces: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                        <button onClick={() => setFormStep(1)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600', cursor: 'pointer' }}>Retour</button>
                                        <button onClick={handleSubmit} disabled={loading} style={{ padding: '0.75rem 2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#059669', color: '#fff', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                                            {loading ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le bien'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {formStep === 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {biensFiltres.map(bien => (
                            <div key={bien.id_bien} style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
                                <div style={{ position: 'relative', height: '140px' }}>
                                    {bien.photos?.[0] ? (
                                        <img src={`http://127.0.0.1:5055${bien.photos[0].url_photobien}`} alt={bien.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>Pas de photo</div>
                                    )}
                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                                        <span style={{
                                            backgroundColor: bien.statut === 'disponible' ? '#ecfdf5' : '#fff7ed',
                                            color: bien.statut === 'disponible' ? '#065f46' : '#9a3412',
                                            padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase'
                                        }}>
                                            {bien.statut}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>{bien.titre}</h3>
                                    <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                        <i className="bi bi-geo-alt" style={{ marginRight: '0.25rem' }}></i>
                                        {bien.adresse}, {bien.ville}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#2563eb' }}>{Number(bien.loyer_mensuel).toLocaleString()} FCFA <span style={{ fontSize: '0.7rem', fontWeight: '500', color: '#6b7280' }}>/mois</span></span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#4b5563', padding: '0.5rem 0', borderTop: '1px solid #f1f5f9' }}>
                                        <span><i className="bi bi-arrows-fullscreen"></i> {bien.superficie} m²</span>
                                        <span><i className="bi bi-door-open"></i> {bien.nombre_pieces} p.</span>
                                    </div>
                                </div>
                                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.4rem' }}>
                                    <button 
                                        onClick={() => handleEdit(bien)}
                                        style={{ flex: 1, padding: '0.35rem', borderRadius: '0.4rem', border: '1px solid #dbeafe', backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', textDecoration: 'none' }}
                                    >
                                        Modifier
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(bien.id_bien)} 
                                        style={{ padding: '0.35rem 0.6rem', borderRadius: '0.4rem', border: '1px solid #fee2e2', backgroundColor: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600', textDecoration: 'none' }}
                                        title="Supprimer"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                        {biensFiltres.length === 0 && !loading && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                                <i className="bi bi-house-add" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
                                {searchTerm ? 'Aucun bien ne correspond à votre recherche.' : 'Aucun bien enregistré.'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default OwnerProperties;
