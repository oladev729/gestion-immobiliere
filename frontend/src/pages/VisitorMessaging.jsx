import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const VisitorMessaging = () => {
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get('demandeId');
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (demandeId) {
      fetchVisitorMessages();
    } else {
      setMessages([]);
      setVisitorInfo(null);
      setLoading(false);
    }
  }, [demandeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchVisitorMessages = async () => {
    try {
      const response = await api.get(`/visiteurs/messages/${demandeId}`);
      setMessages(response.data.messages || []);
      setVisitorInfo(response.data.visitorInfo);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await api.post(`/visiteurs/messages/${demandeId}`, {
        contenu: newMessage,
        expediteur_type: 'visiteur'
      });
      setMessages(prev => [...prev, response.data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      maxWidth: '750px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      overflow: 'hidden'
    }}>

      {/* ── En-tête contact ── */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #e5e7eb',
        background: 'white'
      }}>
        {visitorInfo ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#e5e7eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0
            }}>
              👤
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>
                {visitorInfo.proprietaire_prenoms} {visitorInfo.proprietaire_nom}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: '1.3' }}>
                {visitorInfo.proprietaire_email}
              </div>
              {visitorInfo.bien_titre && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  🏠 {visitorInfo.bien_titre}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: '#e5e7eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.25rem'
            }}>💬</div>
            <div style={{ fontWeight: '700', color: '#111827' }}>Messagerie</div>
          </div>
        )}
      </div>

      {/* ── Zone des messages ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: '#f9fafb'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#9ca3af', margin: 'auto',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
            <p>Aucun message pour le moment.<br />Envoyez votre premier message !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isVisitor = message.expediteur_type === 'visiteur';
            return (
              <div
                key={message.id_message}
                style={{
                  display: 'flex',
                  justifyContent: isVisitor ? 'flex-end' : 'flex-start'
                }}
              >


                <div style={{
                  maxWidth: '70%',
                  padding: '0.6rem 0.9rem',
                  borderRadius: isVisitor ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isVisitor ? '#3b82f6' : 'white',
                  color: isVisitor ? '#ffffff' : '#111827',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: isVisitor ? 'none' : '1px solid #e5e7eb'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-line'
                  }}>
                    {message.contenu}
                  </p>

                  <div style={{
                    marginTop: '0.3rem',
                    fontSize: '0.7rem',
                    color: isVisitor ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                    textAlign: 'right'
                  }}>
                    {formatTime(message.date_envoi)}
                    {isVisitor && (
                      <span style={{ marginLeft: '4px' }}>
                        {message.lu ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>


              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Barre d'envoi ── */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid #e5e7eb',
        background: 'white'
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendingMessage}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '0.9rem',
              outline: 'none',
              background: '#f9fafb',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <button
            type="submit"
            disabled={sendingMessage || !newMessage.trim()}
            style={{
              background: sendingMessage || !newMessage.trim() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: sendingMessage || !newMessage.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'background 0.2s'
            }}
          >
            {sendingMessage ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <>✈ Envoyer</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VisitorMessaging;
