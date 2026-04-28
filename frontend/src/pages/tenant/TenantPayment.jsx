import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLocation } from 'react-router-dom';
import CaurisPayWidget from '../../components/CaurisPayWidget';

export default function TenantPayment() {
  const location = useLocation();
  const [contrats, setContrats] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [chargeData, setChargeData] = useState(null);
  const [showCaurisPay, setShowCaurisPay] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operatorCode, setOperatorCode] = useState('BJMTN');
  const [form, setForm] = useState({
    id_contact: '',
    montant: '',
    type_paiement: 'loyer',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Vérifier si des données de charge ont été passées
    const chargeFromStorage = sessionStorage.getItem('chargeToPay');
    const chargeFromState = location.state?.chargeData;
    
    if (chargeFromStorage || chargeFromState) {
      const charge = chargeFromState || JSON.parse(chargeFromStorage);
      setChargeData(charge);
      setForm({
        id_contact: '', // Sera rempli automatiquement pour les charges
        montant: charge.montant,
        type_paiement: 'charge',
        description: charge.description || `Charge pour ${charge.bien_titre}`
      });
    }
    
    api.get('/contrats/mes-contrats-locataire').then(r => setContrats(r.data)).catch(() => {});
    api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
  }, [location.state]);

  const handlePayer = async (e) => {
    e.preventDefault();
    if (!form.id_contact || !form.montant) return;
    
    handlePayerCaurisPay();
  };

  const handlePayerCaurisPay = async () => {
    if (!phoneNumber) {
      setMessage('Veuillez renseigner votre numéro de téléphone');
      return;
    }
    
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        phoneNumber,
        operatorCode
      };
      
      const res = await api.post('/paiements/caurispay/initier', payload);
      
      if (res.data.success) {
        setMessage('Paiement initié avec succès. Veuillez compléter le paiement sur votre téléphone.');
        // Optionnellement, vérifier le statut après quelques secondes
        setTimeout(() => checkCaurisPayStatus(res.data.merchantReference, res.data.processingReference), 5000);
      } else {
        setMessage('Erreur lors de l\'initiation du paiement.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de l\'initiation du paiement.');
    } finally {
      setLoading(false);
    }
  };

  const checkCaurisPayStatus = async (merchantRef, processingRef) => {
    try {
      const res = await api.post('/paiements/caurispay/statut', {
        merchantReference: merchantRef,
        processingReference: processingRef
      });
      
      if (res.data.success && res.data.status === 'SUCCESS') {
        setMessage('Paiement effectué avec succès !');
        // Rafraîchir les paiements
        api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    }
  };

  const handleCaurisPaySuccess = (data) => {
    setMessage('Paiement effectué avec succès !');
    setShowCaurisPay(false);
    // Rafraîchir les paiements
    api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
  };

  const handleCaurisPayError = (error) => {
    setMessage(`Erreur de paiement: ${error}`);
    setShowCaurisPay(false);
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
      <h2 style={{ marginBottom: 24 }}>
        {chargeData ? 'Payer une charge avec CaurisPay' : 'Effectuer un paiement avec CaurisPay'}
      </h2>

      {/* Affichage des informations de la charge si présentes */}
      {chargeData && (
        <div style={{
          ...cardStyle,
          background: '#f0f9ff',
          borderColor: '#0ea5e9',
          marginBottom: 16
        }}>
          <h4 style={{ marginBottom: 12, color: '#0c4a6e' }}>Détails de la charge</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <strong>Numéro:</strong> {chargeData.numero_transaction}
            </div>
            <div>
              <strong>Montant:</strong> {Number(chargeData.montant).toLocaleString('fr-FR')} FCFA
            </div>
            <div>
              <strong>Bien:</strong> {chargeData.bien_titre}
            </div>
            <div>
              <strong>Type:</strong> Charge
            </div>
          </div>
        </div>
      )}

      {/* Formulaire paiement */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: 16 }}>Nouveau paiement</h4>
        <form onSubmit={handlePayer}>
          {!chargeData && (
            <>
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
            </>
          )}

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Type de paiement</label>
          <select
            style={inputStyle}
            value={form.type_paiement}
            onChange={e => setForm({ ...form, type_paiement: e.target.value })}
            disabled={chargeData !== null} // Désactiver si c'est une charge
          >
            <option value="loyer">Loyer mensuel</option>
            <option value="depot_garantie">Dépôt de garantie</option>
            <option value="charge">Charges</option>
          </select>

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Montant (FCFA)</label>
          <input
            style={inputStyle}
            type="number"
            min="1"
            placeholder="Ex: 75000"
            value={form.montant}
            onChange={e => setForm({ ...form, montant: e.target.value })}
            disabled={chargeData !== null}
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
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: message.includes('redirection') || message.includes('succès') ? '#dcfce7' : '#fef3c7',
              border: `1px solid ${message.includes('redirection') || message.includes('succès') ? '#16a34a' : '#f59e0b'}`,
              color: message.includes('redirection') || message.includes('succès') ? '#166534' : '#92400e'
            }}>
              {message}
            </div>
          )}

          {/* Champs CaurisPay */}
          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>
            Numéro de téléphone
          </label>
          <input
            style={inputStyle}
            type="tel"
            placeholder="Ex: 2290197000000"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
          />

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>
            Opérateur Mobile Money
          </label>
          <select
            style={inputStyle}
            value={operatorCode}
            onChange={e => setOperatorCode(e.target.value)}
          >
            <option value="BJMTN">MTN Bénin</option>
            <option value="BJMOOV">MOOV Bénin</option>
            <option value="BJCELTIIS">CELTIIS</option>
          </select>

          {chargeData && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('chargeToPay');
                setChargeData(null);
                setForm({
                  id_contact: '',
                  montant: '',
                  type_paiement: 'loyer',
                  description: ''
                });
              }}
              style={{
                marginTop: 16,
                padding: '10px 16px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Retour aux paiements standards
            </button>
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
            {loading ? 'Chargement...' : 'Payer via CaurisPay'}
          </button>
        </form>
      </div>

      {/* Widget CaurisPay alternatif */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: 16 }}>Payer directement avec CaurisPay</h4>
        <button
          onClick={() => setShowCaurisPay(true)}
          style={{
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 28px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 15,
            width: '100%'
          }}
        >
          <i className="fas fa-mobile-alt me-2"></i>
          Ouvrir le widget de paiement
        </button>
      </div>

      {/* Modal CaurisPay Widget */}
      {showCaurisPay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h5 style={{ margin: 0 }}>Paiement CaurisPay</h5>
              <button
                onClick={() => setShowCaurisPay(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <CaurisPayWidget
              amount={parseFloat(form.montant)}
              onSuccess={handleCaurisPaySuccess}
              onError={handleCaurisPayError}
              onClose={() => setShowCaurisPay(false)}
            />
          </div>
        </div>
      )}

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
