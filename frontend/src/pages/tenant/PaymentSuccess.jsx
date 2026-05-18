import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [countdown, setCountdown] = useState(6);
  const [errorMsg, setErrorMsg] = useState('');

  const transactionId = searchParams.get('id');
  const transactionStatus = searchParams.get('status');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!transactionId) {
        setStatus('failed');
        setErrorMsg('Aucune référence de transaction trouvée.');
        return;
      }

      try {
        console.log('🔍 Vérification du statut de la transaction FedaPay:', transactionId);
        const res = await api.post('/paiements/fedapay/statut', {
          processingReference: transactionId
        });

        if (res.data.success && (res.data.status === 'approved' || res.data.status === 'captured')) {
          setStatus('success');
        } else {
          setStatus('failed');
          setErrorMsg(res.data.message || 'Le paiement n\'a pas pu être validé.');
        }
      } catch (err) {
        console.error('Erreur lors de la validation du paiement:', err);
        setStatus('failed');
        setErrorMsg(err.response?.data?.message || 'Erreur lors de la validation du paiement.');
      }
    };

    verifyPayment();
  }, [transactionId]);

  useEffect(() => {
    if (status === 'success' || status === 'failed') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/tenant/payment');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div style={glassCardStyle}>
        {status === 'verifying' && (
          <>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Loader2 size={70} className="animate-spin" style={{ color: '#10b981' }} />
            </div>
            <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Validation du paiement...
            </h3>
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Veuillez patienter un instant pendant que nous sécurisons et confirmons votre transaction auprès de FedaPay.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ 
              background: '#d1fae5', 
              borderRadius: '50%', 
              padding: '16px', 
              display: 'inline-flex',
              animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <CheckCircle2 size={56} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, color: '#065f46', margin: '0 0 8px 0', fontSize: '28px' }}>
                Paiement Réussi !
              </h2>
              <p style={{ color: '#047857', fontSize: '16px', fontWeight: 500, margin: 0 }}>
                Votre loyer/charge a été réglé avec succès.
              </p>
            </div>
            <div style={{
              background: '#f0fdf4',
              borderRadius: '16px',
              padding: '16px',
              width: '100%',
              border: '1px solid #a7f3d0',
              textAlign: 'left',
              fontSize: '14px',
              color: '#065f46',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div><strong>Référence :</strong> {transactionId}</div>
              <div><strong>Statut :</strong> Approuvé par FedaPay</div>
              <div><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button
              onClick={() => navigate('/tenant/payment')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              Retourner à mes paiements <ArrowRight size={18} />
            </button>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Redirection automatique dans <strong style={{ color: '#10b981' }}>{countdown}</strong> secondes...
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div style={{ 
              background: '#fee2e2', 
              borderRadius: '50%', 
              padding: '16px', 
              display: 'inline-flex',
              animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <AlertTriangle size={56} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h2 style={{ fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0', fontSize: '26px' }}>
                Échec du Paiement
              </h2>
              <p style={{ color: '#b91c1c', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                {errorMsg || 'La transaction n\'a pas pu être validée.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/tenant/payment')}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              Réessayer le paiement <ArrowRight size={18} />
            </button>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Redirection vers la page de paiement dans <strong style={{ color: '#ef4444' }}>{countdown}</strong> secondes...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
