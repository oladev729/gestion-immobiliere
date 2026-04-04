import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OwnerPayments() {
  const [paiements, setPaiements] = useState([]);
  const [filtre, setFiltre] = useState('tous');

  useEffect(() => {
    api.get('/paiements/recus').then(r => setPaiements(r.data)).catch(() => {});
  }, []);

  const badgeStatut = (statut) => {
    const colors = { 'payé': '#28a745', 'en_attente': '#ffc107', 'échoué': '#dc3545' };
    return (
      <span style={{
        background: colors[statut] || '#6c757d',
        color: '#fff', borderRadius: 8,
        padding: '2px 10px', fontSize: 12, fontWeight: 600
      }}>{statut}</span>
    );
  };

  const filtres = ['tous', 'loyer', 'charge', 'depot_garantie'];
  const paiementsFiltres = filtre === 'tous'
    ? paiements
    : paiements.filter(p => p.type_paiement === filtre);

  const totalRecu = paiements
    .filter(p => p.statut_paiement === 'payé')
    .reduce((acc, p) => acc + Number(p.montant), 0);

  const cardStyle = {
    background: 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.2)',
    padding: 24,
    marginBottom: 24
  };

  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h2 style={{ marginBottom: 24 }}>Paiements reçus</h2>

      {/* Carte total */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: 1, minWidth: 200, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Total reçu</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {totalRecu.toLocaleString('fr-FR')} FCFA
          </div>
        </div>
        <div style={{ ...cardStyle, flex: 1, minWidth: 200, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Paiements en attente</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {paiements.filter(p => p.statut_paiement === 'en_attente').length}
          </div>
        </div>
        <div style={{ ...cardStyle, flex: 1, minWidth: 200, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 6 }}>Paiements confirmés</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>
            {paiements.filter(p => p.statut_paiement === 'payé').length}
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div style={cardStyle}>
        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {filtres.map(f => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              style={{
                background: filtre === f ? '#1a73e8' : 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '6px 16px',
                cursor: 'pointer',
                fontWeight: filtre === f ? 700 : 400
              }}
            >
              {f === 'tous' ? 'Tous' : f === 'depot_garantie' ? 'Dépôt garantie' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {paiementsFiltres.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Aucun paiement trouvé.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                {['Locataire', 'Bien', 'Type', 'Montant', 'Date', 'Description', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', opacity: 0.7, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paiementsFiltres.map(p => (
                <tr key={p.id_payment} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '10px 12px' }}>{p.prenom_locataire} {p.locataire_nom}</td>
                  <td style={{ padding: '10px 12px' }}>{p.bien_titre}</td>
                  <td style={{ padding: '10px 12px' }}>{p.type_paiement}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '10px 12px' }}>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '10px 12px', opacity: 0.8 }}>{p.description || '—'}</td>
                  <td style={{ padding: '10px 12px' }}>{badgeStatut(p.statut_paiement)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}