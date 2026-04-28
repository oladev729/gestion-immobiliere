import { useState, useEffect } from 'react';
import api from '../../api/axios';

const STATUTS = [
  { value: 'ouvert', label: 'Ouvert', badge: 'danger' },
  { value: 'en_cours', label: 'En cours', badge: 'warning' },
  { value: 'resolu', label: 'Résolu', badge: 'success' },
  { value: 'ferme', label: 'Fermé', badge: 'secondary' },
];

const PRIORITES = {
  haute: 'danger',
  moyenne: 'warning',
  basse: 'success',
  urgente: 'danger',
};

export default function MaintenanceRecues() {
  const [problemes, setProblemes] = useState([]);
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de gestion
  const [problemeSelectionne, setProblemeSelectionne] = useState(null);
  const [formStatut, setFormStatut] = useState('');
  const [formMontant, setFormMontant] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [gestionLoading, setGestionLoading] = useState(false);
  const [gestionSuccess, setGestionSuccess] = useState('');
  const [gestionError, setGestionError] = useState('');

  // Modal photos
  const [photosModal, setPhotosModal] = useState(null);

  useEffect(() => {
    fetchProblemes();
  }, []);

  const fetchProblemes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/problemes/problemes-recus');
      const data = res.data;
      setProblemes(data);

      // Charger les photos pour chaque problème
      const photosMap = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const photosRes = await api.get(`/photos/probleme/${p.id_probleme}`);
            photosMap[p.id_probleme] = photosRes.data;
          } catch {
            photosMap[p.id_probleme] = [];
          }
        })
      );
      setPhotos(photosMap);
    } catch (err) {
      setError('Impossible de charger les signalements.');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModal = (probleme) => {
    setProblemeSelectionne(probleme);
    setFormStatut(probleme.statut_probleme || 'ouvert');
    setFormMontant('');
    setFormDescription('');
    setGestionSuccess('');
    setGestionError('');
  };

  const fermerModal = () => {
    setProblemeSelectionne(null);
    setGestionSuccess('');
    setGestionError('');
  };

  const handleGerer = async (e) => {
    e.preventDefault();
    setGestionLoading(true);
    setGestionSuccess('');
    setGestionError('');

    try {
      const payload = { statut: formStatut };
      if (formMontant && parseFloat(formMontant) > 0) {
        payload.montant_depense = parseFloat(formMontant);
        payload.description_travaux = formDescription || `Réparation : ${problemeSelectionne.titre}`;
      }

      const res = await api.patch(`/problemes/${problemeSelectionne.id_probleme}/gerer`, payload);
      setGestionSuccess(res.data.message);

      // Mettre à jour avec les données retournées par le backend
      if (res.data.probleme) {
        setProblemes((prev) =>
          prev.map((p) =>
            p.id_probleme === problemeSelectionne.id_probleme
              ? { ...p, ...res.data.probleme }
              : p
          )
        );
      } else {
        // Fallback si le backend ne retourne pas le problème mis à jour
        setProblemes((prev) =>
          prev.map((p) =>
            p.id_probleme === problemeSelectionne.id_probleme
              ? { ...p, statut_probleme: formStatut }
              : p
          )
        );
      }

      setTimeout(() => { fermerModal(); }, 1500);
    } catch (err) {
      console.error('Erreur gestion problème:', err);
      const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           'Erreur lors de la gestion du problème.';
      setGestionError(errorMessage);
    } finally {
      setGestionLoading(false);
    }
  };

  const getBadge = (statut) => {
    const found = STATUTS.find((s) => s.value === statut);
    return found ? found.badge : 'secondary';
  };

  const getLabelStatut = (statut) => {
    const found = STATUTS.find((s) => s.value === statut);
    return found ? found.label : statut;
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Signalements reçus</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : problemes.length === 0 ? (
        <div className="alert alert-info">Aucun signalement reçu pour le moment.</div>
      ) : (
        <div className="row g-3">
          {problemes.map((p) => {
            const photosProbleme = photos[p.id_probleme] || [];
            return (
              <div className="col-12" key={p.id_probleme}>
                <div className="card shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-1">{p.titre}</h5>
                        <p className="text-muted small mb-1">
                          Bien : <strong>{p.bien_titre || p.id_bien}</strong>
                        </p>
                        <p className="text-muted small mb-1">
                          Locataire : <strong>{p.locataire_nom || 'N/A'}</strong>
                        </p>
                        {p.categorie && (
                          <p className="text-muted small mb-1">
                            Catégorie : <strong>{p.categorie}</strong>
                          </p>
                        )}
                        <p className="card-text mt-2">{p.description}</p>

                        {/* Miniatures photos */}
                        {photosProbleme.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {photosProbleme.map((photo, idx) => (
                              <img
                                key={idx}
                                src={`http://127.0.0.1:5055${photo.url_photosbp}`}
                                alt={`photo-${idx}`}
                                style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)' }}
                                onClick={() => setPhotosModal(photosProbleme)}
                              />
                            ))}
                            <button
                              className="btn btn-sm btn-outline-secondary align-self-center"
                              onClick={() => setPhotosModal(photosProbleme)}
                            >
                              Voir {photosProbleme.length} photo{photosProbleme.length > 1 ? 's' : ''}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="d-flex flex-column align-items-end gap-2">
                        <span className={`badge bg-${getBadge(p.statut_probleme)} fs-6`}>
                          {getLabelStatut(p.statut_probleme)}
                        </span>
                        {p.priorite && (
                          <span className={`badge bg-${PRIORITES[p.priorite] || 'secondary'}`}>
                            Priorité {p.priorite}
                          </span>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => ouvrirModal(p)}>
                          Gérer
                        </button>
                      </div>
                    </div>

                    {p.date_signalement && (
                      <p className="text-muted small mt-2 mb-0">
                        Signalé le : {new Date(p.date_signalement).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MODAL PHOTOS ===== */}
      {photosModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setPhotosModal(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Photos du problème</h5>
                <button type="button" className="btn-close" onClick={() => setPhotosModal(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  {photosModal.map((photo, idx) => (
                    <div className="col-md-4" key={idx}>
                      <img
                        src={`http://127.0.0.1:5055${photo.url_photosbp}`}
                        alt={`photo-${idx}`}
                        className="img-fluid rounded"
                        style={{ width: '100%', height: 200, objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DE GESTION ===== */}
      {problemeSelectionne && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Gérer : {problemeSelectionne.titre}</h5>
                <button type="button" className="btn-close" onClick={fermerModal} />
              </div>

              <form onSubmit={handleGerer}>
                <div className="modal-body">
                  {gestionSuccess && <div className="alert alert-success">{gestionSuccess}</div>}
                  {gestionError && <div className="alert alert-danger">{gestionError}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Statut du problème</label>
                    <select className="form-select" value={formStatut}
                      onChange={(e) => setFormStatut(e.target.value)} required>
                      {STATUTS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <hr />
                  <p className="text-muted small mb-3">
                    Optionnel : si des travaux ont été effectués, indiquez le montant.
                    Il sera ajouté comme charge au locataire.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Montant des travaux (FCFA)</label>
                    <input type="number" className="form-control" placeholder="Ex: 35000"
                      min="0" step="1" value={formMontant}
                      onChange={(e) => setFormMontant(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description des travaux</label>
                    <textarea className="form-control" rows={3}
                      placeholder="Ex: Remplacement du robinet de la cuisine"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)} />
                  </div>

                  {formMontant && parseFloat(formMontant) > 0 && (
                    <div className="alert alert-warning small">
                      Une charge de <strong>{parseFloat(formMontant).toLocaleString('fr-FR')} FCFA</strong> sera
                      ajoutée au locataire <strong>{problemeSelectionne.locataire_nom || ''}</strong>.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={fermerModal} disabled={gestionLoading}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={gestionLoading}>
                    {gestionLoading ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Enregistrement...</>
                    ) : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
