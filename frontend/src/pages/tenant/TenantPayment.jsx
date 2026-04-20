import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function TenantPayment() {
  const [contrats, setContrats] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [form, setForm] = useState({
    id_contact: '',
    montant: '',
    type_paiement: 'loyer',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/contrats/mes-contrats-locataire').then(r => setContrats(r.data)).catch(() => {});
    api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
  }, []);

  const handlePayer = async (e) => {
    e.preventDefault();
    if (!form.id_contact || !form.montant) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/paiements/initier', form);
      // Rediriger vers la page de paiement CinetPay
      window.open(res.data.payment_url, '_blank');
      setMessage('Vous avez été redirigé vers la page de paiement CinetPay.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de l\'initiation du paiement.');
    } finally {
      setLoading(false);
    }
  };

  const badgeStatut = (statut) => {
    const colors = {
      'payé': '#28a745',
      'en_attente': '#ffc107',
      'échoué': '#dc3545'
    };
    return (
      <span style={{
        background: colors[statut] || '#6c757d',
        color: '#fff',
        borderRadius: 8,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 600
      }}>
        {statut}
      </span>
    );
  };

  const cardStyle = {
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: 24,
    marginBottom: 24
  };

  const inputStyle = {
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    color: '#111827',
    padding: '10px 14px',
    width: '100%',
    marginBottom: 12
  };

  return (
    <div style={{ padding: 24, color: '#111827' }}>
      <h2 style={{ marginBottom: 24 }}>Effectuer un paiement</h2>

      {/* Formulaire paiement */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: 16 }}>Nouveau paiement</h4>
        <form onSubmit={handlePayer}>
          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Contrat / Bien</label>
          <select
            style={inputStyle}
            value={form.id_contact}
            onChange={e => setForm({ ...form, id_contact: e.target.value })}
            required
          >
            <option value="">-- Sélectionner un contrat --</option>
            {contrats.map(c => (
              <option key={c.id_contact} value={c.id_contact}>
                {c.bien_titre || c.adresse} — {Number(c.loyer_mensuel).toLocaleString('fr-FR')} FCFA/mois
              </option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Type de paiement</label>
          <select
            style={inputStyle}
            value={form.type_paiement}
            onChange={e => setForm({ ...form, type_paiement: e.target.value })}
          >
            <option value="loyer">Loyer mensuel</option>
            <option value="charge">Charges</option>
            <option value="depot_garantie">Dépôt de garantie</option>
          </select>

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Montant (FCFA)</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            placeholder="Ex: 75000"
            value={form.montant}
            onChange={e => setForm({ ...form, montant: e.target.value })}
            required
          />

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Description (optionnel)</label>
          <input
            style={inputStyle}
            type="text"
            placeholder="Ex: Loyer mars 2026"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />

          {message && (
            <div style={{
              background: message.includes('Erreur') ? '#fef2f2' : '#f0fdf4',
              color: message.includes('Erreur') ? '#991b1b' : '#166534',
              borderRadius: 8,
              padding: 10,
              marginBottom: 12,
              border: `1px solid ${message.includes('Erreur') ? '#fecaca' : '#bbf7d0'}`
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'rgba(255,255,255,0.2)' : '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: 15
            }}
          >
            {loading ? 'Chargement...' : 'Payer via CinetPay'}
          </button>
        </form>
      </div>

      {/* Historique paiements */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: 16 }}>Historique de mes paiements</h4>
        {paiements.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Aucun paiement enregistré.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                {['Bien', 'Type', 'Montant', 'Date', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', opacity: 0.7 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paiements.map(p => (
                <tr key={p.id_payment} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '10px 12px' }}>{p.bien_titre}</td>
                  <td style={{ padding: '10px 12px' }}>{p.type_paiement}</td>
                  <td style={{ padding: '10px 12px' }}>{Number(p.montant).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '10px 12px' }}>{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</td>
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
