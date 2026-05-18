import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useLocation } from 'react-router-dom';
import FedaPayWidget from '../../components/FedaPayWidget';

export default function TenantPayment() {
  const location = useLocation();
  const [contrats, setContrats] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [chargeData, setChargeData] = useState(null);
  const [loyersByContrat, setLoyersByContrat] = useState({});
  const [showFedaPay, setShowFedaPay] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [operatorCode, setOperatorCode] = useState('BJMTN');
  const [paymentMode, setPaymentMode] = useState('mobile');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [form, setForm] = useState({
    id_contact: '',
    montant: '',
    type_paiement: 'loyer',
    mois_concerne: '',
    annee: new Date().getFullYear().toString()
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchLoyersForContrats = async (contratsList) => {
    const loyersData = {};
    for (const c of contratsList) {
      try {
        const res = await api.get(`/paiements/contrat/${c.id_contact}/loyers`);
        loyersData[c.id_contact] = res.data;
      } catch (err) {
        console.error('Erreur chargement échéances contrat:', c.id_contact, err);
      }
    }
    setLoyersByContrat(loyersData);
  };

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
    
    api.get('/contrats/mes-contrats-locataire').then(r => {
      setContrats(r.data);
      fetchLoyersForContrats(r.data);
    }).catch(() => {});
    
    api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
  }, [location.state]);

  const handlePayer = async (e) => {
    e.preventDefault();
    if (!form.id_contact || !form.montant) return;
    
    if (!phoneNumber) {
      setMessage('Veuillez renseigner votre numéro de téléphone');
      return;
    }

    // Vérifier si cette échéance de loyer a déjà été payée
    if (form.type_paiement === 'loyer' && form.mois_concerne) {
      const contratLoyers = loyersByContrat[form.id_contact] || [];
      const monthsMap = {
        'janvier': '01',
        'février': '02',
        'mars': '03',
        'avril': '04',
        'mai': '05',
        'juin': '06',
        'juillet': '07',
        'août': '08',
        'septembre': '09',
        'octobre': '10',
        'novembre': '11',
        'décembre': '12'
      };
      const monthNum = monthsMap[form.mois_concerne.toLowerCase()];
      const targetMoisConcerne = `${form.annee}-${monthNum}`;
      
      const existingLoyer = contratLoyers.find(l => l.mois_concerne === targetMoisConcerne);
      if (existingLoyer && existingLoyer.statut === 'paye') {
        setMessage("⚠️ Cette échéance a déjà été payée ! Vous ne pouvez pas la payer à nouveau.");
        return;
      }
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const payload = {
        ...form,
        phoneNumber,
        paymentMode: 'mobile'
      };
      
      console.log('Envoi du payload:', payload);
      
      const res = await api.post('/paiements/fedapay/initier', payload);
      
      if (res.data.success) {
        setMessage('Paiement initié avec succès. Redirection vers FedaPay...');
        if (res.data.paymentUrl) {
          setTimeout(() => {
            window.location.href = res.data.paymentUrl;
          }, 1500);
        } else {
          setTimeout(() => checkFedaPayStatus(res.data.merchantReference, res.data.processingReference), 5000);
        }
      } else {
        setMessage('Erreur lors de l\'initiation du paiement.');
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      setMessage(err.response?.data?.message || 'Erreur lors de l\'initiation du paiement.');
    } finally {
      setLoading(false);
    }
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
        setTimeout(() => checkFedaPayStatus(res.data.merchantReference, res.data.processingReference), 5000);
      } else {
        setMessage('Erreur lors de l\'initiation du paiement.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Erreur lors de l\'initiation du paiement.');
    } finally {
      setLoading(false);
    }
  };

  const checkFedaPayStatus = async (merchantRef, processingRef) => {
    try {
      const res = await api.post('/paiements/fedapay/statut', {
        merchantReference: merchantRef,
        processingReference: processingRef
      });
      
      if (res.data.success && res.data.status === 'SUCCESS') {
        setMessage('Paiement effectué avec succès !');
        // Rafraîchir les paiements et loyers
        api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
        fetchLoyersForContrats(contrats);
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error);
    }
  };

  const handleFedaPaySuccess = (data) => {
    setMessage('Paiement effectué avec succès !');
    setShowFedaPay(false);
    // Rafraîchir les paiements et loyers
    api.get('/paiements/mes-paiements').then(r => setPaiements(r.data)).catch(() => {});
    fetchLoyersForContrats(contrats);
  };

  const handleFedaPayError = (error) => {
    setMessage(`Erreur de paiement: ${error}`);
    setShowFedaPay(false);
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
        Mes Paiements
      </h2>

      {/* Échéances en cours */}
      <div style={cardStyle}>
        <h4 style={{ marginBottom: 16 }}>Échéances en cours</h4>
        {contrats.length === 0 ? (
          <p style={{ opacity: 0.6 }}>Aucun contrat trouvé.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {contrats.map(contrat => {
              const loyers = loyersByContrat[contrat.id_contact] || [];
              return (
                <div key={contrat.id_contact} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 20,
                  background: '#fafafa'
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#111827', fontSize: '16px' }}>{contrat.bien_titre || contrat.adresse}</strong>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: 4 }}>
                      Contrat : {contrat.numero_contrat} — Loyer de base: {Number(contrat.loyer_mensuel).toLocaleString('fr-FR')} FCFA/mois
                    </div>
                  </div>

                  {loyers.length === 0 ? (
                    <div style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                      Aucune échéance générée pour ce contrat.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {loyers.map(loyer => {
                        // Mapper le format de date YYYY-MM en mois lisible en français
                        const [year, month] = loyer.mois_concerne.split('-');
                        const dateObj = new Date(year, parseInt(month) - 1, 1);
                        const nomMois = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                        
                        return (
                          <div key={loyer.id_loyer} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            background: '#ffffff',
                            borderRadius: 8,
                            border: '1px solid #f0f0f0'
                          }}>
                            <div>
                              <div style={{ fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>
                                {nomMois}
                              </div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: 2 }}>
                                Échéance le : {new Date(loyer.date_echeance).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <div style={{ fontWeight: 'bold', color: '#111827' }}>
                                {Number(Number(loyer.montant_loyer) + Number(loyer.montant_charge)).toLocaleString('fr-FR')} FCFA
                              </div>
                              
                              {/* Affichage du badge et du bouton */}
                              {loyer.statut === 'paye' ? (
                                <span style={{
                                  background: '#dcfce7',
                                  color: '#166534',
                                  borderRadius: 8,
                                  padding: '4px 12px',
                                  fontSize: 12,
                                  fontWeight: 600
                                }}>
                                  Payé
                                </span>
                              ) : loyer.statut === 'impaye' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    borderRadius: 8,
                                    padding: '4px 12px',
                                    fontSize: 12,
                                    fontWeight: 600
                                  }}>
                                    Impayé
                                  </span>
                                  <button
                                    onClick={() => {
                                      const rawMoisFr = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
                                      setForm({
                                        id_contact: contrat.id_contact,
                                        montant: Number(loyer.montant_loyer) + Number(loyer.montant_charge),
                                        type_paiement: 'loyer',
                                        mois_concerne: rawMoisFr,
                                        annee: year
                                      });
                                      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    style={{
                                      background: '#dc3545',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    Régler
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    borderRadius: 8,
                                    padding: '4px 12px',
                                    fontSize: 12,
                                    fontWeight: 600
                                  }}>
                                    En attente
                                  </span>
                                  <button
                                    onClick={() => {
                                      const rawMoisFr = dateObj.toLocaleDateString('fr-FR', { month: 'long' });
                                      setForm({
                                        id_contact: contrat.id_contact,
                                        montant: Number(loyer.montant_loyer) + Number(loyer.montant_charge),
                                        type_paiement: 'loyer',
                                        mois_concerne: rawMoisFr,
                                        annee: year
                                      });
                                      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    style={{
                                      background: '#28a745',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: 6,
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    Payer
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Mois concerné</label>
          <select
            style={inputStyle}
            value={form.mois_concerne || ''}
            onChange={e => setForm({ ...form, mois_concerne: e.target.value })}
            required
          >
            <option value="">-- Sélectionner un mois --</option>
            <option value="janvier">Janvier</option>
            <option value="février">Février</option>
            <option value="mars">Mars</option>
            <option value="avril">Avril</option>
            <option value="mai">Mai</option>
            <option value="juin">Juin</option>
            <option value="juillet">Juillet</option>
            <option value="août">Août</option>
            <option value="septembre">Septembre</option>
            <option value="octobre">Octobre</option>
            <option value="novembre">Novembre</option>
            <option value="décembre">Décembre</option>
          </select>

          <label style={{ display: 'block', marginBottom: 4, opacity: 0.8 }}>Année</label>
          <select
            style={inputStyle}
            value={form.annee || new Date().getFullYear().toString()}
            onChange={e => setForm({ ...form, annee: e.target.value })}
            required
          >
            {Array.from({ length: 3 }, (_, i) => {
              const year = new Date().getFullYear() + i - 1;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>

          <label style={{ display: 'block', marginTop: 12, marginBottom: 4, opacity: 0.8 }}>
            Numéro de téléphone
          </label>
          <input
            style={inputStyle}
            type="tel"
            placeholder="Ex: 22964000001"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            required
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



          <button
            type="submit"
            disabled={loading || !form.id_contact || !form.montant || !phoneNumber}
            style={{
              background: loading ? '#6c757d' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 16,
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Redirection en cours...' : `Payer via FedaPay — ${Number(form.montant).toLocaleString('fr-FR')} FCFA`}
          </button>

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
                cursor: 'pointer'
              }}
            >
              Annuler la charge
            </button>
          )}
        </form>
      </div>

      {/* Modal FedaPay Widget */}
      {showFedaPay && (
        <div style={{
          position: 'fixed',
          top: 0,
left: 0,
right: 0,
bottom: 0,
backgroundColor: 'rgba(0,0,0,0.5)',
zIndex: 9999,
display: 'flex',
justifyContent: 'center',
alignItems: 'center',
overflow: 'auto'
}}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
<h5 style={{ margin: 0 }}>Paiement FedaPay</h5>
<button
onClick={() => setShowFedaPay(false)}
style={{
background: 'none',
border: 'none',
borderRadius: '50%',
width: '30px',
height: '30px',
display: 'flex',
justifyContent: 'center',
alignItems: 'center',
cursor: 'pointer',
fontSize: 16
}}
>
×
</button>
</div>
  
<FedaPayWidget
amount={parseFloat(form.montant)}
onSuccess={handleFedaPaySuccess}
onError={handleFedaPayError}
onClose={() => setShowFedaPay(false)}
/>
</div>
)}
</div>
  );
}
