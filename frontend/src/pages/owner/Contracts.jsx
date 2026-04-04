import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const Contracts = () => {
    const [contrats, setContrats] = useState([]);
    const [biens, setBiens] = useState([]);
    const [locataires, setLocataires] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchLocataire, setSearchLocataire] = useState('');
    const [selectedLocataire, setSelectedLocataire] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [form, setForm] = useState({
        id_locataire: '', id_bien: '', date_debut: '', date_fin: '',
        loyer_mensuel: '', charge: 0, nb_mois_depot_guarantie: 1,
        montant_depot_guarantie_attendu: '', date_signature: ''
    });

    const fetchContrats = () => api.get('/contrats/mes-contrats').then(res => setContrats(res.data));
    const fetchBiens = () => api.get('/biens/mes-biens').then(res => setBiens(res.data));
    const fetchLocataires = () => api.get('/auth/locataires').then(res => setLocataires(res.data)).catch(() => {});

    useEffect(() => { fetchContrats(); fetchBiens(); fetchLocataires(); }, []);

    const handleSelectLocataire = (locataire) => {
        setSelectedLocataire(locataire);
        setForm({ ...form, id_locataire: locataire.id_locataire });
        setSearchLocataire('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        try {
            await api.post('/contrats', form);
            setSuccessMsg('Contrat créé avec succès !');
            setShowForm(false);
            setSelectedLocataire(null);
            setForm({
                id_locataire: '', id_bien: '', date_debut: '', date_fin: '',
                loyer_mensuel: '', charge: 0, nb_mois_depot_guarantie: 1,
                montant_depot_guarantie_attendu: '', date_signature: ''
            });
            fetchContrats();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Erreur lors de la création du contrat');
        }
    };

    const handleTerminer = async (id) => {
        if (window.confirm('Terminer ce contrat ?')) {
            try {
                await api.patch(`/contrats/${id}/terminer`);
                setSuccessMsg('Contrat terminé avec succès !');
                fetchContrats();
            } catch (err) {
                setErrorMsg('Erreur lors de la clôture du contrat');
            }
        }
    };

    const locatairesFiltres = locataires.filter(l =>
        `${l.nom} ${l.prenoms} ${l.email}`.toLowerCase().includes(searchLocataire.toLowerCase())
    );

    return (
        <div className="container mt-4">

            {successMsg && (
                <div className="alert alert-success alert-dismissible fade show">
                    ✅ {successMsg}
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger alert-dismissible fade show">
                    ❌ {errorMsg}
                    <button type="button" className="btn-close" onClick={() => setErrorMsg('')} />
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Contrats</h2>
                <button className="btn btn-primary" onClick={() => {
                    setShowForm(!showForm);
                    setSelectedLocataire(null);
                    setSearchLocataire('');
                }}>
                    {showForm ? 'Annuler' : '+ Nouveau contrat'}
                </button>
            </div>

            {showForm && (
                <div className="card p-4 mb-4 shadow-sm">
                    <h5 className="mb-3">Créer un contrat</h5>
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">

                            {/* Sélection du bien */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Bien</label>
                                <select className="form-select" required value={form.id_bien}
                                    onChange={e => setForm({ ...form, id_bien: e.target.value })}>
                                    <option value="">Sélectionner un bien disponible</option>
                                    {biens.filter(b => b.statut === 'disponible').map(b => (
                                        <option key={b.id_bien} value={b.id_bien}>
                                            {b.titre} — {b.ville} ({Number(b.loyer_mensuel).toLocaleString()} FCFA)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sélection du locataire */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Locataire</label>
                                {selectedLocataire ? (
                                    <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                            style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                                            {selectedLocataire.prenoms?.[0]}{selectedLocataire.nom?.[0]}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold small">{selectedLocataire.prenoms} {selectedLocataire.nom}</div>
                                            <div className="text-muted" style={{ fontSize: 12 }}>{selectedLocataire.email}</div>
                                        </div>
                                        <button type="button" className="btn btn-sm btn-outline-secondary"
                                            onClick={() => { setSelectedLocataire(null); setForm({ ...form, id_locataire: '' }); }}>
                                            Changer
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input className="form-control mb-1"
                                            placeholder="Rechercher par nom ou email..."
                                            value={searchLocataire}
                                            onChange={e => setSearchLocataire(e.target.value)} />
                                        <div className="border rounded" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                            {(searchLocataire ? locatairesFiltres : locataires).length > 0
                                                ? (searchLocataire ? locatairesFiltres : locataires).map(l => (
                                                    <div key={l.id_locataire}
                                                        className="d-flex align-items-center gap-2 p-2 border-bottom"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => handleSelectLocataire(l)}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                                                            style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                                                            {l.prenoms?.[0]}{l.nom?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold small">{l.prenoms} {l.nom}</div>
                                                            <div className="text-muted" style={{ fontSize: 12 }}>{l.email} · {l.telephone}</div>
                                                        </div>
                                                    </div>
                                                ))
                                                : <div className="p-2 text-muted small text-center">Aucun locataire trouvé</div>
                                            }
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Date début</label>
                                <input className="form-control" type="date" required
                                    value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Date fin</label>
                                <input className="form-control" type="date" required
                                    value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Loyer mensuel (FCFA)</label>
                                <input className="form-control" type="number" required
                                    value={form.loyer_mensuel} onChange={e => setForm({ ...form, loyer_mensuel: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Charges (FCFA)</label>
                                <input className="form-control" type="number"
                                    value={form.charge} onChange={e => setForm({ ...form, charge: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">Mois dépôt garantie</label>
                                <input className="form-control" type="number"
                                    value={form.nb_mois_depot_guarantie} onChange={e => setForm({ ...form, nb_mois_depot_guarantie: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Montant dépôt garantie (FCFA)</label>
                                <input className="form-control" type="number"
                                    value={form.montant_depot_guarantie_attendu} onChange={e => setForm({ ...form, montant_depot_guarantie_attendu: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Date signature</label>
                                <input className="form-control" type="date"
                                    value={form.date_signature} onChange={e => setForm({ ...form, date_signature: e.target.value })} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-success mt-3"
                            disabled={!form.id_locataire || !form.id_bien}>
                            Créer le contrat
                        </button>
                    </form>
                </div>
            )}

            <div className="table-responsive">
                <table className="table table-hover bg-white shadow-sm rounded">
                    <thead className="table-dark">
                        <tr>
                            <th>N° Contrat</th>
                            <th>Bien</th>
                            <th>Locataire</th>
                            <th>Loyer</th>
                            <th>Date début</th>
                            <th>Date fin</th>
                            <th>Statut</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contrats.map(c => (
                            <tr key={c.id_contact}>
                                <td><strong>{c.numero_contrat}</strong></td>
                                <td>{c.bien_titre}</td>
                                <td>{c.locataire_prenoms} {c.locataire_nom}</td>
                                <td>{Number(c.loyer_mensuel).toLocaleString()} FCFA</td>
                                <td>{new Date(c.date_debut).toLocaleDateString('fr-FR')}</td>
                                <td>{new Date(c.date_fin).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <span className={`badge ${c.statut_contrat === 'actif' ? 'bg-success' : 'bg-secondary'}`}>
                                        {c.statut_contrat}
                                    </span>
                                </td>
                                <td>
                                    {c.statut_contrat === 'actif' && (
                                        <button onClick={() => handleTerminer(c.id_contact)}
                                            className="btn btn-sm btn-outline-danger">
                                            Terminer
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {contrats.length === 0 && (
                            <tr><td colSpan="8" className="text-center text-muted">Aucun contrat</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Contracts;