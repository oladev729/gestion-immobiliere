import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OwnerPayments() {
  const [paiements, setPaiements] = useState([]);
  const [filtre, setFiltre] = useState('tous');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/paiements/recus')
      .then(r => setPaiements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const badgeStatut = (statut) => {
    const config = {
      'payé': { bg: '#ecfdf5', text: '#065f46', label: 'Payé' },
      'en_attente': { bg: '#fffbeb', text: '#92400e', label: 'En attente' },
      'échoué': { bg: '#fef2f2', text: '#991b1b', label: 'Échoué' }
    };
    const s = config[statut] || { bg: '#f3f4f6', text: '#374151', label: statut };
    return (
      <span style={{
        background: s.bg,
        color: s.text,
        borderRadius: '9999px',
        padding: '2px 10px',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.text, marginRight: '6px' }}></span>
        {s.label}
      </span>
    );
  };

  const filtres = ['tous', 'loyer', 'charge', 'depot_garantie'];
  const paiementsFiltres = filtre === 'tous'
    ? paiements
    : paiements.filter(p => p.type_paiement === filtre);

  const totalRecu = paiements
    .filter(p => p.statut_paiement === 'payé')
    .reduce((acc, p) => acc + Number(p.montant), 0);

  const confirmes = paiements.filter(p => p.statut_paiement === 'payé').length;
  const enAttente = paiements.filter(p => p.statut_paiement === 'en_attente').length;

  if (loading && paiements.length === 0) {
    return (
      <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* EN-TÊTE */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: 0 }}>Paiements reçus</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Consultez et gérez l'historique de vos revenus locatifs.</p>
        </div>

        {/* CARTES STATS */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ 
            flex: 1, minWidth: '280px', backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: '0.75rem' }}>
                <i className="bi bi-wallet2" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Total encaissé</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                  {totalRecu.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            flex: 1, minWidth: '280px', backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '0.75rem', borderRadius: '0.75rem' }}>
                <i className="bi bi-clock-history" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>En attente</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>{enAttente}</div>
              </div>
            </div>
          </div>

          <div style={{ 
            flex: 1, minWidth: '280px', backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.75rem', borderRadius: '0.75rem' }}>
                <i className="bi bi-check2-circle" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Confirmés</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>{confirmes}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          
          {/* BARRE DE FILTRES */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0.75rem', backgroundColor: '#ffffff', flexWrap: 'wrap' }}>
            {filtres.map(f => (
              <button
                key={f}
                onClick={() => setFiltre(f)}
                style={{
                  backgroundColor: filtre === f ? '#2563eb' : '#ffffff',
                  color: filtre === f ? '#ffffff' : '#4b5563',
                  border: filtre === f ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: '9999px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f === 'tous' ? 'Tous' : f === 'depot_garantie' ? 'Dépôt garantie' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* TABLEAU */}
          <div style={{ overflowX: 'auto' }}>
            {paiementsFiltres.length === 0 ? (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#9ca3af' }}>
                <i className="bi bi-wallet-fill" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}></i>
                Aucun paiement trouvé
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '0.875rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Locataire / Bien</th>
                    <th style={{ padding: '0.875rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '0.875rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Montant</th>
                    <th style={{ padding: '0.875rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '0.875rem 1.5rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsFiltres.map(p => (
                    <tr key={p.id_payment} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>{p.prenom_locataire} {p.locataire_nom}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.bien_titre}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#4b5563', textTransform: 'capitalize' }}>
                        {p.type_paiement.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: '700', color: '#111827' }}>
                        {Number(p.montant).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                        {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {badgeStatut(p.statut_paiement)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
